import config from './config.json';
import Mysql from 'mysql2';

const pool = Mysql.createPool(config.database).promise();

async function sqlQuery(sql: string, params: any) : Promise<any> {
    let conn;
    try {
        conn = await pool.getConnection();
        return conn.query(sql, params);
    } finally {
        conn?.release();
    }
};

export { sqlQuery }
