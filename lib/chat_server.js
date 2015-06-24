/**
 * Created by efthemiosprime on 5/11/2015.
 */


var socketio = require('socket.io');
var io;
var guestNumber =1;
var nickNames={};
var namesUsed=[];
var currentRoom={};


exports.listen = function(server) {
    // start socket.io server, allowing it to piggyback on existing http server
    io = socketio.listen(server);
    io.set ('log level', 1);
    // Define how each user connection will be handled
    io.sockets.on("connection", function(socket) {
        // assign user a guest name when they connect
        guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);

        joinRoom(socket, "Lobby");

        // handle user messages, name change attempts and room creation changesw
        handleMessageBroadcasting(socket, nickNames);
        handleNameChangeAttempts(socket, nickNames, namesUsed);
        handleRoomJoining(socket);

        socket.on('rooms', function(){
            socket.emit('rooms', io.socket.manager.rooms);
        });

        handleClientDisconnection(socket, nickNames, namesUsed);

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

// logic to handle name-request attempts
function handleNameChangeAttempts(socket, nickNames, namesUsed) {
    // add listener for nameAttempt events
    socket.on('nameAttempt', function(name){
        if(name.indexOf('Guest') == 0) {
            socket.emit('nameResult', {
                success:false,
                message: 'Names cannot begin with "Guest".'
            });
        }else {
            // if name isn't already registered, register it
            if(namesUsed.indexOf(name) == -1) {
                var previousName = nickNames[socket.id];
                var previousNameIndex = namesUsed.indexOf(previousName);
                namesUsed.push(name);
                nickNames[socket.id] = name;
                // remove previous name to make available to other clients
                delete namesUsed[previousNameIndex];

                socket.emit('nameResult', {
                    success:true,
                    name: name
                });

                socket.broadcast.to(currentRoom[socket.id]).emit('message', {
                    text: previousName + ' is now known as ' + name + '.'
                });
            }else {
                socket.emit('nameResult', {
                    success:false,
                    message:'That name is already in use.'
                })
            }
        }
    });
}

function handleMessageBroadcasting(socket) {
    socket.on('message', function(message) {
        socket.broadcast.to(message.room).emit('message', {
            text: nickNames[socket.id] + ': ' + message.text
        });
    });
}

// add functionality that allows a user to join an existing room
// if it doesn't exist yet then create it
function handleRoomJoining(socket) {
    socket.on('join', function(room) {
        socket.leave(currentRoom[socket.id]);
        joinRoom(socket, room.newRoom);
    });
}

// remove user's nickname from nickNames and namesUsed when the user leaves the chat application
function handleClientDisconnection(socket) {
    socket.on('disconnect', function() {
        var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
        delete namesUsed[nameIndex];
        delete nickNames[socket.id];
    });
}