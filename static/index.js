var user = "";
var last_channel = "General";
var unlock = false;
var uInput;

function login(){
    document.querySelector("button#login").onclick = ()=>{
        let userCheck = document.getElementById("lInput").value;

        // Check if user is new
        if(localStorage.getItem('user') == null || localStorage.getItem('user' == "")){
            // Check if user has enter username
            if(userCheck == null || userCheck == ""){
                alert("Please enter a valid username")
            }
            else{
                // If information has been enter
                // Set information for later usage
                localStorage.setItem('user', userCheck);
                socket.emit('loginUser', {"user": userCheck});
                location.replace("/home");
            }
        }
        else{
            user = localStorage.getItem('user');
            location.replace("/home");
        }

    }
}

document.addEventListener('DOMContentLoaded', () => {

    // Connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
    // When connected, configure buttons
    uInput = document.querySelector("#uText");

    socket.on('connect', () => {

        user = localStorage.getItem('user');
        last_channel = localStorage.getItem('last_channel');

        if(last_channel == null || last_channel != ""){
            last_channel = "General"
        }
        if(user != null || user != ""){
            socket.emit('join', {"username": user, "room": last_channel});
            socket.emit('addchannel', {"room": ""});
            socket.emit('redisplayMessage',{"room": last_channel});
        };

        document.querySelector('button#sendMessage').onclick = ()=>{
            let uInput = document.querySelector("#uText").value;

            let today = new Date();
            let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

            if(uInput != ""){
                socket.send(user + " <" + time + ">: <br>" + uInput);
                document.querySelector("#uText").value = "";
            }
        }

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
        var messageList = document.querySelector('#mBoard');

        while(messageList.firstChild){
            messageList.removeChild(messageList.firstChild);
        }
        for(i = 0; i < data.channelMess.length; i++){
            const li = document.createElement('li');
            li.innerHTML = `${data.channelMess[i]}`;
            document.querySelector('#mBoard').append(li);
        }
    });

    socket.on('displayChannel', data => {
        var channelList = document.querySelector('#channelB');

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

    socket.on('error', data => {
        alert("Error: " + data.error)
    });

});