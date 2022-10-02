window.APP_CONFIG = {
  API_URL: 'https://raw.githubusercontent.com/Risk-DAO/simulation-results/main/',
  PLATFORM_ID: '2',
  TOKEN_PREFIX: '',
  BLOCK_EXPLORER: 'https://arbiscan.io',
  WHITE_LOGO: 'vesta-dark.svg',  
  BLACK_LOGO: 'vesta.svg',
  SOLVER: 'solver_vesta',
  STABLE: 'VST',
  feature_flags: {
    alerts: true,
    loopingToggle: false,
    dexLiquidityLpStatsRow: false,
    systemStatusStableLiquidity: true,
    sandBoxVersion: 1,
  },
  apiEndpoints: [
    'overview', 'accounts', 'dex_liquidity', 
    'oracles', 'usd_volume_for_slippage', 
    'current_simulation_risk',
    'risk_params', 'lending_platform_current', 'whale_accounts', 
    'open_liquidations', 'stability_pool', 'glp_data'
  ],
  SECTIONS: [
    {
      name: 'system-status',
      defaultVisible: true,
    },    
    {
      name: 'overview',
      defaultVisible: true,
    },   
    {
      name: 'collateral-factors',
      displayName: 'MCRs',
    },    
    {
      name: 'sandbox',
    },    
    {
      name: 'asset-distribution',
      defaultVisible: true,
    },
    {
      name: 'stability-pool'
    },
    {
      name: 'open-liquidations',
    },
    {
      name: 'oracle-deviation',
    },
    {
      name: 'liquidity',
      displayName: 'DEX Liquidity'
    },
    {
      name: 'qualitative-analysis'
    },
    {
      name: 'glp-utilization',
      displayName: 'GLP Utilization'
    },
    // 'backstop',
    // 'assumptions',
    //'qualitative-anlysis',
  ],
  TEXTS: {
    ASSET_DISTRIBUTION_DESCRIPTION: "The table tracks the main statistics per asset in the platform. Clicking on each row will open a graph describing the expected liquidations according to price changes of the collateral asset.",
    WORST_DAY_SIMULATION_DESCRIPTION: "Worst day simulation is done according to the worst day price-drop in ETH history. Other assets are being normalized according to their volatility compared to ETH. The simulation considers the current MCRs and users’ usage to present total liquidations and bad debt that would have accrued in the platform. The LCR is the lowest collateral ratio that won’t create bad debt for the platform in case the same scenario repeats today.",
    UTILIZATION_DESCRIPTION: "Recommended MCRs according to current collateral and borrow usage.",
    TOTAL_DEBT: "Total VST Debt",
    COLLATERAL_FACTOR: 'MCR',
    MAX_COLLATERAL_FACTOR: "Lowest Collateral Ratio",
    UTILIZATION: {
      ASSET: "Vault",
      CURRENT_SUPPLY: "Current Minted VST",
      CURRENT_BORROW: "VST in Stability Pool",
      CURRENT_COLLATERAL_FACTOR: "Current Collateral Factor",
      RECOMMENDED_COLLATERAL_FACTOR: "Recommended Collateral Factor",
    },
    ACCORDING_TO_EXISTING_CAPS: "According to Existing Mint Caps",
    ACCORDING_TO_EXISTING_CAPS_DESCRIPTION: "Recommended MCRs according to existing mint caps.",
    ASSET: "Vault",
    BORROW_CAP: "VST Mint Cap",
    SANDBOX_DESCRIPTION: "The sandbox lets you set different Mint caps, Stability Pools size, and B.AMM percentage of the Stability Pool, to get MCR recommendations according to different caps. The tool also provides optimization setting recommendations.",
    DEX_LIQUIDITY_DESCRIPTION: "Monitoring available on-chain DEX liquidity per asset. The graph shows maximum liquidation size that can be executed in a single transaction according to current available DEX liquidity w.r.t current liquidation bonus offered by the platform.",
    DEX_LIQUIDITY_EXPLAINER: "Max Liquidation in single tx for up to <place_holder>% slippage",
    COLLATERAL_PIE_CHART_TITLE: "VST Collateralization",
    DEBT_PIE_CHART_TITLE: "VST minted by Vault",
    SIMULATION_ASTERISK: "Increase current MCR to LCR is recommended",
  },
  QA: {
    "DPX": {
      score: 'C',
      comments: [
        'TWAP oracle owned by the team',
        'Governance risk',
      ]
    },
    "ETH": {
      score: 'A',
      comments: [
      ]
    },
    "gOHM": {
      score: 'B-',
      comments: [
        'Governance risk',
      ]
    },
    "GMX": {
      score: 'C',
      comments: [
        'TWAP oracle',
        'Governance risk',
      ]
    },
    "renBTC": {
      score: 'B+',
      comments: [
        'Custodial risk',
      ]
    },
    "sGLP": {
      score: 'C',
      comments: [
        "Operational risk",
        "Might no be redeemable when in full utilization",
        "Underlying asset composition could change over time"
      ]
    }
  }
}