setTimeout(() => {
    window.location.reload();
}, 600000);

const vanillaCommandsContainer = document.getElementById("vanilla-container");
const prepareCommandsContainer = document.getElementById("preparation-container");
const readyCommandsContainer = document.getElementById("ready-container");
const deliveredCommandsContainer = document.getElementById("delivered-container");

// Defining utility functions
function getCommand(id) {
    return document.getElementById(id);
}

function getWidgets(id) {
    let command = getCommand(id);   
    let widgets = [];
    widgets.push(command.childNodes[1].childNodes[9].childNodes[1])
    widgets.push(command.childNodes[1].childNodes[9].childNodes[3])
    widgets.push(command.childNodes[1].childNodes[9].childNodes[5])
    return widgets
}

function clickSend(evenement) {
    let id = evenement.target.dataset.id;
    let command = getCommand(id);
    
    // Getting the widgets and putting on activated status
    let widgets = getWidgets(id);
    widgets[1].classList.toggle("activated");
    if (!widgets[2].classList.contains("activated")) { // If the command is already delivered, we won't modify the front-end extensively
        // Cloning and removing the command
        var cloneCommand = command.cloneNode(true);
        command.classList.toggle("transition")
        setTimeout(() => {
            command.remove();
        }, 500)
    
        
        if (widgets[1].classList.contains("activated")) { // Depending of the status of the command, we either move it to the empty or preparing command
            readyCommandsContainer.appendChild(cloneCommand);
        } else if (widgets[0].classList.contains("activated")) {
            prepareCommandsContainer.appendChild(cloneCommand);
        } else {
            vanillaCommandsContainer.appendChild(cloneCommand);
        }
        
        // Reattributing all events listeners
        setTimeout(() => {
            activateEventListeners(id);
        }, 500)
    }
}

function clickPrepare(evenement) {
    let id = evenement.target.dataset.id;
    let command = getCommand(id);
    
    // Getting the widgets and putting on activated status
    let widgets = getWidgets(id);
    widgets[0].classList.toggle("activated");
    if (!widgets[1].classList.contains("activated") && !widgets[2].classList.contains("activated")) { // If the command is either ready or delivered, we won't modify the front-end extensively
        // Cloning and removing the command
        var cloneCommand = command.cloneNode(true);
        command.classList.toggle("transition")
        setTimeout(() => {
            command.remove();
        }, 500)
    
        
        if (widgets[0].classList.contains("activated")) { // Depending of the status of the command, we either move it to the empty or preparing command
            prepareCommandsContainer.appendChild(cloneCommand);
        } else {
            vanillaCommandsContainer.appendChild(cloneCommand);
        }
        
        // Reattributing all events listeners
        setTimeout(() => {
            activateEventListeners(id);
        }, 500)
    }
}

function clickValidate(evenement) {
    let id = evenement.target.dataset.id;
    let command = getCommand(id);

    // Getting the widgets and putting on activated status
    let widgets = getWidgets(id);
    widgets[2].classList.toggle("activated");
    
    // Cloning and removing the command
    var cloneCommand = command.cloneNode(true);
    command.classList.toggle("transition")
    setTimeout(() => {
        command.remove();
    }, 500)
    

    // Depending of the status of the command, we either move it to the empty or preparing command
    if (widgets[2].classList.contains("activated")) { // if the deliver widget is now active
        deliveredCommandsContainer.appendChild(cloneCommand); 
    } else { // Command will be sent to nothing activated. It needs therefore to be reset
        vanillaCommandsContainer.appendChild(cloneCommand);
        widgets = getWidgets(id);
        setTimeout(() => {
            if (widgets[1].classList.contains("activated")) { // if the command is still in ready state, we need to deactivate it in BOTH ends
                widgets[1].classList.toggle("activated");
                socket.send(password + "  " + id + "  " + 1)
            } 
            setTimeout(() => {
                if (widgets[0].classList.contains("activated")) {
                    widgets[0].classList.toggle("activated");
                    socket.send(password + "  " + id + "  " + 0)
                }
            }, 50) 
        }, 50);   
    }
    
    // Reattributing all events listeners
    setTimeout(() => {
        activateEventListeners(id);
    }, 500)
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

// Removing event listeners from the cancel search button to prevent fatal errors.
const cancelSearch = document.getElementById('cancel-search');
if (cancelSearch) {
    cancelSearch.removeEventListener('click', sendPayload);
}

function activateEventListeners(id) {
    let widgets = getWidgets(id);

    widgets[0].addEventListener('click', sendPayload);
    widgets[0].addEventListener('click', clickPrepare);
    widgets[1].addEventListener('click', sendPayload);
    widgets[1].addEventListener('click', clickSend);
    widgets[2].addEventListener('click', sendPayload);
    widgets[2].addEventListener('click', clickValidate);
}