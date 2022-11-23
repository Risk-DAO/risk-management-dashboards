import React, { Component } from "react";
import {observer} from "mobx-react"
import mainStore from '../stores/main.store'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import {COLORS, TEXTS} from '../constants'
import {removeTokenPrefix} from '../utils'
import {whaleFriendlyFormater, WhaleFriendlyAxisTick} from '../components/WhaleFriendly'
import BoxRow from "./BoxRow";

const expendedBoxStyle = {margin: '30px', width: '50%', minHeight: '300px', padding: '40px'}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const {name, value} = Object.assign({}, payload[0].payload)
    return (
      <div className="tooltip-container">
        <BoxRow>
          <div>{name}</div>
          <div>{whaleFriendlyFormater(value)}</div>
        </BoxRow>
      </div>
    );
  }
}

class SlippageChart extends Component {

  render () {
    let market = this.props.data

    const loading = mainStore['usd_volume_for_slippage_loading']
    const rawData = Object.assign({}, mainStore['usd_volume_for_slippage_data'] || {})
    const cleanData = {}
    Object.entries(rawData).forEach(([k, v])=> {
      cleanData[k] = v
    })
    const {json_time} = cleanData
    if(json_time){
      delete cleanData.json_time
    }
    const data = !loading ? (cleanData[market] || {}) : {}
    const dataSet = Object.entries(data).map(([k, v])=> ({name: removeTokenPrefix(k), value: v.volume, penalty: v.llc}))
    if(!dataSet.length){
      return null
    }
    let [biggest, secondBiggest] = dataSet.sort((a, b)=> b.value - a.value)
    if(!secondBiggest){
      secondBiggest = biggest
    }
    const dataMax = Math.min(secondBiggest.value * 2, biggest.value)
    
    const text = TEXTS.DEX_LIQUIDITY_EXPLAINER.replace('<place_holder>', ((dataSet[0].penalty - 1) * 100).toFixed(0))
    return (
      <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
        <article style={expendedBoxStyle}>
          <ResponsiveContainer>
            <BarChart data={dataSet}>
              <XAxis dataKey="name" interval={0}/>
              <YAxis type="number" domain={[0, dataMax]} tick={<WhaleFriendlyAxisTick />} allowDataOverflow={true}/>
              <Tooltip content={CustomTooltip}/>
              <Bar dataKey="value" fill={COLORS[0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>
        <div className="box-space" style={{width: '50%', display: 'flex', justifyContent: 'space-between', flexDirection: 'column'}}>
          <hgroup>
            <div></div>
            <p>{text}</p>
          </hgroup>
        </div>
      </div>
    )
  }
}

export default observer(SlippageChart)