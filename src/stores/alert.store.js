import { makeAutoObservable, runInAction } from "mobx"
import mainStore from "./main.store"
import riskStore from "./risk.store"
import { removeTokenPrefix } from "../utils"
import { whaleFriendlyFormater } from '../components/WhaleFriendly'
import BlockExplorerLink from "../components/BlockExplorerLink"
import Ramzor from "../components/Ramzor"
import Token from "../components/Token"
import { TEXTS } from "../constants"

const priceOracleDiffThreshold = 5

const percentFromDiff = (base, num) => {
  const diff = ((num / base) * 100) - 100
  return Math.abs(diff)
}

class AlertStore {
  alerts = []
  loading = true
  valueAtRisk = null
  liquidationsAtRisk = null
  varLarJsonTime = null
  constructor() {
    makeAutoObservable(this)
    this.init()
  }
  
  init = async () => {
    await riskStore.initPromise
    this.getValueRisk()
    this.getLiquidationsRisk()
    this.getVarLarJsonTime()
    const alerts = await Promise.all([
      this.getCollateralFactor(),
      this.getOpenLiquidations(),
      this.getOracleAlert(),
      this.getWhaleAlert(),
      this.getUtilizationAlert(),
    ])
    .catch(err=> {
      console.error(err)
    })
    runInAction(() => {
      this.alerts = alerts
      this.loading = false
    })
  }

  getVarLarJsonTime = async () => {
    const data = await mainStore['current_simulation_risk_request']
    runInAction(()=> {
      this.varLarJsonTime = data.json_time
    })
  }

  getValueRisk = async () => {
    const alerts = []
    const data = mainStore.clean( await mainStore['current_simulation_risk_request'])
    let valueAtRisk = 0
    Object.values(data).forEach(o=> {
      Object.entries(o).forEach(([k, v])=> {
        if (k === 'summary'){
          return
        }
        valueAtRisk += Number(v.pnl)
      })
    })
    runInAction(()=> {
      this.valueAtRisk = whaleFriendlyFormater(valueAtRisk)
    })
  }

  getLiquidationsRisk = async () => {
    const alerts = []
    const data = mainStore.clean( await mainStore['current_simulation_risk_request'])
    let liquidationsAtRisk = 0
    Object.values(data).forEach(o=> {
      Object.entries(o).forEach(([k, v])=> {
        if (k === 'summary'){
          return
        }
        liquidationsAtRisk += Number(v.total_liquidation)
      })
    })

    runInAction(()=> {
      this.liquidationsAtRisk = whaleFriendlyFormater(liquidationsAtRisk)
    })

  }

  getOpenLiquidations = async () => {
    const alerts = []

    const { data: openLiquidations } = mainStore.clean( await mainStore['open_liquidations_request'])
    let totalLiquidations = 0
    openLiquidations.forEach(ol=> {
      totalLiquidations += Number(ol.user_debt_wo_looping)
    })
    let type = 'healthy'
    if(totalLiquidations > 1000){
      type = 'review'
    }
    if(totalLiquidations > 100000){
      type = 'danger'
    }
    return {
      title: 'open liquidations',
      data: alerts,
      type,
      link: '#open-liquidations'
    }
  }

  getOracleAlert = async () => {
    const oracles = mainStore.clean(await mainStore['oracles_request'])
    const alerts = Object.entries(oracles)
      .map(([key, row]) => {
        const diff = Math.max(percentFromDiff(row.oracle, row.cex_price), percentFromDiff(row.oracle, row.dex_price))
        if(diff >= priceOracleDiffThreshold){

          return {
            asset: removeTokenPrefix(key),
            diff,
          }
        }
      })
      .filter(r => !!r)
      const type = alerts.length ? 'review' : 'healthy'
      return {
          title: 'oracles',
          data: alerts,
          type,
          link: '#oracle-deviation'
      }
  }

  getWhaleAlert = async () => {
    const whales = mainStore.clean(await mainStore['whale_accounts_request'])
    const alerts = []

    Object.entries(whales)
      .map(([key, row]) => {
        row.big_collateral.forEach(({id: account, size, whale_flag})=> {
          if(!whale_flag) return
          alerts.push({
            asset: key,
            type: 'Collateral',
            size,
            account,
          })
        })        
        row.big_debt.forEach(({id: account, size, whale_flag})=> {
          debugger
          if(!whale_flag) return
          alerts.push({
            asset: key,
            type: 'Debt',
            size,
            account,
          })        
        })
      })
    const type = alerts.length ? 'review' : 'healthy'
    return {
      title: 'whales',
      data: alerts,
      type,
      link: '#asset-distribution'
    }
  }

  getUtilizationAlert = async () => {
    const markets = {}
    const alerts = []
    const columns = [
      {
        name: 'Asset',
        format: row => <Token value={row.asset}/>,
        selector: row => row.asset,
        sortable: true,
      },
      {
        name: 'Supply/ Borrow',
        selector: row => row.type,
        sortable: true,
      },
      {
        name: 'Cap Utilization',
        selector: row => row.cap,
        format: row => <Ramzor red={row.cap > 85} yellow={row.cap > 70}> {row.cap.toFixed(2)}%</Ramzor>,
        sortable: true,
      }
    ]
    const currentUsage = mainStore.clean(await mainStore['accounts_request'])
    
    Object.entries(currentUsage).forEach(([k, v]) => {
      markets[k] = markets[k] || { market: k }
      markets[k].mint_usage = Number(v.total_collateral)
      markets[k].borrow_usage = Number(v.total_debt)
    })
    const currentCaps = mainStore.clean(await mainStore['lending_platform_current_request'])
    Object.entries(currentCaps).forEach(([k, v]) => {
      if(k === 'borrow_caps'){
        Object.entries(v).forEach(([asset, cap]) => {
          cap = Number(cap)
          if(cap === '0'){
            cap = Infinity
          }
          else if(cap === '1'){
            cap = 0
          }
          else {
            cap = cap
          }
          markets[asset].borrow_cap = cap
        })
      }
      if(k === 'collateral_caps'){
        Object.entries(v).forEach(([asset, cap]) => {
          cap = Number(cap)
          if(cap === 0){
            cap = Infinity
          }
          else if(cap === 1){
            cap = 0
          }
          else {
            cap = cap
          }
          markets[asset].mint_cap = cap
        })
      }
    })
    
    Object.values(markets)
      .forEach(market => {
        if(market.mint_cap === Infinity || market.borrow_cap === Infinity){
          return
        }
        const mintUtilization = (market.mint_usage / market.mint_cap) * 100
        if(mintUtilization > 70){
          alerts.push({
            asset: market.market,
            type: 'Supply',
            cap: mintUtilization
          })
        }
        const borrowUtilization = (market.borrow_usage / market.borrow_cap) * 100
        if(borrowUtilization > 70){
          alerts.push({
            asset: market.market,
            type: 'borrow',
            cap: borrowUtilization
          })
        }
      })

    const type = alerts.length ? 'review' : 'healthy'
    return {
      title: 'utilization',
      data: alerts,
      columns,
      type,
      showTable: true,
    }
  }

  getCollateralFactor = async () => {
    const alerts = []
    // const columns = [
    //   {
    //     name: 'Asset',
    //     selector: row => removeTokenPrefix(row.asset),
    //     format: row => <Token value={row.asset}/>,
    //     sortable: true,
    //   },
    //   {
    //     name: 'Current CF',
    //     selector: row => row.currentCF,
    //     sortable: true,
    //   },
    //   {
    //     name: 'Recommended CF',
    //     selector: row => row.recommendedCF,
    //     sortable: true,
    //   },
    //   {
    //     name: 'Based On',
    //     selector: row => row.basedOn,
    //     sortable: true,
    //   }
    // ]
    const [currentUtilization, currentCap, simulation] = await riskStore.getRecommendations()
    //getCurrentCollateralFactor
    currentUtilization.forEach(row => {
      const currentCF = Number(riskStore.getCurrentCollateralFactor(row.asset))
      const recommendedCF = row.collateral_factor
      if(currentCF > recommendedCF){
        alerts.push({
          asset: row.asset,
          currentCF,
          recommendedCF: recommendedCF.toFixed(2),
          "basedOn": "usage"
        })
      }
    })
    currentCap.forEach(row => {
      const currentCF = Number(riskStore.getCurrentCollateralFactor(row.asset))
      const recommendedCF = row.collateral_factor
      if(currentCF > recommendedCF){
        alerts.push({
          asset: row.asset,
          currentCF,
          recommendedCF: recommendedCF.toFixed(2),
          "basedOn": "caps"
        })
      }
    })
    simulation.forEach(row => {
      const currentCF = Number(riskStore.getCurrentCollateralFactor(row.asset))
      const recommendedCF = Number(row.max_collateral)
      if(currentCF > recommendedCF){
        alerts.push({
          asset: row.asset,
          currentCF,
          recommendedCF: recommendedCF.toFixed(2),
          "basedOn": "Worst Day Scenario"
        })
      }
    })
    const type = alerts.length ? 'review' : 'success'
    return {
      title: TEXTS.COLLATERAL_FACTOR + 's',
      data: alerts,
      type,
      link: '#collateral-factors'
    }
  }
}

export default new AlertStore()