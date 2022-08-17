import React from "react"
import {observer} from "mobx-react"
import mainStore from "../stores/main.store"

const pages = [
  'system-status',
  'overview',
  'collateral-factors',
  'sandbox',
  'asset-distribution',
  'open-liquidations',
  'oracle-deviation',
  'liquidity',
  // 'backstop',
  // 'assumptions',
  //'qualitative-anlysis',
]
 

const humanPagesMap = {
  liquidity: "DEX Liquidity"
}

const Sidenav = (props) => {
  return (
    <div className="side-bar box-space">
      {/* <Header/> */}
      <fieldset>
          <label htmlFor="switch">
            <input onChange={mainStore.toggleProView} defaultChecked={mainStore.proView} type="checkbox" id="switch" name="switch" role="switch"/>
            <span>Pro View</span>
          </label>
        </fieldset>
      <aside>
        <nav>
          <ul>
            {pages.map(page=> <li key={page}>
              <a
                href={'#'+page}
                data-to-scrollspy-id={page}
                className='nav-link'
              >
                {mainStore.proViewShow(page) && <span>
                  {humanPagesMap[page] || page.split('-').join(' ')}
                </span>}
              </a>
            </li>)}
          </ul>
        </nav>
      </aside>
    </div>
  )
}

export default observer(Sidenav)