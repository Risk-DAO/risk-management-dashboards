import React from 'react'
import { observer } from 'mobx-react'
import mainStore from '../stores/main.store'

const { SECTIONS } = window.APP_CONFIG

const StagingBtn = observer(() => {
    return (
        <div className="staging-btn">
            <div onClick={mainStore.setStaging}>
                {!!mainStore.stagingLoader && <progress value={mainStore.stagingLoader} max="100"></progress>}
                <span style={{ color: 'var(--contrast-inverse)' }}>Staging</span>
            </div>
        </div>
    )
})

const Sidenav = (props) => {
    const showProView = window.APP_CONFIG.SECTIONS.filter(({ defaultVisible }) => !defaultVisible).length > 0
    return (
        <div className="side-bar box-space">
            {/* <Header/> */}
            {showProView && (
                <fieldset>
                    <label htmlFor="switch">
                        <input
                            onChange={mainStore.toggleProView}
                            defaultChecked={mainStore.proView}
                            type="checkbox"
                            id="switch"
                            name="switch"
                            role="switch"
                        />
                        <span>Pro View</span>
                    </label>
                </fieldset>
            )}
            <aside>
                <nav>
                    <ul>
                        {SECTIONS.map((section) => (
                            <li key={section.name}>
                                <a href={'#' + section.name} data-to-scrollspy-id={section.name} className="nav-link">
                                    {mainStore.sectionShow(section.name) && (
                                        <span>{section.displayName || section.name.split('-').join(' ')}</span>
                                    )}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>
            <StagingBtn />
        </div>
    )
}

export default observer(Sidenav)
