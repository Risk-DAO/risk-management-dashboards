window.APP_CONFIG = {
  PLATFORM_ID: '0',
  API_URL: 'https://raw.githubusercontent.com/Risk-DAO/simulation-results/main/',
  TOKEN_PREFIX: 'au',
  BLOCK_EXPLORER: 'https://aurorascan.dev',
  WHITE_LOGO: 'aurigami.svg',
  BLACK_LOGO: 'aurigami.svg',
  feature_flags: {
    alerts: false,
    loopingToggle: true
  },
  apiEndpoints: [
    'overview', 'accounts', 'dex_liquidity', 
    'oracles', 'usd_volume_for_slippage', 
    'current_simulation_risk',
    'risk_params', 'lending_platform_current', 'whale_accounts', 
    'open_liquidations',
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
    },   
    {
      name: 'sandbox',
    },
    {
      name: 'asset-distribution',
      defaultVisible: true,
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
  ]
}