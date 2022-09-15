import React, { Component } from "react"
import {observer} from "mobx-react"
import Box from "../components/Box"
import DataTable from 'react-data-table-component'
import vestaRiskStore from '../stores/vestaRisk.store'
import {removeTokenPrefix, shortCurrencyFormatter} from '../utils'
import CapInputGeneric from '../components/CapInputGeneric'
import CfDiffGeneric from '../components/CfDiffGeneric'
import Token from "../components/Token"
import {TEXTS} from "../constants"

const displayCap = (val) => shortCurrencyFormatter.format(val * 1000000)
const displayPercentage = (val) => (val * 100).toFixed(2) + '%'

const columns = [
  {
      name: TEXTS.ASSET,
      selector: row => row.asset,
      format: row => <Token value={row.asset}/>,
      width: '110px'
  },
  {
      name: 'Mint Cap',
      selector: row => row.borrowCap,
      format: row => <CapInputGeneric val={displayCap(row.borrowCap)} increment={()=> vestaRiskStore.increment(row, 'borrowCap')} decrement={()=> vestaRiskStore.decrement(row, 'borrowCap')}/>,
  }, 
  {
      name: `Stability Pool % of Mint Cap`,
      selector: row => row.stabilityPoolSize,
      format: row => <CapInputGeneric val={displayPercentage(row.stabilityPoolSize)} increment={()=> vestaRiskStore.increment(row, 'stabilityPoolSize')} decrement={()=> vestaRiskStore.decrement(row, 'stabilityPoolSize')}/>,
  }, 
  {
      name: `B.AMM % of SP`,
      selector: row => row.bprotocolSize,
      format: row => <CapInputGeneric val={displayPercentage(row.bprotocolSize)} increment={()=> vestaRiskStore.increment(row, 'bprotocolSize')} decrement={()=> vestaRiskStore.decrement(row, 'bprotocolSize')}/>,
  },
  {
      name: `Current MCR`,
      selector: row => row.current_mcr,
      format: row => row.current_mcr.toFixed(2) + '%',
  },
  {
      name: `Recommended MCR`,
      selector: row => row.recommended_mcr,
      format: row => <CfDiffGeneric val={row.recommended_mcr.toFixed(2) + "%"} diff={row.diff} />,
  },
];

class VestaSandBox extends Component {
  
  render (){
    const {loading, json_time, data} = vestaRiskStore
    return (
      <div>
        <Box loading={loading} time={json_time}>
          {!loading && <DataTable
              columns={columns}
              data={data}
          />}
        </Box>
      </div>
    )
  }
}

export default observer(VestaSandBox)