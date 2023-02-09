import { makeAutoObservable, runInAction } from 'mobx'

import Solver from '../risk/solver'
import mainStore from '../stores/main.store'

const tweakCurrentCap = cap => {
  if (cap === '0' || cap === 0) {
    return Infinity
  }
  if (cap <= 10 || cap === '1'){
    return '0'
  }
  return cap
}

class RiskStore {
    data = []
    reverseSolvedData = []
    liquidityData = {}
    solverData = {}
    currentData = []
    utilization = []
    loading = true
    looping = false
    incrementationOptions = {}
    incrementSupplyOptions = {}
    incrementBorrowOptions = {}
    reverseCurrentSelectedSupply = {}
    reverseCurrentSelectedBorrow = {}
    reverseCurrentSelectedBorrowSimulated = {}
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

  getCurrentData = async () => {
    const d = mainStore['lending_platform_current_request'] ? await mainStore['lending_platform_current_request'] : await Promise.resolve({})
    const clean = {}
    for (let asset in d.borrow_caps) {
      clean[asset] = { asset }
      clean[asset].borrow_cap = tweakCurrentCap(d.borrow_caps[asset])
      clean[asset].mint_cap = tweakCurrentCap(d.collateral_caps[asset])
      clean[asset].current_collateral_factor = d.collateral_factors[asset]
    }
    return Object.values(clean)
  }

  getUtilization = async () => {
    const u = mainStore['accounts_request'] ? await mainStore['accounts_request'] : await Promise.resolve({})
    return Object.entries(u)
    .map(([k, v])=> {
      if(k === 'json_time'){
        return null
      }
      return { 
        asset: k,
        mint_cap: this.looping ? v.total_collateral : v.nl_total_collateral,
        borrow_cap: this.looping ? v.total_debt : v.nl_total_debt,            
      }
    })
    .filter(o=> o)
  }

    init = async () => {
        if (true) {
            
            const { computeReverseSandbox } = window.APP_CONFIG.feature_flags
            const data = await mainStore['risk_params_request']

            this.liquidityData = await mainStore['usd_volume_for_slippage_request']
            this.utilization = await this.getUtilization()

            this.currentData = await this.getCurrentData()
            this.rawData = Object.assign({}, data || {})
            const { json_time } = this.rawData
            if (json_time) {
                delete this.rawData.json_time
            }
            // inctanciate a solver
            this.solver = new Solver(this.rawData)
            this.solverData = this.solver.parsedData
            this.solveFor(this.utilization)
            this.solveFor(this.currentData)
            runInAction(() => {
                this.incrementationOptions = this.solver.caps
                this.incrementSupplyOptions = this.solver.supplyCaps
                this.incrementBorrowOptions = this.solver.borrowCaps
                // const sorted = riskData.sort((a,b)=> a.asset.localeCompare(b.asset))
                // this.data = sorted
                this.solve()
                if(computeReverseSandbox) {
                    this.reverseSolveSimulated()
                }
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
          if(k === 'json_time'){
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
            (field === 'borrow_cap'
                ? this.incrementBorrowOptions[row.asset]
                : this.incrementSupplyOptions[row.asset]) || []
        //  this.incrementationOptions[row.asset] || []
        // find the index of exisiting value
        const currentIndex = options.indexOf(Number(row[field]))
        // validate we can incrament or decrament
        if (currentIndex === -1) {
            return
        }
        if (currentIndex === options.length - 1) {
            return
        }
        // cahnge the value
        row[field] = options[currentIndex + 1]
        this.solve()
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
        let sandBoxInitData = this.currentData
        if (window.APP_CONFIG.feature_flags.initSandBoxFromCurrentUtilization) {
            sandBoxInitData = this.utilization
        }

        let collateralFactorCap = 0;
        // for MELD, we need to allow < 0 collateral factor caps, take the cap from the config
        if (window.APP_CONFIG.feature_flags.defaultCollateralFactorCaps !== 0) {
            collateralFactorCap = window.APP_CONFIG.feature_flags.defaultCollateralFactorCaps
        }

        if (this.data.length) {
            this.data.forEach((row) => {
                mintCaps[row.asset] = row.mint_cap
                borrowCaps[row.asset] = row.borrow_cap
                collateralFactorCaps[row.asset] = collateralFactorCap
            })
        } else {
            Object.entries(this.solver.supplyCaps).forEach(([k, v]) => {
                let max
                for (const row of sandBoxInitData) {
                    if (row.asset === k) {
                        max = this.findCap(row.asset, row.mint_cap, false)
                        break
                    }
                }
                //const max = this.findCap(k, 9, false) //v[parseInt(v.length / 2)]
                //max = v[parseInt(v.length / 2)]
                if (max === undefined) {
                    max = this.solver.supplyCaps[k][this.solver.supplyCaps[k].length - 1]
                    if (window.APP_CONFIG.temp.iUSD_initial && k === 'iUSD') {
                        max = window.APP_CONFIG.temp.iUSD_initial
                    }
                }
                mintCaps[k] = max
                //borrowCaps[k] = max
                collateralFactorCaps[k] = collateralFactorCap
            })
            Object.entries(this.solver.borrowCaps).forEach(([k, v]) => {
                //const max = this.findCap(k, 8, true)
                let max
                for (const row of sandBoxInitData) {
                    if (row.asset === k) {
                        max = this.findCap(row.asset, row.borrow_cap, true)
                        break
                    }
                }
                if(max === undefined){
                max = this.solver.borrowCaps[k][this.solver.borrowCaps[k].length -1]
        }
        borrowCaps[k] = max
      })      
    }
    // console.log('mintCaps', JSON.stringify(mintCaps, null, 2))
    // console.log('borrowCaps', JSON.stringify(borrowCaps, null, 2))
    // console.log('collateralFactorCaps', JSON.stringify(collateralFactorCaps, null, 2))
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
    
    let collateralFactorCap = 0;
    // for MELD, we need to allow < 0 collateral factor caps, take the cap from the config
    if (window.APP_CONFIG.feature_flags.defaultCollateralFactorCaps !== 0) {
        collateralFactorCap = window.APP_CONFIG.feature_flags.defaultCollateralFactorCaps
    }

    if(dataSet.length){
      dataSet.forEach(row => {
        mintCaps[row.asset] = this.findCap(row.asset, row.mint_cap, false)
        borrowCaps[row.asset] = this.findCap(row.asset, row.borrow_cap, true)
        collateralFactorCaps[row.asset] = collateralFactorCap
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
            (field === 'borrow_cap'
                ? this.incrementBorrowOptions[row.asset]
                : this.incrementSupplyOptions[row.asset]) || []
        //this.incrementationOptions[row.asset] || []
        // find the index of exisiting value
        const currentIndex = options.indexOf(Number(row[field]))
        // validate we can incrament or decrament
        if (currentIndex === -1) {
            return
        }
        if (currentIndex === 0) {
            return
        }
        // cahnge the value
        row[field] = options[currentIndex - 1]
        this.solve()
    }

  getCurrentCollateralFactor = (asset) => {
    if(asset === window.APP_CONFIG.STABLE || this.currentData.length === 0){
      return 0
    }
    const [{current_collateral_factor}] = this.currentData.filter(r => r.asset === asset)
    return current_collateral_factor
  }

    preformRecommendation = (recommendation) => {
        // decrease ADA.e mint cap to 40
        const [, asset, type, , , amount] = recommendation.split(' ')
        for (let row of this.data) {
            if (row.asset === asset) {
                row[`${type}_cap`] = amount
                this.solve()
                break
            }
        }
    }

    /**
     * /////////// REVERSE SOLVER SANDBOX CODE \\\\\\\\\\\\\\\\\\\\
     */

    reverseSolveSimulated = () => {
        this.reverseSolvedData = []
        for (const [key] of Object.entries(this.solverData)) {
            let reverseSolveItem = {
                long: key,
                supply: this.getReverseSupplyForToken(key),
                borrow: this.getReverseBorrowForToken(key),
                lt: this.LTfromSupplyBorrowSimulated(key),
                liquidity: this.liquidityData[key],
                liquidityChange: 'N/A',                
            }


            const simuBorrows = [];
            for (const [borrowSimuKey] of Object.entries(this.reverseCurrentSelectedBorrowSimulated[key])) {
                simuBorrows.push(`${borrowSimuKey}: ${this.reverseCurrentSelectedBorrowSimulated[key][borrowSimuKey]}`);
            }
            reverseSolveItem.simuBorrows = simuBorrows;

            // console.log(this.reverseCurrentSelectedBorrowSimulated);

            let cptLiquidityChange = 0
            for (const [keyShort] of Object.entries(this.solverData[key])) {
                delete reverseSolveItem.liquidity[keyShort]["simulatedVolume"];
                const realBorrowOfShort = this.getReverseBorrowForToken(keyShort)
                const simulatedBorrowOfShort = this.getReverseBorrowForTokenSimulated(key, keyShort)
                if(realBorrowOfShort > 0) {
                    // real borrow = simulated borrow, do not display volume change for short
                    if (realBorrowOfShort === simulatedBorrowOfShort) {
                        continue;
                    }

                    if(reverseSolveItem.supply <= Math.min(realBorrowOfShort, simulatedBorrowOfShort)) {
                        continue;
                    }

                    const ratio = realBorrowOfShort / simulatedBorrowOfShort
                    cptLiquidityChange++
                    reverseSolveItem.liquidity[keyShort].simulatedVolume =
                        reverseSolveItem.liquidity[keyShort].volume * ratio
                }
            }

            if (cptLiquidityChange > 0) {
                reverseSolveItem.liquidityChange = cptLiquidityChange
            }

            this.reverseSolvedData.push(reverseSolveItem)
        }

        this.reverseSolvedData = this.reverseSolvedData.sort((a, b) => a.long.localeCompare(b.long))
    }

    getReverseSupplyForToken = (token) => {
        if (this.reverseCurrentSelectedSupply[token] === undefined) {
            if (window.APP_CONFIG.feature_flags.initDexLiquiditySandBoxFromCurrentUtilization) {
                const utilizationForToken = this.utilization.find(_ => _.asset === token);
                if(utilizationForToken) {
                    this.reverseCurrentSelectedSupply[token] = utilizationForToken.debug_mc
                }
                else {
                    this.reverseCurrentSelectedSupply[token] = this.findMaxDCForToken(token)
                }
            } 
            else {
                this.reverseCurrentSelectedSupply[token] = this.findMaxDCForToken(token)
            }
        }

        return this.reverseCurrentSelectedSupply[token]
    }

    getReverseBorrowForToken = (token) => {
        if (this.reverseCurrentSelectedBorrow[token] === undefined) {
            if (window.APP_CONFIG.feature_flags.initDexLiquiditySandBoxFromCurrentUtilization) {
                const utilizationForToken = this.utilization.find(_ => _.asset === token);
                if(utilizationForToken) {
                    this.reverseCurrentSelectedBorrow[token] = utilizationForToken.debug_bc
                }
                else {
                    this.reverseCurrentSelectedBorrow[token] = this.findMaxDCForToken(token)
                }
            } 
            else {
                this.reverseCurrentSelectedBorrow[token] = this.findMaxDCForToken(token)
            }
        }

        return this.reverseCurrentSelectedBorrow[token]
    }

    getReverseBorrowForTokenSimulated = (long, short) => {
        if (this.reverseCurrentSelectedBorrowSimulated[long] === undefined) {
            this.reverseCurrentSelectedBorrowSimulated[long] = {}
            this.reverseCurrentSelectedBorrowSimulated[long][short] = this.getReverseBorrowForToken(short)
        } else if (this.reverseCurrentSelectedBorrowSimulated[long][short] === undefined) {
            this.reverseCurrentSelectedBorrowSimulated[long][short] = this.getReverseBorrowForToken(short)
        }

        return this.reverseCurrentSelectedBorrowSimulated[long][short]
    }

    findDCStepsForToken = (token) => {
        for (const [longKey] of Object.entries(this.solverData)) {
            for (const [shortKey, short] of Object.entries(this.solverData[longKey])) {
                if (shortKey === token) {
                    return Object.keys(short).map((entry) => Number(entry))
                }
            }
        }
    }

    findMaxDCForToken = (token) => {
        return Math.max(...this.findDCStepsForToken(token))
    }

    LTfromSupplyBorrowSimulated = (token) => {
        const longSupply = this.getReverseSupplyForToken(token)

        let min = 1
        for (const [keyShort, short] of Object.entries(this.solverData[token])) {
            const shortBorrow = this.getReverseBorrowForTokenSimulated(token, keyShort)
            const minSupplyBorrow = Math.min(Number(longSupply), Number(shortBorrow))
            const selectedLt = short[minSupplyBorrow.toString()]
            if (selectedLt < min) {
                min = selectedLt
            }
        }

        return min
    }

    calculateLTFromSuppliesAndBorrows = (token, longSupply, shortBorrows) => {
        let min = 1
        for (const [keyShort, short] of Object.entries(this.solverData[token])) {
            const shortBorrow = shortBorrows[keyShort]
            const minSupplyBorrow = Math.min(Number(longSupply), Number(shortBorrow))
            const selectedLt = short[minSupplyBorrow.toString()]
            if (selectedLt < min) {
                min = selectedLt
            }
        }

        return min
    }

    newReverseIncrementLT = (token) => {
        // console.log('====================================');
        // calculate current LT
        // console.log('working on', token);
        const currentTokenSupply = this.reverseCurrentSelectedSupply[token];
        // console.log('currentTokenSupply', currentTokenSupply);
        const borrows = {};
        for (const [keyShort] of Object.entries(this.solverData[token])) {
            borrows[keyShort] = this.getReverseBorrowForTokenSimulated(token, keyShort);
        }

        // console.log('borrows', borrows);
        const currentLT = this.calculateLTFromSuppliesAndBorrows(token, currentTokenSupply, borrows);
        // console.log('currentLT:', currentLT);

        // generate array of steps from the solver data
        const solverDataArray = []
        for (const [keyShort] of Object.entries(this.solverData[token])) {
            for (const [borrowVal, ltValue] of Object.entries(this.solverData[token][keyShort])) {
                solverDataArray.push({
                    lt: Number(ltValue),
                    symbol: keyShort,
                    value: Number(borrowVal),
                })
            }
        }
        // sort the array from lower LT to highest lt
        solverDataArray.sort((a, b) => a.lt - b.lt)

        // we will now step through the solver data array and find the first value that 
        // could give a smallest higher LT than the current one
        let selectedSolverData = undefined;
        for(let i = 0; i < solverDataArray.length; i++) {
            const solverData = solverDataArray[i];
            // console.log('solverData:', solverData);

            if(solverData.value === 0) {
                // console.log('ignoring', solverData, 'because value = 0');
                continue;
            }

            if(solverData.lt <= currentLT) {
                // console.log('ignoring', solverData, 'because lt:', solverData.lt, `<= to currentLt:`, currentLT);
                continue;
            }

            // the solver data must have lower borrow value than the current borrow for the token
            if(solverData.value >= borrows[solverData.symbol]) {
                // console.log('ignoring', solverData, 'because value:', solverData.value, `equals borrows[${solverData.symbol}]:`, borrows[solverData.symbol]);
                continue;
            }

            borrows[solverData.symbol] = solverData.value;
            const testLt = this.calculateLTFromSuppliesAndBorrows(token, currentTokenSupply, borrows);

            if(testLt <= currentLT) {
                // console.log('ignoring', solverData, 'because calculated lt:', testLt, 'is lower than current lt:', currentLT);
                continue;
            }

            // IF HERE, BINGO
            // console.log('New LT is better! Using', solverData, 'as selected data:', testLt, 'from:', currentLT);
            selectedSolverData = solverData;
            break;
        }

        if(selectedSolverData) {
            // console.log('previous borrow for', selectedSolverData.symbol, ':', this.reverseCurrentSelectedBorrowSimulated[token][selectedSolverData.symbol]);
            this.reverseCurrentSelectedBorrowSimulated[token][selectedSolverData.symbol] = selectedSolverData.value;
            // console.log('new borrow for', selectedSolverData.symbol, ':', this.reverseCurrentSelectedBorrowSimulated[token][selectedSolverData.symbol]);
            this.reverseSolveSimulated();
        } else {
            console.log('could not find better LT for', token);
        }
    }

    newReverseDecrementLT = (token) => {
        // console.log('====================================');
        // calculate current LT
        // console.log('working on', token);
        const currentTokenSupply = this.reverseCurrentSelectedSupply[token];
        // console.log('currentTokenSupply', currentTokenSupply);
        const borrows = {};
        for (const [keyShort] of Object.entries(this.solverData[token])) {
            borrows[keyShort] = this.getReverseBorrowForTokenSimulated(token, keyShort);
        }

        // console.log('borrows', borrows);
        const currentLT = this.calculateLTFromSuppliesAndBorrows(token, currentTokenSupply, borrows);
        // console.log('currentLT:', currentLT);

        // generate array of steps from the solver data
        const solverDataArray = []
        for (const [keyShort] of Object.entries(this.solverData[token])) {
            for (const [borrowVal, ltValue] of Object.entries(this.solverData[token][keyShort])) {
                solverDataArray.push({
                    lt: Number(ltValue),
                    symbol: keyShort,
                    value: Number(borrowVal),
                })
            }
        }
        // sort the array from highest LT to lowest lt
        solverDataArray.sort((a, b) => b.lt - a.lt)

        // we will now step through the solver data array and find the best value that 
        // could give a biggest smaller LT than the current one
        let selectedSolverData = undefined;
        for(let i = 0; i < solverDataArray.length; i++) {
            const solverData = solverDataArray[i];
            // console.log('solverData:', solverData);
            
            // if(this.getReverseBorrowForToken(solverData.symbol) < solverData.value) {
            //     console.log('ignoring', solverData, 'because it would accrue borrow to', solverData.value , 'from user setup borrow:', userSetBorrowOfAsset);
            //     continue;
            // }

            if(selectedSolverData && selectedSolverData.symbol !== solverData.symbol) {
                // console.log('ignoring', solverData, 'because already found solver data on symbol', selectedSolverData.symbol);
                continue;                
            } 
            
            if(solverData.value === 0) {
                // console.log('ignoring', solverData, 'because value = 0');
                continue;
            }

            if(solverData.lt > currentLT) {
                // console.log('ignoring', solverData, 'because lt:', solverData.lt, `> to currentLt:`, currentLT);
                continue;
            }

            // the solver data must have a strictly higher borrow value than the current borrow for the token
            if(solverData.value <= borrows[solverData.symbol]) {
                // console.log('ignoring', solverData, 'because value:', solverData.value, `equals borrows[${solverData.symbol}]:`, borrows[solverData.symbol]);
                continue;
            }

            const oldBorrowValue = borrows[solverData.symbol];
            borrows[solverData.symbol] = solverData.value;
            const testLt = this.calculateLTFromSuppliesAndBorrows(token, currentTokenSupply, borrows);
            borrows[solverData.symbol] = oldBorrowValue;
            
            if(testLt > currentLT) {
                // console.log('ignoring', solverData, 'because calculated lt:', testLt, 'is higher than current lt:', currentLT);
                continue;
            }
            if(selectedSolverData) {
                // console.log('calcLT', selectedSolverData.calcLT, 'testLT', testLt);
                // check if same lt as current, if yes, update
                if(selectedSolverData.calcLT === testLt) {
                    selectedSolverData = solverData;
                    selectedSolverData.calcLT = testLt;
                }
            }
            else {
                // console.log('New LT is better! Using', solverData, 'as selected data. newLT:', testLt);
                selectedSolverData = solverData;
                selectedSolverData.calcLT = testLt;
            }
        }

        if(selectedSolverData) {
            // console.log('previous borrow for', selectedSolverData.symbol, ':', this.reverseCurrentSelectedBorrowSimulated[token][selectedSolverData.symbol]);
            this.reverseCurrentSelectedBorrowSimulated[token][selectedSolverData.symbol] = selectedSolverData.value;
            // console.log('new borrow for', selectedSolverData.symbol, ':', this.reverseCurrentSelectedBorrowSimulated[token][selectedSolverData.symbol]);
            this.reverseSolveSimulated();
        } else {
            console.log('could not find lower LT for', token);
        }
    }

    reverseIncrement = (token, field) => {
        const currentVal =
            field === 'supply' ? this.getReverseSupplyForToken(token) : this.getReverseBorrowForToken(token)

        const dcsForToken = this.findDCStepsForToken(token) // [0,1,5,10,15,20]
        dcsForToken.sort((a, b) => a - b)
        const indexOfCurrent = dcsForToken.indexOf(currentVal)
        if (indexOfCurrent === dcsForToken.length - 1) {
            // do nothing if already max
        } else {
            // if not max, update value with the next
            const newValue = dcsForToken[indexOfCurrent + 1]
            field === 'supply'
                ? (this.reverseCurrentSelectedSupply[token] = newValue)
                : (this.reverseCurrentSelectedBorrow[token] = newValue)
        }

        // when changing borrow, set simulated to borrow to be the same
        // if (field === 'borrow') {
        //     for (const [longKey] of Object.entries(this.reverseCurrentSelectedBorrowSimulated)) {
        //         this.reverseCurrentSelectedBorrowSimulated[longKey][token] = this.getReverseBorrowForToken(token)
        //     }
        // }

        // restart the reverse solve to recompute lt when changing supply or borrow
        this.reverseSolveSimulated()
    }

    reverseDecrement = (token, field) => {
        const currentVal =
            field === 'supply' ? this.getReverseSupplyForToken(token) : this.getReverseBorrowForToken(token)
        const dcsForToken = this.findDCStepsForToken(token) // [0,1,5,10,15,20]
        dcsForToken.sort((a, b) => a - b)
        const indexOfCurrent = dcsForToken.indexOf(currentVal)
        if (indexOfCurrent === 0) {
            // do nothing if already min
        } else {
            // if not max, update value with the next
            const newValue = dcsForToken[indexOfCurrent - 1]
            if (newValue > 0) {
                field === 'supply'
                    ? (this.reverseCurrentSelectedSupply[token] = newValue)
                    : (this.reverseCurrentSelectedBorrow[token] = newValue)
            }
        }

        // when decreasing supply, if any simulated borrow is higher than the current supply, reset simu borrow = real borrow
        if (field === 'supply') {
            for (const [borrowSimuKey] of Object.entries(this.reverseCurrentSelectedBorrowSimulated[token])) {
                const simuBorrow = this.reverseCurrentSelectedBorrowSimulated[token][borrowSimuKey];
                if(simuBorrow >= this.reverseCurrentSelectedSupply[token]) {
                    this.reverseCurrentSelectedBorrowSimulated[token][borrowSimuKey] = this.getReverseBorrowForToken(borrowSimuKey)
                }
            }
        }

        // when changing borrow, set simulated to borrow to be the same
        // if (field === 'borrow') {
        //     for (const [longKey] of Object.entries(this.reverseCurrentSelectedBorrowSimulated)) {
        //         this.reverseCurrentSelectedBorrowSimulated[longKey][token] = this.getReverseBorrowForToken(token)
        //     }
        // }

        // restart the reverse solve to recompute lt when changing supply or borrow
        this.reverseSolveSimulated()
    }
}

export default new RiskStore()