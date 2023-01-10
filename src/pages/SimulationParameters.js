import Box from "../components/Box";
import BoxGrid from "../components/BoxGrid";
import { Component } from "react";
import mainStore from '../stores/main.store';
import { observer } from "mobx-react";

const boxRow = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
    paddingBottom: '10px',
    borderBottom: '1px solid rgba(120, 120, 120, 0.1)'
}

class SimulationParameters extends Component {
    render() {
        const loading = mainStore['lending_platform_current_loading'];
        const data = mainStore['lending_platform_current_data']
        const json_time = data['json_time'];

        return (
            <div>
                        <BoxGrid>
                            <Box loading={loading} time={json_time}>
                                <boxRow><div style={boxRow}>Liquidation Incentive: {data['liquidationIncentive']}</div></boxRow>
                                <boxRow><div style={boxRow}>Protocol Fee Incentive: {data['protocolFees']}</div></boxRow>
                                <boxRow><div style={boxRow}>Liquidation Delay: {data['liquidationDelay'].join(',')}</div></boxRow>
                                <boxRow><div style={boxRow}>Additional Liquidation Incentive: {data['magicNumber']}</div></boxRow>
                            </Box>
                        </BoxGrid>
                        <div style={boxRow} >
                        </div>

            </div>
        )
    }
}

export default observer(SimulationParameters)