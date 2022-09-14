import React, { Component } from "react"
import {observer} from "mobx-react"
import Box from "../components/Box"
import DataTable from 'react-data-table-component'
import mainStore from '../stores/main.store'
import {whaleFriendlyFormater} from '../components/WhaleFriendly'

const typeFormatter = type => {
  if(type == 'solid'){
    return 'BTC/ETH'
  }
  if(type == 'stable'){
    return 'Stables'
  }  
  if(type == 'other'){
    return 'Other'
  }
}

const columns = [
  {
    name: 'Type',
    selector: row => row.type,
    format: row => typeFormatter(row.type),
    sortable: true,
  },
  {
    name: 'Utilization',
    selector: row => row.utilization,
    format: row => (row.utilization * 100).toFixed(2) + '%',
    sortable: true,
  },
  {
    name: 'Total',
    selector: row => row.total,
    format: row => whaleFriendlyFormater(row.total),
    sortable: true,
  },

]

class GlpUtilization extends Component {
  render() {
    const loading = mainStore["glp_data_loading"] 
    const {json_time} = mainStore["glp_data_data"]
    const {glp_data} = mainStore.clean(mainStore["glp_data_data"])
    const dataMap = {}
    Object.entries(glp_data).forEach(([k, v]) => {
      debugger
      let type, utilization, total
      const key = k.toLowerCase()
      if(key.indexOf("solid") > -1){
        type = "solid"
      } else if(key.indexOf("stable") > -1){
        type = "stable"
      } else {
        type = "other"
      }
      dataMap[type] = dataMap[type] || { type }
      if(key.indexOf("utilization") > -1){
        dataMap[type]["utilization"] = v
      } else if(key.indexOf("treasury") > -1){
        dataMap[type]["total"] = v
      }
    })
    const data = Object.values(dataMap)
    return (<Box loading={loading} time={json_time}>
      {!loading && <DataTable
        columns={columns}
        data={data}
      />}
    </Box>)
  }
}

export default observer(GlpUtilization)