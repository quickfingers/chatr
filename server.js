/**
 * Created by efthemiosprime on 5/11/2015.
 */
var http = require('http');         // built-in module provides http server and client functionality
var fs = require('fs');             // built-in fs module provides filesystem related functionality
var path = require('path');         // built-in path module provides filesystem path-related functionality
var mime = require('mime');         // add-on mime module provides ability to derive a mime type based on a filename extension
var cache = {};                     // cache object is where contents of cached files are stored

// sending file data and error response
function send404(response)
{
    response.writeHead(404, {'Content-Type': 'text/plain'});
    response.write('Error 404: resource not found');
    response.end();
}

// serves file data
function sendFile(response, filePath, fileContents)
{
    response.writeHead(
        200,
        {'Content-Type': mime.lookup(path.basename(filePath))}
    );
    response.end(fileContents);
}

function serveStatic(respponse, cache, absPath)
{
    // check if file is cached in memory
    if(cache[absPath]) {
        //serve file from memory
        sendFile(respponse, absPath, cache[absPath]);
    }else {
        fs.exists(absPath,function(exists) {
            if(exists)
            {
                // read file from disk
                fs.readFile(absPath, function(err, data)
                {
                    if(err) {
                        send404(respponse);
                    }else {
                        cache[absPath] = data;

                        // serve file read from disk
                        sendFile(respponse, absPath, data);
                    }
                });
            }else {
                send404(respponse);
            }
        });
    }
}


// creating the http server, using anonymous function to define pre-request
var server = http.createServer(function(request, response){
    var filePath = false;
    if(request.url == '/') {
        // default
        filePath = 'public/index.html';
    }else {
        // url path to relative path
        filePath = 'public' + request.url;
    }

    var absPath= "./" + filePath;
    serveStatic(response, cache, absPath);
});

var chatServer = require('./lib/chat_server');
chatServer.listen(server);


server.listen(3001, function() {
    console.log("Server is listening to port 3000.");
})