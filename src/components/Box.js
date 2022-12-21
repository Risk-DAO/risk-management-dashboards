import React from 'react'
import {observer} from 'mobx-react'
import BoxFooter from './BoxFooter'

const Box = props => {
  const box = {
    width: '100%',
    minHeight: '200px',
    marginTop: 0,
    padding: '40px',
    marginBottom: 'var(--spacing)',
    height: props.height,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  }
  return (
    <article style={box} aria-busy={props.loading}>
      {props.children}
      <BoxFooter {...props}/>
    </article>
  )
}

export default observer(Box)