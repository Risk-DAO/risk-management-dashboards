window.APP_CONFIG = {
  PLATFORM_ID: '2',
  TOKEN_PREFIX: '',
  BLOCK_EXPLORER: 'https://arbiscan.io',
  WHITE_LOGO: 'vesta.svg',  
  BLACK_LOGO: 'vesta.svg',
  SOLVER: 'solver_demo',
  STABLE: 'VST',
  feature_flags: {
    alerts: true
  },
  SECTIONS: [
    {
      name: 'system-status',
      defaultVisible: true,
    },    
    {
      name: 'overview',
      defaultVisible: true,
    },   
    // {
    //   name: 'collateral-factors',
    //   displayName: 'collateral-ratios',
    // },    
    // {
    //   name: 'sandbox',
    // },    
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
    // {
    //   name: 'liquidity',
    //   displayName: '"DEX Liquidity"'
    // }
    // 'backstop',
    // 'assumptions',
    //'qualitative-anlysis',
  ]
}