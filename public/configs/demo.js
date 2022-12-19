window.APP_CONFIG = {
    PLATFORM_ID: '0',
    TOKEN_PREFIX: 'au',
    BLOCK_EXPLORER: 'https://aurorascan.dev',
    WHITE_LOGO: 'wit-dh.png',
    BLACK_LOGO: 'blk-dh.png',
    feature_flags: {
        alerts: true,
    },
    sections: [
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
            displayName: 'collateral-ratios',
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
        // {
        //   name: 'liquidity',
        //   displayName: '"DEX Liquidity"'
        // }
        // 'backstop',
        // 'assumptions',
        //'qualitative-anlysis',
    ],
}
