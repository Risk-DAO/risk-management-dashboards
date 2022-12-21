import React from "react";
import {observer} from "mobx-react"
import moment from "moment"

const BoxFooter = (props) => {
  if(!props.time && !props.text){
    return null;
  }
  const time = props.time ? "last updated " + moment(parseInt(1000 * props.time)).fromNow() : ""
  const text = props.text || ""
  return <div style={{color: 'var(--muted-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingTop: 'calc(var(--spacing) * 2)'}}>
    <small>
      {text}
    </small>    
    <small>
      {time}
    </small>
  </div>
}

export default observer(BoxFooter)