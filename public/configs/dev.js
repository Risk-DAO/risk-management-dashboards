window.APP_CONFIG = {
    PLATFORM_ID: '5',
    API_URL: 'https://raw.githubusercontent.com/Risk-DAO/simulation-results/main/',
    TOKEN_PREFIX: '',
    BLOCK_EXPLORER: 'https://cardanoscan.io',
    WHITE_LOGO: 'meld.svg',
    BLACK_LOGO: 'meld-black.svg',
    feature_flags: {
        alerts: true,
        loopingToggle: false,
        initSandBoxFromCurrentUtilization: false,
    },
    apiEndpoints: ['risk_params', 'usd_volume_for_slippage'],
    SECTIONS: [
        {
            name: 'sandbox',
            defaultVisible: true,
        },
        {
            name: 'reversesolver',
            defaultVisible: true,
        },
        {
            name: 'liquidity',
            displayName: 'DEX Liquidity',
            defaultVisible: true,
        },
    ],
    TEXTS: {
        COLLATERAL_FACTOR: 'Liquidation Threshold',
        MAX_COLLATERAL_FACTOR: 'Lowest Liquidation Threshold',
        WORST_DAY_SIMULATION_DESCRIPTION:
            'Worst day simulation is done according to the worst day price-drop in ETH history. Other assets are being normalized according to their volatility compared to ETH. The simulation takes into consideration the current liquidation thresholds and current users’ usage to present total liquidations and bad debt that would have accrued in the platform. The Max CF is the highest liquidation threshold that won’t create bad debt for the platform in case the same scenario repeats today',
        UTILIZATION_DESCRIPTION: 'Recommended liquidation thresholds according to current supply and borrow usage',
        ACCORDING_TO_EXISTING_CAPS_DESCRIPTION:
            'Recommended liquidation thresholds according to existing supply and borrow caps set by the platform.',
        SANDBOX_DESCRIPTION:
            'The sandbox lets you set different Supply and Borrow caps to get liquidation threshold recommendations according to different caps. The tool also provides optimization setting recommendations.',
        UTILIZATION: {
            CURRENT_COLLATERAL_FACTOR: 'Current Liquidation Threshold',
            RECOMMENDED_COLLATERAL_FACTOR: 'Recommended Liquidation Threshold',
        },
    },
    temp: {
        iUSD_initial: 0.1,
    },
}
