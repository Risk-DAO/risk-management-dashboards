import React, { Component } from "react";
import {observer} from "mobx-react"
import {TEXTS} from '../constants'
import BoxGrid from '../components/BoxGrid'
import Box from '../components/Box'
import PieChart from '../components/PieChart'
import mainStore from '../stores/main.store'

class OverviewPieCharts extends Component {
  
  render() {
    const loading = mainStore['accounts_loading']
    const rawData = Object.assign({}, mainStore['accounts_data'] || {})
    const {json_time} = rawData
    if(json_time){
      delete rawData.json_time
    }
    const data = !loading ? Object.entries(rawData)
    .filter(([k, v])=> k !== window.APP_CONFIG.STABLE || "")
    .map(([k, v])=> {
      v.key = k
      return v
    }) : []
    return (
      <BoxGrid>
        <Box loading={loading} height={500} time={json_time}>
          <h6 style={{margin: 0}}>{TEXTS.COLLATERAL_PIE_CHART_TITLE}</h6>
          {!loading && <PieChart data={data} dataKey={'total_collateral'}/>}
        </Box>
        <Box loading={loading} height={500} time={json_time}>
          <h6 style={{margin: 0}}>{TEXTS.DEBT_PIE_CHART_TITLE}</h6>
          {!loading && <PieChart data={data} dataKey={'total_debt'}/>}
        </Box>
      </BoxGrid>
    )
  }
}

export default observer(OverviewPieCharts)