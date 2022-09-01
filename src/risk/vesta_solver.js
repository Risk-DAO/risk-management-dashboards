class VestaSolver {
  constructor(rawDataObj) {
      this.liquidationPenalty = 0.1
      this.collaterals = []
      this.stables = ["VST"]
      this.shortStableLfs = [1, 1.5, 2]
      this.borrowCaps = {}
      this.stabilityPoolCaps = {}
      this.bprotocolCaps = {}

      this.cfs = {}

      // the output ori should have give me...
      this.parsedData = {} // [long][short][dc] => cf

      for(const pair of Object.keys(rawDataObj)) {
          let perPairResult
          const pairArray = pair.split("-")
          const long = pairArray[0]
          const short = pairArray[1]

          if(! this.collaterals.includes(long)) this.collaterals.push(long)
          if(! this.collaterals.includes(short)) this.collaterals.push(short)

          for(const liquidity of Object.keys(rawDataObj[pair])) {
              perPairResult = {} // reset results, so only last results count
              const perCfgResult = {}
              const dcs = []
              const sps = []
              const bps = []

              for(const data of rawDataObj[pair][liquidity]) {
                  // init lfs - according to long and short assets
                  let lfs
                  if(this.stables.includes(short)) lfs = this.shortStableLfs
                  else continue

                  if(! lfs.includes(data["lf"])) continue // lf is not relevant
                  const dc = data["dc"]
                  const sp = data["spibr"]
                  const bp = data["si"]

                  if(! dcs.includes(dc)) dcs.push(dc)
                  if(! (dc in perCfgResult)) perCfgResult[dc] = {}

                  //console.log({dc}, {sp}, {bp}, perCfgResult[dc])

                  if(! sps.includes(sp)) sps.push(sp)
                  if(! (sp in perCfgResult[dc])) perCfgResult[dc][sp] = {}

                  if(! bps.includes(bp)) bps.push(bp)
                  if(! (bp in perCfgResult[dc][sp])) perCfgResult[dc][sp][bp] = { "avg" : 0, "mds" : [] }

                  perCfgResult[dc][sp][bp].mds.push(data["md"] + data["li"])
                  let sum = 0
                  for(const md of perCfgResult[dc][sp][bp].mds) sum += md
                  perCfgResult[dc][sp][bp].avg = sum / perCfgResult[dc][sp][bp].mds.length
              }

              this.borrowCaps[long] = dcs
              this.stabilityPoolCaps[long] = sps
              this.bprotocolCaps[long] = bps

              perPairResult = Object.assign({}, perCfgResult)
          }

          if(! this.parsedData[long]) this.parsedData[long] = {}
          this.parsedData[long] = Object.assign({}, perPairResult)
      }

      console.log(JSON.stringify(this.parsedData, null, 2))
  }

  getCf(asset, borrowCap, stabilityPoolSize, bprotocolSize) {
    // find caps
    let realBorrowCap = 0
    let realStabilityPoolSize = 0
    let realBProtocolSize = 0
    
    for(const bc of this.borrowCaps[asset]) {
        realBorrowCap = bc
        if(bc >= borrowCap) break
    }

    for(const sp of this.stabilityPoolCaps[asset]) {
        realStabilityPoolSize = sp
        if(sp >= stabilityPoolSize) break
    }

    for(const bp of this.bprotocolCaps[asset]) {
        realBProtocolSize = bp
        if(bp >= bprotocolSize) break
    }
    
    return 1 - this.parsedData[asset][realBorrowCap][realStabilityPoolSize][realBProtocolSize].avg
  }
}
const rawData = require("./input.json")
const s = new VestaSolver(rawData)

console.log(s.getCf("ETH", 7, 0.1, 0.1))
