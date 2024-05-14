import grpc from '@grpc/grpc-js'

const server = new grpc.Server()
const grpcUtils = {
  server: server,
  init: (port) => {
    server.bindAsync(
      '0.0.0.0:' + port,
      grpc.ServerCredentials.createInsecure(),
      () => {
        server.start()
      }
    )
  },
}

export default grpcUtils
