import React from "react";
import {observer} from "mobx-react"

const buttonsStyle = {
  display: 'flex', 
  flexDirection: 'column', 
  alignItems: 'center', 
  margin: '5px 20px', 
  borderRadius: 'var(--border-radius)', 
  boxShadow: 'var(--card-box-shadow)',
}

const formatter = new Intl.NumberFormat('en-US', { 
  style: 'currency', 
  currency: 'USD',   
  notation: "compact", 
  compactDisplay: "short" 
})

class CapInputGeneric extends React.Component {
  render() {
    
    const {val, increment, decrement} = this.props;
    
    return <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%'}}>
      <span style={{minWidth: '50px'}}>
        {formatter.format(val*1000000)}
      </span>
      <span>
        <div style={buttonsStyle}>
          <div onClick={increment} className="plus-minus">+</div>
          <div onClick={decrement} className="plus-minus">-</div>
        </div>
      </span>
    </div>
  }
}

export default observer(CapInputGeneric)