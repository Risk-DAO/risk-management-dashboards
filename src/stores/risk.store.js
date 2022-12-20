import { makeAutoObservable, runInAction } from 'mobx'

import Solver from '../risk/solver'
import mainStore from '../stores/main.store'

const tweakCurrentCap = (cap) => {
    if (cap === '0' || cap === 0) {
        return Infinity
    }
    if (cap === '1' || cap === 1) {
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
    reverseCurrentSelectedSupplySimulated = {}
    reverseCurrentSelectedBorrowSimulated = {}
    recommendations = []
    asterixs = {
        worstDay: false,
        usage: false,
        caps: false,
    }

    constructor() {
        this.initPromise = this.init()
        makeAutoObservable(this)
    }

    getCurrentData = async () => {
        const d = mainStore['lending_platform_current_request']
            ? await mainStore['lending_platform_current_request']
            : await Promise.resolve({})
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
            .map(([k, v]) => {
                if (k === 'json_time') {
                    return null
                }
                return {
                    asset: k,
                    mint_cap: this.looping ? v.total_collateral : v.nl_total_collateral,
                    borrow_cap: this.looping ? v.total_debt : v.nl_total_debt,
                }
            })
            .filter((o) => o)
    }

    init = async () => {
        if (true) {
            const data = await mainStore['risk_params_request']

            this.liquidityData = await mainStore['usd_volume_for_slippage_request'];
            // console.log('this.liquidityData', JSON.stringify(this.liquidityData, null, 2));
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
            // console.log('caps', this.solver.caps)
            runInAction(() => {
                this.incrementationOptions = this.solver.caps
                this.incrementSupplyOptions = this.solver.supplyCaps
                this.incrementBorrowOptions = this.solver.borrowCaps
                // console.log(this.incrementationOptions)
                // const sorted = riskData.sort((a,b)=> a.asset.localeCompare(b.asset))
                // this.data = sorted
                this.solve()
                this.reverseSolve()
                this.loading = false
            })
        }
    }

    toggleLooping = async () => {
        this.looping = !this.looping
        this.utilization = await mainStore['accounts_request'].then((u) => {
            return Object.entries(u)
                .map(([k, v]) => {
                    if (k === 'json_time') {
                        return null
                    }
                    return {
                        asset: k,
                        mint_cap: this.looping ? v.total_collateral : v.nl_total_collateral,
                        borrow_cap: this.looping ? v.total_debt : v.nl_total_debt,
                    }
                })
                .filter((o) => o)
        })

        this.solveFor(this.utilization)
    }

    getRecommendations = async () => {
        await this.initPromise
        const simulation = Object.entries(mainStore.clean(await mainStore['current_simulation_risk_request'])).map(
            ([k, v]) => Object.assign({ asset: k }, v.summary)
        )
        return [this.utilization, this.currentData, simulation]
    }

    incrament = (row, field) => {
        // find the options
        const options =
            (field === 'borrow_cap'
                ? this.incrementBorrowOptions[row.asset]
                : this.incrementSupplyOptions[row.asset]) || []
        //  this.incrementationOptions[row.asset] || []
        // console.log({ options }, field)
        // find the index of exisiting value
        const currentIndex = options.indexOf(Number(row[field]))
        // validate we can incrament or decrament
        if (currentIndex === -1) {
            // console.log('cant incrament 1')
            return
        }
        if (currentIndex === options.length - 1) {
            // console.log('cant incrament 2')
            return
        }
        // cahnge the value
        row[field] = options[currentIndex + 1]
        this.solve()
        // console.log('incrament')
    }

    clearDiffs = () => {
        if (this.timeOutId) {
            //clear timeOut
            clearTimeout(this.timeOutId)
        }
        this.timeOutId = setTimeout(() => {
            runInAction(() => {
                this.data = this.data.map((r) => {
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
        if (this.data.length) {
            this.data.forEach((row) => {
                mintCaps[row.asset] = row.mint_cap
                borrowCaps[row.asset] = row.borrow_cap
                collateralFactorCaps[row.asset] = 0
            })
        } else {
            Object.entries(this.solver.supplyCaps).forEach(([k, v]) => {
                let max
                for (const row of sandBoxInitData) {
                    //console.log(row.asset, k)
                    if (row.asset === k) {
                        max = this.findCap(row.asset, row.mint_cap, false)
                        console.log('found max collateral', k, { max })
                        break
                    }
                }
                //console.log("currdata",this.currentData[0].asset)
                //console.log("collateral", {k},{v})
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
                collateralFactorCaps[k] = 0
            })
            Object.entries(this.solver.borrowCaps).forEach(([k, v]) => {
                //console.log("debt", {k},{v})
                //const max = this.findCap(k, 8, true)
                let max
                for (const row of sandBoxInitData) {
                    if (row.asset === k) {
                        max = this.findCap(row.asset, row.borrow_cap, true)
                        console.log('found max debt', k, { max }, row.borrow_cap)

                        break
                    }
                }
                if (max === undefined) {
                    max = this.solver.borrowCaps[k][this.solver.borrowCaps[k].length - 1]
                }
                borrowCaps[k] = max
            })
        }
        const newRiskParameters = this.solver.optimizeCfg(
            this.solver.findValidCfg(mintCaps, borrowCaps, collateralFactorCaps)
        )

        this.recommendations = this.solver.recommendations(newRiskParameters)
        // then rebuild data object from new configurations
        const newTableData = {}
        Object.entries(newRiskParameters.mintCaps).forEach(([k, v]) => {
            newTableData[k] = newTableData[k] || { asset: k }
            newTableData[k].mint_cap = v
        })
        Object.entries(newRiskParameters.borrowCaps).forEach(([k, v]) => {
            newTableData[k] = newTableData[k] || { asset: k }
            newTableData[k].borrow_cap = v
        })
        Object.entries(newRiskParameters.cfs).forEach(([k, v]) => {
            newTableData[k] = newTableData[k] || { asset: k }
            newTableData[k].collateral_factor = v
        })
        // look for diffs and add theme
        this.data.forEach((row) => {
            const cf = row.collateral_factor
            const newCf = newTableData[row.asset].collateral_factor
            if (!cf || cf === newCf) {
                newTableData[row.asset].diff = false
                return
            }
            newTableData[row.asset].diff = newCf - cf
        })
        // then rerender
        runInAction(() => {
            this.data = Object.values(newTableData).sort((a, b) => a.asset.localeCompare(b.asset))
        })
        this.clearDiffs()
    }

    findCap = (asset, value, borrow) => {
        const caps = borrow ? this.solver.borrowCaps[asset] : this.solver.supplyCaps[asset] // this.solver.caps[asset]
        if (!caps) {
            console.warn('findCap fn: No caps found for asset ' + asset)
            return 0
        }
        if (value === undefined) {
            console.warn('findCap fn: No value provided for asset ' + asset)
            return caps[0]
        }
        if (value === Infinity) {
            return caps[caps.length - 1]
        }
        for (let cap of caps) {
            if (cap * 1000000 >= value) {
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
        if (dataSet.length) {
            dataSet.forEach((row) => {
                mintCaps[row.asset] = this.findCap(row.asset, row.mint_cap, false)
                borrowCaps[row.asset] = this.findCap(row.asset, row.borrow_cap, true)
                collateralFactorCaps[row.asset] = 0
            })
        }
        const newRiskParameters = this.solver.optimizeCfg(
            this.solver.findValidCfg(mintCaps, borrowCaps, collateralFactorCaps)
        )

        //this.recommendations = this.solver.recommendations(newRiskParameters)
        // then rebuild data object from new configurations
        const newTableData = {}
        Object.entries(newRiskParameters.mintCaps).forEach(([k, v]) => {
            newTableData[k] = newTableData[k] || { asset: k }
            newTableData[k].mint_cap = v
        })
        Object.entries(newRiskParameters.borrowCaps).forEach(([k, v]) => {
            newTableData[k] = newTableData[k] || { asset: k }
            newTableData[k].borrow_cap = v
        })
        Object.entries(newRiskParameters.cfs).forEach(([k, v]) => {
            newTableData[k] = newTableData[k] || { asset: k }
            newTableData[k].collateral_factor = v
        })

        // then rerender
        runInAction(() => {
            dataSet = dataSet.map((r) => {
                r.collateral_factor = newTableData[r.asset].collateral_factor
                r.debug_mc = newTableData[r.asset].mint_cap
                r.debug_bc = newTableData[r.asset].borrow_cap
                return r
            }) //(Object.values(newTableData)).sort((a,b)=> a.asset.localeCompare(b.asset))
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
        // console.log({ options }, this.incrementationOptions[row.asset])
        const currentIndex = options.indexOf(Number(row[field]))
        // validate we can incrament or decrament
        if (currentIndex === -1) {
            // console.log('cant decrament 1', row[field])
            return
        }
        if (currentIndex === 0) {
            // console.log('cant decrament 2')
            return
        }
        // cahnge the value
        row[field] = options[currentIndex - 1]
        this.solve()
        // console.log('decrament')
    }

    getCurrentCollateralFactor = (asset) => {
        if (asset === window.APP_CONFIG.STABLE || this.currentData.length === 0) {
            return 0
        }
        const [{ current_collateral_factor }] = this.currentData.filter((r) => r.asset === asset)
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

    // this function is called for the reverse solver sandbox
    // it compute the LT for specified supply and borrow
    // SHOULD NOT be used when manually changing liquidation threshold
    reverseSolve = () => {
        this.reverseSolvedData = [];
        // console.log('solverdata', JSON.stringify(this.solverData, null, 2));
        for(const [key, long]  of Object.entries(this.solverData)){
            let reverseSolveItem = {
                long: key,
                supply: this.getReverseSupplyForToken(key),
                borrow: this.getReverseBorrowForToken(key),
                lt: this.LTfromSupplyBorrow(key),
                liquidity: this.liquidityData[key],
                liquidityChange: 'N/A'
            };
            this.reverseSolvedData.push(reverseSolveItem);
        }

        this.reverseSolvedData = this.reverseSolvedData.sort((a,b) => a.long.localeCompare(b.long));
        console.log('reverseSolvedData', JSON.stringify(this.reverseSolvedData, null, 2));
    }
    
    reverseSolveSimulated = () => {
        this.reverseSolvedData = [];
        // console.log('solverdata', JSON.stringify(this.solverData, null, 2));
        for(const [key, long]  of Object.entries(this.solverData)){
            let reverseSolveItem = {
                long: key,
                supply: this.getReverseSupplyForTokenSimulated(key),
                borrow: this.getReverseBorrowForTokenSimulated(key),
                lt: this.LTfromSupplyBorrowSimulated(key),
                liquidity: this.liquidityData[key],
                liquidityChange: 'N/A'
            };
            this.reverseSolvedData.push(reverseSolveItem);
        }

        this.reverseSolvedData = this.reverseSolvedData.sort((a,b) => a.long.localeCompare(b.long));
        console.log('reverseSolvedData', JSON.stringify(this.reverseSolvedData, null, 2));
    }

    getReverseSupplyForToken = (token) => {
        if(this.reverseCurrentSelectedSupply[token] === undefined) {
            this.reverseCurrentSelectedSupply[token] = this.findMaxDCForToken(token)
        } 

        return this.reverseCurrentSelectedSupply[token];
    }

    getReverseSupplyForTokenSimulated = (token) => {
        if(this.reverseCurrentSelectedSupplySimulated[token] === undefined) {
            this.reverseCurrentSelectedSupplySimulated[token] = this.getReverseSupplyForToken(token);
        } 

        return this.reverseCurrentSelectedSupplySimulated[token];
    }

    getReverseBorrowForToken = (token) => {
        if(this.reverseCurrentSelectedBorrow[token] === undefined) {
            this.reverseCurrentSelectedBorrow[token] = this.findMaxDCForToken(token)
        } 

        return this.reverseCurrentSelectedBorrow[token]        
    }

    getReverseBorrowForTokenSimulated = (token) => {
        if(this.reverseCurrentSelectedBorrowSimulated[token] === undefined) {
            this.reverseCurrentSelectedBorrowSimulated[token] = this.getReverseBorrowForToken(token)
        } 

        return this.reverseCurrentSelectedBorrowSimulated[token]        
    }

    findDCStepsForToken = (token) => {
        for(const [longKey, long]  of Object.entries(this.solverData)){
            for(const [shortKey, short]  of Object.entries(long)){
                if(shortKey === token){
                    return Object.keys(short).map((entry) => Number(entry))
                }
            }
        }
    }

    findMaxDCForToken = (token) => {
        return Math.max(...this.findDCStepsForToken(token));
    }

    LTfromSupplyBorrow = (token) => {
        const longSupply = this.reverseCurrentSelectedSupply[token];
        // console.log(token, 'longSupply', longSupply)
    
        let min = 1;
        for(const [keyShort, short]  of Object.entries(this.solverData[token])) {
            const shortBorrow = this.getReverseBorrowForToken(keyShort);
            // console.log(keyShort, 'short borrow', shortBorrow)
            const minSupplyBorrow = Math.min(Number(longSupply), Number(shortBorrow));
            const selectedLt = short[minSupplyBorrow.toString()]
            if(selectedLt < min) {
                min = selectedLt;
            }
        }
    
        return min;
    }
    

    LTfromSupplyBorrowSimulated = (token) => {
        const longSupply = this.reverseCurrentSelectedSupplySimulated[token];
        // console.log(token, 'longSupply', longSupply)
    
        let min = 1;
        for(const [keyShort, short]  of Object.entries(this.solverData[token])) {
            const shortBorrow = this.getReverseBorrowForTokenSimulated(keyShort);
            // console.log(keyShort, 'short borrow', shortBorrow)
            const minSupplyBorrow = Math.min(Number(longSupply), Number(shortBorrow));
            const selectedLt = short[minSupplyBorrow.toString()]
            if(selectedLt < min) {
                min = selectedLt;
            }
        }
    
        return min;
    }

    reverseIncrement = (token, field) => {
        const currentVal = field === 'supply' ? this.getReverseSupplyForToken(token) : this.getReverseBorrowForToken(token)

        const dcsForToken = this.findDCStepsForToken(token); // [0,1,5,10,15,20]
        dcsForToken.sort((a,b) => a - b);
        const indexOfCurrent = dcsForToken.indexOf(currentVal);
        if(indexOfCurrent === dcsForToken.length -1) {
            // do nothing if already max
            console.log('reverseIncrement', field, 'already at max', currentVal);
        } else {
            // if not max, update value with the next
            const newValue = dcsForToken[indexOfCurrent+1];
            field === 'supply' ? 
                    this.reverseCurrentSelectedSupply[token] = newValue
                    : this.reverseCurrentSelectedBorrow[token] = newValue

        }

        // restart the reverse solve to recompute lt when changing supply or borrow
        this.reverseSolve();
    }

    reverseDecrement = (token, field) => {
        const currentVal = field === 'supply' ? this.getReverseSupplyForToken(token) : this.getReverseBorrowForToken(token)
        const dcsForToken = this.findDCStepsForToken(token); // [0,1,5,10,15,20]
        dcsForToken.sort((a,b) => a - b);
        const indexOfCurrent = dcsForToken.indexOf(currentVal);
        if(indexOfCurrent === 0) {
            // do nothing if already min
            console.log('reverseDecrement', field, 'already at min', currentVal);
        } else {
            // if not max, update value with the next
            const newValue = dcsForToken[indexOfCurrent-1];
            if(newValue === 0) {
                console.log('reverseDecrement', field, 'should not go to 0 from ', currentVal);
            }
            else {
                field === 'supply' ? 
                            this.reverseCurrentSelectedSupply[token] = newValue
                            : this.reverseCurrentSelectedBorrow[token] = newValue
            }
        }

        // restart the reverse solve to recompute lt when changing supply or borrow
        this.reverseSolve();
    }

    reverseIncrementLiquidationThreshold = (token) => {
        // get min supply or borrow
        let minSupplySimulated = this.reverseCurrentSelectedSupply[token];
        const currentDataIndex = this.reverseSolvedData.findIndex(_ => _.long === token);

        if(this.reverseSolvedData[currentDataIndex].simulated) {
            minSupplySimulated = Math.min(Number(minSupplySimulated), Number(this.reverseSolvedData[currentDataIndex].simulated));
        }
        // console.log(token, 'longSupply', longSupply)
    
        let minBorrow = 1;
        let minToken = ''
        let minLt = 1;
        let supplyIsLower = false;
        for(const [keyShort, short]  of Object.entries(this.solverData[token])) {
            const shortBorrow = this.getReverseBorrowForToken(keyShort);
            // console.log(keyShort, 'short borrow', shortBorrow)
            const minSupplyBorrow = Math.min(Number(minSupplySimulated), Number(shortBorrow));
            const selectedLt = short[minSupplyBorrow.toString()]
            if(selectedLt < minLt) {
                minLt = selectedLt;
                minBorrow = Number(shortBorrow);
                minToken = keyShort;
                supplyIsLower = minBorrow > minSupplySimulated;
            }
        }
    
        console.log('minBorrow', minBorrow)
        console.log('minToken', minToken)
        console.log('minLt', minLt)
        console.log('supplyIsLower', supplyIsLower)

        // find the next lower DC step for the token
        const dcsForToken = this.findDCStepsForToken(supplyIsLower ? token : minToken); // [0,1,5,10,15,20]
        dcsForToken.sort((a,b) => a - b);
        const currentVal = supplyIsLower ? minSupplySimulated : minBorrow;
        const indexOfCurrent = dcsForToken.indexOf(currentVal);
        if(indexOfCurrent === 0) {
            // do nothing if already min
            console.log('reverseIncrementLiquidationThreshold already at min');
        } else {
            // if not max, update value with the next
            const newValue = dcsForToken[indexOfCurrent-1];
            if(newValue === 0) {
                console.log('reverseIncrementLiquidationThreshold should not go to 0');
            }
            else {
                const mult = currentVal / newValue; // if current was 20M, next is 15M, then mult = 1.333...
                // we should multiply the existing liquidity for this token by the mult
                // this.reverseSolvedData[currentDataIndex].simulated = newValue;
                const currentSimulatedVolume = this.reverseSolvedData[currentDataIndex].liquidity[minToken].simulatedVolume;
                const baseVolume = this.reverseSolvedData[currentDataIndex].liquidity[minToken].volume
                const volumeToMultiply = currentSimulatedVolume || baseVolume;

                const newCalculatedLiquidity = volumeToMultiply * mult;

                const changeFromBaseVolume = newCalculatedLiquidity / baseVolume;
                this.reverseSolvedData[currentDataIndex].liquidityChange = `+${(Math.round((changeFromBaseVolume-1)*100)).toFixed(0)}% ${token}->${minToken}`;
                this.reverseSolvedData[currentDataIndex].lt = this.solverData[token][minToken][newValue];
                this.reverseSolvedData[currentDataIndex].simulated = newValue;
                this.reverseSolvedData[currentDataIndex].liquidity[minToken].simulatedVolume = newCalculatedLiquidity;
                // console.log('this.reverseSolvedData', JSON.stringify(this.reverseSolvedData, null, 2))
                // this is done because I need to reset the data to update the state
                console.log('this.reverseSolvedData', JSON.stringify(this.reverseSolvedData[currentDataIndex], null, 2))
                const oldState = JSON.parse(JSON.stringify(this.reverseSolvedData));
                this.reverseSolvedData = [];
                this.reverseSolvedData = oldState;
            }
        }
    }
    
    reverseDecrementLiquidationThreshold = (token) => {
        
    }

}

export default new RiskStore()
