const { ConnectDB } = require("./connectDB");
const axios = require("axios");
const nodecron = require("node-cron");
const https = require("https");
const fs = require("fs");
const path = require('path');
const moment = require('moment');

const AutoRequestAPI = async () => {
  const branch = ["BWC", "BS", "CY", "KC", "KKF", "NR"];
  const branchPMII = ["BW", "BS", "CY", "KC", "KK", "NR"];
  // const branch = ["BS"];
  // const branchPMII = ["BS"];
  let nowdt = moment();//new Date();

  for (let index = 0; index < branch.length; index++) {

    let sql = "";
    let send_pps = {
      KKF_RefId: "",
      PMII: [],
    };

    let url = `https://pmii.kkfnets.com/pmii/api_timebase/api.php?branch=${branchPMII[index]
      }&y=${Number(nowdt.format("YYYY"))}`;

    const pool = new ConnectDB(branch[index], "REALTIMETORBRANCH");
    let result = await (
      await (await pool.conn().connect())
        .request()
        .query(`SELECT * FROM [RealTimeTorBranch].[dbo].[tb_planPmii] where YEAR(pm_machine_stop_plan) = YEAR(GETDATE()) and MONTH(pm_machine_stop_plan) >= MONTH(GETDATE()) order by date_insert desc`)
    ).recordset;
    //console.log(result);

    const poolCenter = new ConnectDB("CENTER", "PLCORDERWOVENMCIDIP");
    const mcid_pmii = await (
      await (await poolCenter.conn().connect()).request()
        .query(`SELECT a.mcid,a.mcid_PMII,b.branch_name FROM  [PLCorderwoven_mcidip].[dbo].[PLCipaddress_mcid] as a inner join [PLCorderwoven_mcidip].[dbo].[PLCbranch] as b
    ON a.branch_id = b.branch_id where b.branch_name = '${branch[index]}'`)
    ).recordset;
    //console.log(mcid_pmii)

    const result_api = await axios({
      url: url,
      method: "GET",
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    })
      .then((result) => {
        return result.data;
      })
      .catch((err) => {
        console.log(err);
        return [];
      });

    // result_api = {
    //   data:[
    //   {"branch":"BW","MCID_PMII":"BW-WDC-WLD-069","pm_time":"2022-11-04","Operation_time_PM":"0","time_create":"2022-11-04","ID_plan":"PM-BW-WDC-WLD-069-W3-ME-IN-1"}
    // ]}
    //result_api = JSON.parse(result_api);

    //console.log(result_api.data.length)
    //console.log("============================================================= result")
    //console.log(result);
    // console.log("============================================================= result_api")
    // console.log(result_api)
    //console.log("============================================================= mcid_pmii")
    //console.log(mcid_pmii)
    //console.log("nowdt.format('YYYY')",Number(nowdt.format('YYYY')));

    if ("data" in result_api && result_api.data.length > 0) {
      for (let key in result_api.data) {

        let time_create = moment(result_api.data[key].time_create)
        let dt_pm_time = moment(result_api.data[key].pm_time)
        let Operation_time_PM = Number(result_api.data[key].Operation_time_PM);

        if (Number(dt_pm_time.format('YYYY')) === Number(nowdt.format('YYYY')) && Number(dt_pm_time.format('MM')) >= Number(nowdt.format('MM')) && Operation_time_PM > 0) {
          //ค้นหาข้อมูลในฐานข้อมูลซ้ำกับ API หรือไม่ ถ้าไม่มีในฐานข้อมูลจะ return undefined
          let _result = result.find((item) => {
            let dt_pm_time = moment(result_api.data[key].pm_time);//new Date(result_api.data[key].pm_time);
            if (
              item.ID_plan === result_api.data[key].ID_plan &&
              moment(item.pm_machine_stop_plan).format("YYYY-MM-DD") === dt_pm_time.format("YYYY-MM-DD")
            ) {
              return item;
            }
          });

          //ถ้า API ไม่มีข้อมูลในฐานข้อมูล
          if (_result === undefined) {
            let map_pmii = mcid_pmii.find(
              (item) => item.mcid_PMII === result_api.data[key].MCID_PMII
            );

            //กรองเอาเฉพาะเครื่องทอ
            if (map_pmii !== undefined) {
              sql += `INSERT INTO [dbo].[tb_planPmii]([ID_plan],[mcid],[mcid_pmii],[pm_machine_stop_plan],[Operation_time_pm],[date_create_plan],[date_insert],[date_update]) VALUES('${result_api.data[key].ID_plan
                }','${map_pmii === undefined ? "" : map_pmii.mcid}','${result_api.data[key].MCID_PMII
                }','${result_api.data[key].pm_time}','${result_api.data[key].Operation_time_PM
                }','${result_api.data[key].time_create}',GETDATE(),GETDATE());\n`;

              let pm_time = moment(result_api.data[key].pm_time);//new Date(result_api.data[key].time_create);

              //ตรวจสอบเวลา >= 360 นาที
              if (
                Number(result_api.data[key].Operation_time_PM) >= 360 &&
                Number(pm_time.format("YYYY")) >= Number(nowdt.format('YYYY'))
              ) {
                //ให้เตรียมข้อมูลเพื่อส่ง API
                if (
                  map_pmii !== undefined &&
                  map_pmii.mcid !== "" &&
                  map_pmii.mcid !== null
                ) {
                  send_pps.PMII.push({
                    BranchCode: branch[index],
                    DateStopMachine: result_api.data[key].pm_time,
                    MCId: map_pmii.mcid,
                    DateStartMachine: "",
                    PMTime: result_api.data[key].Operation_time_PM,
                  });
                }
              }
            }
          }
          else {
            sql += `UPDATE [dbo].[tb_planPmii] SET [pm_machine_stop_plan] = '${result_api.data[key].pm_time}',[Operation_time_pm] = '${result_api.data[key].Operation_time_PM}',[date_create_plan] = '${result_api.data[key].time_create}',[date_update] = GETDATE() WHERE [ID_plan] = '${_result.ID_plan}' and [pm_machine_stop_plan] = '${moment(result_api.data[key].pm_time).format("YYYY-MM-DD")}';\n`;
          }
        }
      }
    }

    if (result.length > 0) {
      for (let key in result) {
        const findDataInApi = result_api.data.find((item) => {
          if (item.ID_plan === result[key].ID_plan && moment(item.pm_time).format("YYYY-MM-DD") === moment(result[key].pm_machine_stop_plan).format("YYYY-MM-DD")) {
            return item
          }
        });

        if (findDataInApi === undefined) {
          sql += `Delete FROM [RealTimeTorBranch].[dbo].[tb_planPmii] where ID_plan = '${result[key].ID_plan}' and pm_machine_stop_plan = '${moment(result[key].pm_machine_stop_plan).format("YYYY-MM-DD")}';`
        }
      }
    }


    //ส่ง API ไปยัง App PPS
    if (send_pps.PMII.length > 0) {
      // generated KKF-Key
      let datenow = new Date();
      const key = `KKF-${datenow.getDate()}${datenow.getMonth() + 1
        }${datenow.getFullYear()}${datenow.getHours()}${datenow.getMinutes()}${datenow.getSeconds()}`;

      send_pps.KKF_RefId = key;

      // let path1 = path.join(__dirname,`/fileAPI_json`, `${branch[index]}.json`);

      // fs.writeFile(path1, JSON.stringify(send_pps), err => {
      //   if (err) {
      //     console.error(err);
      //   }
      //   console.log(`File created! ${branch[index]}`);
      // });

      //console.log(send_pps);
      //console.log(send_pps.PMII.length);

      const sendAPI = await axios({
        url: "https://prdplantest.kkfnets.com/api/plc/pm",
        method: "POST",
        data: send_pps,
        responseType: 'json',
        headers: {
          'VendorID': 't4y3hhy7sjpjstfp4erj7gvxrhxv4xrku93qa8b8s4jx2r5h69c33qpqrfw45y3g',
          'AuthKey': 'gbtwtxp3mv73esb3qa3x8v56mmxx34zzrmw5cgbx2wthuhnkjsp3ydye3kxvwtjh',
        }
      })
        .then(async function (response) {
          console.log(response.status)
          console.log(response.data)
          await (await pool.conn().connect())
            .request()
            .query(`INSERT INTO [dbo].[tb_planPmii_API_log]([log_status],[log_datetime]) VALUES('success API',GETDATE());`
            );
          return response;
        })
        .catch(function (error) {
          console.log(error);
        });
    }


    if (sql !== "") {
      const result_query = await (await pool.conn().connect())
        .request()
        .query(sql);
      if (result_query.rowsAffected.length > 0) {
        console.log("success");
        await (await pool.conn().connect())
          .request()
          .query(
            `INSERT INTO [dbo].[tb_planPmii_API_log]([log_status],[log_datetime]) VALUES('success',GETDATE());`
          );
      } else {
        console.log("fail");
        await (await pool.conn().connect())
          .request()
          .query(
            `INSERT INTO [dbo].[tb_planPmii_API_log]([log_status],[log_datetime]) VALUES('fail',GETDATE());`
          );
      }
    } else {
      console.log("no data");
      await (await pool.conn().connect())
        .request()
        .query(
          `INSERT INTO [dbo].[tb_planPmii_API_log]([log_status],[log_datetime]) VALUES('no data',GETDATE());`
        );
    }

  }
};

//AutoRequestAPI();

nodecron.schedule(
  "59 11 * * *",
  () => {
    AutoRequestAPI();
    console.log("Load data pmii to Database success");
  },
  {
    scheduled: true,
    timezone: "Asia/Bangkok",
  }
);

nodecron.schedule(
  "59 19 * * *",
  () => {
    AutoRequestAPI();
    console.log("Load data pmii to Database success");
  },
  {
    scheduled: true,
    timezone: "Asia/Bangkok",
  }
);

console.log("Start App...");
