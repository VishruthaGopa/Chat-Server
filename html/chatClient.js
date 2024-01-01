/* chatClient.js file */

//connect to server and retain the socket
//connect to same host that served the document

const socket = io() //by default connects to same server that served the page
let username;

let introMessage = document.getElementById("introMessage")
introMessage.textContent = `Please enter your username to start chatting.`;

// Initially disable message input elements
toggleMessageInputElements(true);

socket.on('serverSays', function(message) {
  let msgDiv = document.createElement('div');
  
  // Extract the sender's username and message from the data
  let senderName = message.sender + ": ";
  let messageText = message.message;
  msgDiv.textContent = senderName + messageText;

  // Diiferent colours based on whether the message is from the sender or others. Also, color depends on type of text.
  if (message.type === 'everyone') {
    if (username != message.sender){
      msgDiv.classList.add('sender-message');
    }else{
      msgDiv.classList.add('own-message');
    }
  } else {
      //NOTE: Prof said if the user private messages themselves (message.self === True), their username should still be visible in the text (just like any other private/group text)
      msgDiv.classList.add('private-message');
      //if (username != message.sender || message.self){
      //msgDiv.textContent = senderName + messageText;
      //}
    }
  //console.log(msgDiv)
  document.getElementById('messages').appendChild(msgDiv);
  // Log the message to the console
  console.log('Received message:', message);

})

function sendMessage() {
  let message = document.getElementById('msgBox').value.trim()
  if(message === '') return //do nothing
  socket.emit('clientSays', message)
  document.getElementById('msgBox').value = ''
}


function sendUsername() {
  let introMessage = document.getElementById("introMessage")
  const successMessage = document.getElementById('successMessage');
  username = document.getElementById('connectBox').value.trim()
  if(username === '') return //do nothing
    
  // Check if username is valid
  if (!isValidUsername(username)) {
    alert('Invalid username. Usernames must start with a letter and contain only letters and numbers.');
    document.getElementById('connectBox').value = ''
    return;
  }
  console.log("Username: ", username);
  
  // Enable message input elements after a valid username is provided
  toggleMessageInputElements(false);

  // Remove the "Connect As" button
  const connectButton = document.getElementById('connect_button');
  const connectBox = document.getElementById('connectBox');
  if (connectButton && connectBox) {
    connectButton.parentNode.removeChild(connectButton);
    connectBox.parentNode.removeChild(connectBox);
  }

  // Display a successfully username message and clear intro message
  introMessage.innerHTML = '' //clear the html
  successMessage.textContent = `Successfully connected as '${username}'`;

  socket.emit('connectAs', username)
}

// Check if a username is valid 
function isValidUsername(username) {
  const usernameRegex = /^[a-zA-Z][a-zA-Z0-9]*$/;
  return usernameRegex.test(username);
}

// Function to enable or disable message input elements
function toggleMessageInputElements(disabled) {
  document.getElementById('msgBox').disabled = disabled;
  document.getElementById('send_button').disabled = disabled;
  document.getElementById('clear_button').disabled = disabled;
}

function handleKeyDown(event) {
  const ENTER_KEY = 13 //keycode for enter key
  if (event.keyCode === ENTER_KEY) {
    sendMessage()
    return false //don't propogate event
  }
}

// Function to clear the chat content
function clearChat() {
  // Get the chat container element
  const chatContainer = document.getElementById('messages');
  
  // Clear the chat content by removing all child elements
  while (chatContainer.firstChild) {
    chatContainer.removeChild(chatContainer.firstChild);
  }
}
