import { makeAutoObservable, runInAction } from "mobx"
import mainStore from '../stores/main.store'
import Solver from "../risk/solver_vesta"

const capsMap = {
  borrowCap: 'borrowCaps',
  stabilityPoolSize: 'stabilityPoolCaps', 
  bprotocolSize: 'bprotocolCaps',
}

class VestaRiskStore {

  loading = true
  data = []
  json_time = null

  constructor(){
    this.initPromise = this.init()
    makeAutoObservable(this)
  }

  init = async () => {
    this.loading = true
    const riskParams = await mainStore['risk_params_request']
    const cleanRiskParams = Object.assign({}, riskParams || {})
    const {json_time} = cleanRiskParams
    if(json_time){
      delete cleanRiskParams.json_time
    }
    this.solver = new Solver(cleanRiskParams)
    
    const data = await mainStore['lending_platform_current_request']
    const accountsData = await mainStore['accounts_request']
    const spData = await mainStore['stability_pool_request']
    this.json_time = Math.min(data.json_time, spData.json_time)
    
    const cleanData = Object.entries(data.borrow_caps).map(([asset, v])=> {
      const minted = accountsData[asset].total_debt
      const borrowCap = v / 1000000
      const stabilityPoolSize = spData.stabilityPoolVstBalance[asset] / minted
      const bprotocolSize = spData.bprotocolBalance[asset] / stabilityPoolSize
      const current_mcr = 100 / data.collateral_factors[asset]
      const recommended_mcr = 100 / this.solver.getCf(asset, borrowCap, stabilityPoolSize, bprotocolSize)
      return {
        asset,
        borrowCap: this.roundUpCap(asset, "borrowCap", borrowCap),
        stabilityPoolSize: this.roundUpCap(asset, "stabilityPoolSize", stabilityPoolSize), 
        bprotocolSize: this.roundUpCap(asset, "bprotocolSize", bprotocolSize),
        current_mcr,
        recommended_mcr,
      }
    })
    runInAction(()=>{
      this.loading = false
      this.data = cleanData
    })

  }

  increment = (row, fieldName) => {
    runInAction(()=> this.loading = true)
    const {asset, borrowCap, stabilityPoolSize, bprotocolSize} = row
    const capsName = capsMap[fieldName]
    const caps = this.solver[capsName][asset]
    const currentValue = row[fieldName]
    let newCap
    
    for (const cap of caps) {
      newCap = cap
      if (cap > currentValue) break
    }
    
    runInAction(()=> {
      this.loading = false
      row[fieldName] = newCap
      const newRecommendedMcr = 100 / this.solver.getCf(asset, borrowCap, stabilityPoolSize, bprotocolSize)
      row.diff = row.recommended_mcr - newRecommendedMcr
      row.recommended_mcr = newRecommendedMcr
      this.data = this.data.map(r => r.asset === asset ? {...row} : r)
    })
    this.clearDiff(row.asset)
  }

  roundUpCap = (asset, fieldName, currentValue) => {
    const capsName = capsMap[fieldName]
    const caps = this.solver[capsName][asset]
    let newCap
    for (const cap of caps) {
      newCap = cap
      if (cap >= currentValue) break
    }
    return newCap
  }

  clearDiff = (asset) => {
    let row = this.data.filter(r => r.asset === asset)[0]
    if(row.timeout){
      clearTimeout(row.timeout)
    }
    row.timeout = setTimeout(()=> runInAction(()=>{
        this.data = this.data.map(r => {
          if(r.asset === asset){
            r.diff = 0
            return {...r}
          }
          return r
        })
      })
    , 5000)
    // updates dataTable now
    runInAction(()=>{
      this.data = this.data.map(r => r.asset === asset ? {...row} : r) 
    })
  }

  decrement = (row, fieldName) => {
    runInAction(()=> this.loading = true)
    const {asset, borrowCap, stabilityPoolSize, bprotocolSize} = row
    const capsName = capsMap[fieldName]
    const caps = this.solver[capsName][asset]
    const currentValue = row[fieldName]
    let newCap
    
    for (let i = caps.length - 1; i >= 0; i--) {
      const cap = caps[i]
      newCap = cap
      if (cap && cap < currentValue) break
    }
    
    runInAction(()=> {
      this.loading = false
      row[fieldName] = newCap
      const newRecommendedMcr = 100 / this.solver.getCf(asset, borrowCap, stabilityPoolSize, bprotocolSize)
      row.diff = row.recommended_mcr - newRecommendedMcr
      row.recommended_mcr = newRecommendedMcr
      this.data = this.data.map(r => r.asset === asset ? {...row} : r)
    })
    this.clearDiff(row.asset)
  }
}

export default new VestaRiskStore()