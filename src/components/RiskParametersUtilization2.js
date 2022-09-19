import React, { Component } from "react"
import {observer} from "mobx-react"
import Box from "./Box"
import DataTable from 'react-data-table-component'
import {whaleFriendlyFormater} from './WhaleFriendly'
import vestaRiskStore from '../stores/vestaRisk.store'
import Token from './Token'
import {TEXTS} from '../constants'
import CfDiffGeneric from './CfDiffGeneric'

const hasAsterisk = row => row.current_mcr < row.recommended_mcr
const hasAtLeastOneAsterisk = data => data.filter(hasAsterisk).length

const currentColumns = [
  {
      name: TEXTS.ASSET,
      selector: row => row.asset,
      format: row => <Token value={row.asset}/>,
  },
  {
      name: 'Current Minted VST',
      selector: row => row.total_debt,
      format: row => whaleFriendlyFormater(row.total_debt),
      grow: 2,
  },  
  {
      name: 'VST in Stability Pool',
      selector: row => row.stabilityPoolVstBalance,
      format: row => whaleFriendlyFormater(row.stabilityPoolVstBalance),
      grow: 2,
  },  
  {
      name: 'VST in B.AMM',
      selector: row => row.bprotocolBalance,
      format: row => whaleFriendlyFormater(row.bprotocolBalance),
      grow: 2,
  },  
  {
    name: `Current MCR`,
    selector: row => row.current_mcr,
    format: row => <CfDiffGeneric val={row.current_mcr.toFixed(2) + "%"} diff={row.diff} />,
    grow: 2,
  }, 
  {
      name: 'Recommended MCR',
      selector: row => row.recommended_mcr,
      format: row => <CfDiffGeneric val={row.recommended_mcr.toFixed(2) + "%" + (hasAsterisk(row) ? " *" : "")} diff={row.diff} />,
      grow: 2,
  },
];

class RiskParametersUtilization2 extends Component {
  render (){
    const {loadingUtilization, utilizationData, utilizationJsonTime} = vestaRiskStore
    const text = hasAtLeastOneAsterisk(utilizationData) ? "* increasing MCR is recommended to avoid bad debt." : ""
    return (
      <div>
        <Box loading={loadingUtilization} time={utilizationJsonTime} text={text}>
          <hgroup>
            <h6>According to Current Usage</h6>
            <p>{TEXTS.UTILIZATION_DESCRIPTION}</p>
          </hgroup>

          {!loadingUtilization && <DataTable
              columns={currentColumns}
              data={utilizationData}
          />}
        </Box>
      </div>
    )
  }
}

export default observer(RiskParametersUtilization2)