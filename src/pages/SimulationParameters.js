import Box from "../components/Box";
import { Component } from "react";
import DataTable from "react-data-table-component";
import mainStore from '../stores/main.store';
import { observer } from "mobx-react";

const columns = [
    {
        name: 'Parameter',
        selector: row => row.key,
        format: row => row.key,
        sortable: true,
    },
    {
      name: 'Value',
      selector: row => row.value,
      format: row => row.value,
    }
  ];

class SimulationParameters extends Component {
    render() {
        const loading = mainStore['lending_platform_current_loading'];
        const data = mainStore['lending_platform_current_data']
        const json_time = data['json_time'];
        const tableData = [];
        if(!loading){
            tableData.push({
                key: 'Liquidation Incentive',
                value: Math.round((Number(data['liquidationIncentive']) - 1)*100)/100
            })
            tableData.push({
                key: 'Protocol Fee Incentive',
                value: data['protocolFees']
            })
            tableData.push({
                key: 'Additional Liquidation Incentive',
                value: data['magicNumber']
            })
            tableData.push({
                key: 'Liquidation Delay (minute(s))',
                value: data['liquidationDelay'].join(', ')
            })
        }

        return (
            <div>
        <Box loading={loading}  time={json_time}>
          <hgroup>
            <h6>Simulation Parameters</h6>
            <p className="description">These are the current simulation parameters.</p>
          </hgroup>
          {!loading && <DataTable
              columns={columns}
              data={tableData}
          />}
        </Box>
            </div>
        )
    }
}

export default observer(SimulationParameters)