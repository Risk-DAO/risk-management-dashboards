import { makeAutoObservable, runInAction } from "mobx"
import Solver from "../risk/solver"
import mainStore from '../stores/main.store'

const tweakCurrentCap = cap => {
  if (cap === '0' || cap === 0) {
    return Infinity
  }
  if (cap === '1'  || cap === 1){
    return '0'
  }
  return cap
}

class RiskStore {
  data = [] 
  currentData = []
  utilization = []
  loading = true
  looping = false
  incrementationOptions = {}
  incrementSupplyOptions = {}
  incrementBorrowOptions = {}
  recommendations = []
  asterixs = {
    worstDay: false,
    usage: false,
    caps: false,
  }

  constructor (){
    this.initPromise = this.init()
    makeAutoObservable(this)
  }

  init = async ()=> {
    if(true) {
      const data = await mainStore['risk_params_request']
      this.utilization = await mainStore['accounts_request']
      .then(u=> {
        return Object.entries(u)
        .map(([k, v])=> {
          if(k == 'json_time'){
            return null
          }
          return { 
            asset: k,
            mint_cap: this.looping ? v.total_collateral : v.nl_total_collateral,
            borrow_cap: this.looping ? v.total_debt : v.nl_total_debt,            
          }
        })
        .filter(o=> o)
      })
      this.currentData = await mainStore['lending_platform_current_request']
        .then(d => {
          const clean = {}
          for (let asset in d.borrow_caps) {
            clean[asset] = { asset }
            clean[asset].borrow_cap = tweakCurrentCap(d.borrow_caps[asset])
            clean[asset].mint_cap = tweakCurrentCap(d.collateral_caps[asset])
            clean[asset].current_collateral_factor = d.collateral_factors[asset]
          }
          return Object.values(clean)
        })
      this.rawData = Object.assign({}, data || {})
      const {json_time} = this.rawData
      if(json_time){
        delete this.rawData.json_time
      }
      // inctanciate a solver
      this.solver = new Solver(this.rawData)
      this.solveFor(this.utilization)
      this.solveFor(this.currentData)
      console.log("caps", this.solver.caps)
      runInAction(()=> {
        this.incrementationOptions = this.solver.caps
        this.incrementSupplyOptions = this.solver.supplyCaps
        this.incrementBorrowOptions = this.solver.borrowCaps
        console.log(this.incrementationOptions)
        // const sorted = riskData.sort((a,b)=> a.asset.localeCompare(b.asset))
        // this.data = sorted
        this.solve()
        this.loading = false
      })
    }
  }

  toggleLooping = async () => {
    this.looping = !this.looping
    this.utilization = await mainStore['accounts_request']
      .then(u=> {
        return Object.entries(u)
        .map(([k, v])=> {
          if(k == 'json_time'){
            return null
          }
          return { 
            asset: k,
            mint_cap: this.looping ? v.total_collateral : v.nl_total_collateral,
            borrow_cap: this.looping ? v.total_debt : v.nl_total_debt,            
          }
        })
        .filter(o=> o)
      })
    
    this.solveFor(this.utilization)
  }

  getRecommendations = async () => {
    await this.initPromise
    const simulation = Object.entries(mainStore.clean( await mainStore['current_simulation_risk_request']))
      .map(([k, v])=> Object.assign({asset: k}, v.summary))
    return [this.utilization, this.currentData, simulation]
  }

  incrament = (row, field) => {
    // find the options
    const options = 
      (field === "borrow_cap" ? this.incrementBorrowOptions[row.asset] : this.incrementSupplyOptions[row.asset]) || []
    //  this.incrementationOptions[row.asset] || []
    console.log({options}, field)
    // find the index of exisiting value
    const currentIndex = options.indexOf(Number(row[field]))
    // validate we can incrament or decrament
    if(currentIndex == -1 ){
      console.log('cant incrament 1')
      return
    }
    if(currentIndex === options.length - 1){
      console.log('cant incrament 2')
      return
    }
    // cahnge the value
    row[field] = options[currentIndex+1]
    this.solve()
    console.log('incrament')
  }

  clearDiffs = () => {
    if(this.timeOutId){
      //clear timeOut
      clearTimeout(this.timeOutId)
    }
    this.timeOutId = setTimeout(() => {
      runInAction(()=> {
        this.data = this.data.map(r => {
          r.diff = false
          return r
        })
      })
    }, 5000)
  }

  solve = () => {
    // generate mintCaps, borrowCaps & collateralFactorCaps objects
    const mintCaps = {}
    const borrowCaps = {}
    const collateralFactorCaps = {}
    if(this.data.length){
      this.data.forEach(row => {
        mintCaps[row.asset] = row.mint_cap
        borrowCaps[row.asset] = row.borrow_cap
        collateralFactorCaps[row.asset] = 0
      })
    } else {
      Object.entries(this.solver.supplyCaps).forEach(([k, v])=> {
        let max
        for(const row of this.currentData) {
          //console.log(row.asset, k)
          if(row.asset === k) {
            max = this.findCap(row.asset, row.mint_cap, false)
            console.log("found max collateral", k, {max})
            break
          }
        }
        //console.log("currdata",this.currentData[0].asset)
        //console.log("collateral", {k},{v})
        //const max = this.findCap(k, 9, false) //v[parseInt(v.length / 2)]
        //max = v[parseInt(v.length / 2)]
        mintCaps[k] = max
        //borrowCaps[k] = max
        collateralFactorCaps[k] = 0
      })
      Object.entries(this.solver.borrowCaps).forEach(([k, v])=> {
        //console.log("debt", {k},{v})        
        //const max = this.findCap(k, 8, true)
        let max
        for(const row of this.currentData) {
          if(row.asset === k) {
            max = this.findCap(row.asset, row.borrow_cap, true)
            console.log("found max debt", k, {max}, row.borrow_cap)

            break
          }
        }
        //max = v[parseInt(v.length / 2)]        
        borrowCaps[k] = max
      })      
    }
    const newRiskParameters = this.solver.optimizeCfg(this.solver.findValidCfg(mintCaps, borrowCaps, collateralFactorCaps))
    
    this.recommendations = this.solver.recommendations(newRiskParameters)
    // then rebuild data object from new configurations
    const newTableData = {}
    Object.entries(newRiskParameters.mintCaps).forEach(([k, v])=> {
      newTableData[k] = newTableData[k] || {asset: k}
      newTableData[k].mint_cap = v
    })
    Object.entries(newRiskParameters.borrowCaps).forEach(([k, v])=> {
      newTableData[k] = newTableData[k] || {asset: k}
      newTableData[k].borrow_cap = v
    })
    Object.entries(newRiskParameters.cfs).forEach(([k, v])=> {
      newTableData[k] = newTableData[k] || {asset: k}
      newTableData[k].collateral_factor = v
    })
    // look for diffs and add theme
    this.data.forEach(row=> {
      const cf = row.collateral_factor
      const newCf = newTableData[row.asset].collateral_factor
      if(!cf || cf === newCf) {
        newTableData[row.asset].diff = false
        return
      }
      newTableData[row.asset].diff = newCf - cf
    })
    // then rerender
    runInAction(()=> {
      this.data = (Object.values(newTableData)).sort((a,b)=> a.asset.localeCompare(b.asset))
    })
    this.clearDiffs()
  }

  findCap = (asset, value, borrow) => {
    const caps = borrow ? this.solver.borrowCaps[asset] : this.solver.supplyCaps[asset]// this.solver.caps[asset]
    if(!caps) {
      console.warn("findCap fn: No caps found for asset " + asset)
      return 0
    }
    if(value === undefined) {
      console.warn("findCap fn: No value provided for asset " + asset)
      return caps[0]
    }
    if(value === Infinity){
      return caps[caps.length - 1]
    }
    for(let cap of caps){
      if(cap * 1000000 >= value){
        return cap
      }
    }
    // if nothing catches return the highest cap
    return caps[caps.length - 1]
  }

  solveFor = (dataSet) => {
    // generate mintCaps, borrowCaps & collateralFactorCaps objects
    const mintCaps = {}
    const borrowCaps = {}
    const collateralFactorCaps = {}
    if(dataSet.length){
      dataSet.forEach(row => {
        mintCaps[row.asset] = this.findCap(row.asset, row.mint_cap, false)
        borrowCaps[row.asset] = this.findCap(row.asset, row.borrow_cap, true)
        collateralFactorCaps[row.asset] = 0
      })
    }
    const newRiskParameters = this.solver.optimizeCfg(this.solver.findValidCfg(mintCaps, borrowCaps, collateralFactorCaps))
    
    //this.recommendations = this.solver.recommendations(newRiskParameters)
    // then rebuild data object from new configurations
    const newTableData = {}
    Object.entries(newRiskParameters.mintCaps).forEach(([k, v])=> {
      newTableData[k] = newTableData[k] || {asset: k}
      newTableData[k].mint_cap = v
    })
    Object.entries(newRiskParameters.borrowCaps).forEach(([k, v])=> {
      newTableData[k] = newTableData[k] || {asset: k}
      newTableData[k].borrow_cap = v
    })
    Object.entries(newRiskParameters.cfs).forEach(([k, v])=> {
      newTableData[k] = newTableData[k] || {asset: k}
      newTableData[k].collateral_factor = v
    })

    // then rerender
    runInAction(()=> {
      dataSet = dataSet.map(r=> {
        r.collateral_factor = newTableData[r.asset].collateral_factor
        r.debug_mc = newTableData[r.asset].mint_cap
        r.debug_bc = newTableData[r.asset].borrow_cap
        return r
      })//(Object.values(newTableData)).sort((a,b)=> a.asset.localeCompare(b.asset))
    })
  }

  decrament = (row, field) => {
    // find the options
    const options =
      (field === "borrow_cap" ? this.incrementBorrowOptions[row.asset] : this.incrementSupplyOptions[row.asset]) || []    
      //this.incrementationOptions[row.asset] || []
    // find the index of exisiting value
    console.log({options}, this.incrementationOptions[row.asset])
    const currentIndex = options.indexOf(Number(row[field]))
    // validate we can incrament or decrament
    if(currentIndex == -1 ){
      console.log('cant decrament 1', row[field])
      return
    }
    if(currentIndex === 0){
      console.log('cant decrament 2')
      return
    }
    // cahnge the value
    row[field] = options[currentIndex-1]
    this.solve()
    console.log('decrament')
  }

  getCurrentCollateralFactor = (asset) => {
    if(asset === window.APP_CONFIG.STABLE){
      return 0
    }
    const [{current_collateral_factor }] = this.currentData.filter(r => r.asset === asset)
    return current_collateral_factor
  }

  preformRecommendation = (recommendation) => {
    // decrease ADA.e mint cap to 40
    const [operation, asset, type, , , amount] = recommendation.split(' ')
    for (let row of this.data) {
      if(row.asset === asset){
        row[`${type}_cap`] = amount
        this.solve()
        break;
      }
    }
  }
}

export default new RiskStore()