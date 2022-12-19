import Box from '../components/Box'
import CapInput from '../components/CapInput'
import { Component } from 'react'
import DataTable from 'react-data-table-component'
import { TEXTS } from '../constants'
import mainStore from '../stores/main.store'
import { observer } from 'mobx-react'
import riskStore from '../stores/risk.store'

const columns = [
    {
        name: 'Asset',
        selector: (row) => row.long,
        format: (row) => row.long,
    },
    {
        name: 'Supply Cap',
        selector: (row) => row.mint_cap,
        format: (row) => <CapInput row={row} field={'mint_cap'} />,
    },
    {
        name: 'Borrow Cap',
        selector: (row) => row.borrow_cap,
        format: (row) => <CapInput row={row} field={'borrow_cap'} />,
    },
    {
        name: `Desired ${TEXTS.COLLATERAL_FACTOR}`,
        selector: (row) => riskStore.getCurrentCollateralFactor(row.asset),
        format: (row) => <CapInput row={row} field={'borrow_cap'} />,
    },
    {
        name: `Required Liquidity`,
        selector: (row) => computeRecLiquidity(row.test),
        format: (row) => row.test,
    },
]



const computeRecLiquidity = () =>{


}

const LTfromSupplyBorrow = (displayItem, displayData) => {
    const supply = displayItem.selectedSupply;
    const token = displayItem.long;

    let min = 1;
    for(const short of Object.keys(displayItem.solverData)){
    }

}

const findMaxDCForToken = (token, solverData) => {

    for(const long of Object.keys(solverData)){
        for(const short of Object.keys(long)){
            if(short === token){
                return Math.max(...Object.keys(short).map((entry) => Number(entry)))
            }
        }
    }
}


class ReverseSolver extends Component {
    render() {
        const { loading } = riskStore
        const { json_time } = mainStore['risk_params_data'] || {}
        const solverData = riskStore.solverData;
        const liquidities = Object.assign({}, mainStore['usd_volume_for_slippage_data'] || {})
        const displayData = []
        const test = [{test: 2}]

        for(const long of Object.keys(solverData)){
            

            let displayItem = {"long": long};
            
            displayItem['selectedSupply'] = findMaxDCForToken(long, solverData);
            displayItem['selectedBorrow'] = findMaxDCForToken(long, solverData);
            displayItem['selectedLT'] = 0;
            displayItem['requiredLiquidity'] = 0;
            displayItem['liquidities'] = liquidities[long];
            displayItem['solverData'] = solverData[long];
            displayData.push(displayItem);
        }


        return (
            <div>
                <Box loading={loading} time={json_time}>
                    {!loading && <DataTable columns={columns} data={displayData} />}
                </Box>
            </div>
        )
    }
}

export default observer(ReverseSolver)
