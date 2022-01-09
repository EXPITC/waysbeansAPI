const express = require('express');
const app = express();
const port = process.env.PORT
const router = require('./src/routers')


const cors = require('cors')
const http = require('http')
const {Server} = require('socket.io')
// const socketIo =  require('./src/socket')

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
      origin: `${process.env.FRONTEND}`
  }
})

require('./src/socket')(io)



app.use(express.json());
app.use(cors());
app.use('/img', express.static('./uploads/img'))
app.use('/api/v1/', router)
server.listen(port , ()=>{console.log(`listen port ${port}`)})