import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";

import { Component } from "react";
import { observer } from "mobx-react";

const expendedBoxStyle = {margin: '30px', width: '50%', minHeight: '300px', padding: '40px'}

class MeldBarGraph extends Component {
    render() {
        let data = [this.props.data];
        console.log('data', data)
        return (
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
        <article style={expendedBoxStyle}>
          
        <ResponsiveContainer>
            <BarChart
                width={500}
                height={300}
                data={data}
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
                <Bar dataKey="liquidationThreshold" stackId="a" fill="#82ca9d" />
                <Bar dataKey="price" stackId="a" fill="#8884d8" />
                <Bar dataKey="ltv" fill="#ffc658" />
            </BarChart>
            </ResponsiveContainer>
        </article>
        <div className="box-space" style={{width: '50%', display: 'flex', justifyContent: 'space-between', flexDirection: 'column'}}>
          <hgroup>
            <div></div>
            <p>placeholder</p>
          </hgroup>
        </div>
      </div>
        );
    }
}


export default observer(MeldBarGraph);