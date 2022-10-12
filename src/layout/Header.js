import React, { Component } from "react";
import {observer} from "mobx-react"
import mainStore from "../stores/main.store"

class Header extends Component {

  render () {
    const color = mainStore.blackMode ? 'white' : 'black';
    const logo = mainStore.blackMode ? window.APP_CONFIG.WHITE_LOGO : window.APP_CONFIG.BLACK_LOGO
    return (
      <div className="box-space" style={{position: 'fixed', top: 0, width: 'var(--sidebar-width)', height: 'var(--header-height)', paddingLeft: '30px'}}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', height: '100%', flexDirection: 'column'}}>
          <img style={{ height: 'calc((var(--header-height) / 2) - 35px)'}} src={`/images/${color}-wordmark.png`} alt=""/>
          {/* <img style={{ width: '0.7vw', margin: '0 2vw'}} src={`/logos/${color}-x.svg`}/> */}
          {logo && <img style={{height: 'calc((var(--header-height) / 2) - 45px)'}} src={`/logos/${logo}`} alt=""/>}
        </div>
      </div>
    )
  }
}

export default observer(Header)