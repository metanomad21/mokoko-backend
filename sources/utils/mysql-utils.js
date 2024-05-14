import mysql from 'mysql2/promise'

var pool = null

async function init(
  host = 'localhost',
  user,
  password,
  database = '',
  port = 3306
) {
  if (!pool) {
    try {
      pool = await mysql.createConnection({
        host: host,
        user: user,
        password: password,
        database: database,
        port: port,
      })

      await pool.connect()
      const [rows] = await pool.execute('SELECT CONNECTION_ID()')
      console.log(
        'Connected to MySQL successfully, Connection ID:',
        rows[0]['CONNECTION_ID()']
      )
    } catch (err) {
      console.error('Failed to connect to MySQL:', err)
      pool = null
    }
  } else {
    console.log('Using existing database connection')
  }
}

async function query(sql, values) {
  if (!pool) {
    throw new Error(
      'Database connection was not created. Ensure init() has been called.'
    )
  }
  try {
    const [rows, fields] = await pool.execute(sql, values)
    return rows
  } catch (err) {
    throw err
  }
}

function format(sql, values) {
  return mysql.format(sql, values)
}

function getPool() {
  return pool
}
 
export default { init, query, format, getPool }
