require("dotenv").config()

const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const cors = require("cors")

const socketHandler = require("./socket/socketHandler")

const app = express()
app.use(cors())

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: "*",
  },
})

socketHandler(io)

const PORT = process.env.PORT || 5000

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
