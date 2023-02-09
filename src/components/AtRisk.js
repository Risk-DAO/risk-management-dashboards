import React from 'react'
import {observer} from 'mobx-react'
import alertStore from '../stores/alert.store'
import Box from "../components/Box"
import BoxRow from "../components/BoxRow"
import BoxGrid from "../components/BoxGrid"
import StableLiquidity from "../components/StableLiquidity"

const AtRisk = props => {
  return <>
  <BoxGrid>
    <Box time={alertStore.varLarJsonTime}>
      <BoxRow>
        <h5 style={{margin: 0}}>Value at Risk on Worst Day Simulation</h5>
        <h5 style={{margin: 0}}>{alertStore.valueAtRisk}</h5>
      </BoxRow>
      <hgroup style={{margin: 0}}>
        <p style={{margin: 0}}>
          Value at Risk reflects bad debt the platform might accrued in a Worst Day simulation.
          Worst Day simulates the current state of the platform during the biggest price drop in ETH history, normalizing other assets according to their volatility w.r.t ETH.
        </p>
      </hgroup>

    </Box>
    <Box time={alertStore.varLarJsonTime}>
      <BoxRow>
        <h5 style={{margin: 0}}>Liquidations on Worst Day Simulation</h5>
        <h5 style={{margin: 0}}>{alertStore.liquidationsAtRisk}</h5>
      </BoxRow>
      <hgroup style={{margin: 0}}>
        <p style={{margin: 0}}>
          Liquidation at Risk reflects liquidated positions the platform would process in a Worst Day simulation. 
          Worst Day simulates the current state of the platform during the biggest price drop in ETH history, normalizing other assets according to their volatility w.r.t ETH.
        </p>
      </hgroup>
    </Box>
  </BoxGrid>
  {window.APP_CONFIG.feature_flags.systemStatusStableLiquidity && <StableLiquidity/>}
  </>
}

export default observer(AtRisk)