import React, { Component } from 'react'
import { observer } from 'mobx-react'
import Box from '../components/Box'
import DataTable from 'react-data-table-component'
import mainStore from '../stores/main.store'
import { whaleFriendlyFormater } from '../components/WhaleFriendly'

const columns = [
    {
        name: 'Type',
        selector: (row) => row.name,
        sortable: true,
    },
    {
        name: 'Utilization',
        selector: (row) => row.utilization,
        format: (row) => (row.utilization * 100).toFixed(2) + '%',
        sortable: true,
    },
    {
        name: 'Size',
        selector: (row) => row.size,
        format: (row) => whaleFriendlyFormater(row.size),
        sortable: true,
    },
]

class GlpUtilization extends Component {
    render() {
        const loading = mainStore['glp_data_loading']
        const { json_time } = mainStore['glp_data_data']
        const { glp_data } = mainStore.clean(mainStore['glp_data_data'])
        const {
            liquidSolidAssetTreasury,
            liquidStableTreasury,
            liquidTreasury,
            solidTreasuryUtilization,
            stableTreasuryUtilization,
            treasuryUtilization,
        } = glp_data

        const dataMap = {
            stable: {
                name: 'Stables',
                utilization: stableTreasuryUtilization,
                size: liquidSolidAssetTreasury / (1 - solidTreasuryUtilization),
            },
            solid: {
                name: 'ETH/BTC',
                utilization: solidTreasuryUtilization,
                size: liquidStableTreasury / (1 - stableTreasuryUtilization),
            },
            other: {
                name: 'Total',
                utilization: treasuryUtilization,
                size: liquidTreasury / (1 - treasuryUtilization),
            },
        }

        const data = Object.values(dataMap)
        return (
            <Box loading={loading} time={json_time}>
                {!loading && <DataTable columns={columns} data={data} />}
            </Box>
        )
    }
}

export default observer(GlpUtilization)
