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
    },
    {
        name: 'Supply Cap',
        selector: (row) => row.supply,
        format: (row) => <CapInput row={row} field={'supply'} />,
    },
    {
        name: 'Borrow Cap',
        selector: (row) => row.borrow,
        format: (row) => <CapInput row={row} field={'borrow'} />,
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
                                    <div /*onClick={() => riskStore.incrament(row, field)}*/ className="plus-minus">
                                        +
                                    </div>
                                    <div /*onClick={() => riskStore.decrament(row, field)}*/ className="plus-minus">
                                        -
                                    </div>
                                </div>
                            </span>
                        </div>,
    },
    {
        name: `Required Liquidity`,
        selector: (row) => row.liquidityChange,
        format: (row) => row.liquidityChange,
    },
]

// const increaseSupplyOrBorrow = (displayItem, field) => {

// }

const computeRecLiquidity = () =>{


}

const LTfromSupplyBorrow = (displayItem, displayData) => {
    const longSupply = displayItem.selectedSupply;

    let min = 1;
    for(const [keyShort, short]  of Object.entries(displayItem.solverData)) {
        const shortItem = displayData.find(_ => _.long === keyShort);
        if(!shortItem) {
            throw new Error(`Could not find ${short} in display data`);
        }
        else {
            const shortBorrow = shortItem.selectedBorrow;
            const minSupplyBorrow = Math.min(Number(longSupply), Number(shortBorrow));
            const selectedLt = short[minSupplyBorrow.toString()]
            if(selectedLt < min) {
                min = selectedLt;
            }
        }
    }

    return min;
}

// const findMaxDCForToken = (token, solverData) => {
//     for(const [longKey, long]  of Object.entries(solverData)){
//         for(const [shortKey, short]  of Object.entries(long)){
//             if(shortKey === token){
//                 return Math.max(...Object.keys(short).map((entry) => Number(entry)))
//             }
//         }
//     }
// }


class ReverseSolver extends Component {
    render() {
        const { loading } = riskStore
        const { json_time } = mainStore['risk_params_data'] || {}
        // const solverData = riskStore.solverData;
        // const liquidities = Object.assign({}, mainStore['usd_volume_for_slippage_data'] || {})
        // const displayData = []

        // for(const [key, long]  of Object.entries(solverData)){
        //     let displayItem = {"long": key};
        //     displayItem['selectedSupply'] = findMaxDCForToken(key, solverData);
        //     displayItem['selectedBorrow'] = findMaxDCForToken(key, solverData);
        //     displayItem['selectedLT'] = 0;
        //     displayItem['requiredLiquidity'] = 0;
        //     displayItem['liquidities'] = liquidities[key];
        //     displayItem['solverData'] = solverData[key];
        //     displayData.push(displayItem);
        // }

        // displayData.forEach(displayItem => {
        //     displayItem.selectedLT = LTfromSupplyBorrow(displayItem, displayData);
        // });




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
