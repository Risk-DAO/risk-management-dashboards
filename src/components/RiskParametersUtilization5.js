import Asterisk, { hasAtLeastOneAsterisk } from './Asterisk';

import Box from "./Box";
import { Component } from "react";
import DataTable from 'react-data-table-component';
import { TEXTS } from '../constants';
import Token from './Token';
import mainStore from '../stores/main.store';
import { observer } from "mobx-react";
import riskStore from '../stores/risk.store';
import { whaleFriendlyFormater } from './WhaleFriendly';

const currentColumns = [
  {
      name: 'Asset',
      selector: row => row.asset,
      format: row => <Token value={row.asset}/>,
  },
  {
      name: 'Current Supply',
      selector: row => row.mint_cap,
      format: row => whaleFriendlyFormater(row.mint_cap),
      grow: 2,
  },     
  // {
  //     name: 'debug_mc',
  //     selector: row => row.debug_mc,
  //     grow: 2,
  // },   
  {
      name: 'Current Borrow',
      selector: row => row.borrow_cap,
      format: row => whaleFriendlyFormater(row.borrow_cap),
      grow: 2,
  },   
  // {
  //     name: 'debug_bc',
  //     selector: row => row.debug_bc,
  //     grow: 2,
  // },
  {
      name: `Current ${TEXTS.COLLATERAL_FACTOR}`,
      selector: row => riskStore.getCurrentCollateralFactor(row.asset),
      width: '260px'
  },    
  {
      name: `Recommended ${TEXTS.COLLATERAL_FACTOR}`,
      selector: row => row.collateral_factor,
      format: row => <Asterisk row={row} field={"collateral_factor"} modifier={cardanoLtModifiers}/>,
      grow: 2,
  },
];

let cardanoLtModifiers = 0;
class RiskParametersUtilization extends Component {
  render (){
    const {loading, utilization} = riskStore
    const lendingPlatformData = mainStore['lending_platform_current_data'] || {}
    const text = hasAtLeastOneAsterisk(utilization, "collateral_factor") ? "* if user composition will change, reduction of LT might be required to avoid bad debt." : ""
    const currentJsonTime = lendingPlatformData['json_time'];
    if(window.APP_CONFIG.feature_flags.cardanoLtModifiers){
      cardanoLtModifiers = Number(lendingPlatformData['protocolFees']) + Number(lendingPlatformData['magicNumber']);
    }

    return (
      <div>
        <Box loading={loading} time={currentJsonTime} text={text}>
          <hgroup>
            <h6>According to Current Usage</h6>
            <p>{TEXTS.UTILIZATION_DESCRIPTION}</p>
          </hgroup>

          {!loading && <DataTable
              columns={currentColumns}
              data={utilization}
          />}
        </Box>
      </div>
    )
  }
}

export default observer(RiskParametersUtilization)