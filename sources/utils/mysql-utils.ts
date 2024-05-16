import mysql, { Connection } from 'mysql2/promise'; 
 
// 类型定义 
type Pool = Connection | null; 
 
let pool: Pool = null; 
 
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
        pool = await mysql.createConnection({ 
          host: host, 
          user: user, 
          password: password, 
          database: database, 
          port: port, 
        }); 
 
        await pool.connect(); 
        const [rows]: [any[], mysql.FieldPacket[]] = await pool.execute('SELECT CONNECTION_ID()'); 
        console.log( 
          'Connected to MySQL successfully, Connection ID:', 
          rows[0]['CONNECTION_ID()'] 
        ); 
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
      const [rows]: [any[], mysql.FieldPacket[]] = await pool.execute(sql, values); 
      return rows; 
    } catch (err) { 
      throw err; 
    } 
  }, 
 
  format: (sql: string, values: any[]): string => { 
    return mysql.format(sql, values); 
  }, 
 
  getPool: (): Pool => { 
    return pool; 
  }, 
}; 
 
export default mysqlUtils;