window.APP_CONFIG = {
  PLATFORM_ID: '1',
  API_URL: 'https://raw.githubusercontent.com/Risk-DAO/simulation-results/main/',
  TOKEN_PREFIX: '',
  BLOCK_EXPLORER: 'https://explorer.nervos.org',  
  WHITE_LOGO: 'nervos-dark.svg',
  BLACK_LOGO: 'nervos.svg',
  feature_flags: {
    alerts: true,
    loopingToggle: false,
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
      name: 'asset-distribution',
      defaultVisible: true,
    },    
    {
      name: 'open-liquidations',
    },
    {
      name: 'oracle-deviation',
    },
  ]
}