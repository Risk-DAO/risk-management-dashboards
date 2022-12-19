import React, { Component } from 'react'
import { observer } from 'mobx-react'
import Box from './Box'
import DataTable from 'react-data-table-component'
import mainStore from '../stores/main.store'
import { whaleFriendlyFormater } from './WhaleFriendly'
import Token from './Token'
import Asterisk, { hasAtLeastOneAsterisk } from './Asterisk'
import { TEXTS } from '../constants'

const columns = [
    {
        name: 'Asset',
        selector: (row) => row.key,
        format: (row) => <Token value={row.key} />,
        sortable: true,
    },
    {
        name: 'Total Liquidations',
        selector: (row) => row.total_liquidation,
        format: (row) => whaleFriendlyFormater(row.total_liquidation),
        sortable: true,
    },
    {
        name: 'Bad Debt Accrued',
        selector: (row) => row.pnl,
        format: (row) => whaleFriendlyFormater(row.pnl),
        sortable: true,
    },
    {
        name: `Max ${TEXTS.COLLATERAL_FACTOR}`,
        selector: (row) => row['max_collateral'],
        format: (row) => <Asterisk row={row} field={'max_collateral'} />,
        sortable: true,
    },
]

class RiskParametersSimulation extends Component {
    render() {
        const loading = mainStore['current_simulation_risk_loading']
        const rawData = Object.assign({}, mainStore['current_simulation_risk_data'] || {})
        const { json_time } = rawData
        if (json_time) {
            delete rawData.json_time
        }
        const data = !loading
            ? Object.entries(rawData).map(([k, v]) => {
                  return Object.assign({ key: k }, v.summary)
              })
            : []
        const text = hasAtLeastOneAsterisk(data, 'max_collateral') ? TEXTS.SIMULATION_ASTERISK : ''
        return (
            <div>
                <Box loading={loading} time={json_time} text={text}>
                    <hgroup>
                        <h6>According to Worst Day Scenario</h6>
                        <p className="description">{TEXTS.WORST_DAY_SIMULATION_DESCRIPTION}</p>
                    </hgroup>
                    {!loading && <DataTable columns={columns} data={data} />}
                </Box>
            </div>
        )
    }
}

export default observer(RiskParametersSimulation)
