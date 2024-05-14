import mysql from 'mysql2/promise';

// Define types for the connection and pool
type Pool = mysql.Connection;

let pool: Pool | null = null;

async function init(
  host: string = 'localhost',
  user: string,
  password: string,
  database: string = '',
  port: number = 3306
): Promise<void> {
  if (!pool) {
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
}

async function query(sql: string, values?: any[]): Promise<any> {
  if (!pool) {
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
}

function format(sql: string, values: any[]): string {
  return mysql.format(sql, values);
}

function getPool(): Pool | null {
  return pool;
}

export default { init, query, format, getPool };