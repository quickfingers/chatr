/**
 * Created by efthemiosprime on 5/11/2015.
 */

function divEscapedContentElement(message) {
    return $('<div></div>').text(message);
}


function divSystemContentElement(message) {
    return $("<div></div>").html('<i>' + message + '</i>');
}

// processing raw user input
function processUserInput(chatApp, socket) {
    var message = $('#send-message').val();
    var systemMessage;
    if(message.charAt(0) == '/') {

        systemMessage = chatApp.processCommand(message);
        if(systemMessage) {
            $('#messages').append(divSystemContentElement(systemMessage));
        }
    }else {
        chatApp.sendMessage($("#room").text(), message);
        $("#messages").append(divEscapedContentElement(message));
        $("#messages").scrollTop($("#messages").prop("scrollHeight"));
    }

    $("#send-message").val('');
}

// client-side application intialization logic
var socket = io.connect();

$(document).ready(function(){
    var chatApp = new Chat(socket);

    // display result of a name-change attempt
    socket.on('nameResult', function (result){
        var message;
        if(result.success) {
            message = "You are now known as " + result.name + ".";

        }else {
            message = result.message;

        }
        $("#messages").append(divSystemContentElement(message));
    });

    // display result of a room change
    socket.on('joinResult', function(result){
        $("#room").test(result.room);
        $("#messages").append(divSystemContentElement("Room changes."))
    });

    // display received messages
    socket.on('message', function(){
        var newElement = $('<div></div>').text(message.text);
        $('#messages').append(newElement);
    });

    // display list of rooms available
    socket.on('rooms', function(rooms){
        $("#room-list").empty();

        for(var room in rooms) {
            room = room.substring(1, room.length);
            if(room != '') {
                $("#room-list").append(divEscapedContentElement(room));
            }
        }

        $("#room-list div").click(function(){
            chatApp.processCommand('/join ' + $(this).text());
            $('#send-message').focus();
        });
    });

    setInterval(function(){
        socket.emit('rooms');
    }, 1000);

    $("#send-message").focus();

    $("#send-form").submit(function() {
        processUserInput(chatApp, socket);
        return false;
    });
});