function roundTo(num, dec = 2) {
    const pow =  Math.pow(10,dec);
    return Math.round((num + Number.EPSILON) * pow) / pow;
}

/**
 * Compute the required liquidities increase needed for increasing tokenA->tokenB liquidity if the pair is not direct
 * ie: increasing liquidity of HOSKY->WRT must go throug two pools: HOSKY->ADA and ADA->WRT so increasing HOSKY->WRT liquidity x2
 * does not always mean to increase HOSKY->ADA x2 and ADA->WRT x2
 * @param {string} tokenA name of the tokenA (logging purpose)
 * @param {number} liquidityAvsADA volume in usd of tokenA->ADA
 * @param {string} tokenB name of the tokenB (logging purpose)
 * @param {number} liquidityADAvsB volume in usd of ADA->tokenB
 * @param {number} increaseFactor the amount of liquidity increase is required. example: 2 for x2 = +100%
 * @param {number} startingSlippagePercent the slippage amount for the liquidity, 10 for 10%
 * @returns 
 */
function SolveLiquidityIncrease(tokenA, liquidityAvsADA, tokenB, liquidityADAvsB, increaseFactor, startingSlippagePercent) {
    // const tokenA = 'MELD';
    // const tokenB = 'HOSKY';
    const baseLiquidityAvsADA = liquidityAvsADA;
    const baseLiquidityADAvsB = liquidityADAvsB;
    const currentSlippage = startingSlippagePercent;
    const liquidityFactorRequired = increaseFactor;
    const targetSlippage = currentSlippage / liquidityFactorRequired;

    console.log(`Increase required on ${tokenA}->${tokenB}: +${(liquidityFactorRequired-1)*100}%`);
    console.log(`Finding liquidity increase for ${tokenA}->${tokenB}, meaning ${tokenA}->ADA and ADA->${tokenB}`);
    console.log(`Target effective slippage: ${targetSlippage}%`);

    // console.log(`Base liquidity ${tokenA}->ADA: $${baseLiquidityAvsADA}`);
    // console.log(`Base liquidity ADA->${tokenB}: $${baseLiquidityADAvsB}`);

    const baseRatio = baseLiquidityAvsADA / baseLiquidityADAvsB;
    const ratioToCurrentSlippage = currentSlippage / (baseRatio + 1);
    let slippageWeightOfTokenA = ratioToCurrentSlippage;
    let slippageWeightOfTokenB = ratioToCurrentSlippage * baseRatio;
    
    // console.log(`baseRatio: ${baseRatio}`);
    // console.log(`${tokenA} is causing ${roundTo(slippageWeightOfTokenA)} of the ${currentSlippage}% slippage`);
    // console.log(`${tokenB} is causing ${roundTo(slippageWeightOfTokenB)} of the ${currentSlippage}% slippage`);

    let currentEffectiveSlippage = currentSlippage;

    let simulatedLiquidityA = baseLiquidityAvsADA;
    let simulatedLiquidityB = baseLiquidityADAvsB;
    
    const stepSize = 1 + 1 / 1000; // 1.001
    console.log(`Base liquidities:\n   - ${tokenA}->ADA: $${roundTo(simulatedLiquidityA)}\n   - ADA->${tokenB}: $${roundTo(simulatedLiquidityB)}`);
    console.log(`Slippage weights: \n   - ${tokenA}: ${roundTo(slippageWeightOfTokenA)} of the ${currentSlippage}% slippage\n   - ${tokenB}: ${roundTo(slippageWeightOfTokenB)} of the ${currentSlippage}% slippage`);
    // console.log(`Current slippage: ${currentEffectiveSlippage}%`);
    while(currentEffectiveSlippage > targetSlippage) {
        if(simulatedLiquidityA === simulatedLiquidityB) {
            // increase both liquidities by stepSize
            const newLiquidity = stepSize * simulatedLiquidityA;
            simulatedLiquidityA = newLiquidity;
            simulatedLiquidityB = newLiquidity;
            slippageWeightOfTokenB = slippageWeightOfTokenB / stepSize;
            slippageWeightOfTokenA = slippageWeightOfTokenA / stepSize;
        } else {
            if(simulatedLiquidityA < simulatedLiquidityB) {
                // increase liquidity A by stepSize
                let newLiquidity = stepSize * simulatedLiquidityA;
                if(newLiquidity >= simulatedLiquidityB) {
                    newLiquidity = simulatedLiquidityB;
                    // console.log(`Liquidity of ${tokenA} reached liquidity of token ${tokenB}: ${newLiquidity}`);
                }
                const changeRatio = newLiquidity / simulatedLiquidityA;
                simulatedLiquidityA = newLiquidity;
                slippageWeightOfTokenA = slippageWeightOfTokenA / changeRatio;
            } else {
                // increase liquidity B by stepSize
                let newLiquidity = stepSize * simulatedLiquidityB;
                if(newLiquidity >= simulatedLiquidityA) {
                    newLiquidity = simulatedLiquidityA;
                    // console.log(`Liquidity of ${tokenB} reached liquidity of token ${tokenA}: ${newLiquidity}`);
                }
                const changeRatio = newLiquidity / simulatedLiquidityB;
                simulatedLiquidityB = newLiquidity;
                slippageWeightOfTokenB = slippageWeightOfTokenB / changeRatio;
            }
        }

        currentEffectiveSlippage = slippageWeightOfTokenA + slippageWeightOfTokenB;
    }

    // console.log(`ENDING effective slippage: ${roundTo(currentEffectiveSlippage, 2)}%`);
    const increaseRatioOfLiquidityAvsADA = simulatedLiquidityA / baseLiquidityAvsADA;
    const increaseRatioOfLiquidityADAvsB = simulatedLiquidityB / baseLiquidityADAvsB;
    // console.log(`Increasing ${tokenA}->${tokenB} liquidity by ${(liquidityFactorRequired-1)*100}% requires:`);
    // console.log(`    - Increasing ${tokenA}->ADA liquidity by ${roundTo((increaseRatioOfLiquidityAvsADA-1)*100)}%`);
    // console.log(`    - Increasing ADA->${tokenB} liquidity by ${roundTo((increaseRatioOfLiquidityADAvsB-1)*100)}%`);
    console.log(`Required Liquidities for a ${roundTo((liquidityFactorRequired-1)*100)}% increase:\n   - ${tokenA}->ADA: $${roundTo(simulatedLiquidityA)} (+${roundTo((increaseRatioOfLiquidityAvsADA-1)*100)}%)\n   - ADA->${tokenB}: $${roundTo(simulatedLiquidityB)} (+${roundTo((increaseRatioOfLiquidityADAvsB -1)*100)}%)`);
    
    return {
        tokenAIncreaseRatio: increaseRatioOfLiquidityAvsADA,
        tokenBIncreaseRatio: increaseRatioOfLiquidityADAvsB,
    };
}

module.exports = { SolveLiquidityIncrease, roundTo }