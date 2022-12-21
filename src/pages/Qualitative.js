import React, { Component } from "react"
import {observer} from "mobx-react"
import Box from "../components/Box"
import DataTable from 'react-data-table-component'
import mainStore from '../stores/main.store'
import Token from '../components/Token'

const Comments = props => {
  return (
    <div>
      <ul style={{margin: 'var(--spacing) 0'}}>
        {props.comments.map((comment, i) => <li key={i}>{comment}</li>)}
      </ul>
    </div>
  )
}

const columns = [
  {
      name: 'Asset',
      selector: row => row.key,
      format: row => <Token value={row.key}/>,
      sortable: true,
  },
  {
      name: 'Score',
      selector: row => row.score,
      sortable: true,
  },  
  {
      name: 'Current VST Mint % of total VST Supply',
      selector: row => row.share_of_total_vst_supply,
      format: row => row.share_of_total_vst_supply.toFixed(2) + '%',
      sortable: true,
  },  
  {
      name: 'Comments',
      selector: row => row.comments,
      format: row => <Comments comments={row.comments}/>,
      grow: 3
  },  
];


class Qualitative extends Component {
  render (){
    const loading = mainStore['accounts_loading']
    const rawData = Object.assign({}, mainStore['accounts_data'] || {})
    const qa = window.APP_CONFIG.QA || {}
    const {json_time} = rawData
    if(json_time){
      delete rawData.json_time
    }
    const totalMintedVst = Object.values(rawData).reduce((acc, o) => acc + parseFloat(o.total_debt), 0)
    const data = !loading ? Object.entries(rawData)
    .filter(([asset])=> asset !== window.APP_CONFIG.STABLE || "")
    .map(([asset, v])=> {
      v.asset = asset
      v.share_of_total_vst_supply = ((v.total_debt / totalMintedVst) * 100)
      v.score = qa[asset].score
      v.comments = qa[asset].comments
      return v
    }) : []

    return (
      <div>
        <Box loading={loading} time={json_time}>
          {!loading && <DataTable
              columns={columns}
              data={data}
          />}
        </Box>
      </div>
    )
  }
}

export default observer(Qualitative)