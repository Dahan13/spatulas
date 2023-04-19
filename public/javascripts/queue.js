// This part manage the popup search form
const searchButton = document.getElementById("search-button");

const searchForm = "\
<form action=\"queue\">\
    <h2> Search a command's number </h2>\
    <div class=\"input-div\">\
        <label for=\"search-query\"> Last and/or first name </label>\
        <input type=\"text\" id=\"search-query\" name=\"search-query\" placeholder=\"John Doe\">\
    </div>\
    <input type=\"submit\" value=\"Search\" id=\"submit-button\" disabled/>\
</form>\
"




searchButton.addEventListener('click', () => {
    popup.innerHTML = searchForm;

    // Configuring user input checks
    const searchInput = document.getElementById("search-query");
    const submitButton = document.getElementById("submit-button");

    function inputsChecker() {
        if (searchInput.value.length >= 1 && submitButton.disabled) {
            submitButton.disabled = false;
        } else if (searchInput.value.length < 1) {
            submitButton.disabled = true;
        }
    }

    searchInput.addEventListener('input', inputsChecker);

    // Showing the actual popup
    popupVeil.classList.toggle("invisible");
})

// This part handle the reload system
const lastReloadTime = document.getElementById('last-update-time');
if (lastReloadTime) {
    const d = new Date();
    let minutes = (("" + d.getMinutes()).length == 2) ? "" + d.getMinutes() : "0" + d.getMinutes(); // Make sur that hour and minute number have two length (01 instead of 1 for example)
    let hours = (("" + d.getHours()).length == 2) ? "" + d.getHours() : "0" + d.getHours();
    lastReloadTime.innerHTML = "" + hours + "h" + minutes;

    const reloadButton = document.getElementById('reload-button');
    reloadButton.addEventListener('click', () => {
        window.location.reload();
    })
}

// This part handle the dynamic appearance of the chosen menu for each user tile
const buttons = document.getElementsByClassName('menu-button');
let toggledMenuId = null;

function displayCommand(evenement) {
    // Get original target of event
    command = evenement.target;

    // Remove event listener to prevent multiple clicks, removing arrow
    command.removeEventListener('click', displayCommand);
    command.classList.toggle("invisible");

    // In case a menu is already showing, we remove him again
    if (toggledMenuId) {
        menu = document.getElementById("menu-" + toggledMenuId);
        menu.classList.toggle("invisible");
        oldButton1 = document.getElementById("but-" + toggledMenuId);
        oldButton2 = document.getElementById("but2-" + toggledMenuId);
        if (oldButton1.classList.contains("invisible")) oldButton1.classList.toggle("invisible");
        if (oldButton2.classList.contains("invisible")) oldButton2.classList.toggle("invisible");
        oldButton1.addEventListener('click', displayCommand);
    }

    // Displaying the menu
    commandId = command.dataset.commandid
    toggledMenuId = commandId;
    menu = document.getElementById("menu-" + commandId);
    menu.classList.toggle("invisible");
}

// Adding the event listener to each command tile
for (let i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', displayCommand);
}

/**
 * This function will update the count for a given time in the form
 * @param {string} time : Time to update
 * @param {int} count : Count to update
 */
function updateCount(time, count) {
    const timeNode = document.getElementById("count-" + time);
    if (!(timeNode.innerHTML == "FULL ")) { // If the time is not full, we update the count
        // The string is in format "count/limit"
        let limit = parseInt(timeNode.innerHTML.split("/")[1]);
        if (count >= limit || limit === NaN) { // If the count is greater than the limit or if the limit is NaN, we set the count to "FULL"
            timeNode.innerHTML = "FULL ";
        } else {
            timeNode.innerHTML = count + " / " + limit + " ";
        }
        return;
    }
}


// WebSocket communication
let error = document.querySelector('.error-message');
let url = 'ws://' + window.location.hostname + ":8000";
let socket = start(url);

function start(webSocketURL) {
    ws = new WebSocket(webSocketURL);
    
    ws.onopen = (evt) =>  {
        if (!error.classList.contains('invisible')) { // Removing the error message if it was here
            error.classList.toggle('invisible');
        }

        ws.addEventListener('message', (event) => {
            let message = event.data.split(" ");
            if (message[0] == "timeCountUpdate") { // If the message is a time count update
                updateCount(message[1], message[2]);
            }
        });
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
