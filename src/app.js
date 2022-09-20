const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/mesages');
const { addUser, removeUser, getUser, getUsersInRooom } = require('./utils/users');

const app = express();
const server = http.createServer(app); // create a new server
const io = socketio(server); // configuring socketio to work with our server

// let count = 0;

// io.on() runs when a event occurs, connection event happens on client connection
// socket contains info about the connection
io.on('connection', (socket) => {

    console.log('connected!');

    // listening for a new to join a room
    socket.on('join', ({ username, room }, callback) => {

        const { user, error } = addUser({
            id: socket.id,
            username,
            room
        });

        if (error) {
            return callback(error);
        }

        socket.join(user.room); // joining a room

        socket.emit('newMessage', generateMessage('Admin', 'Welcome, To AR-Chat-App!'));

        socket.broadcast.to(user.room).emit('newMessage', generateMessage('Admin', ` ${user.username} has joined the chat.`)); // broadcast emits an event to every connection except the connection which caused the event to be emitted

        // console.log(user.room, getUsersInRooom(user.room));

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRooom(user.room)
        });
        
        callback();
    });

    socket.on('sendMessage', (message, callback) => {

        const user = getUser(socket.id);

        const filter = new Filter(); // creating a new new instance of filter

        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed!');
        }

        io.to(user.room).emit('newMessage', generateMessage(user.username, message));
        callback(); // Once the callback is called, the event is acknowledeged
    });

    // listens for the client to share location
    socket.on('sendLocation', ({ latitude, longitude }, callback) => {

        const user = getUser(socket.id);

        io.to(user.room).emit('newLocationMessage', generateLocationMessage(user.username, `https://www.google.com/maps/@${latitude},${longitude}`));
        callback();
    })


    // listens for the clinet tp disconnect
    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if (user) {
            io.to(user.room).emit('newMessage', generateMessage('Admin', `${user.username} has left the chat.`));

            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRooom(user.room)
            });
        }
    });

});

const PORT = process.env.PORT || 3000;
const hostname = '127.0.0.1';

const publicDirectoryPath = path.join(__dirname, '../public');
app.use(express.static(publicDirectoryPath));

server.listen(PORT, () => {
    console.log(`server running on http://${hostname}:${PORT}`);
});