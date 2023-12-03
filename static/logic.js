let socket = io();

const textarea = document.querySelector("#message")
const button = document.querySelector("#send")
const username = localStorage.getItem('username')

const emoji = document.querySelector('emoji-picker')

initialRender()

// Event Listener para enviar mensaje al presionar enter
textarea.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault() // Previene crear una nueva linea en la textarea
    sendMessage()
  }
})

function scrollToBottom(messages) {
  messages.scrollTop = messages.scrollHeight
}

function sendMessage() {
  let room = document.querySelector("#room").innerHTML
  let message = document.querySelector("#message").value.trim()

  if (message.length !== 0){
    socket.emit("message", { room: room, message: message })
  }


  document.getElementById("message").value = ""
}

function createRoom(){
  const roomElement = document.querySelector('#room-name')
  const warning = document.querySelector('.warning')
  const roomName = roomElement.value

  warning.innerHTML = ''
  roomElement.value = ''
  
  if (roomName.length === 0){
    warning.innerHTML = 'Ingrese un nombre válido'
    return
  }
  if (roomName.indexOf(' ') !== -1){
    warning.innerHTML = 'El nombre no puede contener espacios'
    return
  }

  socket.emit('createRoom', {name:roomName})
}

socket.on("roomResponse", function (data) {

  if (data.valid === true){
    socket.emit('render')
  } 
  else{
    const warning = document.querySelector('.warning')
    warning.innerHTML = 'Ya existe un canal con ese nombre'
  }
})

socket.on('renderRooms', function(data){
  let channels = document.querySelector('#channel-list')

  channels.innerHTML = ''

  data.rooms.forEach((room) =>{
    channels.innerHTML += `<li name='${room}' class='room' onclick="joinRoom(this)">${room}</li>`
  })

  keepActualRoomVisual()
})

socket.on("message", function (data) {
  document.querySelector(".messages-container").innerHTML = ''

  data.data.slice().reverse().forEach(message => {
    renderMessage(message, username)
  });
})

socket.on("renderPastMessages", function (data) {
  console.log('xd')
  document.querySelector(".messages-container").innerHTML = ''

  data.data.slice().reverse().forEach(message => {
    renderMessage(message, username)
  });
})

async function initialRender(){
  emoji.style.display = 'none';
  // Esperar a que se rendericen las salas
  await new Promise((resolve) => {
    socket.emit('render', () => {
      resolve()
    })
  })

  keepActualRoom()
}

function keepActualRoom(){
  let room = localStorage.getItem('room')
  let actualRoom = document.querySelector(`[name=${room}]`)

  if (room === null || actualRoom === null){
    room = 'General'
  }
  
  actualRoom = document.querySelector(`[name=${room}]`)
  joinRoom(actualRoom)
}

function keepActualRoomVisual(){
  let room = localStorage.getItem('room')
  let actualRoom = document.querySelector(`[name=${room}]`)
  if (room === null || actualRoom === null){
    room = 'General'
  }
  actualRoom = document.querySelector(`[name=${room}]`)
  actualRoom.style.backgroundColor = '#20bf6b'
}

function joinRoom(room_element) {
  // Reset colors
  const rooms = document.querySelectorAll('.room')

  rooms.forEach((item) =>{
    item.style.backgroundColor = 'white'
  })
  room_element.style.backgroundColor = '#20bf6b'

  // Room handling
  let room = room_element.getAttribute("name")
  let room_header = document.querySelector("#room")
  room_header.innerHTML = room
  localStorage.setItem('room', room)

  // Emit join
  socket.emit('join', {room: room, username: username})

  socket.emit('')
}

function renderMessage(data, username){
  let messages = document.querySelector(".messages-container")
  let message_class = 'message-container'

  if (username === data.username){
    message_class += ' self'
  }

  messages.innerHTML += `
        <div class="${message_class}" id="message-container">
          <div class="message-details">
            <h3>
                ${data.username}
            </h3>
            <p>
            ${data.time}
            </p>
          </div>
            <div class="textbox">
                ${data.content}
            </div>
        </div>`

  scrollToBottom(messages)
}

// Emoji 

function emojiPicker(){
  if (emoji.style.display == 'none'){
    emoji.style.display = 'inline'
  }
  else{
    emoji.style.display = 'none'
  }
}

document.querySelector('emoji-picker').addEventListener('emoji-click', event => {
  let message = document.querySelector("#message")
  message.value += event.detail.unicode
})