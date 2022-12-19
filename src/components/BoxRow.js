import React from 'react'

const BoxRow = (props) => {
    const slimStyle = {
        marginBottom: '5px',
        paddingBottom: '5px',
    }
    return (
        <div className="box-row" style={props.slim ? slimStyle : {}}>
            {props.children}
        </div>
    )
}

export default BoxRow
