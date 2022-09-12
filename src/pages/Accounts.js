import React, { Component } from "react"
import {observer} from "mobx-react"
import Box from "../components/Box"
import DataTable from 'react-data-table-component'
import mainStore from '../stores/main.store'
import LiquidationsGraph from '../components/LiquidationsGraph'
import {whaleFriendlyFormater} from '../components/WhaleFriendly'
import { makeAutoObservable, runInAction } from "mobx"
import Token from "../components/Token"
import {TopTenAccounts, usersMinWidth} from "../components/TopAccounts"
import {TEXTS} from "../constants"


class LocalStore {
  looping = true

  constructor (){
    if(window.APP_CONFIG.feature_flags.loopingToggle  === false){
      this.looping = false
    }
    makeAutoObservable(this)
  }

  toggleLooping = () => {
    this.looping = !this.looping
  }

  get loopingPrefix(){
    return !this.looping ? '' : 'nl_'
  }

  prefixLooping = str => {
     return this.loopingPrefix + str
  }
}

const localStore = new LocalStore()

const rowPreExpanded = row => row.defaultExpanded
  
class Accounts extends Component {
  render (){
    const {prefixLooping} = localStore
    const columns = [
      {
          name: 'Asset',
          selector: row => row.key,
          format: row => <Token value={row.key}/>,
          sortable: true,
          minWidth: '110px'
      },  
      {
          name: 'Total Collateral',
          selector: row =>  Number(row[prefixLooping('total_collateral')]),
          format: row => whaleFriendlyFormater(row[prefixLooping('total_collateral')]),
          sortable: true,
          minWidth: '140px'
      },
      {
          name: TEXTS.TOTAL_DEBT,
          selector: row => Number(row[prefixLooping('total_debt')]),
          format: row => whaleFriendlyFormater(row[prefixLooping('total_debt')]),
          sortable: true,
          minWidth: '110px'
      },
      {
          name: 'Median Collateral',
          selector: row =>  Number(row[prefixLooping('median_collateral')]),
          format: row => whaleFriendlyFormater(row[prefixLooping('median_collateral')]),
          sortable: true,
          minWidth: '140px'
      },  
      {
          name: 'Median Debt',
          selector: row =>  Number(row[prefixLooping('median_debt')]),
          format: row => whaleFriendlyFormater(row[prefixLooping('median_debt')]),
          sortable: true,
          minWidth: '120px'
      },  
      {
          name: 'Top 10 Accounts Collateral',
          selector: row =>  Number(row[prefixLooping('top_10_collateral')]),
          format: row => < TopTenAccounts row={row} accounts={row.whales.big_collateral} value={whaleFriendlyFormater(row[prefixLooping('top_10_collateral')])}/>,
          sortable: true,
          minWidth: usersMinWidth
      },
      {
          name: 'Top 10 Accounts Debt',
          selector: row =>  Number(row[prefixLooping('top_10_debt')]),
          format: row => <TopTenAccounts row={row} accounts={row.whales.big_debt} value={whaleFriendlyFormater(row[prefixLooping('top_10_debt')])}/>,
          sortable: true,
          minWidth: usersMinWidth
      },
      {
          name: 'Top 1 Account Collateral',
          selector: row =>  Number(row['top_1_collateral']),
          format: row => whaleFriendlyFormater(row['top_1_collateral']),
          sortable: true,
          minWidth: '140px'
      },
      {
          name: 'Top 1 Account Debt',
          selector: row =>  Number(row['top_1_debt']),
          format: row => whaleFriendlyFormater(row['top_1_debt']),
          sortable: true,
          minWidth: '140px'
      },
    ]

    const loading = mainStore['accounts_loading'] || mainStore['whale_accounts_loading']
    const rawData = Object.assign({}, mainStore['accounts_data'] || {})
    const whaleData = mainStore['whale_accounts_data'] || {}
    
    const {json_time} = rawData
    if(json_time){
      delete rawData.json_time
    }
    const data = !loading ? Object.entries(rawData)
    .filter(([k, v])=> k !== window.APP_CONFIG.STABLE || "")
    .map(([k, v])=> {
      v.key = k
      v.whales = whaleData[k]
      return v
    })
    .sort((a, b)=> {
      return b.total_collateral - a.total_collateral
    }) : []

    if(data.length){
      data[0].defaultExpanded = true  
    }

    const text = "* Big account included in the list"
    const onRowExpandToggled = (expanded, row) => row.expanded = expanded
    
    return (
      <div>
        <Box loading={loading} time={json_time} text={text}>
        {window.APP_CONFIG.feature_flags.loopingToggle && <fieldset>
          <label htmlFor="switch">
            <input onChange={localStore.toggleLooping} defaultChecked={localStore.looping} type="checkbox" id="switch" name="switch" role="switch"/>
            <span>Ignore correlated debt and collateral, and assets not in market</span>
          </label>
        </fieldset>}
          {!loading && <DataTable
              expandableRows
              columns={columns}
              defaultSortFieldId={2}
              defaultSortAsc={false}
              data={data}
              expandableRowsComponent={LiquidationsGraph}
              expandableRowExpanded={rowPreExpanded}
              onRowExpandToggled={onRowExpandToggled}
          />}
        </Box>
      </div>
    )
  }
}

export default observer(Accounts)
