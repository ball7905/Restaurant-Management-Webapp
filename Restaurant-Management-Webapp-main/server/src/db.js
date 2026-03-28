import sql from "mssql";

// MSSQL connection settings
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    trustServerCertificate: true,
  },
};

export const pool = new sql.ConnectionPool(config); //can have multiple connections
export const poolConnect = pool.connect();
