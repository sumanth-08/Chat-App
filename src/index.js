const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const express = require('express')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, getUser, removeUser, getUserRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)



const port = process.env.PORT || 3000

const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

// let count = 0

io.on('connection', (socket) => {
     console.log('new web connection')

     socket.on('join', (options, callback) => {
      const { error, user } = addUser({id: socket.id, ...options })

      if (error){
         return callback(error)
      }

      socket.join(user.room)

      socket.emit('message', generateMessage(`Welcome! ${user.username}`))
      socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined!`))
      io.to (user.room).emit('roomData', {
         room:user.room,
         users: getUserRoom(user.room)
      })

      callback()
     })

     socket.on('sendMessage', (message, callback) => {
      const user = getUser(socket.id)
      const filter = new Filter()

        if (filter.isProfane(message)){
            return callback('bad words are not allowed')
        }
        
        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
     })

     socket.on('disconnect', () => {
      const user = removeUser(socket.id)
      if (user) {
         io.to(user.room).emit('message', generateMessage(`${user.username} left`))
         io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUserRoom(user.room)
         })

      }
     })

     socket.on('sendLocation', (coords, callback) => {
      const user =getUser(socket.id)
        io.emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()

     })

    //  socket.emit('countUpadated', count)

    //  socket.on('increment', () => {
    //     count++
    //     // socket.emit('countUpdated', count)
    //     io.emit('countUpdated', count)
    //  })
})

server.listen(port, () => {
    console.log(`servere is up on the port ${port}`)
})

