import os, re

from collections import deque
from flask import Flask, render_template, request, redirect, session
from flask_socketio import SocketIO, emit, join_room, leave_room, send, Namespace

app = Flask(__name__)
app.config["SECRET_KEY"] = "my secret key"
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


@app.route("/home", methods=["POST"])
def home():
    lInput = request.form.get("lInput")

    if lInput == None or lInput == "":
        return redirect("/")


    # Checking for duplicate usernames
    if lInput not in user: 
        # Username is unique and can proceed to be added
        user.append(lInput)
        session["user"] = str(lInput)

    return render_template("index.html")

@socketio.on("newUser")
def login():
    emit("displayAll", {"user": session.get("user")})

@socketio.on('message')
def handle_message(message):
    currentRoom = session.get("last_channel")
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

@socketio.on('userDisplay')
def userDis():
    emit("displayUsers",{"users": user}, broadcast=True)

@socketio.on('redisplayMessage')
def displayMess(data):
    tempList = []
    for i in range(len(channelMessage[data['room']])):
        tempList.append(channelMessage[data['room']][i])
    emit("updateMessage", {"channelMess": tempList})
    
if __name__ == '__main__':
    socketio.run(app)