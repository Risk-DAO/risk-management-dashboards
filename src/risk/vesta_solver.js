class VestaSolver {
  constructor(rawDataObj) {
      this.liquidationPenalty = 0.1
      this.collaterals = []
      this.stables = ["VST"]
      this.shortStableLfs = [1, 1.5, 2]
      this.caps = {}
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
              const perDcResult = {}
              const dcs = []
              const cfs = []
              const result = {}
              for(const data of rawDataObj[pair][liquidity]) {
                  // init lfs - according to long and short assets
                  let lfs
                  if(this.stables.includes(short)) lfs = this.shortStableLfs
                  else continue

                  if(! lfs.includes(data["lf"])) continue // lf is not relevant
                  const dc = data["dc"]
                  if(! dcs.includes(dc)) {
                      dcs.push(dc)
                      perDcResult[dc] = []
                  }

                  perDcResult[dc].push(data["md"])
              }

              for(const dc of dcs) {
                  let sum = 0.0
                  for(const md of perDcResult[dc]) sum += md
                  const avg = sum / perDcResult[dc].length

                  const cf = result[dc] = 1 - avg - this.liquidationPenalty
                  if(! cfs.includes(cf)) cfs.push(cf)
              }

              perPairResult = Object.assign({}, result)
              this.caps[long] = dcs
              this.cfs[long] = cfs.sort((a,b) => a-b)
          }

          if(! this.parsedData[long]) this.parsedData[long] = {}
          this.parsedData[long][short] = Object.assign({}, perPairResult)
      }

      console.log(JSON.stringify(this.parsedData, null, 2))
  }

  min(val1, val2) {
      if(val1 === undefined) return val2
      return val1 > val2 ? val2 : val1
  }

  findValidCfg(borrowCaps, cfs) {
      //console.log({cfs})
      const resultBorrowCaps = Object.assign({}, borrowCaps)
      const resultCfs = {}
      let valid = true
      const efficientFrontier = []

      for(const long of Object.keys(this.parsedData)) {
          for(const short of Object.keys(this.parsedData[long])) {
              //console.log(long, short)
              let prevDc = 0
              for(let dc of Object.keys(this.parsedData[long][short])) {
                  dc = Number(dc)
                  const cf = this.parsedData[long][short][dc]
                  //if(long === "auETH") console.log(long, short, dc, cf, cfs[long], mintCaps[long], borrowCaps[short])
                  if(cfs[long] > cf) {
                      //console.log(long, short, " cf", cfs[long], " is violated for dc ", dc)
                      valid = false
                      break // move to next short asset
                  }

                  let match = false
                  if(dc >= borrowCaps[long]) {
                      match = true

                      //if(cfs[long] === cf) efficientFrontier.push({"asset" : long, "short" : short, "change" : "borrowCap", "recommendation" : "decrease " + long + " borrow cap to " + prevDc.toString(), "newCap" : prevDc})                        
                  }

                  if(match) {
                      //console.log("match", long, dc)
                      resultCfs[long] = this.min(resultCfs[long], cf)
                      break
                  }

                  prevDc = dc
              }
          }
      }

      for(const asset of this.collaterals) {
          if(resultBorrowCaps[asset] === undefined) resultBorrowCaps[asset] = borrowCaps[asset]
          if(resultCfs[asset] === undefined) resultCfs[asset] = cfs[asset]
      }

      return {"borrowCaps" : resultBorrowCaps, "cfs" : resultCfs, valid, efficientFrontier}
  }

  isValidCfg(borrowCaps, cfs) {
      return (this.findValidCfg(borrowCaps, cfs)).valid
  }

  optimizeCfg(cfg) {
      for(const asset of this.collaterals) {
          if(this.caps[asset] === undefined) continue

          for(const cf of this.cfs[asset]) {
              if(cf > cfg.cfs[asset]) {
                  const cfs = Object.assign({}, cfg.cfs)
                  cfs[asset] = cf
                  if(this.isValidCfg(cfg.borrowCaps, cfs)) {
                      console.log("improve cf", asset, "old cf", this.cfs[asset], "new cf", cf)
                      return this.optimizeCfg(this.findValidCfg(cfg.borrowCaps, cfs))
                  }
              }
          }

          return cfg

          for(const cap of this.caps[asset]) {
              if(cap > cfg.borrowCaps[asset]) {
                  const tempBorrowCaps = Object.assign({}, cfg.borrowCaps)
                  tempBorrowCaps[asset] = cap
                  if(this.isValidCfg(tempBorrowCaps, cfg.cfs)) {
                      console.log("improve borrow", asset, "old cap", cfg.borrowCaps[asset], "new cap", cap)
                      return this.optimizeCfg(this.findValidCfg(tempBorrowCaps, cfg.cfs))
                  }
              }
          }
      }

      return cfg
  }

  optimizeBorrowCaps(borrowCaps, cfs) {
      let newBorrowCaps = Object.assign({}, borrowCaps)
      for(const asset of this.collaterals) {
          if(this.caps[asset] === undefined) continue
          for(const cap of this.caps[asset]) {
              if(cap <= borrowCaps[asset]) continue
              const tempBorrowCaps = Object.assign({}, newBorrowCaps)
              tempBorrowCaps[asset] = cap
              if(this.isValidCfg(tempBorrowCaps, cfs)) newBorrowCaps[asset] = cap
              else console.log("optimizeBorrowCaps", asset, cap, "invalid")
          }
      }

      return newBorrowCaps
  }

  // retun the efficient frontier
  recommendationForIncrease(cfg, property, asset, newVal) {
      const newCfg = Object.assign({}, cfg)
      newCfg[property][asset] = newVal

      return this.findValidCfg(newCfg.borrowCaps, newCfg.cfs).efficientFrontier
  }

  recommendCfIncrease(cfg, asset) {
      const currCf = cfg.cfs[asset]
      let newCf = currCf + 0.001
      for(let i = 0 ; i < this.cfs[asset].length ; i++) {
          if(this.cfs[asset][i] === currCf) {
              if(i + 1 < this.cfs[asset].length) {
                  newCf = this.cfs[asset][i]
                  break
              } 
          }
      }

      const recommendations = this.recommendationForIncrease(cfg, "cfs", asset, newCf)
      if(recommendations.length === 0) return null

      const short = []
      let long = 0
      for(const recommendation of recommendations) {
          const cap = recommendation.prevDc
          short.push({"asset": recommendation.short, "borrowCap" : cap})

          if(long > cap || long === 0) long = cap
      }

      return {"borrowCap" : short }
  }

  recommendations(cfg) {
      return this.findValidCfg(cfg.borrowCaps, cfg.cfs).efficientFrontier
  }
}
const rawData = require("./input.json")
const s = new VestaSolver(rawData)
console.log(s.caps)

const caps = {
   "DPX" : 0,
   "ETH" : 0,
   "renBTC" : 2,
   "GMX" : 2,
   "gOHM" : 2,
   "GLP" : 2,
   "VST" : 0
}

const cfs = {
   "DPX" : 0,
   "ETH" : 0,
   "renBTC" : 0,
   "GMX" : 0,
   "gOHM" : 0,
   "GLP" : 0,
   "VST" : 0    
}

const cfg = s.findValidCfg(caps, cfs)
console.log({caps})
console.log({cfg})
console.log("try to optimize")
const imp = s.optimizeCfg(cfg)
console.log({imp})
console.log("try to imporove cf")
// //const newEthCf = 0.89 //0.862




// return
console.log("optimize borrow caps")
imp.borrowCaps = s.optimizeBorrowCaps(imp.borrowCaps, imp.cfs)
/*
console.log(s.recommendations(imp))
console.log("====================")
console.log(s.recommendationForIncrease(imp, "borrowCaps", "GLP", 40))
*/
//console.log({opt})


console.log("--------------------------")
console.log({imp})
//console.log(opt)
