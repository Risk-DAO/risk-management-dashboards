import React, { Component } from 'react'
import { observer } from 'mobx-react'
import Box from '../components/Box'
import BoxGrid from '../components/BoxGrid'
import mainStore from '../stores/main.store'
import WhaleFriendly from '../components/WhaleFriendly'

const boxRow = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
    paddingBottom: '10px',
    borderBottom: '1px solid rgba(120, 120, 120, 0.1)',
}

const humanTxt = (txt) => txt.split('_').join(' ')

class Overview extends Component {
    render() {
        const data = mainStore['overview_data']
        const loading = mainStore['overview_loading']
        const half = !loading ? parseInt(Object.entries(data).length / 2) : 0
        const firstHalf = !loading ? Object.entries(data).slice(0, half) : []
        const secondHalf = !loading ? Object.entries(data).slice(half) : []
        return (
            <div>
                <BoxGrid>
                    <Box loading={loading}>
                        {firstHalf.map(([k, v]) => (
                            <div key={k} style={boxRow}>
                                <div>{humanTxt(k)}</div>
                                <div>
                                    $<WhaleFriendly num={v} />
                                </div>
                            </div>
                        ))}
                    </Box>
                    <Box loading={loading}>
                        {secondHalf.map(([k, v]) => (
                            <div key={k} style={boxRow}>
                                <div>{humanTxt(k)}</div>
                                <div>
                                    $<WhaleFriendly num={v} />
                                </div>
                            </div>
                        ))}
                    </Box>
                </BoxGrid>
            </div>
        )
    }
}

export default observer(Overview)
