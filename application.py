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

# Default route
@app.route("/")
def index():
    return render_template("login.html")

# The main 
@app.route("/home", methods=["GET","POST"])
def home():
    # Only trigger if user has submit username
    if request.method == "POST":

        # Grabs user input
        lInput = request.form.get("lInput")

        # Check user input
        if lInput == None or lInput == "":
            return redirect("/")


        # Checking for duplicate usernames
        if lInput not in user: 
            # Username is unique and can proceed to be added
            user.append(lInput)
            session["user"] = str(lInput)

    # If everythings is checked, direct them to home page
    return render_template("index.html")

# User is new to the Shucord, display all important information
@socketio.on("newUser")
def login():
    emit("displayAll", {"user": session.get("user")})

# Message Handler "Server-side"
@socketio.on('message')
def handle_message(message):
    currentRoom = session.get("last_channel")
    if len(channelMessage[currentRoom]) == 100:
        channelMessage[currentRoom].pop(0)
    channelMessage[currentRoom].append(message)
    send(message, room=currentRoom, broadcast=True)

# User joining room
@socketio.on('join')
def on_join(data):
    username = data['username']
    if data['room'] not in channels:
        room = "General"
        session["last_channel"] = room
    else:
        room = data['room']
        session["last_channel"] = room
    join_room(room)
    send(username + ' has entered the ' + room + '.', room=room)

# User leaving room
@socketio.on('leave')
def on_leave(data):
    username = data['username']
    room = data['room']
    leave_room(room)
    send(username + ' has left the ' + room + '.', room=room)

# Add new channel/chat room
@socketio.on('addchannel')
def addChan(data):
    # Grab user input
    newChannel = data['room']

    # Check if channel with the same name has already created
    if newChannel in channels:
        # Alert user that, the channel with the same name already exist 
        emit("error", {"error": "channel already exist"})
    elif newChannel == "":
        # Only runs when user reload pages
        emit("displayChannel", {"channels": channels},broadcast=True)
    else:
        # Channel/chat name can be created
        channels.append(newChannel)
        channelMessage[newChannel] = deque()
        emit("displayChannel", {"channels": channels}, broadcast=True)

# Display all user currently logged on
@socketio.on('userDisplay')
def userDis():
    emit("displayUsers",{"users": user}, broadcast=True)

# Log out user
@socketio.on('logout')
def logOut(data):
    session.clear()
    session["user"] = None
    print(session["user"])
    if data['user'] in user:
        user.remove(data['user'])
    

# Re-display message to broadcast to other users
@socketio.on('redisplayMessage')
def displayMess(data):
    # Creating temp variable
    tempList = []
    tempRoom = data['room']

    if data['room'] not in channels:
        tempRoom = "General"

    for i in range(len(channelMessage[tempRoom])):
        tempList.append(channelMessage[tempRoom][i])
    emit("updateMessage", {"channelMess": tempList})
    
if __name__ == '__main__':
    socketio.run(app)