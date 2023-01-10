import Ramzor from './Ramzor';
import React from "react";
import { observer } from "mobx-react";
import riskStore from '../stores/risk.store';

export const Cf = props => {
  const cf = (props.row.collateral_factor || 0).toFixed(2)
  const currentCollateralFactor = riskStore.getCurrentCollateralFactor(props.row.asset)
  return <div>
    <abbr> {cf} </abbr>
    <span> ({currentCollateralFactor}) </span>
  </div>
}

class CfDiff extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tooltip: true,
    };
  }

  render () {
    let modifier = this.props.modifier;
    if(!modifier){
      modifier = 0
    }
    let cf = ((this.props.row.collateral_factor || 0) - modifier).toFixed(2);
    if(cf <= 0){
      cf = 0;
    }
    const diff = this.props.row.diff
    return (<React.Fragment>
      <abbr className={`transition ${diff ? 'highlight' : ''}`}>
        {cf} 
      </abbr>
      {diff && <Ramzor red={diff < 0}> ({diff.toFixed(2)})</Ramzor>}
    </React.Fragment>)
  }
}

export default observer(CfDiff)