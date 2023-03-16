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
        const rawData = mainStore['last_day_volume_data'] || {}
        const token = this.props.data[0].name;
        const price = this.props.data[0].ADAPrice;
        const data = [];
        if (token === 'HOSKY') {
            for (const [key, value] of Object.entries(rawData[token]['poolDepthInADA'])) {
                let date = moment(key * 1000).format('LT');
                let depth = Number(value) * price;
                let volume = Number(rawData[token]['tradingVolumeInADA'][key]) * price;

                data.push(
                    {
                        x: date,
                        depth: Number(depth).toFixed(2),
                        volume: Number(volume.toFixed(2))
                    });
            }
        }
        else {
            for (const [key, value] of Object.entries(rawData[token]['poolDepthInADA'])) {
                let date = moment(key * 1000).format('LT');
                let depth = Number(value) * price;
                let volume = Number(rawData[token]['tradingVolumeInADA'][key]) * price;
                data.push(
                    {
                        x: date,
                        depth: Number(depth).toFixed(2),
                        volume: Number(volume.toFixed(2))
                    });
            }
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
                <YAxis yAxisId="left" label={{ value: 'Pool Depth ($)', angle: -90, position: 'insideLeft', textAnchor: 'middle', offset: '-15' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: '24h Volume ($)', angle: -90, position: 'insideRight', textAnchor: 'middle', offset: '-10' }} />
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

function getInterestRateInfTarget(utilization, base, target, slope1){
    return Number(base) + Number(utilization) / Number(target) * Number(slope1)
}
function getInterestRateSupTarget(utilization, base, target, slope1, slope2){
    return Number(base) + Number(slope1) + ((Number(utilization) - Number(target)) / (1 - Number(target))) * Number(slope2)
}
class MeldRateChart extends Component {
    render() {
        const target = this.props.data[0]['formulaParams']['rpTargetUtilizationRate'];
        const slope1 = this.props.data[0]['formulaParams']['rpInterestRateSlope1'];
        const slope2 = this.props.data[0]['formulaParams']['rpInterestRateSlope2'];
        const base = this.props.data[0]['formulaParams']['rpBaseBorrowingRate'];
        const graphData = [];
        let utilization = 0;

        ///util <= target = base + util/target * slope1
        ///else (ase + slope1 + (Util - target) / (1 - target) * slope2
        while(utilization <=100) {
            const x = utilization
            const y = utilization > 80 ? getInterestRateSupTarget(utilization / 100, base, target, slope1, slope2) : getInterestRateInfTarget(utilization / 100, base, target, slope1);
            graphData.push({
                x: x,
                y: Number(y * 100).toFixed(2),
            })
            utilization += 2;
        }

    return <div>
    <LineChart
        width={600}
        height={300}
        data={graphData}
        margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5
        }}
    >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="x" />
        <YAxis yAxisId="left" label={{ value: 'Interest Rate (%)', angle: -90, position: 'insideLeft', textAnchor: 'middle', offset: '-15' }} />
        <Tooltip />
        <Legend />
        <Line
            yAxisId="left"
            type="monotone"
            dataKey="y"
            stroke="#8884d8"
            name="borrow rate"

        />
    </LineChart>
</div>
}
}

class MeldBarGraph extends Component {
    render() {
        let barData = [this.props.data];
        return (
            <div className="meldGraphs">
                <div className="left">
                {barData[0].name === 'ADA' ? '' :
                    <article style={{marginTop:0, marginBottom:0}}>
                        <MeldDepthChart data={barData} />
                    </article>}
                    <article  style={{marginTop:10, marginBottom:0}}>
                    <MeldRateChart data={barData} />
                    </article>
                    </div>
                    <div className="right">
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

                        <Bar dataKey="price" fill="#8884d8" name="Price">
                            <LabelList dataKey='priceLabel' /></Bar>
                        <Bar dataKey="liquidationThreshold" stackId="a" fill="#82ca9d" name="Liquidation Level">
                            <LabelList dataKey='liquidationRatio' /></Bar>
                        <Bar dataKey="ltv" fill="#ffc658" name="Minimum Collateral Ratio">
                            <LabelList dataKey='ltvRatio' /></Bar>
                    </BarChart>
                </article>
                </div>
            </div>
        );
    }
}


export default observer(MeldBarGraph);