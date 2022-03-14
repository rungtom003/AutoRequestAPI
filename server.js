import {
    ConnectDB
} from "./connectDB";
import axios from "axios";
import nodecron from "node-cron"

const AutoRequestAPI = async () => {
    // const branch = ["BWC","BS","CY","KC","KKF","NR"];
    // const branchPMII = ["BW","BS","CY","KC","KK","NR"];
    const branch = ["BWC"];
    const branchPMII = ["BW"];

    for (let index = 0; index < branch.length; index++) {
        let sql = "";
        let url = `https://pmii.kkfnets.com/pmii/api_timebase/api.php?branch=${branchPMII}`;
        const pool = new ConnectDB(branch[index], "REALTIMETORBRANCH");
        const result = await (
            await (await pool.conn().connect())
            .request()
            .query(`SELECT * FROM [RealTimeTorBranch].[dbo].[tb_planPmii]`)
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
            })
            .then((result) => {
                return result.data;
            })
            .catch((err) => {
                console.log(err);
                return [];
            });
        if (result_api.data.length > 0) {
            for (let key in result_api.data) {
                let _result = result.find(
                    (item) => item.ID_plan === result_api.data[key].ID_plan
                );
                if (_result === undefined) {
                    let map_pmii = mcid_pmii.find((item) =>item.mcid_PMII === result_api.data[key].MCID_PMII);
                    sql += `INSERT INTO [dbo].[tb_planPmii]([ID_plan],[mcid],[mcid_pmii],[pm_machine_stop_plan],[Operation_time_pm],[date_create_plan],[date_insert],[date_update]) VALUES('${result_api.data[key].ID_plan}','${map_pmii===undefined?"":map_pmii.mcid}','${result_api.data[key].MCID_PMII}','${result_api.data[key].pm_time}','${result_api.data[key].Operation_time_PM}','${result_api.data[key].time_create}',GETDATE(),GETDATE());\n`;
                } else {
                    sql += `UPDATE [dbo].[tb_planPmii] SET [pm_machine_stop_plan] = '${result_api.data[key].pm_time}',[Operation_time_pm] = '${result_api.data[key].Operation_time_PM}',[date_create_plan] = '${result_api.data[key].time_create}',[date_update] = GETDATE() WHERE [ID_plan] = '${_result.ID_plan}';\n`
                }
            }
        }
        const result_query = await (await pool.conn().connect()).request().query(sql);
        if (result_query.rowsAffected.length > 0) {
            console.log("success")
            await (await pool.conn().connect()).request().query(`INSERT INTO [dbo].[tb_planPmii_API_log]([log_status],[log_datetime]) VALUES('success',GETDATE());`);
        } else {
            console.log("fail")
            await (await pool.conn().connect()).request().query(`INSERT INTO [dbo].[tb_planPmii_API_log]([log_status],[log_datetime]) VALUES('fail',GETDATE());`);
        }
    }
};

nodecron.schedule('59 11 * * *', () => {
    AutoRequestAPI();
    console.log("Load data pmii to Database success")
});

nodecron.schedule('59 19 * * *', () => {
    AutoRequestAPI();
    console.log("Load data pmii to Database success")
});