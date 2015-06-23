/**
 * Created by efthemiosprime on 5/11/2015.
 */


var socketio = require('socket.io');
var io;
var guestNumber =1;
var nickNames={};
var nameUsed=[];
var currentRoom={};


exports.listen = function(server) {
    // start socket.io server, allowing it to piggyback on existing http server
    io = socketio.listen(server);
    io.set ('log level', 1);
    // Define how each user connection will be handled
    io.sockets.on("connection", function(socket) {
        // assign user a guest name when they connect
        guestNumber = assignGuestName(socket, guestNumber, nickNames, nameUsed);

        joinRoom(socket, "Lobby");

        // handle user messages, name change attempts and room creation changesw
        handleMessageBroadcasting(socket, nickNames);
        handleNameChangeAttempts(socket, nickNames, nameUsed);
        handleRoomJoining(socket);

        socket.on('rooms', function(){
            socket.emit('rooms', io.socket.manager.rooms);
        });

        handleClientDisconnection(socket, nickNames, nameUsed);

    });
}

function assignGuestName(socket, guestNumber, nickNames, namesUsed)
{
    var name = 'Guest' + guestNumber;
    nickNames[socket.id] = name;
    socket.emit('nameResult',
        {
            success: true,
            name: name
        }

    );
    namesUsed.push(name);

    return guestNumber + 1;

}

function joinRoom(socket, room) {
    socket.join(room);
    currentRoom[socket.id] = room;
    socket.emit('joinResult', {room: room});
    socket.broadcast.to(room).emit('message', {
        text: nickNames[socket.id] + ' has joined ' + room + '.'
    });

    var usersInRoom = io.sockets.clients(room);
    if(usersInRoom.length>1) {
        var usersInRoomSummary = 'Users current in ' + room + ": ";
        for (var index in usersInRoom) {
            var userSocketId = usersInRoom[index].id;
            if(userSocketId != socket.id) {
                if(index>0) {
                    usersInRoomSummary += ', ';
                }

                usersInRoomSummary += nickNames[userSocketId];
            }
        }

        usersInRoomSummary += ".";
        socket.emit('message', {text:usersInRoomSummary});
    }
}