import { Component, Suspense, lazy } from "react";

import MeldGraphs from "./MeldGraphs";
import ReverseSolver from './ReverseSolver';
import ScrollSpy from "react-ui-scrollspy";
import SimulationParameters from "./SimulationParameters";
import { TEXTS } from "../constants";
import mainStore from '../stores/main.store';
import { observer } from "mobx-react";
import riskStore from '../stores/risk.store';

const Overview = lazy(() => import('./Overview'))
const Liquidity = lazy(() => import('./Liquidity'))
const Accounts = lazy(() => import('./Accounts'))
const Oracles = lazy(() => import('./Oracles'))
const RiskParameters = lazy(() => import('./RiskParameters'))
const Alerts = lazy(() => import('./Alerts'))
const StabilityPool = lazy(() => import('./StabilityPool'))
const OpenLiquidations = lazy(() => import('./OpenLiquidations'))
const Qualitative = lazy(() => import('./Qualitative'))
const GlpUtilization = lazy(() => import('./GlpUtilization'))

const SandBox = lazy(()=> {
  const {sandBoxVersion} = window.APP_CONFIG.feature_flags
  switch (sandBoxVersion){
    case 1: return import("./VestaSandBox")
    default: return import("./SandBox")
  }
})

class SinglePage extends Component {

  render (){
    const color = mainStore.blackMode ? 'white' : 'black';
    return (
      <ScrollSpy offsetBottom={400} scrollThrottle={100} parentScrollContainerRef={this.props.scrollContainer}>
        <section id="system-status">
          {mainStore.sectionShow("system-status") && <div>
            <h2>System Status</h2>
            <Suspense fallback={<article aria-busy="true"></article>}>
              <Alerts/>
            </Suspense>
          </div>}
        </section>
        <section id="overview">
          {mainStore.sectionShow("overview") && <div>
            <hgroup>
              <h2>Overview</h2>
              <p className="description">State of the platform overview</p>
            </hgroup>
            <Suspense fallback={<article aria-busy="true"></article>}>
              <Overview/>
            </Suspense>
          </div>}
        </section>
        <section id="simulation-parameters">
          {mainStore.sectionShow("simulation-parameters") && <div>
            <h2>Simulation Parameters</h2>
            <Suspense fallback={<article aria-busy="true"></article>}>
              <SimulationParameters/>
            </Suspense>
          </div>}
        </section>
        <section id="collateral-factors">
          {mainStore.sectionShow("collateral-factors") && <div>
            <h2>{TEXTS.COLLATERAL_FACTOR} Recommendations</h2>
            <Suspense fallback={<article aria-busy="true"></article>}>
              <RiskParameters />
            </Suspense>
          </div>}
        </section>
       <section id="sandbox">
        {mainStore.sectionShow("sandbox") && <div>
            <hgroup>
              <h2> Risk Parameters Sandbox</h2>
              <p className="description">{TEXTS.SANDBOX_DESCRIPTION}</p>
            </hgroup>
            <Suspense fallback={<article aria-busy="true"></article>}>
              <SandBox/>
            </Suspense>
          </div>}
        </section>        
        {riskStore.solverData ? (
                    <section id="reversesolver">
                        {mainStore.sectionShow('reversesolver') && (
                            <div>
                                <hgroup>
                                    <h2>Dex Liquidity Sandbox</h2>
                                    <p className="description">{TEXTS.REVERSESOLVER_DESCRIPTION}</p>
                                </hgroup>
                                <Suspense fallback={<article aria-busy="true"></article>}>
                                    <ReverseSolver />
                                </Suspense>
                            </div>
                        )}
                    </section>
                ) : (
                    ''
                )}
        <section id="asset-distribution">
          {mainStore.sectionShow("asset-distribution") && <div>
            <hgroup>
              <h2>Asset Distribution</h2>
              <p className="description">
                {TEXTS.ASSET_DISTRIBUTION_DESCRIPTION}
              </p>
            </hgroup>
            <Suspense fallback={<article aria-busy="true"></article>}>
              <Accounts/>
            </Suspense>
          </div>}
        </section>
        <section id="stability-pool">
          {mainStore.sectionShow("stability-pool") && <div>
            <hgroup>
              <h2>Stability Pool</h2>
              <p>VST in the Stability Pool is used to execute liquidations of Vaults which crossed the MCR. The B.AMM (Backstop AMM) operates an automatic rebalance process for the seized collateral, selling it back to VST for users who have deposited VST through B.Protocol.</p>
            </hgroup>
            <Suspense fallback={<article aria-busy="true"></article>}>
              <StabilityPool/>
            </Suspense>
          </div>}
        </section>
        <section id="open-liquidations">
          {mainStore.sectionShow("open-liquidations") && <div>
            <hgroup>
              <h2>Open Liquidations</h2>
              <p></p>
            </hgroup>
            <Suspense fallback={<article aria-busy="true"></article>}>
              <OpenLiquidations/>
            </Suspense>
          </div>}
        </section>
        <section  id="oracle-deviation">
          {mainStore.sectionShow("oracle-deviation") && <div>
            <hgroup>
              <h2>Oracle Deviation</h2>
              <p className="description">The table tracks the deviation from the oracle price feed used by the platform compared to the assets’ prices taken from Centralized Exchanges (CEX) and Decentralized Exchanges (DEX). This helps monitor any critical deviations that might indicate an oracle manipulation, de-pegging, downtime, etc.</p>
            </hgroup>
            <Suspense fallback={<article aria-busy="true"></article>}>
              <Oracles/>
            </Suspense>
          </div>}
        </section>
        <section id="liquidity">
          {mainStore.sectionShow("liquidity") && <div>
              <hgroup>
                <h2>DEX Liquidity</h2>
                <p className="description">
                  {TEXTS.DEX_LIQUIDITY_DESCRIPTION}
                </p>
            </hgroup>
            {/* <small>Aggregated DEX data is provided by</small> */}
            <img style={{width: '250px', display: 'block'}} src={`/images/${color}-powered-by-kyberswap.png`} alt=""/>
            <Suspense fallback={<article aria-busy="true"></article>}>
              <Liquidity/>
            </Suspense>
          </div>}
        </section>
        <section id="meldGraphs">
          {mainStore.sectionShow("meldGraphs") && <div>
              <hgroup>
                <h2>Additional Info</h2>
                <p className="description">
                  {/* description goes here */}
                </p>
            </hgroup>
            <Suspense fallback={<article aria-busy="true"></article>}>
              <MeldGraphs/>
            </Suspense>
          </div>}
        </section>
        <section id="qualitative-analysis">
        {mainStore.sectionShow("qualitative-analysis") && <div>
              <hgroup>
                <h2>Qualitative Analysis</h2>
                <p className="description">
                  We propose to cap the debt ceiling of the assets according to their Score: 
                  <br/>
                  <small>
                  <b>A</b> - could potentially be uncapped, however to mitigate price oracle attacks and other potential glitches, we recommend to cap it by 2 times the amount of VST DEX liquidity (on Curve Finance)
                  <br/>
                  <b>B</b> -  should be capped to at most 20-30% of the entire VST target supply*.
                  <br/> 
                  <b>C</b> - should be capped to at most 10% of the entire VST target supply*.
                  <br/>      
                  * Target supply: Given the early stage of Vesta Finance, the target supply need not be the current VST supply, as otherwise, it would lift heavy restrictions on risky assets. 
                  </small>
                </p>
            </hgroup>
            <Suspense fallback={<article aria-busy="true"></article>}>
              <Qualitative/>
            </Suspense>
          </div>}
        </section>
        <section id="glp-utilization">
          {mainStore.sectionShow("glp-utilization") && <div>
            <hgroup>
              <h2>GLP Utilization</h2>
              <p className="description">
              Monitoring the utilization of the GLP vault
              </p>
            </hgroup>            
            <Suspense fallback={<article aria-busy="true"></article>}>
              <GlpUtilization/>
            </Suspense>
          </div>}
        </section>
      </ScrollSpy>
    )
  }
}

export default observer(SinglePage)