import Box from "../components/Box"
import CapInput from '../components/CapInput'
import CfDiff from '../components/CfDiff'
import { Component } from "react";
import DataTable from 'react-data-table-component'
import { TEXTS } from "../constants"
import Token from "../components/Token"
import mainStore from '../stores/main.store'
import { observer } from "mobx-react"
import { removeTokenPrefix } from '../utils'
import riskStore from '../stores/risk.store'

const columns = [
  {
      name: 'Asset',
      selector: row => row.asset,
      format: row => <Token value={row.asset}/>,
  },
  {
      name: 'Supply Cap',
      selector: row => row.mint_cap,
      format: row => <CapInput row={row} field={'mint_cap'}/>,
      grow: 2
  },
  {
      name: 'Borrow Cap',
      selector: row => row.borrow_cap,
      format: row => <CapInput row={row} field={'borrow_cap'}/>,
      grow: 2
  }, 
  {
      name: `Current ${TEXTS.COLLATERAL_FACTOR}`,
      selector: row => riskStore.getCurrentCollateralFactor(row.asset),
      width: '260px'
  },    
  {
      name: `Recommended ${TEXTS.COLLATERAL_FACTOR}`,
      selector: row => row.collateral_factor,
      format: row => <CfDiff row={row} modifier={cardanoLtModifiers}/>,
      grow: 2
  }
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

const Recommendation = (props) => {
  let recommendations = []
  riskStore.recommendations.forEach(r=> {
    if(r.asset === props.data.asset){
      recommendations.push(r.recommendation)
    }
  })
  recommendations = [...new Set(recommendations)]
  return <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
    <article style={expendedBoxStyle}>
      <h6>to improve collateral factor</h6>
      {recommendations.map(r=> <div key={r}>
        <button className="outline" style={{border: 'none', display: 'inline', padding: '5px', width: 'auto'}} onClick={()=>riskStore.preformRecommendation(r)}>
          {humanizeRecommendation(r)}
        </button>
      </div>)}
    </article>
  </div>
}

let cardanoLtModifiers = 0;
class SandBox extends Component {
  render (){
    const {loading} = riskStore
    const {json_time} = mainStore['risk_params_data'] || {}
    const lendingPlatformData = mainStore['lending_platform_current_data'] || {}
    if(window.APP_CONFIG.feature_flags.cardanoLtModifiers){
      cardanoLtModifiers = Number(lendingPlatformData['protocolFees']) + Number(lendingPlatformData['magicNumber']);
    }
    
    return (
      <div>
        <Box loading={loading} time={json_time}>
          {!loading && <DataTable
              expandableRows
              columns={columns}
              data={riskStore.data}
              expandableRowsComponent={Recommendation}
          />}
        </Box>
      </div>
    )
  }
}

export default observer(SandBox)