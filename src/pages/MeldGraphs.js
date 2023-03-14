import Box from "../components/Box";
import { Component } from "react";
import MeldBarGraph from "../components/MeldBarGraph";
import Token from "../components/Token";
import mainStore from '../stores/main.store';
import { observer } from "mobx-react";

class MeldGraphs extends Component {
    render() {
        const loading = mainStore['lending_platform_current_loading']
        const rawData = mainStore['lending_platform_current_data'] || {}
        const { json_time } = rawData
        const data = [];
        for (const name in rawData['names']) {
            const datapoint = {};
            datapoint['name'] = name;
            datapoint['price'] = Number(rawData['prices'][name]);
            datapoint['ltv'] = Number(rawData['ltv'][name]) * Number(rawData['prices'][name]);
            datapoint['liquidationThreshold'] = Number(rawData['collateral_factors'][name]) * Number(rawData['prices'][name]);
            data.push(datapoint);
        }
        return (
            <div>
                <Box loading={loading} time={json_time}>
                    <p>
                    </p>
                    {data.map((asset, i) => <details key={i} open>
                        <summary><Token value={asset.name} /></summary>
                        <div style={{ display: 'flex' }}>
                            <MeldBarGraph data={asset} i={i} />
                        </div>
                        <div style={{ marginLeft: '30px' }}>
                        </div>
                    </details>)}
                </Box>
            </div>
        )
    }
}

export default observer(MeldGraphs)
