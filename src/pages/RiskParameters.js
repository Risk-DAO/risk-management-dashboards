import React, { Component } from "react"
import {observer} from "mobx-react"
import RiskParametersCurrent from '../components/RiskParametersCurrent'
import RiskParametersCurrent2 from '../components/RiskParametersCurrent2'
import RiskParametersUtilization from '../components/RiskParametersUtilization'
import RiskParametersUtilization2 from '../components/RiskParametersUtilization2'
import RiskParametersSimulation from '../components/RiskParametersSimulation'
import RiskParametersSimulation2 from '../components/RiskParametersSimulation2'


class RiskParameters extends Component {
  render (){
    const {PLATFORM_ID} = window.APP_CONFIG
    return (
      <div>
        {PLATFORM_ID === "2" && <>
          <RiskParametersSimulation2/>
          <RiskParametersUtilization2/>
          <RiskParametersCurrent2/>      
        </>}  
        {PLATFORM_ID != "2" && <>
        <RiskParametersSimulation/>
          <RiskParametersUtilization/>
          <RiskParametersCurrent/>      
        </>}  
      </div>
    )
  }
}

export default observer(RiskParameters)
