import React from 'react'
import {observer} from 'mobx-react'
import { BLOCK_EXPLORER } from '../constants'

const BlockExplorerLink = props => {
  return <a href={`${BLOCK_EXPLORER}/address/${props.address}`} target="_blank" rel="noreferrer">{props.address}</a>
}

export default observer(BlockExplorerLink)