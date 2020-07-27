import os, re

from flask import Flask, render_template, request, redirect
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

# Define variables
user = []
channels = []
channelMessage = dict()

@app.route("/")
def index():
    return render_template("login.html")


@app.route("/home")
def home():

    return render_template("index.html")

@socketio.on("loginUser")
def login(data):
    user = ""