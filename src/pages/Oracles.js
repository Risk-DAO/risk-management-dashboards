import Box from "../components/Box";
import { Component } from "react";
import DataTable from 'react-data-table-component';
import Ramzor from '../components/Ramzor';
import Token from '../components/Token';
import mainStore from '../stores/main.store';
import { observer } from "mobx-react";

const percentFrom = (base, num) => {
  if (base <= 0 || num <= 0) {
    return "N/A";
  }
  if(base ==="NaN" || num === "NaN"){
    return "N/A";
  }
  const percent = ((num / base) * 100) - 100
  return <Ramzor 
    yellow={percent > 2 || percent < -2} 
    red={percent >5 || percent < -5}>
      {percent.toFixed(2)}%
    </Ramzor>
}

const columns = [
  {
      name: 'Asset',
      selector: row => row.key,
      format: row => <Token value={row.key}/>,
      sortable: true,
  },
  {
      name: 'Platform’s Oracle Price ',
      selector: row => row.oracle,
      sortable: true,
  },  
  {
      name: 'CEX Price',
      selector: row => row.cex_price,
      format: row => percentFrom(row.oracle, row.cex_price),
      sortable: true,
  },  
  {
      name: 'DEX Price',
      selector: row => row.dex_price,
      format: row => percentFrom(row.oracle, row.dex_price),
      sortable: true,
  },  
];

class Oracles extends Component {
  render (){
    const loading = mainStore['oracles_loading']
    const rawData = Object.assign({}, mainStore['oracles_data'] || {})
    const {json_time} = rawData
    if(json_time){
      delete rawData.json_time
    }
    const data = !loading ? Object.entries(rawData)
    .filter(([k, v])=> k !== window.APP_CONFIG.STABLE || "")
    .map(([k, v])=> {
      v.key = k
      return v
    }) : []

    return (
      <div>
        <Box loading={loading} time={json_time}>
          {!loading && <DataTable
              columns={columns}
              data={data}
          />}
        </Box>
      </div>
    )
  }
}

export default observer(Oracles)