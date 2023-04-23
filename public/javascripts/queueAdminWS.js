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