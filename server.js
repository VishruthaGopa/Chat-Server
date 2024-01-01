/*server.js file*/
const server = require('http').createServer(handler)
const io = require('socket.io')(server) //wrap server app in socket io capability
const fs = require('fs') //file system to server static files
const url = require('url'); //to parse url strings
const PORT = process.argv[2] || process.env.PORT || 3000 //useful if you want to specify port through environment variable
                                                         //or command-line arguments

const ROOT_DIR = 'html' //dir to serve static files from

const MIME_TYPES = {
  'css': 'text/css',
  'gif': 'image/gif',
  'htm': 'text/html',
  'html': 'text/html',
  'ico': 'image/x-icon',
  'jpeg': 'image/jpeg',
  'jpg': 'image/jpeg',
  'js': 'application/javascript',
  'json': 'application/json',
  'png': 'image/png',
  'svg': 'image/svg+xml',
  'txt': 'text/plain'
}

function get_mime(filename) {
  for (let ext in MIME_TYPES) {
    if (filename.indexOf(ext, filename.length - ext.length) !== -1) {
      return MIME_TYPES[ext]
    }
  }
  return MIME_TYPES['txt']
}

server.listen(PORT) //start http server listening on PORT

function handler(request, response) {
  //handler for http server requests including static files
  let urlObj = url.parse(request.url, true, false)
  console.log('\n============================')
  console.log("PATHNAME: " + urlObj.pathname)
  console.log("REQUEST: " + ROOT_DIR + urlObj.pathname)
  console.log("METHOD: " + request.method)

  let filePath = ROOT_DIR + urlObj.pathname
  if (urlObj.pathname === '/') filePath = ROOT_DIR + '/index.html'

  fs.readFile(filePath, function(err, data) {
    if (err) {
      //report error to console
      console.log('ERROR: ' + JSON.stringify(err))
      //respond with not found 404 to client
      response.writeHead(404);
      response.end(JSON.stringify(err))
      return
    }
    response.writeHead(200, {
      'Content-Type': get_mime(filePath)
    })
    response.end(data)
  })

}

const connectedUsers = {}; // Store connected users

function extractRecipientAndMessage(message){
  const colonIndex = message.indexOf(':');

  if (colonIndex !== -1) {
    const recipient = message.substring(0, colonIndex).trim();
    const messageContent = message.substring(colonIndex + 1).trim();
    return { recipient, messageContent };
  } else {
    // No colon found, treat the whole message as the message content.
    return { recipient: '', messageContent: message.trim() };
  }

}



//Socket Server
io.on('connection', function(socket) {
  console.log('client connected')
  //console.dir(socket)
  //socket.emit('serverSays', 'You are connected to CHAT SERVER')
  
  socket.on('connectAs', function(username) {
    // Register the user
    socket.username = username;
    connectedUsers[username] = socket;
    console.log(`User '${username}' connected`);
    //socket.emit('serverSays', `You are connected as '${username}'`);
    //socket.emit('serverSays', `You are connected under '${connectedUsers[username].id}'`);

    // Log the usernames of connected users
    console.log('Connected Users:', Object.keys(connectedUsers));

    // Broadcast the user list to all clients
    io.emit('userList', Object.keys(connectedUsers));
  });

  socket.on('clientSays', function(data) {
    console.log("Message from", socket.username, ": ", data);
    //console.log('RECEIVED: ' + data)

    let recipients = []; // Initialize an array to hold recipients
    let type, self;

    if (data.includes(':')) {
      const { recipient, messageContent } = extractRecipientAndMessage(data);
      console.log("Recipient:", recipient);
      console.log("Message Content:", messageContent);

      // Split the recipients by commas and optional spaces
      recipients = recipient.split(',').map(recipient => recipient.trim());
      if (recipients.length === 1){ //if only recipient
        type = "private"
      }else{
        type = 'group'
      }
      self = recipients.includes(socket.username);
      data = messageContent;
    } else {
      recipients = Object.keys(connectedUsers); // No 'let' here, assign directly to the existing variable
      type = "everyone"
    }
  
    console.log("Recipients:", recipients);
    console.log("Message Content:", data);
    console.log("Type of message:", type);
  
    // Include the sender's username in the message data
    const messageData = {
      sender: socket.username,
      message: data,
      type: type,
      self: self
    };

    for (let username in connectedUsers) {
      // Send the message to each connected user and also sender
      if (recipients.includes(username) || (username === socket.username)) {
        connectedUsers[username].emit('serverSays', messageData);
      }
    }
    //to broadcast message to everyone including sender:
    //io.emit('serverSays', data) //broadcast to everyone including sender
    //alternatively to broadcast to everyone except the sender
    //socket.broadcast.emit('serverSays', data)
  })

  socket.on('disconnect', function(data) {
    //event emitted when a client disconnects
    if (socket.username) {
      // Remove the user from the connected users list
      delete connectedUsers[socket.username];
      // Broadcast the updated user list to all clients
      io.emit('userList', Object.keys(connectedUsers));
      console.log(`User '${socket.username}' disconnected`);
    }
  })
})

console.log(`Server Running at port ${PORT}  CNTL-C to quit`)
console.log(`To Test:`)
console.log(`Open several browsers to: http://localhost:${PORT}/chatClient.html`)
