// Defining utility functions
function getCommand(id) {
    return document.getElementById(id);
}

function clickSend(evenement) {
    let id = evenement.target.dataset.id;
    let command = getCommand(id);
    command.classList.toggle("ready")
    evenement.target.classList.toggle("activated");
}

function clickPrepare(evenement) {
    let id = evenement.target.dataset.id;
    let command = getCommand(id);
    command.classList.toggle("prepare")
    evenement.target.classList.toggle("activated");
}

function clickValidate(evenement) {
    let id = evenement.target.dataset.id;
    let command = getCommand(id);
    if (command.classList.contains("ready")) {
        command.remove();
    }
}

function clickClose(evenement) {
    if (evenement.target.dataset.id) {
        let id = evenement.target.dataset.id;
        let command = getCommand(id);
        let dialog = window.confirm("Are you sure you want to delete this command ?")
        if (dialog) {
            command.remove();
        }
    } 
}

// Adding EventListeners
const senders = document.querySelectorAll(".send")
for (let i = 0; i < senders.length; i++) {
    senders[i].addEventListener('click', clickSend);
}

const preparers = document.querySelectorAll(".wprepare");
for (let i = 0; i < preparers.length; i++) {
    preparers[i].addEventListener('click', clickPrepare);
}

const validators = document.querySelectorAll(".validate");
for (let i = 0; i < validators.length; i++) {
    validators[i].addEventListener('click', clickValidate);
}

const closers = document.querySelectorAll(".close-button")
for (let i = 0; i < closers.length; i++) {
    closers[i].addEventListener('click', clickClose);
}

// WebSocket communication
let error = document.querySelector('.error-message');
let url = 'ws://' + window.location.hostname + ":8000";
let password = `; ${document.cookie}`.split(`; ${'spatulasPower'}=`)[1];
let socket = start(url);

function start(webSocketURL) {
    ws = new WebSocket(webSocketURL);
    
    ws.onopen = (evt) =>  {
        if (!error.classList.contains('invisible')) { // Removing the error message if it was here
            error.classList.toggle('invisible');
        }
    }
    
    ws.onclose = function() {
        
        setTimeout(() => {
            if (error.classList.contains('invisible')) {
                error.classList.toggle('invisible');
            }
            setTimeout(function(){socket = start(url)}, 10000)
        }, 1000);
    }

    return ws
}


// Adding event listeners to link the socket with 
for (let i = 0; i < senders.length; i++) {
    senders[i].addEventListener('click', sendPayload);
    preparers[i].addEventListener('click', sendPayload);
    closers[i].addEventListener('click', sendPayload);
    validators[i].addEventListener('click', sendPayload);
}

function sendPayload(evenement) {
    let id = evenement.target.dataset.id
    let payload;
    if (evenement.target.classList.contains('wprepare')) {
        payload = 0;
    } else if (evenement.target.classList.contains('send')) {
        payload = 1;
    } else if (evenement.target.classList.contains('validate') || evenement.target.classList.contains('close-button')) {
        payload = 2;
    }
    socket.send(password + "  " + id + "  " + payload)
}