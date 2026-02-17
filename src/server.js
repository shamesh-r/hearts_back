require("dotenv").config()

const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const cors = require("cors")
const socketHandler = require("./socket/socketHandler")

const app = express()
const PORT = process.env.PORT || 5000
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173"

app.use(
  cors({
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  })
)

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
})

socketHandler(io)

app.get("/", (_req, res) => {
  res.send("Socket server is running")
})

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Socket CORS origin: ${FRONTEND_URL}`)
})
