import React from 'react'
import Box from '../components/Box'
import { shortCurrencyFormatter } from '../utils'
import { Component } from 'react'
import DataTable from 'react-data-table-component'
import { TEXTS } from '../constants'
import mainStore from '../stores/main.store'
import { observer } from 'mobx-react'
import riskStore from '../stores/risk.store'

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
    {
        name: `Desired ${TEXTS.COLLATERAL_FACTOR}`,
        selector: (row) => row.lt,
        format: (row) => <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                width: '100%',
                            }}
                        >
                            <span style={{ minWidth: '50px' }}>{row.lt.toFixed(2)}</span>
                            <span>
                                <div style={buttonsStyle}>
                                    <div onClick={() => riskStore.reverseIncrementLiquidationThreshold(row.long)} className="plus-minus">
                                        +
                                    </div>
                                    <div onClick={() => riskStore.reverseDecrementLiquidationThreshold(row.long)} className="plus-minus">
                                        -
                                    </div>
                                </div>
                            </span>
                        </div>,
        width: '15%',
    },
    {
        name: `Required Liquidity Change`,
        selector: (row) => row.liquidityChange,
        format: (row) => row.liquidityChange,
        width: '40%',
    },
]


class ReverseSolver extends Component {
    render() {
        const { loading } = riskStore
        const { json_time } = mainStore['risk_params_data'] || {}

        return (
            <div>
                <Box loading={loading} time={json_time}>
                    {!loading && <DataTable columns={columns} data={riskStore.reverseSolvedData} />}
                </Box>
            </div>
        )
    }
}

export default observer(ReverseSolver)
