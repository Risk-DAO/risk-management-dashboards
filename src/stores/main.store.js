import { makeAutoObservable, runInAction } from "mobx"
import axios from "axios"

const STAGING = 'https://api-staging.riskdao.org'

const {SECTIONS, PLATFORM_ID, API_URL} = window.APP_CONFIG
const apiEndpoints = ['overview', 'accounts', 'dex_liquidity', 'oracles', 'usd_volume_for_slippage', 'current_simulation_risk',
                      'risk_params', 'lending_platform_current', 'whale_accounts', 'open_liquidations', 'stability_pool']


class MainStore {

  blackMode =  true
  loading = {}
  apiData = {}
  proView = false
  apiUrl = API_URL
  stagingLoader = 0

  constructor () {

    if(window.location.href.indexOf('staging') > -1){
      this.apiUrl = STAGING
    }
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
    this[endpoint + '_request'] = axios.get(`${this.apiUrl}/${endpoint}/${PLATFORM_ID}?timestamp=${parseInt(new Date().getTime() / (1000 * 60 * 60))}`)
    .then(({data})=> {
      this[endpoint + '_loading'] = false
      this[endpoint + '_data'] = data
      return data
    })
    .catch(console.error)
  }

  setStaging = async ()=> {
    window.location.replace(window.location.origin + '/staging')
  }
}

const sleep = async (sec)=> new Promise(resolve => setTimeout(resolve, sec * 1000))

export default new MainStore()
