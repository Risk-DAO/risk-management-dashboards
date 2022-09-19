import React, { Component } from "react"
import {observer} from "mobx-react"
import Box from "./Box"
import DataTable from 'react-data-table-component'
import {whaleFriendlyFormater} from './WhaleFriendly'
import vestaRiskStore from '../stores/vestaRisk.store'
import Token from './Token'
import CfDiffGeneric from './CfDiffGeneric'
import { TEXTS } from '../constants' 

const hasAsterisk = row => row.current_mcr < row.recommended_mcr
const hasAtLeastOneAsterisk = data => data.filter(hasAsterisk).length


const currentColumns = [
  {
      name: TEXTS.ASSET,
      selector: row => row.asset,
      format: row => <Token value={row.asset}/>,
  },
  {
      name: TEXTS.BORROW_CAP,
      selector: row => row.borrow_caps,
      format: row => whaleFriendlyFormater(row.borrow_caps),
      grow: 2,
  },
  {
      name: `VST in Stability Pool`,
      selector: row => row.stabilityPoolVstBalance,
      format: row => whaleFriendlyFormater(row.stabilityPoolVstBalance),
      grow: 2,
  },  
  {
      name: `VST in B.AMM`,
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
      name: `Recommended MCR`,
      selector: row => row.recommended_mcr,
      format: row => <CfDiffGeneric val={row.recommended_mcr.toFixed(2) + "%" + (hasAsterisk(row) ? " *" : "")} diff={row.diff} />,
      grow: 2,
  },
];

class RiskParametersCurrent2 extends Component {
  render (){
    const {loadingCurrent, currentData, currentJsonTime} = vestaRiskStore
    const text = hasAtLeastOneAsterisk(currentData) ? "* increasing MCR is recommended to avoid bad debt." : ""
    return (
      <div>
        <Box loading={loadingCurrent} time={currentJsonTime} text={text}>
          <hgroup>
            <h6>{TEXTS.ACCORDING_TO_EXISTING_CAPS}</h6>
            <p className="description">{TEXTS.ACCORDING_TO_EXISTING_CAPS_DESCRIPTION}</p>
          </hgroup>
          {!loadingCurrent && <DataTable
              columns={currentColumns}
              data={currentData}
          />}
        </Box>
      </div>
    )
  }
}

export default observer(RiskParametersCurrent2)