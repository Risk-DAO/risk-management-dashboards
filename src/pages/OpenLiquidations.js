import React, { Component } from "react"
import {observer} from "mobx-react"
import Box from "../components/Box"
import DataTable from 'react-data-table-component'
import mainStore from '../stores/main.store'
import BlockExplorerLink from "../components/BlockExplorerLink"
import {whaleFriendlyFormater} from "../components/WhaleFriendly"

const columns = [
  {
    name: 'User',
    selector: row => row.account,
    format: row => <BlockExplorerLink address={row.account}/>,
    sortable: true,
  },
  {
    name: 'Debt Size',
    selector: row => whaleFriendlyFormater(row.user_debt_wo_looping),
    sortable: true,
  },
  {
    name: 'Collateral Size',
    selector: row => whaleFriendlyFormater(row.user_collateral_wo_looping),
    sortable: true,
  },
]

class OpenLiquidations extends Component {
  render (){
    const {loading} = mainStore['open_liquidations_loading']
    const rawData = Object.assign({}, mainStore['open_liquidations_data'] || {})
    const {json_time} = rawData
    if(json_time){
      delete rawData.json_time
    }
    const {data} = rawData
    if(!data) {
      return null;
    }
    const totalDebt = data.reduce((acc, val) => acc + Number(val.user_debt_wo_looping), 0)
    const smallLiquidations = totalDebt < 1000
    return (
      <div>
        <Box loading={loading} time={json_time}>
          {!loading && <div>
            {!smallLiquidations && <DataTable
                columns={columns}
                data={data}
            />}
            {smallLiquidations && 
              <div style={{textAlign: 'center', padding: "50px"}}>
                Total open liquidations are lower than $1k 😀  
              </div>
            }
          </div>}
        </Box>
      </div>
    )
  }
}

export default observer(OpenLiquidations)