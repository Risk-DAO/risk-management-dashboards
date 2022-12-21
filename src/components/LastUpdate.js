import React from "react";
import {observer} from "mobx-react"
import moment from "moment"

const LastUpdate = (props) => {
  const time = moment(parseInt(1000 * props.time)).fromNow()
  return <div style={{color: 'var(--muted-color)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', width: '100%', paddingTop: 'calc(var(--spacing) * 2)'}}>
    <small>
      last updated {time}
    </small>
  </div>
}

export default observer(LastUpdate)