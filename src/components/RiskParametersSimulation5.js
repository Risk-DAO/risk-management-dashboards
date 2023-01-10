import Asterisk, { hasAtLeastOneAsterisk } from './Asterisk';

import Box from "./Box";
import { Component } from "react";
import DataTable from 'react-data-table-component';
import { TEXTS } from '../constants';
import Token from './Token';
import mainStore from '../stores/main.store';
import { observer } from "mobx-react";
import { whaleFriendlyFormater } from './WhaleFriendly';

const columns = [
  {
      name: 'Asset',
      selector: row => row.key,
      format: row => <Token value={row.key}/>,
      sortable: true,
  },
  {
    name: 'Total Liquidations',
    selector: row => row.total_liquidation,
    format: row => whaleFriendlyFormater(row.total_liquidation),
    sortable: true,
  },  
  {
    name: 'Bad Debt Accrued',
    selector: row => row.pnl,
    format: row => whaleFriendlyFormater(row.pnl),
    sortable: true,
  },      
  {
      name: 'Max Liquidation Threshold',
      selector: row => row['max_collateral'],
      format: row =>  <Asterisk row={row} field={"max_collateral"} modifier={cardanoLtModifiers} />,
      sortable: true,
  },  
];


let cardanoLtModifiers = 0;
class RiskParametersSimulation extends Component {
  render (){
    const loading = mainStore['current_simulation_risk_loading']
    const rawData = Object.assign({}, mainStore['current_simulation_risk_data'] || {})
    const {json_time} = rawData
    const lendingPlatformData = mainStore['lending_platform_current_data'] || {}
    if(window.APP_CONFIG.feature_flags.cardanoLtModifiers){
      cardanoLtModifiers = Number(lendingPlatformData['protocolFees']) + Number(lendingPlatformData['magicNumber']);
    }
    if(json_time){
      delete rawData.json_time
    }
    const data = !loading ? Object.entries(rawData).map(([k, v])=> {
      return Object.assign({ key: k}, v.summary)
    }) : []
    const text = hasAtLeastOneAsterisk(data, "max_collateral") ? TEXTS.SIMULATION_ASTERISK : ""
    return (
      <div>
        <Box loading={loading}  time={json_time} text={text}>
          <hgroup>
            <h6>According to Worst Day Scenario</h6>
            <p className="description">{TEXTS.WORST_DAY_SIMULATION_DESCRIPTION}</p>
          </hgroup>
          {!loading && <DataTable
              columns={columns}
              data={data}
          />}
        </Box>
      </div>
    )
  }
}

export default observer(RiskParametersSimulation)
