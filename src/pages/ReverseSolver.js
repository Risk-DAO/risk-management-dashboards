import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { COLORS, TEXTS } from '../constants'
import { WhaleFriendlyAxisTick, whaleFriendlyFormater } from '../components/WhaleFriendly'
import Box from '../components/Box'
import BoxRow from '../components/BoxRow'
import { Component } from 'react'
import DataTable from 'react-data-table-component'
import React from 'react'
import mainStore from '../stores/main.store'
import { observer } from 'mobx-react'
import riskStore from '../stores/risk.store'
import { shortCurrencyFormatter } from '../utils'
import { roundTo, SolveLiquidityIncrease } from '../risk/meld_liquidity_solver'
import {
    Accordion,
    AccordionItem,
    AccordionItemHeading,
    AccordionItemButton,
    AccordionItemPanel,
} from 'react-accessible-accordion';
const {PLATFORM_ID} = window.APP_CONFIG

const buttonsStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: '5px 20px',
    borderRadius: 'var(--border-radius)',
    boxShadow: 'var(--card-box-shadow)',
}

const accordionButtonStyle = {
    width: '100%',
    // marginTop: '1px',
    padding: '1px',
}

class CapInput extends React.Component {
    render() {
        const { row, field } = this.props
        const val = shortCurrencyFormatter.format(row[field])
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                }}
            >
                <span style={{ minWidth: '50px' }}>{val}M</span>
                <span>
                    <div style={buttonsStyle}>
                        <div onClick={() => riskStore.reverseIncrement(row.long, field)} className="plus-minus">
                            +
                        </div>
                        <div onClick={() => riskStore.reverseDecrement(row.long, field)} className="plus-minus">
                            -
                        </div>
                    </div>
                </span>
            </div>
        )
    }
}

const columns = [
    {
        name: 'Asset',
        selector: (row) => row.long,
        format: (row) => row.long,
        width: '15%',
    },
    {
        name: 'Supply Cap',
        selector: (row) => row.supply,
        format: (row) => <CapInput row={row} field={'supply'} />,
        width: '15%',
    },
    {
        name: 'Borrow Cap',
        selector: (row) => row.borrow,
        format: (row) => <CapInput row={row} field={'borrow'} />,
        width: '15%',
    },
    // {
    //     name: 'Borrow Cap Simu',
    //     selector: (row) => row.simuBorrows,
    //     format: (row) => (
    //         <ul>
    //             {row.simuBorrows.map((entry, key) => {
    //                         return <li key={key}>{entry}</li>
    //                     })}
    //         </ul>
    //     ),
    //     width: '15%',
    // },
    {
        name: `Desired ${TEXTS.COLLATERAL_FACTOR}`,
        selector: (row) => row.lt,
        format: (row) => (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                }}
            >
                <span style={{ minWidth: '50px' }}>{(row.lt - cardanoLtModifiers).toFixed(2)}</span>
                <span>
                    <div style={buttonsStyle}>
                        <div
                            onClick={() => riskStore.newReverseIncrementLT(row.long)}
                            className="plus-minus"
                        >
                            +
                        </div>
                        <div
                            onClick={() => riskStore.newReverseDecrementLT(row.long)}
                            className="plus-minus"
                        >
                            -
                        </div>
                    </div>
                </span>
            </div>
        ),
        width: '15%',
    },
    {
        name: `Number of Required Liquidity Change`,
        selector: (row) => row.liquidityChange,
        format: (row) => row.liquidityChange,
        width: '20%',
    },
]

/// EXPANDABLE ROW SECTION
const expendedBoxStyle = {
    margin: '30px',
    width: '100%',
    minHeight: '300px',
    padding: '30px',
}

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const { name, value } = Object.assign({}, payload[0].payload)
        return (
            <div className="tooltip-container">
                <BoxRow>
                    <div>{name}</div>
                    <div>{whaleFriendlyFormater(value)}</div>
                </BoxRow>
            </div>
        )
    }
}


function getSolvedLiquidity(ratio, tokenA, tokenB, liquidityData) {
    const solvedData = getSolvedLiquidityValues(ratio, tokenA, tokenB, liquidityData)
    return [`${tokenA}->ADA: +${roundTo((solvedData.tokenAIncreaseRatio - 1) * 100)}%`,
            `ADA->${tokenB}: +${roundTo((solvedData.tokenBIncreaseRatio - 1) * 100)}%`]
}

function getSolvedLiquidityValues(ratio, tokenA, tokenB, liquidityData) {
    const increaseFactor = ratio / 100 + 1
    const slippageAvsADA = liquidityData[tokenA]['ADA'].llc - 1
    const slippageADAvsB = liquidityData['ADA'][tokenB].llc - 1
    const currentSlippage = Math.round(Math.max(slippageAvsADA, slippageADAvsB) * 100)
    return SolveLiquidityIncrease(tokenA, liquidityData[tokenA]['ADA'].volume, tokenB, liquidityData['ADA'][tokenB].volume, increaseFactor, currentSlippage)
}

const LiquidityChanges = (props) => {
    // GRAPH DATA
    const textDisplay = []
    const displayData = []
    const liquidityData = Object.assign({}, mainStore['usd_volume_for_slippage_data'] || {})
    console.log('LiquidityChanges liquidityData', JSON.stringify(liquidityData, null, 2));
    Object.entries(props.data.liquidity).forEach((entry) => {
        const [key, value] = entry
        let graphItem = { name: key }
        if (value['simulatedVolume'] === undefined) {
            graphItem['value'] = value['volume']
        } else {
            let ratio = Math.round((value['simulatedVolume'] / value['volume'] - 1) * 100);
            let decomposedLiquidity = null;
            // add tooltip on liquidity requirement only for MELD, platform = 5
            if(PLATFORM_ID === '5' ) {
                if(ratio < 0) {
                    decomposedLiquidity = ['N/A'];
                } else {
                    if(props.data.long === 'ADA') {
                        decomposedLiquidity = [`ADA->${key}: +${ratio}%`]
                    } else if(key === 'ADA') {
                        decomposedLiquidity = [`${props.data.long}->ADA: +${ratio}%`]
                    }
                    else {
                        decomposedLiquidity = getSolvedLiquidity(ratio, props.data.long, key, liquidityData)
                    }
                }
            }
            textDisplay.push({ text: `${props.data.long} -> ${key} ${ratio < 0 ? '' : '+'}${ratio}% `, ratio: ratio, decomposedLiquidity: decomposedLiquidity })
            graphItem['value'] = value['simulatedVolume']
        }
        displayData.push(graphItem)
    })
    textDisplay.sort((a, b) => b.ratio - a.ratio)
    let [biggest, secondBiggest] = displayData.sort((a, b) => b.value - a.value)
    if (!secondBiggest) {
        secondBiggest = biggest
    }
    const dataMax = biggest.value


    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
            }}
        >
            <article style={expendedBoxStyle}>
                <ResponsiveContainer>
                    <BarChart data={displayData}>
                        <XAxis dataKey="name" interval={0} />
                        <YAxis
                            type="number"
                            domain={[0, dataMax]}
                            tick={<WhaleFriendlyAxisTick />}
                            allowDataOverflow={true}
                        />
                        <Tooltip content={CustomTooltip} />
                        <Bar dataKey="value" fill={COLORS[0]} />
                    </BarChart>
                </ResponsiveContainer>
            </article>
            <div
                className="box-space"
                style={{
                    width: '50%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    flexDirection: 'column',
                }}
            >
                <hgroup>
                    <p>Changes required:</p>
                    {PLATFORM_ID === '5' ? 
                        <Accordion allowZeroExpanded={true} allowMultipleExpanded={true}>
                            {textDisplay.map((entry, key) => {
                                    return <AccordionItem>
                                                <AccordionItemHeading>
                                                    <AccordionItemButton style={accordionButtonStyle}>
                                                        {entry.text}
                                                    </AccordionItemButton>
                                                </AccordionItemHeading>
                                                <AccordionItemPanel>
                                                    <article className='accordion-article'>
                                                        <ul className='accordion-ul'>
                                                            {entry.decomposedLiquidity.map((dl, keyDl) => {return <li key={keyDl}>{dl}</li>})}
                                                        </ul>
                                                    </article>
                                                </AccordionItemPanel>
                                            </AccordionItem>                                
                            })}
                        </Accordion> 
                        :  
                        <ul>
                            {textDisplay.map((entry, key) => { return <li key={key}>{entry.text}</li>})}
                            </ul>
                    }
                    
                </hgroup>
            </div>
        </div>
    )
}


const LiquiditySummary = (props) => {
    // console.log('data', JSON.stringify(props.data, null, 2));
    const liquidityData = Object.assign({}, mainStore['usd_volume_for_slippage_data'] || {})
    console.log('LiquiditySummary liquidityData', JSON.stringify(liquidityData, null, 2));

    const maxRatios = {};
    for(let i = 0; i < props.data.length; i++) {
        const currentData = props.data[i];
        const longKey = currentData.long;
        for(const [shortKey, liquidityValue] of Object.entries(currentData.liquidity)) {
            if(!liquidityValue.simulatedVolume) {
                continue;
            }

            // console.log(longKey, '->', shortKey, liquidityValue.simulatedVolume);
            
            let ratio = Math.round((liquidityValue['simulatedVolume'] / liquidityValue['volume'] - 1) * 100);
            if(ratio < 0) {
                continue;
            }

            // if long or short is ADA, just use ratio directly
            if(longKey === 'ADA' || shortKey === 'ADA') {
                const otherToken = longKey === 'ADA' ? shortKey : longKey;
                const increaseFactor = ratio / 100 + 1
                if(!maxRatios[otherToken]) {
                        maxRatios[otherToken] = increaseFactor;
                    } else {
                        maxRatios[otherToken] = Math.max(maxRatios[otherToken], increaseFactor);
                    }
            // else, it means we need to compute the decomposed ratio token0->ADA and token1->ADA
            } else {
                const decomposedLiquidity = getSolvedLiquidityValues(ratio, longKey, shortKey, liquidityData)
                // console.log('decomposedLiquidity',decomposedLiquidity);
                if(!maxRatios[longKey]) {
                    maxRatios[longKey] = decomposedLiquidity.tokenAIncreaseRatio;
                } else {
                    maxRatios[longKey] = Math.max(maxRatios[longKey], decomposedLiquidity.tokenAIncreaseRatio);
                }

                if(!maxRatios[shortKey]) {
                    maxRatios[shortKey] = decomposedLiquidity.tokenBIncreaseRatio;
                } else {
                    maxRatios[shortKey] = Math.max(maxRatios[shortKey], decomposedLiquidity.tokenBIncreaseRatio);
                }
            }
        }
    }

    // here the max increase ratio ada->token are set
    console.log('maxRatios',maxRatios);

    const graphData = []
    const textData = []

    for(const [shortKey, volumeValue] of Object.entries(liquidityData['ADA'])) {
        if(shortKey === 'key') {
            continue;
        }
        console.log('liquidity ADA->', shortKey, volumeValue)
        let ratioForShort = 1;
        if(maxRatios[shortKey]) {
            ratioForShort = maxRatios[shortKey];
        }

        graphData.push({ 
            name: shortKey,
            value: volumeValue.volume * ratioForShort,
        });

        if(ratioForShort !== 1) {
            textData.push({
                ratio: ratioForShort,
                text: `ADA->${shortKey}: +${roundTo((ratioForShort-1)*100, 2)}%`
            });
        }
    }
    graphData.sort((a, b) => b.value - a.value)
    textData.sort((a, b) => b.ratio - a.ratio)
    console.log('graphData', graphData)
    const dataMax = graphData[0].value;
    return (
    <div
        style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
        }}
    >  
        <article style={expendedBoxStyle}>
            <ResponsiveContainer>
                <BarChart data={graphData}>                
                    <XAxis dataKey="name" interval={0} />
                    <YAxis
                        type="number"
                        domain={[0, dataMax]}
                        tick={<WhaleFriendlyAxisTick />}
                        allowDataOverflow={true}
                    />
                    <Tooltip content={CustomTooltip} />
                    <Bar dataKey="value" fill={COLORS[0]} />
                </BarChart>
            </ResponsiveContainer>
        </article>
        
        <div
            className="box-space"
            style={{
                width: '50%',
                display: 'flex',
                justifyContent: 'space-between',
                flexDirection: 'column',
            }}
        >
            <hgroup>
                <p>Liquidity changes:</p>
                    <ul>
                        {textData.map((entry, key) => { return <li key={key}>{entry.text}</li>})}
                    </ul>
            </hgroup>
        </div>
    </div>);
}

// const expandRowOnClick = (row) => {
//     if (row['liquidityChange'] === 'N/A') {
//         return false
//     } else {
//         return true
//     }
// }
let cardanoLtModifiers = 0;
class ReverseSolver extends Component {
    render() {
        const { loading } = riskStore
        const { json_time } = mainStore['risk_params_data'] || {}
        const lendingPlatformData = mainStore['lending_platform_current_data'] || {}
        if(window.APP_CONFIG.feature_flags.cardanoLtModifiers){
            cardanoLtModifiers = Number(lendingPlatformData['protocolFees']) + Number(lendingPlatformData['magicNumber']);
        }

        // console.log('riskStore.reverseSolvedData', JSON.stringify(riskStore.reverseSolvedData, null, 2))

        return (
            <div>
                <Box loading={loading} time={json_time}>
                    {!loading && (
                        <DataTable
                            expandableRows
                            /*expandableRowExpanded={expandRowOnClick}*/
                            expandableRowsComponent={LiquidityChanges}
                            columns={columns}
                            data={riskStore.reverseSolvedData}
                        />
                    )}
                    {!loading && PLATFORM_ID === '5' && (
                        <div style={{
                            width: '100%',
                        }}>
                            <article>ADA Liquidity Summary:
                                <LiquiditySummary data={riskStore.reverseSolvedData}/>
                            </article>
                        </div>
                    )}
                </Box>
            </div>
        )
    }
}

export default observer(ReverseSolver)

