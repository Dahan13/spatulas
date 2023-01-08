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
const socket = new WebSocket('ws://' + window.location.hostname + ":8000");

// Connection opened
socket.addEventListener('open', (event) => {
    socket.send('Hello Server!');
});

// Listen for messages
socket.addEventListener('message', (event) => {
    console.log('Message from server ', event.data);
});

socket.onmessage = (evt) => {
    console.log("test")
}

// Utiliser cet évènement pour mettre en place un message d'erreur qui indique si le websocket est deconnecté
socket.onopen = (evt) => {
    console.log("open");
}

// ! This function may create an infinite recursion, redo it without recursion call to automatically restart the ws
function start(websocketServerLocation){
    ws = new WebSocket(websocketServerLocation);
    ws.onmessage = function(evt) { alert('message received'); };
    ws.onclose = function(){
        // Try to reconnect in 5 seconds
        setTimeout(function(){start(websocketServerLocation)}, 5000);
    };
}
