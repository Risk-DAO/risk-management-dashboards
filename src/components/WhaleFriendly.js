import React, { Component, Fragment, PureComponent } from "react";
import {observer} from "mobx-react"
const tenth = 100

export const whaleFriendlyFormater = num => {
  if (isNaN(num)){
    // not a numerical string
    return num
  } else {
    num = parseFloat(num)
  }
  let wfn
    if(num === 0) {
      wfn = '$0'
    } else if(!num){
      wfn = 'N/A'
    }else if(num  <= tenth) {
      wfn = '$' + Number(num.toFixed(2))
    }else if(num / 1000 <= tenth) {
      wfn = '$' + Number((num / 1000).toFixed(2)) + 'K'
    } else if(num / 1000000 <= tenth) {
      wfn = '$' + Number((num / 1000000).toFixed(2)) + 'M'
    } else {
      wfn = '$' + Number((num / 1000000000).toFixed(2)) + 'B'
    }
    return wfn
}

class WhaleFriendly extends Component {

  render () {
    let wfn = whaleFriendlyFormater(this.props.num)
    return (
      <Fragment>
        {wfn}
      </Fragment>
    )
  }
}

export class WhaleFriendlyAxisTick extends PureComponent {
  render() {
    const { x, y, payload } = this.props;

    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="end" fill="#666">
          {whaleFriendlyFormater(payload.value)}
        </text>
      </g>
    );
  }
}

export default observer(WhaleFriendly);