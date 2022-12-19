import Box from '../components/Box'
import CapInput from '../components/CapInput'
import { Component } from 'react'
import DataTable from 'react-data-table-component'
import { TEXTS } from '../constants'
import Token from '../components/Token'
import mainStore from '../stores/main.store'
import { observer } from 'mobx-react'
import riskStore from '../stores/risk.store'

const columns = [
    {
        name: 'Asset',
        selector: (row) => row.asset,
        format: (row) => <Token value={row.asset} />,
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
        selector: (row) => riskStore.getCurrentCollateralFactor(row.asset),
        format: (row) => 'hahaha',
    },
]

class ReverseSolver extends Component {
    render() {
        const { loading } = riskStore
        const { json_time } = mainStore['risk_params_data'] || {}

        return (
            <div>
                <Box loading={loading} time={json_time}>
                    {!loading && <DataTable columns={columns} data={riskStore.data} />}
                </Box>
            </div>
        )
    }
}

export default observer(ReverseSolver)
