import React from 'react'
import {observer} from 'mobx-react'
import riskStore from '../stores/risk.store'

export const hasAtLeastOneAsterisk = (rows, field) => {
  for (const row of rows) {
    if(showAsterisk(row, field)) {
      return true
    }
  }
}

const showAsterisk = (row, field) => {
  const {key, asset} = row
  const recommendedCF = row[field]
  const currentCF = riskStore.getCurrentCollateralFactor(key || asset)
  const asterisk = currentCF > recommendedCF
  return asterisk
}

const Asterisk = props => {
  const {row, field, CR} = props
  let recommendedCF = row[field]
  const asterisk = showAsterisk(row, field)
  if(CR){
    recommendedCF = 100 / recommendedCF
  }
  return (
    <>
      <span>{recommendedCF.toFixed(2)}</span>
      {CR && <span>%</span>}
      {asterisk && <span> *</span>}
    </>
  )
}

export default observer(Asterisk)