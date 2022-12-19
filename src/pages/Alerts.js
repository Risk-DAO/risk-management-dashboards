import React, { Component } from 'react'
import { observer } from 'mobx-react'
import Box from '../components/Box'
import BoxRow from '../components/BoxRow'
import BoxGrid from '../components/BoxGrid'
import alertStore from '../stores/alert.store'
import DataTable from 'react-data-table-component'
import AtRisk from '../components/AtRisk'

const AlertText = (props) => {
    const { type } = props
    const style = {
        display: 'inline-block',
        minWidth: '26px',
        minHeight: '26px',
        paddingLeft: '30px',
        textTransform: 'capitalize',
    }
    if (type === 'healthy') {
        style.backgroundImage = `var(--icon-valid)`
    }
    if (type === 'review') {
        style.backgroundImage = `var(--icon-review)`
    }
    if (type === 'danger') {
        style.backgroundImage = `url('icons/exclamation-triangle.svg')`
    }
    return <div style={style}>{props.children}</div>
}

const Alert = (props) => {
    const { alert } = props

    return (
        <>
            <BoxRow>
                <summary>
                    <AlertText type={alert.type}>{alert.title}</AlertText>
                </summary>
                {alert.type === 'healthy' && (
                    <kbd className="status-tag" style={{ backgroundColor: 'var(--ins-color)' }}>
                        Healthy
                    </kbd>
                )}
                {alert.type === 'danger' && (
                    <a href={alert.link}>
                        <kbd className="status-tag" style={{ backgroundColor: 'var(--red-text)' }}>
                            Action Required
                        </kbd>
                    </a>
                )}
                {alert.type === 'review' && (
                    <a href={alert.link}>
                        <kbd className="status-tag" style={{ backgroundColor: 'var(--yellow-text)' }}>
                            Review
                        </kbd>
                    </a>
                )}
                {alert.showTable && !!alert.data.length && (
                    <div
                        style={{
                            marginTop: 'var(--spacing)',
                            minWidth: '100%',
                        }}
                    >
                        <Box>
                            <DataTable data={alert.data} columns={alert.columns} defaultSortFieldId={1} />
                        </Box>
                    </div>
                )}
            </BoxRow>
        </>
    )
}

class Alerts extends Component {
    render() {
        return (
            <div>
                <AtRisk />
                {window.APP_CONFIG.feature_flags.alerts && (
                    <BoxGrid>
                        <Box loading={alertStore.loading}>
                            <div>
                                {alertStore.alerts.map((alert, i) => (
                                    <Alert key={i} alert={alert} />
                                ))}
                            </div>
                        </Box>
                    </BoxGrid>
                )}
            </div>
        )
    }
}

export default observer(Alerts)
