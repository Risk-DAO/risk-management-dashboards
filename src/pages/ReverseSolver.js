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

const buttonsStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: '5px 20px',
    borderRadius: 'var(--border-radius)',
    boxShadow: 'var(--card-box-shadow)',
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

const LiquidityChanges = (props) => {
    // GRAPH DATA
    const textDisplay = []
    const displayData = []
    Object.entries(props.data.liquidity).forEach((entry) => {
        const [key, value] = entry
        let graphItem = { name: key }
        if (value['simulatedVolume'] === undefined) {
            graphItem['value'] = value['volume']
        } else {
            let ratio = Math.round((value['simulatedVolume'] / value['volume'] - 1) * 100)
            textDisplay.push({ text: `${props.data.long} -> ${key} ${ratio < 0 ? '' : '+'}${ratio}% `, ratio: ratio })
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
                    <ul>
                        {textDisplay.map((entry, key) => {
                            return <li key={key}>{entry.text}</li>
                        })}
                    </ul>
                </hgroup>
            </div>
        </div>
    )
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

        console.log('riskStore.reverseSolvedData', JSON.stringify(riskStore.reverseSolvedData, null, 2))

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
                </Box>
            </div>
        )
    }
}

export default observer(ReverseSolver)
