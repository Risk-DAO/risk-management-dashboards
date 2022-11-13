import React from "react";
import {observer} from "mobx-react"
import riskStore from '../stores/risk.store'
import Ramzor from './Ramzor'

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
    const cf = (this.props.row.collateral_factor || 0).toFixed(2)
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