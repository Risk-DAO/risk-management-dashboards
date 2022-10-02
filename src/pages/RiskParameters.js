import React, { Component } from "react"
import {observer} from "mobx-react"
import { lazy } from 'react';
const {PLATFORM_ID} = window.APP_CONFIG
const RiskParametersCurrent = lazy(() => import(`../components/RiskParametersCurrent${PLATFORM_ID != '0' ? PLATFORM_ID : ''}`));
const RiskParametersUtilization = lazy(() => import(`../components/RiskParametersUtilization${PLATFORM_ID != '0' ? PLATFORM_ID : ''}`));
const RiskParametersSimulation = lazy(() => import(`../components/RiskParametersSimulation${PLATFORM_ID != '0' ? PLATFORM_ID : ''}`));


class RiskParameters extends Component {
  render (){
    return (
      <div>
        <RiskParametersSimulation/>
        <RiskParametersUtilization/>
        <RiskParametersCurrent/>      
      </div>
    )
  }
}

export default observer(RiskParameters)
