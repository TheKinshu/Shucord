import os, re

from collections import deque
from flask import Flask, render_template, request, redirect, session
from flask_socketio import SocketIO, emit, join_room, leave_room, send, Namespace

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

# Define variables
user = []
channels = ["General"]
channelMessage = dict()

channelMessage['General'] = deque()

# Setting the default room to General
# All user should have access to 
# general chat, when they first
# access Shucord.
currentRoom = "General"

@app.route("/")
def index():
    return render_template("login.html")


@app.route("/home")
def home():
    
    # Checking if username has been taken
    if session.get("dupUser") == "True":
        # Give user an error message, stating that the name has already been taken
        # Redirect them to login screen
        emit("error", {"error": "Username has already been taken. Please try again!"})
        return render_template("login.html")
    else:
        # Username is avaliable and will be redirect to the main page
        return render_template("index.html")


@socketio.on("loginUser")
def login(data):
    print("Checking user")
    # Checking for duplicate usernames
    if data['user'] not in user: 
        # Username is unique and can proceed
        user.append(data['user'])
        session["dupUser"] = "False"
        session["currentUser"] = data['user']

    else:
        # Duplicate username has been found
        session["dupUser"] = "True"

@socketio.on('message')
def handle_message(message):
    currentRoom = session.get("last_channel")
    print(currentRoom + " fasdfasfdafd")
    channelMessage[currentRoom].append(message)
    send(message, room=currentRoom, broadcast=True)

@socketio.on('join')
def on_join(data):
    username = data['username']
    room = data['room']
    session["last_channel"] = room
    join_room(room)
    send(username + ' has entered the ' + room + '.', room=room)

@socketio.on('leave')
def on_leave(data):
    username = data['username']
    room = data['room']
    leave_room(room)
    send(username + ' has left the ' + room + '.', room=room)

@socketio.on('addchannel')
def addChan(data):
    newChannel = data['room']

    if newChannel in channels:
        emit("error", {"error": "channel already exist"})
    elif newChannel == "":
        emit("displayChannel", {"channels": channels},broadcast=True)
    else:
        channels.append(newChannel)
        channelMessage[newChannel] = deque()
        emit("displayChannel", {"channels": channels}, broadcast=True)

    
if __name__ == '__main__':
    socketio.run(app)