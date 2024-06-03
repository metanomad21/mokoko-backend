import mysql, { Pool, FieldPacket } from 'mysql2/promise';

// 初始化连接池
let pool: Pool | null = null;

const mysqlUtils = {
  init: async (
    host: string = 'localhost',
    user: string,
    password: string,
    database: string = '',
    port: number = 3306
  ): Promise<void> => {
    if (pool === null) {
      try {
        pool = mysql.createPool({
          host: host,
          user: user,
          password: password,
          database: database,
          port: port,
          connectionLimit: 80,
        });

        // 测试连接是否成功
        const connection = await pool.getConnection();
        const [rows, fields]: [any[], FieldPacket[]] = await connection.execute('SELECT CONNECTION_ID()');
        console.log(
          'Connected to MySQL successfully, Connection ID:',
          rows[0]['CONNECTION_ID()']
        );
        connection.release();
      } catch (err) {
        console.error('Failed to connect to MySQL:', err);
        pool = null;
      }
    } else {
      console.log('Using existing database connection');
    }
  },

  query: async (sql: string, values?: any[]): Promise<any> => {
    if (pool === null) {
      throw new Error(
        'Database connection was not created. Ensure init() has been called.'
      );
    }
    try {
      const [rows, fields]: [any[], FieldPacket[]] = await pool.execute(sql, values);
      return rows;
    } catch (err) {
      throw err;
    }
  },

  format: (sql: string, values: any[]): string => {
    return mysql.format(sql, values);
  },

  getPool: (): Pool | null => {
    return pool;
  },
};

export default mysqlUtils;
