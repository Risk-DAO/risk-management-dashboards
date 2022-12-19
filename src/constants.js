export const TOKEN_PREFIX = window.APP_CONFIG.TOKEN_PREFIX
export const BLOCK_EXPLORER = window.APP_CONFIG.BLOCK_EXPLORER
export const COLORS = ['#1095C1', '#9410C1', '#C13C10', '#3CC110', '#1BE470', '#1B2BE4', '#E41B8F', '#E4D41B']

const defaultTexts = {
    ASSET_DISTRIBUTION_DESCRIPTION:
        'The table tracks the main statistics per asset in the platform. Clicking on each row will open a graph describing the expected liquidations according to price changes of the base asset. Liquidations can be executed also if an asset price increases when the asset is the debt asset.',
    WORST_DAY_SIMULATION_DESCRIPTION:
        'Worst day simulation is done according to the worst day price-drop in ETH history. Other assets are being normalized according to their volatility compared to ETH. The simulation takes into consideration the current collateral factors and current users’ usage to present total liquidations and bad debt that would have accrued in the platform. The Max CF is the highest collateral factor that won’t create bad debt for the platform in case the same scenario repeats today',
    UTILIZATION_DESCRIPTION: 'Recommended collateral factors according to current supply and borrow usage',
    TOTAL_DEBT: 'Total Debt',
    COLLATERAL_FACTOR: 'Collateral Factor',
    MAX_COLLATERAL_FACTOR: 'Max Collateral Factor',
    UTILIZATION: {
        ASSET: 'Asset',
        CURRENT_SUPPLY: 'Current Supply',
        CURRENT_BORROW: 'Current Borrow',
        CURRENT_COLLATERAL_FACTOR: 'Current Collateral Factor',
        RECOMMENDED_COLLATERAL_FACTOR: 'Recommended Collateral Factor',
    },
    ACCORDING_TO_EXISTING_CAPS: 'According to Existing Caps',
    ACCORDING_TO_EXISTING_CAPS_DESCRIPTION:
        'Recommended collateral factors according to existing supply and borrow caps set by the platform.',
    ASSET: 'Asset',
    SUPPLY_CAP: 'Supply Cap',
    BORROW_CAP: 'Borrow Cap',
    SANDBOX_DESCRIPTION:
        'The sandbox lets you set different Supply and Borrow caps to get Collateral Factor recommendations according to different caps. The tool also provides optimization setting recommendations.',
    DEX_LIQUIDITY_DESCRIPTION:
        'Monitoring available on-chain DEX liquidity per asset. The statistics monitor the top accounts portion of total liquidity as well as the average and median size of LP positions.',
    DEX_LIQUIDITY_EXPLAINER:
        'Max liquidation size that can be executed with a single transaction according to current available DEX liquidity.',
    COLLATERAL_PIE_CHART_TITLE: 'Collateral',
    DEBT_PIE_CHART_TITLE: 'Debt',
    SIMULATION_ASTERISK: '* Decreasing CF to Max CF is recommended.',
}

export const TEXTS = Object.assign(defaultTexts, window.APP_CONFIG.TEXTS)
