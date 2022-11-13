import React, { Component } from "react"
import {observer} from "mobx-react"
import Box from "./Box"
import DataTable from 'react-data-table-component'
import mainStore from '../stores/main.store'
import {whaleFriendlyFormater} from './WhaleFriendly'
import {removeTokenPrefix} from '../utils'
import riskStore from '../stores/risk.store'
import Token from './Token'
import Asterisk, {hasAtLeastOneAsterisk} from './Asterisk'
import { TEXTS } from '../constants' 

const currentCapFormater = num => {
  if (num === Infinity) {
    return '∞';
  }
  return whaleFriendlyFormater(num)
}

const currentColumns = [
  {
      name: TEXTS.ASSET,
      selector: row => row.asset,
      format: row => <Token value={row.asset}/>,
  },
  {
      name: TEXTS.SUPPLY_CAP,
      selector: row => row.mint_cap,
      format: row => currentCapFormater(row.mint_cap),
  },    

  {
      name: TEXTS.BORROW_CAP,
      selector: row => row.borrow_cap,
      format: row => currentCapFormater(row.borrow_cap),
  },
  {
      name: `Current ${TEXTS.COLLATERAL_FACTOR}`,
      selector: row => riskStore.getCurrentCollateralFactor(row.asset),
  },  
  {
      name: `Recommended ${TEXTS.COLLATERAL_FACTOR}`,
      selector: row => row.collateral_factor,
      format: row => <Asterisk row={row} field={"collateral_factor"}/>,
  },
];

class RiskParametersCurrent extends Component {
  render (){
    const {loading, currentData} = riskStore
    const {json_time: currentJsonTime} = mainStore['lending_platform_current_data'] || {}
    const text = hasAtLeastOneAsterisk(currentData, "collateral_factor") ? "* If usage will increase, reduction of CF might be required to avoid bad debt." : ""
    return (
      <div>
        <Box loading={loading} time={currentJsonTime} text={text}>
          <hgroup>
            <h6>{TEXTS.ACCORDING_TO_EXISTING_CAPS}</h6>
            <p className="description">{TEXTS.ACCORDING_TO_EXISTING_CAPS_DESCRIPTION}</p>
          </hgroup>
          {!loading && <DataTable
              columns={currentColumns}
              data={currentData}
          />}
        </Box>
      </div>
    )
  }
}

export default observer(RiskParametersCurrent)