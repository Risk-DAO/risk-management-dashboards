import React, { Component } from 'react'
import { observer } from 'mobx-react'
import Box from '../components/Box'
import SlippageChart from '../components/SlippageChart'
import mainStore from '../stores/main.store'
import Token from '../components/Token'

class Liquidity extends Component {
    render() {
        const loading = mainStore['usd_volume_for_slippage_data']
        const assets = {}
        const rawData = Object.assign({}, mainStore['usd_volume_for_slippage_data'] || {})
        const { json_time } = rawData

        if (json_time) {
            delete rawData.json_time
        }

        Object.entries(rawData).forEach(([k, v]) => {
            const asset = k.split('-')[0]
            assets[asset] = assets[asset] || { name: asset, lps: [] }
            v.key = k
            assets[asset].lps.push(v)
        })

        return (
            <div>
                <Box loading={loading} time={json_time}>
                    <p></p>
                    {Object.values(assets).map((asset, i) => (
                        <details key={i} open>
                            <summary>
                                <Token value={asset.name} />
                            </summary>
                            <div style={{ display: 'flex' }}>
                                <SlippageChart data={asset.name} i={i} />
                            </div>
                            <div style={{ marginLeft: '30px' }}></div>
                        </details>
                    ))}
                </Box>
            </div>
        )
    }
}

export default observer(Liquidity)
