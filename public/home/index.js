function criticalError(error){
  const root = document.getElementById("root");
  root.innerHTML = '';
  const paragraph = document.createElement('p');
  paragraph.textContent = error;
  root.appendChild(paragraph);
  root.className = "error";
}

if (typeof(Storage) === "undefined") {
  criticalError("LocalStorage not supported in your browser.")
}

var currentChat;

const origin = window.location.href;
console.log("Response from this origin:", origin);

// Define available models
const availableModels = [
  { id: "llama3.2:1b", name: "Llama 3.2 (1B)" },
  { id: "llama3.2:70b", name: "Llama 3.2 (70B)" },
];

function retrieveChats() {
  const chats = [];
  const length = localStorage.length;
  for (let i = 0; i < length; i++) {
      const key = localStorage.key(i);
      chats.push(key);
  }
  return chats;
}

var allchats = retrieveChats();

function renderMarkdown(element, markdownText) {
  if (element && markdownText) {
      const converter = new showdown.Converter();
      element.innerHTML = converter.makeHtml(markdownText);
  } else {
      console.error("Invalid element or markdown text.");
  }
}

function reFreshChats(){
  allchats = retrieveChats();
  const chatlist = document.getElementById("chatlist");
  chatlist.innerHTML = '';
  allchats.forEach(function(chat) {
    const element = document.createElement('p');
    element.textContent = chat;
    element.className = 'chats';
    element.addEventListener('click', function(){
      loadChat(this.textContent);
    });
    chatlist.appendChild(element);
  });
}

function nuke(){
  localStorage.clear();
  allchats = retrieveChats();
  const chatbox = document.getElementById("messages");
  chatbox.textContent = "Start a New Chat";
  const infobar = document.getElementById("infobar");
  infobar.innerHTML = '';
  const searchbar = document.getElementById("searchbar");
  searchbar.innerHTML = '';
  reFreshChats();
}

function makeid(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

function loadChat(chatName) {
  const history = JSON.parse(localStorage.getItem(chatName));
  const infobar = document.getElementById("infobar");
  infobar.innerHTML = '';

  var nameElement = document.createElement('p');
  nameElement.textContent = chatName;
  nameElement.id = "infoname";
  nameElement.width = "70%";
  infobar.appendChild(nameElement);

  var modelName = document.createElement('p');
  modelName.textContent = history.model;
  modelName.id = "modelname";
  modelName.width = "30%";
  infobar.appendChild(modelName);

  var deleteElement = document.createElement('img');
  deleteElement.id = "deleteButton";
  deleteElement.src = "misc/delete_icon.png";
  deleteElement.width = 20;
  deleteElement.height = 20;
  deleteElement.className = "icons";
  deleteElement.addEventListener('click', function() {
      deleteChat(chatName);
  });
  infobar.appendChild(deleteElement);

  var renameElement = document.createElement('img');
  renameElement.id = "renameButton";
  renameElement.src = "misc/edit_icon.png";
  renameElement.width = 20;
  renameElement.height = 20;
  renameElement.className = "icons";
  renameElement.addEventListener('click', function() {
      const renameBar = document.createElement('input');
      renameBar.type = "text";
      renameBar.id = "renameChatName";
      renameBar.placeholder = "New Chat Name";
      renameBar.addEventListener('keydown', function(event) {
          if (event.key === 'Enter'){
              const renameText = renameBar.value;
              if (renameText.trim() !== '') {
                  renameChat(currentChat, renameText);
              }
          }
      });
      infobar.appendChild(renameBar);
  });
  infobar.appendChild(renameElement);

  const chatbox = document.getElementById("messages");
  chatbox.innerHTML = '';

  history.messages.forEach(function(message) {
      const messageElement = document.createElement('p');
      if (message.role === "user") {
        messageElement.textContent = message.content;
        messageElement.className = "usermessage";
      } else {
        renderMarkdown(messageElement, message.content);
        messageElement.className = "botmessage";
      }

      chatbox.append(messageElement);
  });

  const searchbar = document.getElementById("searchbar");
  searchbar.innerHTML = '';

  const textbox = document.createElement('input');
  textbox.type = "text";
  textbox.id = "messageInput";
  textbox.placeholder = "Type your prompt....";
  searchbar.appendChild(textbox);

  const sendbutton = document.createElement('button');
  sendbutton.id = "sendButton";
  sendbutton.textContent = "Send";
  sendbutton.addEventListener('click', function() {
      const messageInput = document.getElementById('messageInput');
      const chatContainer = document.getElementById('messages');
      const messageText = messageInput.value;

      if (messageText.trim() !== '') {
          const messageElement = document.createElement('p');
          messageElement.className = "usermessage";
          messageElement.textContent = messageText;
          chatContainer.appendChild(messageElement);
          messageInput.value = '';
          chatContainer.scrollTop = chatContainer.scrollHeight;
          sendPrompt(messageText);
      }
  });

  textbox.addEventListener('keydown', function(event) {
    if (event.key === 'Enter'){
      const messageInput = document.getElementById('messageInput');
      const chatContainer = document.getElementById('messages');
      const messageText = messageInput.value;

      if (messageText.trim() !== '') {
          const messageElement = document.createElement('p');
          messageElement.className = "usermessage";
          messageElement.textContent = messageText;
          chatContainer.appendChild(messageElement);
          messageInput.value = '';
          chatContainer.scrollTop = chatContainer.scrollHeight;
          sendPrompt(messageText);
      }
    }
  });

  searchbar.appendChild(sendbutton);
  currentChat = chatName;
}

function createNewChat(model){
  const initialMessage = {
    "role": "user",
    "content": ""
  }
  const chat = {
    "model" : model,
    "messages" : [
      initialMessage
    ]
  }
  const chatName = makeid(12);
  localStorage.setItem(chatName, JSON.stringify(chat));
  reFreshChats();
  console.log("New chat created ", chatName);
  console.log("New chat created ", model);
  return chatName;
}

function displayModelSelector() {
  const chatbox = document.getElementById("messages");
  chatbox.innerHTML = '';
  
  const modelSelectionContainer = document.createElement('div');
  modelSelectionContainer.id = "modelSelectionContainer";
  modelSelectionContainer.className = "model-selection";
  
  const title = document.createElement('h3');
  title.textContent = "Select a model for your new chat:";
  modelSelectionContainer.appendChild(title);
  
  availableModels.forEach(model => {
    const modelOption = document.createElement('div');
    modelOption.className = "model-option";
    modelOption.addEventListener('click', function() {
      const chatName = createNewChat(model.id);
      loadChat(chatName);
    });
    
    const modelName = document.createElement('p');
    modelName.className = "model-name";
    modelName.textContent = model.name;
    
    const modelId = document.createElement('p');
    modelId.className = "model-id";
    modelId.textContent = model.id;
    
    modelOption.appendChild(modelName);
    modelSelectionContainer.appendChild(modelOption);
  });
  
  chatbox.appendChild(modelSelectionContainer);
  
  const infobar = document.getElementById("infobar");
  infobar.innerHTML = '';
  var nameElement = document.createElement('p');
  nameElement.textContent = "Select a Model";
  nameElement.width = "100%";
  infobar.appendChild(nameElement);
  

  const searchbar = document.getElementById("searchbar");
  searchbar.innerHTML = '';
}

function renameChat(oldName, newName){
  const object = localStorage.getItem(oldName);
  const allChats = retrieveChats();
  if (allChats.includes(newName)){
    alert("Name already Exists");
    const renameBar = document.getElementById("renameChatName");
    if (renameBar) {
      renameBar.placeholder = "Name Already Exists";
    }
    return;
  }
  if (object) {
    localStorage.setItem(newName, object);
    localStorage.removeItem(oldName);
  } else {
    console.log('No object found with the key:', oldName);
  }
  loadChat(newName);
  currentChat = newName;
  reFreshChats();
}

function deleteChat(name){
  localStorage.removeItem(name);
  reFreshChats();
  const chatbox = document.getElementById("messages");
  chatbox.textContent = "Chat deleted. Select another chat or create a new one.";
  const infobar = document.getElementById("infobar");
  infobar.innerHTML = '';
}

function sendPrompt(promptText){
  const history = JSON.parse(localStorage.getItem(currentChat));
  console.log(history.model);
  const messages = history.messages;
  const url = '/api';
  console.log("Requesting ", url);
  messages.push({"role":"user", "content": promptText});
  const data = {
    model: history.model,
    messages: messages,
    stream: false
  };

  fetch(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  .then(response => {
      if (!response.ok) {
          throw new Error('Network response was not ok ' + response.statusText);
      }
      return response.json();
  })
  .then(data => {
      console.log('Success:', data);
      messages.push(data.message);
      const messageElement = document.createElement('p');
      messageElement.className = "botmessage";
      renderMarkdown(messageElement, data.message.content);
      const chatContainer = document.getElementById('messages');
      chatContainer.appendChild(messageElement);
      const messageInput = document.getElementById('messageInput');
      if (messageInput) {
        messageInput.value = '';
      }
      chatContainer.scrollTop = chatContainer.scrollHeight;
      const newHistory = {
        "model" : history.model,
        "messages" : messages
      }
      localStorage.removeItem(currentChat);
      localStorage.setItem(currentChat, JSON.stringify(newHistory));
  })
  .catch(error => {
      console.error('Error:', error);
      const chatContainer = document.getElementById('messages');
      const errorElement = document.createElement('p');
      errorElement.className = "error";
      errorElement.textContent = "An error occurred while sending your message. Please try again.";
      chatContainer.appendChild(errorElement);
  });
}

document.addEventListener('DOMContentLoaded', function(){
  reFreshChats();

  const newChatButton = document.getElementById('newchat');
  const nukeButton = document.getElementById('nuke');

  newChatButton.addEventListener('click', function(){
    displayModelSelector();
  });

  nukeButton.addEventListener('click', function(){
    nuke();
    const infobar = document.getElementById("infobar");
    infobar.innerHTML = '';
    var nameElement = document.createElement('p');
    nameElement.textContent = "Created By Rexdy";
    nameElement.width = "70%";
    infobar.appendChild(nameElement);
  });
});