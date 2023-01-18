// TODO: change order of look ups 

class VestaSolver {
    constructor(rawDataObj) {
        this.liquidationPenalty = 0.1
        this.collaterals = []
        this.stables = ["VST"]
        this.shortStableLfs = [1, 1.5, 2]
        this.borrowCaps = {}
        this.supplyCaps = {}
        this.stabilityPoolCaps = {}
        this.bprotocolCaps = {}

        this.cfs = {}

        // the output ori should have give me...
        this.parsedData = {} // [long][short][dc] => cf

        for (const pair of Object.keys(rawDataObj)) {
            let perPairResult
            const pairArray = pair.split("-")
            const long = pairArray[0]
            const short = pairArray[1]

            if (!this.collaterals.includes(long)) this.collaterals.push(long)
            if (!this.collaterals.includes(short)) this.collaterals.push(short)

            for (const liquidity of Object.keys(rawDataObj[pair])) {
                perPairResult = {} // reset results, so only last results count
                const perCfgResult = {}
                const dcs = []
                const sps = []
                const bps = []

                for (const data of rawDataObj[pair][liquidity]) {
                    // init lfs - according to long and short assets
                    let lfs
                    if (this.stables.includes(short)) lfs = this.shortStableLfs
                    else continue

                    if (!lfs.includes(data["lf"])) continue // lf is not relevant
                    const dc = data["dc"]
                    const sp = data["spibr"]
                    const bp = data["si"]

                    if (!dcs.includes(dc)) dcs.push(dc)
                    if (!(dc in perCfgResult)) perCfgResult[dc] = {}

                    if (!sps.includes(sp)) sps.push(sp)
                    if (!(sp in perCfgResult[dc])) perCfgResult[dc][sp] = {}

                    if (!bps.includes(bp)) bps.push(bp)
                    if (!(bp in perCfgResult[dc][sp])) perCfgResult[dc][sp][bp] = { "avg": 0, "mds": [] }

                    perCfgResult[dc][sp][bp].mds.push(data["md"] + data["li"])
                    let sum = 0
                    for (const md of perCfgResult[dc][sp][bp].mds) sum += md
                    perCfgResult[dc][sp][bp].avg = sum / perCfgResult[dc][sp][bp].mds.length
                }

                this.borrowCaps[long] = dcs
                this.stabilityPoolCaps[long] = sps
                this.bprotocolCaps[long] = bps

                perPairResult = Object.assign({}, perCfgResult)
            }

            if (!this.parsedData[long]) this.parsedData[long] = {}
            this.parsedData[long] = Object.assign({}, perPairResult)
        }
    }

    getCf(asset, borrowCap, stabilityPoolSize, bprotocolSize) {
        // find caps
        let realBorrowCap = 0
        let realStabilityPoolSize = 0
        let realBProtocolSize = 0

        for (const bc of this.borrowCaps[asset]) {
            realBorrowCap = bc
            if (bc >= borrowCap) break
        }

        for (let i = this.stabilityPoolCaps[asset].length - 1; i >= 0; i--) {
            const sp = this.stabilityPoolCaps[asset][i] 
            realStabilityPoolSize = sp
            if (sp <= stabilityPoolSize) break
        }

        for (let i = this.bprotocolCaps[asset].length - 1; i >= 0; i--) {
            const bp = this.bprotocolCaps[asset][i]
            realBProtocolSize = bp
            if (bp <= bprotocolSize) break
        }

        return 1 - this.parsedData[asset][realBorrowCap][realStabilityPoolSize][realBProtocolSize].avg
    }

    // this is a dummy function not needed for Vesta, just preserving the API
    findValidCfg(mintCaps, borrowCaps, cfs) {
        let valid = true
        const efficientFrontier = []
  
        return {mintCaps, borrowCaps, cfs,  valid, efficientFrontier}
    }

    // this is a dummy function not needed for Vesta, just preserving the API
    optimizeCfg(cfg) {
        return cfg
    }
    // this is a dummy function not needed for Vesta, just preserving the API
    recommendations(cfg) {
        return this.findValidCfg(cfg.mintCaps, cfg.borrowCaps, cfg.cfs).efficientFrontier
    }
}

const Solver = VestaSolver
export default Solver