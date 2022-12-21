import React from "react";
import {observer} from "mobx-react"
import riskStore from "../stores/risk.store"
import {shortCurrencyFormatter} from '../utils'

const buttonsStyle = {
  display: 'flex', 
  flexDirection: 'column', 
  alignItems: 'center', 
  margin: '5px 20px', 
  borderRadius: 'var(--border-radius)', 
  boxShadow: 'var(--card-box-shadow)',
}

class CapInput extends React.Component {
  render() {
    const {row, field} = this.props;
    const val = shortCurrencyFormatter.format(row[field]);
    return <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%'}}>
      <span style={{minWidth: '50px'}}>{val}M</span>
      <span>
        <div style={buttonsStyle}>
          <div onClick={()=> riskStore.incrament(row, field)} className="plus-minus">+</div>
          <div onClick={()=> riskStore.decrament(row, field)} className="plus-minus">-</div>
        </div>
      </span>
    </div>
  }
}

export default observer(CapInput)