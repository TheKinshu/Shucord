var user = "";
var last_channel = "General";
var unlock = false;
var uInput;



document.addEventListener('DOMContentLoaded', () => {

    // Connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
    // When connected, configure buttons
    socket.on('connect', () => {
        // Check if user is new
        user = localStorage.getItem('user');
        // Check last use chat channel
        if(localStorage.getItem('last_channel') != null)
            last_channel = localStorage.getItem('last_channel');

        // If local storage stored empty string set last used channel to General
        if(last_channel == "")
            last_channel = "General"

        // Check if user account
        if(user != null){
            socket.emit('join', {"username": user, "room": last_channel});
            socket.emit('addchannel', {"room": ""});
            socket.emit('userDisplay');
            socket.emit('redisplayMessage',{"room": last_channel});
            
        }
        else{
            socket.emit('newUser');
        }
        
        // Upload image to local "Client side only"
        document.querySelector('input[type=file]#imageUp').addEventListener('input', function (evt) {
            let today = new Date();
            let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
            let file = this.files[0];
            let url = URL.createObjectURL(file);
            socket.send(user + " <" + time + ">: <br>" + "<img src=" + url + "></img>");
        });

        document.querySelector('button#sendMessage').onclick = ()=>{
            let uInput = document.querySelector("#uText").value;

            let today = new Date();
            let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
            if(user == null){
                user = localStorage.getItem('user'); 
            }
            if(uInput != ""){
                socket.send(user + " <" + time + ">: <br>" + uInput);
                document.querySelector("#uText").value = "";
            }
        }
        // Allow user to logout
        document.querySelector('button#logout').onclick = ()=>{
            let log = confirm("Do you want to log off?")

            // Checks if user clicked okay
            if(log){
                socket.emit("logout", {"user": user});
                localStorage.clear();
                user = "";
                location.replace("/")
            }
        };

        document.querySelector('button#newChannel').onclick = () => {
            let nChannel = prompt("Please Enter a new channel name");

            // Check if user enter something
            if(nChannel == "" || nChannel == null){
                alert("Invalid Channel name");
            }
            else{
                socket.emit('addchannel', {"room": nChannel});
            }
        }

    });

    window.addEventListener("keydown", function (e){
        if(e.keyCode === 13){
            document.querySelector('button#sendMessage').click();
        }
    });
    socket.on('message', data => {
        const li = document.createElement('li');
        li.innerHTML = `${data}`;
        document.querySelector('#mBoard').append(li);
    });

    socket.on('updateMessage', data => {

        document.querySelector("#roomName").innerHTML = last_channel;
        
        let messageList = document.querySelector('#mBoard');

        while(messageList.firstChild){
            messageList.removeChild(messageList.firstChild);
        }
        for(i = 0; i < data.channelMess.length; i++){
            const li = document.createElement('li');
            li.innerHTML = `${data.channelMess[i]}`;
            document.querySelector('#mBoard').append(li);
        }
    });

    socket.on('displayUsers', data => {
        let userList = document.querySelector("#userID");
        while(userList.firstChild){
            userList.removeChild(userList.firstChild);
        }

        for(i = 0; i < data.users.length; i++){
            const li = document.createElement('li');
            let username = data.users[i];
            li.innerHTML = `${username}`;
            document.querySelector('#userID').append(li);
        }
    });

    socket.on('displayChannel', data => {
        let channelList = document.querySelector('#channelB');

        // Remove all current channel
        while(channelList.firstChild){
            channelList.removeChild(channelList.firstChild);
        }

        // Loops through a list and re-enter any new channels that has been created
        for(i = 0; i < data.channels.length; i++){
            const li = document.createElement('li');
            let cName = data.channels[i];

            li.innerHTML = `<button id="channel-change" data-channel="` + `${cName}` + `">` + `${cName}` + `</button>`;
            document.querySelector('#channelB').append(li);
        }

        document.querySelectorAll('button#channel-change').forEach(function(button) {
            button.onclick = function() {
                if(last_channel != button.dataset.channel){
                    socket.emit('leave', {"username": user, "room": last_channel});
                    localStorage.setItem('last_channel', button.dataset.channel)                
                    last_channel = localStorage.getItem('last_channel');
                    socket.emit('join', {"username": user, "room": last_channel});
                    socket.emit('redisplayMessage',{"room": last_channel});
                }
            };
        });
    });

    socket.on('displayAll', data => {

        user = localStorage.setItem('user', data.user);
        socket.emit('join', {"username": data.user, "room": last_channel});
        socket.emit('addchannel', {"room": ""});
        socket.emit('userDisplay');
        socket.emit('redisplayMessage',{"room": last_channel});
    })
    socket.on('error', data => {
        alert("Error: " + data.error)
        if(data.status === 101){
            location.replace("/");
        }
    });

});