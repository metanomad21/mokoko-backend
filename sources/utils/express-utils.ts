import express, { Express } from 'express'
import { Server } from 'http';

const app: Express = express()

const expressUtils = {
  app: app,
  init: (port: number): void => {
    const httpServer: Server = app.listen(port, () => {
      const address = httpServer.address();
      const host = typeof address === 'string' ? address : address?.address;
      const port = typeof address === 'string' ? null : address?.port;
      console.log('Http app listening at', host, port)
    })
    app.use(express.json())
  },
}

export default expressUtils