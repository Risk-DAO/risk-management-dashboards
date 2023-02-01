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
      format: row => <Asterisk row={row} field={"collateral_factor"} modifier={cardanoLtModifiers}/>,
  },
];


let cardanoLtModifiers = 0
class RiskParametersCurrent extends Component {
  render (){
    const {loading, currentData} = riskStore
    const lendingPlatformData = mainStore['lending_platform_current_data'] || {}
    const text = hasAtLeastOneAsterisk(currentData, "collateral_factor") ? "* If usage will increase, reduction of LT might be required to avoid bad debt." : ""
    const currentJsonTime = lendingPlatformData['json_time'];
    if(window.APP_CONFIG.feature_flags.cardanoLtModifiers){
      cardanoLtModifiers = Number(lendingPlatformData['protocolFees']) + Number(lendingPlatformData['magicNumber']);
    }
  
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