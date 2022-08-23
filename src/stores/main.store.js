import { makeAutoObservable, runInAction } from "mobx"
import axios from "axios"

const platformId = window.APP_CONFIG.PLATFORM_ID
const {SECTIONS} = window.APP_CONFIG
const apiEndpoints = ['overview', 'accounts', 'dex_liquidity', 'oracles', 'usd_volume_for_slippage', 'current_simulation_risk',
                      'risk_params', 'lending_platform_current', 'whale_accounts', 'open_liquidations']


class MainStore {

  apiUrl = process.env.REACT_APP_API_URL || 'https://analytics.riskdao.org'
  blackMode =  true
  loading = {}
  apiData = {}
  proView = false

  constructor () {
    this.init()
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      // dark mode
      this.blackMode = true
    }
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      this.blackMode = !!e.matches
    });
    makeAutoObservable(this)
  }

  toggleProView = () => this.proView = !this.proView

  sectionShow = (sectionName) => {
    if(this.proView){
      return true
    }
    for(let section of SECTIONS){
      if (section.name === sectionName){
        return section.defaultVisible
      }
    }
  }

  setBlackMode = (mode) => {
    this.blackMode = mode
  }

  init = () => {
    apiEndpoints.forEach(this.fetchData)
  }

  clean = data => {
    const clean = Object.assign({}, data)
    if(clean.json_time) {
      delete clean.json_time
    }
    return clean
  }

  fetchData = (endpoint) => {
    this[endpoint + '_loading'] = true
    this[endpoint + '_data'] = null
    this[endpoint + '_request'] = axios.get(`${this.apiUrl}/${endpoint}/${platformId}`)
    .then(({data})=> {
      this[endpoint + '_loading'] = false
      this[endpoint + '_data'] = data
      return data
    })
    .catch(console.error)
  }
}

export default new MainStore()
