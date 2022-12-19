import React, { Component } from 'react'
import { observer } from 'mobx-react'
import alertStore from '../stores/alert.store'

class AlertsJson extends Component {
    render() {
        return <div id="json">{JSON.stringify(alertStore.alerts)}</div>
    }
}

export default observer(AlertsJson)
