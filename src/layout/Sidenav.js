import React from "react"
import {observer} from "mobx-react"
import mainStore from "../stores/main.store"

const {SECTIONS} = window.APP_CONFIG 

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
            {SECTIONS.map(section=> <li key={section.name}>
              <a
                href={'#'+section.name}
                data-to-scrollspy-id={section.name}
                className='nav-link'
              >
                {mainStore.sectionShow(section.name) && <span>
                  {section.displayName || section.name.split('-').join(' ')}
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