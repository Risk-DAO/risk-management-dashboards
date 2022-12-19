import React from 'react'
import { observer } from 'mobx-react'

const Ramzor = (props) => {
    let color = 'green'
    if (props.yellow) {
        color = 'yellow'
    }
    if (props.red) {
        color = 'red'
    }
    return <span style={{ color: `var(--${color}-text)` }}>{props.children}</span>
}

export default observer(Ramzor)
