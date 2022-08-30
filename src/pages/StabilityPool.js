import React, { Component } from "react"
import {observer} from "mobx-react"
import Box from "../components/Box"
import mainStore from "../stores/main.store"
import Token from "../components/Token"
import DataTable from 'react-data-table-component'
import {whaleFriendlyFormater} from "../components/WhaleFriendly"

const columns = [
  {
    name: 'Asset',
    selector: row => row.asset,
    format: row => <Token value={row.asset}/>,
    sortable: true,
  },
  {
    name: 'Stability Pool Size',
    selector: row => row.stabilityPoolVstBalance,
    format: row => whaleFriendlyFormater(row.stabilityPoolVstBalance),
    sortable: true,

  },
  {
    name: 'Stability Pool Imbalance',
    selector: row => row.stabilityPoolGemBalance,
    format: row => whaleFriendlyFormater(row.stabilityPoolGemBalance),
    sortable: true,
  },
  {
    name: 'B.AMM Size',
    selector: row => row.bprotocolBalance,
    format: row => whaleFriendlyFormater(row.bprotocolBalance),
    sortable: true,
  },
  {
    name: 'B.AMM Imbalance ',
    selector: row => row.bprotocolGemBalance,
    format: row => whaleFriendlyFormater(row.bprotocolGemBalance),
    sortable: true,
  },
  {
    name: 'B.AMM share of SP',
    selector: row => ((row.bprotocolBalance / row.stabilityPoolVstBalance) * 100),
    format: row => ((row.bprotocolBalance / row.stabilityPoolVstBalance) * 100).toFixed(2) + '%',
    sortable: true,
  }

]

class StabilityPool extends Component {

  render() {
    const loading = mainStore['stability_pool_loading']
    const rawData = Object.assign({}, mainStore['stability_pool_data'] || {})
    const {json_time} = rawData
    if(json_time){
      delete rawData.json_time
    }
     
    const sortedData = {}
    Object.entries(rawData).forEach(([column, v]) => {
      Object.entries(v).forEach(([asset, value])=> {
        sortedData[asset] = sortedData[asset] || {asset}
        sortedData[asset][column] = value
      })
    })

    const data = Object.values(sortedData)
    return (<Box time={json_time} loading={loading}>
        {!loading && <DataTable
          columns={columns}
          data={data}
        />}
      </Box>)
  }
}

export default observer(StabilityPool)