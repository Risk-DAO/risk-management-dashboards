import React, { Component } from "react"
import {observer} from "mobx-react"
import Box from "../components/Box"
import SlippageChart from "../components/SlippageChart"
import DataTable from 'react-data-table-component'
import mainStore from '../stores/main.store'
import {whaleFriendlyFormater} from '../components/WhaleFriendly'
import {precentFormatter} from '../utils'
import Token from '../components/Token'
import TopAccounts, {usersMinWidth} from '../components/TopAccounts'


const columns = [
  {
      name: 'LP Pair',
      selector: row => row.key,
      format: row => <Token value={row.key}/>,
      minWidth: '140px'
  },    
  {
      name: 'LPs count',
      selector: row => row.count,
      format: row => row.count,
  },  
  {
      name: 'Avg LP size',
      selector: row => row.avg,
      format: row => whaleFriendlyFormater(row.avg),
  },  
  {
      name: 'Med LP size',
      selector: row => row.med,
      format: row => whaleFriendlyFormater(row.med),
  },  
  {
      name: 'Top 1 LP',
      selector: row => row.top_1,
      format: row => precentFormatter(row.top_1),
  },
  {
      name: 'Top 5 LP',
      selector: row => row.top_5,
      format: row => <TopAccounts row={row} />,
      minWidth: usersMinWidth
  },
  {
      name: 'Top 10 LP',
      selector: row => row.top_10,
      format: row => precentFormatter(row.top_10),
  },
  {
      name: 'Total liquidity ',
      selector: row => row.total,
      format: row => whaleFriendlyFormater(row.total),
  }
];

class Liquidity extends Component {
  render (){
    const loading = mainStore['dex_liquidity_loading']
    const assets = {}
    const rawData = Object.assign({}, mainStore['dex_liquidity_data'] || {})
    const {json_time} = rawData

    if(json_time){
      delete rawData.json_time
    }
    Object.entries(rawData).map(([k, v])=> {
      const asset = k.split('-')[0]
      assets[asset] = assets[asset] || { name: asset, lps: []}
      v.key = k
      assets[asset].lps.push(v)
    })
    
    if(window.APP_CONFIG.PLATFORM_ID === '0'){
      assets['WNEAR'] = { name: 'WNEAR', lps: []}
    }

    return (
      <div>
        <Box loading={loading} time={json_time}>
          <p> 
            </p>
          {Object.values(assets).map((asset, i)=><details key={i} open>
            <summary><Token value={asset.name} /></summary>
            <div style={{display: 'flex'}}>
              <SlippageChart data={asset.name} i={i}/>
            </div>
            <div style={{marginLeft: '30px'}}>
            {window.APP_CONFIG.feature_flags.dexLiquidityLpStatsRow && !!asset.lps.length && <Box>
                   <DataTable
                    columns={columns}
                    data={asset.lps}
                  />
              </Box>}
            </div>
          </details>)}
        </Box>
      </div>
    )
  }
}

export default observer(Liquidity)