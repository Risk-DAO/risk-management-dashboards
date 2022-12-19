window.APP_CONFIG = {
    API_URL: 'https://api-staging.riskdao.org',
    PLATFORM_ID: '2',
    TOKEN_PREFIX: '',
    BLOCK_EXPLORER: 'https://arbiscan.io',
    WHITE_LOGO: 'vesta.svg',
    BLACK_LOGO: 'vesta.svg',
    SOLVER: 'solver_vesta',
    STABLE: 'VST',
    feature_flags: {
        alerts: true,
        loopingToggle: false,
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
        {
            name: 'collateral-factors',
            displayName: 'collateral ratios',
        },
        {
            name: 'sandbox',
        },
        {
            name: 'asset-distribution',
            defaultVisible: true,
        },
        {
            name: 'stability-pool',
        },
        {
            name: 'open-liquidations',
        },
        {
            name: 'oracle-deviation',
        },
        {
            name: 'liquidity',
            displayName: 'DEX Liquidity',
        },
        // 'backstop',
        // 'assumptions',
        //'qualitative-anlysis',
    ],
    TEXTS: {
        ASSET_DISTRIBUTION_DESCRIPTION:
            'The table tracks the main statistics per asset in the platform. Clicking on each row will open a graph describing the expected liquidations according to price changes of the collateral asset.',
        WORST_DAY_SIMULATION_DESCRIPTION:
            'Worst day simulation is done according to the worst day price-drop in ETH history. Other assets are being normalized according to their volatility compared to ETH. The simulation considers the current MCRs and users’ usage to present total liquidations and bad debt that would have accrued in the platform. The LCR is the lowest collateral ratio that won’t create bad debt for the platform in case the same scenario repeats today.',
        UTILIZATION_DESCRIPTION: 'Recommended MCRs according to current collateral and borrow usage.',
        TOTAL_DEBT: 'Total VST Debt',
        COLLATERAL_FACTOR: 'Collateral Ratio',
        MAX_COLLATERAL_FACTOR: 'Lowest Collateral Ratio',
        UTILIZATION: {
            ASSET: 'Vault',
            CURRENT_SUPPLY: 'Current Minted VST',
            CURRENT_BORROW: 'VST in Stability Pool',
            CURRENT_COLLATERAL_FACTOR: 'Current Collateral Factor',
            RECOMMENDED_COLLATERAL_FACTOR: 'Recommended Collateral Factor',
        },
        ACCORDING_TO_EXISTING_CAPS: 'According to Existing Mint Caps',
        ACCORDING_TO_EXISTING_CAPS_DESCRIPTION: 'Recommended MCRs according to existing mint caps.',
        ASSET: 'Vault',
        SUPPLY_CAP: 'VST Mint Cap',
        SANDBOX_DESCRIPTION:
            'The sandbox lets you set different Mint caps, Stability Pools size, and B.AMM percentage of the Stability Pool, to get MCR recommendations according to different caps. The tool also provides optimization setting recommendations.',
    },
}
