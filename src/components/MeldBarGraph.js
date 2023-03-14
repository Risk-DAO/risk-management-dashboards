import {
    Bar,
    BarChart,
    CartesianGrid,
    LabelList,
    Legend,
    Line,
    LineChart,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { Component } from "react";
import mainStore from '../stores/main.store';
import moment from "moment";
import { observer } from "mobx-react";

class MeldDepthChart extends Component {
    render() {
        const loading = mainStore['last_day_volume_loading']
        const rawData = mainStore['last_day_volume_data'] || {}
        const token = this.props.data[0].name;
        const price = this.props.data[0].price;
        const data = [];
        for (const [key, value] of Object.entries(rawData[token]['poolDepthInADA'])) {
            let date = moment(key * 1000).format('LT');
            let depth = Number(value) * price;
            let volume = Number(rawData[token]['tradingVolumeInADA'][key]) * price;
            data.push(
                {
                    x: date,
                    depth: Number(depth).toFixed(2),
                    volume: Number(volume)
                });
        }


        return <div>
            <LineChart
                width={600}
                height={300}
                data={data}
                margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5
                }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" />
                <YAxis yAxisId="left" label={{ value: 'Pool Depth', angle: -90, position: 'insideLeft', textAnchor: 'middle', offset: '-10' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: '24h Volume', angle: -90, position: 'insideRight', textAnchor: 'middle' }} />
                <Tooltip />
                <Legend />
                <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="depth"
                    stroke="#8884d8"

                />
                <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="volume"
                    stroke="#82ca9d"

                />
            </LineChart>
        </div>
    }
}

class MeldBarGraph extends Component {
    render() {
        let barData = [this.props.data];
        return (
            <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%' }}>
                {barData[0].name === 'ADA' ? '' :
                    <article>
                        <MeldDepthChart data={barData} />
                    </article>}
                <article>
                    <BarChart
                        width={500}
                        height={300}
                        data={barData}
                        margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="price" fill="#8884d8" name="Price"/>
                        <Bar dataKey="liquidationThreshold" stackId="a" fill="#82ca9d" name="Liquidation Level">
                            <LabelList dataKey='liquidationRatio' /></Bar>
                        <Bar dataKey="ltv" fill="#ffc658"name="Minimum Collateral Ratio">
                        <LabelList dataKey='ltvRatio' /></Bar>
                    </BarChart>
                </article>
            </div>
        );
    }
}


export default observer(MeldBarGraph);