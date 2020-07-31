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
                location.replace("/home");
            }
        }
        else{
            user = localStorage.getItem('user');
            location.replace("/home");
        }

    }
}