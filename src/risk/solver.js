// class Solver {
export default class Solver {
  constructor(rawDataObj) {
      this.collaterals = []
      this.stables = ["auUSDC", "auUSDT", "USDT.e", "USDC.e", "USDC", "WXDAI", "iUSD", "USDT", "sDAI"]
      this.shortStableLfs = [1, 1.5, 2]
      this.longStableLfs = [0.25, 0.5, 1]
      this.otherLfs = [0.5, 1, 1.5]
      this.caps = {}
      this.borrowCaps = {}
      this.supplyCaps = {}
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
              let li = 0.0;
              const cfs = []
              const result = {}
              for(const data of rawDataObj[pair][liquidity]) {
                  // init lfs - according to long and short assets
                  let lfs
                  if(this.stables.includes(short)) lfs = this.shortStableLfs
                  else if(this.stables.includes(long)) lfs = this.longStableLfs
                  else lfs = this.otherLfs

                  if(! lfs.includes(data["lf"])) continue // lf is not relevant
                  const dc = data["dc"]
                  if(! dcs.includes(dc)) {
                      dcs.push(dc)
                      li = data["li"]
                      perDcResult[dc] = []
                  }

                  perDcResult[dc].push(data["md"])

                  this.borrowCaps[short] = this.mergeArrays(this.borrowCaps[short], [dc])
                  this.supplyCaps[long] = this.mergeArrays(this.supplyCaps[long], [dc])
              }

              for(const dc of dcs) {
                  let sum = 0.0
                  for(const md of perDcResult[dc]) sum += md
                  const avg = sum / perDcResult[dc].length

                  const cf = result[dc] = 1 - avg - li
                  if(! cfs.includes(cf)) cfs.push(cf)
              }

              perPairResult = Object.assign({}, result)
              this.caps[long] = this.mergeArrays(this.caps[long], dcs)
              this.cfs[long] = this.mergeArrays(this.cfs[long], cfs)
          }

          if(! this.parsedData[long]) this.parsedData[long] = {}
          this.parsedData[long][short] = Object.assign({}, perPairResult)
      }
      
    //   console.log('this.parsedData', JSON.stringify(this.parsedData, null, 2));
  }

  mergeArrays(arr1, arr2) {
    let realArr1 = [] 
    if(arr1 !== undefined) realArr1 = [].concat(arr1)
    const combinedArray = realArr1.concat(arr2)
    const unique = Array.from(new Set(combinedArray))

    const sortedUnique = unique.sort((a,b) => Number(a)- Number(b))

    return sortedUnique
  }

  sortArray(arr) {
    return arr.sort((a,b) => Number(a) - Number(b))
  }

  min(val1, val2) {
      if(val1 === undefined) return val2
      return val1 > val2 ? val2 : val1
  }

    findValidCfg(mintCaps, borrowCaps, cfs) {
        const resultMintCaps = {}
        const resultBorrowCaps = Object.assign({}, borrowCaps)
        const resultCfs = {}
        let valid = true
        const efficientFrontier = []

        for (const long of Object.keys(this.parsedData)) {
            for (const short of Object.keys(this.parsedData[long])) {
                let prevDc = 0
                for (let dc of this.sortArray(Object.keys(this.parsedData[long][short]))) {
                    dc = Number(dc)
                    const cf = this.parsedData[long][short][dc]
                    if (cfs[long] > cf) {
                        valid = false
                        break // move to next short asset
                    }

                  let match = false
                  if(dc >= mintCaps[long]) {
                      resultMintCaps[long] = this.min(resultMintCaps[long], dc)
                      match = true

                      if(cfs[long] === cf) efficientFrontier.push({"asset" : long, "short" : short, "change" : "mintCap", "recommendation" : "decrease " + long + " mint cap to " + prevDc.toString(), "newCap" : prevDc})
                  }
                  if(dc >= borrowCaps[short]) {
                      match = true

                      if(cfs[long] === cf) efficientFrontier.push({"asset" : long, "short" : short, "change" : "borrowCap", "recommendation" : "decrease " + short + " borrow cap to " + prevDc.toString(), "newCap" : prevDc})                        
                  }

                  if(match) {
                      resultCfs[long] = this.min(resultCfs[long], cf)
                      break
                  }

                  prevDc = dc
              }
          }
      }

      for(const asset of this.collaterals) {
          if(resultMintCaps[asset] === undefined) resultMintCaps[asset] = mintCaps[asset]
          if(resultBorrowCaps[asset] === undefined) resultBorrowCaps[asset] = borrowCaps[asset]
          if(resultCfs[asset] === undefined) resultCfs[asset] = cfs[asset]
      }

      return {"mintCaps" : resultMintCaps, "borrowCaps" : resultBorrowCaps, "cfs" : resultCfs, valid, efficientFrontier}
  }

  isValidCfg(mintCaps, borrowCaps, cfs) {
      return (this.findValidCfg(mintCaps, borrowCaps, cfs)).valid
  }

  optimizeCfg(cfg) {
      for(const asset of this.collaterals) {
          if(this.supplyCaps[asset] === undefined) continue

          for(const cf of this.cfs[asset]) {
              if(cf > cfg.cfs[asset]) {
                  const cfs = Object.assign({}, cfg.cfs)
                  cfs[asset] = cf
                  if(this.isValidCfg(cfg.mintCaps, cfg.borrowCaps, cfs)) {
                      console.log("improve cf", asset, "old cf", this.cfs[asset], "new cf", cf)
                      return this.optimizeCfg(this.findValidCfg(cfg.mintCaps, cfg.borrowCaps, cfs))
                  }
              }
          }

          return cfg

        //   for(const cap of this.caps[asset]) {
        //       if(cap > cfg.mintCaps[asset]) {
        //           const tempMintCaps = Object.assign({}, cfg.mintCaps)
        //           tempMintCaps[asset] = cap
        //           if(this.isValidCfg(tempMintCaps, cfg.borrowCaps, cfg.cfs)) {
        //               console.log("improve mint", asset, "old cap", cfg.mintCaps[asset], "new cap", cap)                        
        //               return this.optimizeCfg(this.findValidCfg(tempMintCaps, cfg.borrowCaps, cfg.cfs))
        //           }                    
        //       }

        //       if(cap > cfg.borrowCaps[asset]) {
        //           const tempBorrowCaps = Object.assign({}, cfg.borrowCaps)
        //           tempBorrowCaps[asset] = cap
        //           if(this.isValidCfg(cfg.mintCaps, tempBorrowCaps, cfg.cfs)) {
        //               console.log("improve borrow", asset, "old cap", cfg.borrowCaps[asset], "new cap", cap)
        //               return this.optimizeCfg(this.findValidCfg(cfg.mintCaps, tempBorrowCaps, cfg.cfs))
        //           }
        //       }
        //   }
      }

      return cfg
  }

  optimizeBorrowCaps(mintCaps, borrowCaps, cfs) {
      let newBorrowCaps = Object.assign({}, borrowCaps)
      for(const asset of this.collaterals) {
          if(this.borrowCaps[asset] === undefined) continue
          for(const cap of this.borrowCaps[asset]) {
              if(cap <= borrowCaps[asset]) continue
              const tempBorrowCaps = Object.assign({}, newBorrowCaps)
              tempBorrowCaps[asset] = cap
              if(this.isValidCfg(mintCaps, tempBorrowCaps, cfs)) newBorrowCaps[asset] = cap 
          }
      }

      return newBorrowCaps
  }

  // retunr the efficient frontier
  recommendationForIncrease(cfg, property, asset, newVal) {
      const newCfg = Object.assign({}, cfg)
      newCfg[property][asset] = newVal

      return this.findValidCfg(newCfg.mintCaps, newCfg.borrowCaps, newCfg.cfs).efficientFrontier
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

      return {"mintCap" : {"asset" : asset, "cap" : long},
              "borrowCap" : short }
  }

  recommendations(cfg) {
      return this.findValidCfg(cfg.mintCaps, cfg.borrowCaps, cfg.cfs).efficientFrontier
  }
}

// const rawData = require("./risk_params.json")
// const s = new Solver(rawData)
// console.log(s.parsedData)

// const supplyCaps = {
//   "ADA" : 0.1,
//   "C3" : 0.2,
//   "COPI" : 0.1,
//   "HOSKY" : 20,
//   "iBTC" : 20,
//   "iUSD" : 0.1,
//   "MELD" : 0.1,
//   "MIN" : 0.1,
//   "WMT" : 0.1,
//   "WRT" : 0.1,
// }


// const borrowCaps = {
//     "ADA" : 0.1,
//     "C3" : 0.2,
//     "COPI" : 0.1,
//     "HOSKY" : 20,
//     "iBTC" : 20,
//     "iUSD" : 0.1,
//     "MELD" : 0.1,
//     "MIN" : 0.1,
//     "WMT" : 0.1,
//     "WRT" : 0.1,
//   }

  
// const cfs = {
//     "ADA" : -10,
//     "C3" :  -10,
//     "COPI" :  -10,
//     "HOSKY" :  -10,
//     "iBTC" :  -10,
//     "iUSD" :  -10,
//     "MELD" : -10,
//     "MIN" :  -10,
//     "WMT" :  -10,
//     "WRT" :  -10
//   }

// const cfg = s.findValidCfg(supplyCaps, borrowCaps, cfs)
// console.log(cfg)
// //console.log({caps})
// console.log({cfg})
// console.log("try to optimize")
// const imp = s.optimizeCfg(cfg)
// console.log(imp)
// console.log("try to imporove cf")
// //const newEthCf = 0.89 //0.862
// //console.log(s.recommendationForIncrease(imp, "cfs", "auETH", newEthCf))
// console.log(s.recommendations(imp))
// return
// console.log("optimize borrow caps")
// const opt = s.optimizeBorrowCaps(cfg[0], cfg[1], cfg[2])
// console.log({opt})


// console.log("--------------------------")
// console.log(cfg[0])
// console.log(opt)
