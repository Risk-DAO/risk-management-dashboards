import React from 'react'
import {observer} from 'mobx-react'
import { removeTokenPrefix } from '../utils'

const Token = props => {
  let name = removeTokenPrefix(props.value)
  if(name === 'WETH'){
    name = 'ETH'
  }
  return <b>{name}</b>
}

export default observer(Token)