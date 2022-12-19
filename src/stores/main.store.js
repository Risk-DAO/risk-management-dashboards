import { makeAutoObservable } from 'mobx'
import axios from 'axios'

// const STAGING = 'https://api-staging.riskdao.org'

const { SECTIONS, PLATFORM_ID, API_URL, apiEndpoints } = window.APP_CONFIG

class MainStore {
    blackMode = true
    loading = {}
    apiData = {}
    proView = false
    apiUrl = API_URL
    stagingLoader = 0

    constructor() {
        // if(window.location.href.indexOf('staging') > -1){
        //   this.apiUrl = STAGING
        // }
        this.init()
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            // dark mode
            this.blackMode = true
        }
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            this.blackMode = !!e.matches
        })
        makeAutoObservable(this)
    }

    toggleProView = () => (this.proView = !this.proView)

    sectionShow = (sectionName) => {
        for (let section of SECTIONS) {
            if (section.name === sectionName) {
                if (this.proView) {
                    return true
                }
                return section.defaultVisible
            }
        }
    }

    setBlackMode = (mode) => {
        this.blackMode = mode
    }

    getApiVersion = () => {
        const qsApiVersion = new URLSearchParams(window.location.search).get('api-version')
        if (qsApiVersion) return new Promise((resolve) => resolve(qsApiVersion))
        const build = process.env.REACT_APP_CONFIG || 'dev'
        return axios
            .get(`https://raw.githubusercontent.com/Risk-DAO/version-control/main/${build}`)
            .then(({ data }) => data.trim().replace('\n', ''))
    }

    init = () => {
        this.apiVersionPromise = this.getApiVersion()
        apiEndpoints.forEach(this.fetchData)
    }

    clean = (data) => {
        const clean = Object.assign({}, data)
        if (clean.json_time) {
            delete clean.json_time
        }
        return clean
    }

    fetchData = (endpoint) => {
        this[endpoint + '_loading'] = true
        this[endpoint + '_data'] = null
        const apiIsV2 = this.apiUrl.indexOf('github') > -1
        this[endpoint + '_request'] = this.apiVersionPromise
            .then((version) => {
                let url
                if (apiIsV2) {
                    url = `${this.apiUrl}/${PLATFORM_ID}/${version}/${endpoint}.json`
                } else {
                    url = `${this.apiUrl}/${endpoint}/${PLATFORM_ID}?timestamp=${parseInt(
                        new Date().getTime() / (1000 * 60 * 60)
                    )}`
                }
                return axios.get(url)
            })
            .then(({ data }) => {
                this[endpoint + '_loading'] = false
                this[endpoint + '_data'] = data
                return data
            })
            .catch(console.error)
    }

    setStaging = async () => {
        window.location.replace(window.location.origin + '/staging')
    }
}

export default new MainStore()
