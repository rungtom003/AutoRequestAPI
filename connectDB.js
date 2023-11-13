const sql = require("mssql");
require('dotenv').config();

class ConnectDB {
  constructor(branch, dbName) {
    const {
      DB_NAME_CONNECT,
      DB_IP_CONNECT_BWC,
      DB_IP_CONNECT_BS,
      DB_IP_CONNECT_CY,
      DB_IP_CONNECT_KC,
      DB_IP_CONNECT_KKF,
      DB_IP_CONNECT_NR,
      DB_IP_CONNECT_CENTER,
      DB_NAME_CONNECT_PLC,
      DB_IP_CONNECT_MY
    } = process.env

    this.checkBranch = false;
    this.DB_IP_CONNECT = "";
    this.branch = branch.toUpperCase();
    this.dbName = dbName.toUpperCase();
    this.databaseName = ""

    switch (this.branch) {
      case "BWC":
        this.checkBranch = true;
        this.DB_IP_CONNECT = DB_IP_CONNECT_BWC;
        break;
      case "BS":
        this.checkBranch = true;
        this.DB_IP_CONNECT = DB_IP_CONNECT_BS;
        break;
      case "CY":
        this.checkBranch = true;
        this.DB_IP_CONNECT = DB_IP_CONNECT_CY;
        break;
      case "KC":
        this.checkBranch = true;
        this.DB_IP_CONNECT = DB_IP_CONNECT_KC;
        break;
      case "KKF":
        this.checkBranch = true;
        this.DB_IP_CONNECT = DB_IP_CONNECT_KKF;
        break;
      case "NR":
        this.checkBranch = true;
        this.DB_IP_CONNECT = DB_IP_CONNECT_NR;
        break;
      case "CENTER":
        this.checkBranch = true;
        this.DB_IP_CONNECT = DB_IP_CONNECT_CENTER;
        break;
      case "MY":
        this.checkBranch = true;
        this.DB_IP_CONNECT = DB_IP_CONNECT_MY;
        break;
      default:
        this.checkBranch = false;
        this.DB_IP_CONNECT = DB_IP_CONNECT_BWC;
    }
    switch (this.dbName) {
      case "REALTIMETORBRANCH":
        this.databaseName = DB_NAME_CONNECT_PLC
        break;
      default:
        break;
    }
  }
  conn() {

    const {
      DB_USER,
      DB_PASSWORD,
    } = process.env

    if (this.DB_IP_CONNECT !== "") {

      const sqlConfig = {
        user: DB_USER,
        password: DB_PASSWORD,
        database: this.databaseName,
        server: this.DB_IP_CONNECT,
        requestTimeout : 30000,
        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000
        },
        options: {
          encrypt: false, // for azure
          trustServerCertificate: true // change to true for local dev / self-signed certs
        }
      }
      const pool = new sql.ConnectionPool(sqlConfig)
      return pool
    } else {
      return null
    }

  }
}
module.exports = { ConnectDB }