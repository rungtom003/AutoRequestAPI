const cron = require('node-cron');
const axios = require("axios");
const {ConnectDB} = require("./connectDB");
const moment = require("moment");

// //ทำงานทุกๆ 2 นาที
// cron.schedule('*/2 * * * *', () => {
//     console.log('running a task every two minutes */2 * * * *');
//   });

// cron.schedule('25 13 * * *', () => {
//   console.log("Load data pmii to Database success")
// }, {
//   scheduled: true,
//   timezone: "Asia/Bangkok"
// });

// const pool = new ConnectDB("KC", "REALTIMETORBRANCH");
// pool.conn().connect(function (err) {
//   if (err) {
//     console.log(err);
//   } else {
//     console.log("Connected");
//   }
// });
let nowdt = moment()
let result_api = {
    data:[{"branch":"BW","MCID_PMII":"BW-WDC-WFM-EE-002","pm_time":"2022-02-12","Operation_time_PM":"0","time_create":"1970-01-01","ID_plan":"PM-BW-WDC-WFM-EE-002-M1-EE-IN-1"},{"branch":"BW","MCID_PMII":"BW-WDC-WLD-001","pm_time":"2022-03-01","Operation_time_PM":"25920","time_create":"2022-02-14","ID_plan":"PM-BW-WDC-WLD-001-Y3-BW-PM-1"}]
  }
let databaseResult = [{"branch":"BW","MCID_PMII":"BW-WDC-WXD-067","pm_time":"2022-03-01","Operation_time_PM":"0","time_create":"2022-10-04","ID_plan":"PM-BW-WDC-WLD-001-Y3-BW-PM-2"}]

  // for (let key in result_api.data) {
  //   let time_create = moment(result_api.data[key].time_create)
  //   let dt_pm_time = moment(result_api.data[key].pm_time)
  //   if (Number(time_create.format('YYYY')) === Number(nowdt.format('YYYY')) && Number(dt_pm_time.format('MM')) >= Number(nowdt.format('MM'))) {
  //       let result = databaseResult.find((item)=>{
  //         if(item.ID_plan ===result_api.data[key].ID_plan && item.pm_time ===result_api.data[key].pm_time)
  //         {
  //           return item;
  //         }
  //       })
  //       console.log(result)
  //   }
  // }

  for(let key in databaseResult)
  {
    const result = result_api.data.find((i)=>{
      if(i.ID_plan === databaseResult[key].ID_plan && i.pm_time === databaseResult[key].pm_time)
      {
        return i;
      }
    })
    console.log(result)
  }