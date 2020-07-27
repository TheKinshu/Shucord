var user = "";
var last_channel = "";


function login(){
    document.querySelector("button#login").onclick = ()=>{
        user = document.getElementById("lInput").value;

        if(localStorage.getItem('user') == null || localStorage.getItem('user' == "")){
            if(user == null || user == ""){
                alert("Please enter a valid username")
            }
            else{
                localStorage.setItem('user', user);
                location.replace("/home");
            }
        }
        else{
            user = localStorage.getItem('user');
            socket.emit('loginUser', {"user": user});
            location.replace("/home");
        }

    }
}

document.addEventListener('DOMContentLoaded', () => {

    // Connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

    // When connected, configure buttons
    socket.on('connect', () => {

        user = localStorage.getItem('user');
        
    });

});