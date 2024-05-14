import mongoose from 'mongoose'

var db = null
const dbUtils = {
  db: db,
  init: (
    host = 'localhost',
    user,
    password,
    database = 'wallet-service',
    port = 27017
  ) => {
    if (db === null) {
      let mongoURI
      if (user) {
        mongoURI = `mongodb://${user}:${encodeURIComponent(
          password
        )}@${host}:${port}/${database}?authSource=admin`
      } else {
        mongoURI = `mongodb://${host}:${port}/${database}`
      }
      // console.log("mongoURI .. ", mongoURI)
      mongoose
        .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => {
          console.log('Connected to MongoDB successfully')
        })
        .catch((err) => {
          console.error('Failed to connect to MongoDB:', err)
        })
      db = mongoose.connection
      db.on('error', console.error.bind(console, 'MongoDB error：'))
      db.once('open', () => {
        console.log('Connected to MongoDB successfully')
      })
    }
  },
}

export default dbUtils
