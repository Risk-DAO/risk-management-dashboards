import React, { Component } from 'react'
import { observer } from 'mobx-react'
import Box from '../components/Box'
import BoxGrid from '../components/BoxGrid'
import mainStore from '../stores/main.store'
import WhaleFriendly from '../components/WhaleFriendly'
import BoxRow from '../components/BoxRow'
import OverviewPieCharts from '../components/OverviewPieCharts'

const txtMap = {
    total_debt: 'Total Debt',
    top_1_debt: 'Debt of Top 1 User',
    top_10_debt: 'Debt of Top 10 Users',
    median_debt: 'Median Debt per User',
    total_collateral: 'Total Collateral',
    top_1_collateral: 'Collateral of Top 1 User',
    top_10_collateral: 'Collateral of Top 10 Users',
    median_collateral: 'Median Collateral per User',
}

const humanTxt = (txt) => txtMap[txt]

class Overview extends Component {
    render() {
        const rawData = Object.assign({}, mainStore['overview_data'] || {})
        const { json_time } = rawData
        if (json_time) {
            delete rawData.json_time
        }

        const loading = mainStore['overview_loading']
        const data = Object.entries(rawData)
            .filter(([k, v]) => k.indexOf('nl_') === -1)
            .filter(([k, v]) => k.indexOf('median') === -1)
        const firstHalf = !loading
            ? data
                  .filter(([k, v]) => {
                      return k.indexOf('collateral') > -1
                  })
                  .sort(([a], [b]) => {
                      if (a > b) return -1
                      if (a < b) return 1
                      return 0
                  })
            : []
        const secondHalf = !loading
            ? data
                  .filter(([k, v]) => {
                      return k.indexOf('debt') > -1
                  })
                  .sort(([a], [b]) => {
                      if (a > b) return -1
                      if (a < b) return 1
                      return 0
                  })
            : []
        return (
            <div>
                <OverviewPieCharts />
                <BoxGrid>
                    <Box loading={loading} time={json_time}>
                        <div>
                            {firstHalf.map(([k, v]) => (
                                <BoxRow key={k}>
                                    <div>{humanTxt(k)}</div>
                                    <div>
                                        <WhaleFriendly num={v} />
                                    </div>
                                </BoxRow>
                            ))}
                        </div>
                    </Box>
                    <Box loading={loading} time={json_time}>
                        <div>
                            {secondHalf.map(([k, v]) => (
                                <BoxRow key={k}>
                                    <div>{humanTxt(k)}</div>
                                    <div>
                                        <WhaleFriendly num={v} />
                                    </div>
                                </BoxRow>
                            ))}
                        </div>
                    </Box>
                </BoxGrid>
            </div>
        )
    }
}

export default observer(Overview)
