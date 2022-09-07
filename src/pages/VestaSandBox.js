import React, { Component } from "react"
import {observer} from "mobx-react"
import Box from "../components/Box"
import DataTable from 'react-data-table-component'
import vestaRiskStore from '../stores/vestaRisk.store'
import {removeTokenPrefix} from '../utils'
import CapInputGeneric from '../components/CapInputGeneric'
import CfDiffGeneric from '../components/CfDiffGeneric'
import Token from "../components/Token"
import {TEXTS} from "../constants"

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
      format: row => <CapInputGeneric val={row.borrowCap} increment={()=> vestaRiskStore.increment(row, 'borrowCap')} decrement={()=> vestaRiskStore.decrement(row, 'borrowCap')}/>,
  }, 
  {
      name: `Stability Pool Size`,
      selector: row => row.stabilityPoolSize,
      format: row => <CapInputGeneric val={row.stabilityPoolSize} increment={()=> vestaRiskStore.increment(row, 'stabilityPoolSize')} decrement={()=> vestaRiskStore.decrement(row, 'stabilityPoolSize')}/>,
  }, 
  {
      name: `Backstop Size`,
      selector: row => row.bprotocolSize,
      format: row => <CapInputGeneric val={row.bprotocolSize} increment={()=> vestaRiskStore.increment(row, 'bprotocolSize')} decrement={()=> vestaRiskStore.decrement(row, 'bprotocolSize')}/>,
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

const expendedBoxStyle = {margin: '30px', width: '100%', minHeight: '100px', padding: '30px'}
const humanizeRecommendation = r => {
  const rItems = r.split(' ')
  rItems[1] = removeTokenPrefix(rItems[1])
  if(rItems[2] === 'mint'){
    rItems[2] = 'supply'
  }
  return rItems.join(' ')
}

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