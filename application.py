import os
import json

from datetime import datetime
from flask import Flask, render_template, request, session, redirect, jsonify
from flask_socketio import SocketIO, join_room, leave_room, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = 'clave_super_secreta'
socketio = SocketIO(app, cors_allowed_origins='*')

# Clases

class Message:
    def __init__(self, content, room, time, username):
        self.content = content
        self.room = room
        self.time = time
        self.username = username

class Room:
    def __init__(self, name):
        self.name = name
        self.messages = []
        self.message_count = 0

    def appendMessage(self, message):
        if self.message_count >= 100:
            self.messages.pop()
        else:
            self.message_count += 1
        self.messages.insert(0, message)

# Lista para las salas + agregar canal general
rooms = []
rooms.append(Room('General'))

# Routes Logic 

@app.route("/", methods = ['GET', 'POST'])
def index():
    if request.method == 'POST':
        session['username'] = request.form.get('username')
        return redirect('/chat')
    else:
        if not KeyError and len(session['username']) != 0:
            return redirect('/chat')
        
        return render_template('index.html')
    
@app.route('/logout')
def logout():
    session.clear()
    return redirect('/')

@app.route('/chat')
def chat():
    if session.get("username") is None:
        return redirect("/")
    return render_template('chat.html')

# Socket Logic

@socketio.on('createRoom')
def create_room(data):
    name = data['name']
    valid_name = True

    for room in rooms:
        if room.name == name:
            valid_name = False
            break

    if valid_name == True:
        new_room = Room(name)
        rooms.append(new_room)

    emit('roomResponse', {'valid': valid_name}, broadcast=True)

@socketio.on('render')
def render():
    rooms_names = [room.name for room in rooms]
    emit('renderRooms', {'rooms': rooms_names}, broadcast=True)


@socketio.on('join')
def on_join(data):
    room = data['room']
    join_room(room)

    message_list = retrieve_messages(room)
 
    emit('renderPastMessages', message_list)

@socketio.on('leave')
def on_leave(data):
    room = data['room']
    leave_room(room)
    message = f'{session["username"]} se ha salido de la sala.'
    emit('status', {'message': message})

@socketio.on('message')
def handle_message(data):
    now = datetime.now()
    time = now.strftime("%m/%d/%Y, %H:%M:%S")

    message = Message(data['message'], data['room'], time, session['username'])

    room = find_room(data['room'])

    if room == None:
        return 'error'
    
    room.appendMessage(message)

    message_list = retrieve_messages(data['room'])

    # Convertir los atributos del objeto a un diccionario al momento de enviarlo
    emit('message', message_list, to=data['room'])

def find_room(name):
    for room in rooms:
        if room.name == name:
            return room
    return None

def retrieve_messages(room):
    room_object = find_room(room)
    message_list = [message.__dict__ for message in room_object.messages]
    data = {'data': message_list}
    return data
