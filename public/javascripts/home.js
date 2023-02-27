// Input validation
const firstNameInput = document.getElementById("firstName");
const lastNameInput = document.getElementById("lastName");
const checkbox = document.getElementById("accept");
const submitButton = document.getElementById("submit-button");
const burgers = document.getElementById("burger");
const fries = document.getElementById("fries");
const drinks = document.getElementById("drink");
const times = document.getElementById("time");
const displayedPrice = document.getElementById("price-range");

// Reseting on page load all inputs to the default value
firstNameInput.value = "";
lastNameInput.value = "";
checkbox.checked = false;
submitButton.disabled = true;
burgers.selectedIndex = 0;
fries.selectedIndex = 0;
drinks.selectedIndex = 0;
times.selectedIndex = 0;

/**
 * This function will checks if all inputs were filled, thus allowing the submit button to be used 
 */
function inputsChecker() {
    if (firstNameInput.value.length >= 1 && lastNameInput.value.length >= 1 && checkbox.checked && submitButton.disabled && burgers.options[burgers.selectedIndex].value != "none" && fries.options[fries.selectedIndex].value != "none" && drinks.options[drinks.selectedIndex].value != "none" && times.options[times.selectedIndex].value != "none") {
        submitButton.disabled = false;
    } else if (firstNameInput.value.length < 1 || lastNameInput.value.length < 1 || !checkbox.checked || burgers.options[burgers.selectedIndex].value == "none" || fries.options[fries.selectedIndex].value == "none" || drinks.options[drinks.selectedIndex].value == "none" || times.options[times.selectedIndex].value == "none") {
        submitButton.disabled = true;
    }
}
inputsChecker();

// Adding event listeners to all inputs to check if they are filled
firstNameInput.addEventListener('input', inputsChecker);
lastNameInput.addEventListener('input', inputsChecker);
checkbox.addEventListener('input', inputsChecker);
burgers.addEventListener('input', inputsChecker);
fries.addEventListener('input', inputsChecker);
drinks.addEventListener('input', inputsChecker);
times.addEventListener('input', inputsChecker);

// Price calculation

/**
 * This function will calculates the price of the current selected command
 * @return float : Calculated price
 */
function calculatePrice() {
    var burgerPrice;
    var choice = burgers.options[burgers.selectedIndex].dataset.price
    if (choice) {
        burgerPrice = parseFloat(choice);
    } else {
        burgerPrice = 0.0;
    }
    
    var friesPrice;
    choice = fries.options[fries.selectedIndex].dataset.price
    if (choice) {
        friesPrice = parseFloat(choice);
    } else {
        friesPrice = 0.0;
    }

    var drinkPrice;
    choice = drinks.options[drinks.selectedIndex].dataset.price
    if (choice) {
        drinkPrice = parseFloat(choice);
    } else {
        drinkPrice = 0.0;
    }

    return burgerPrice + friesPrice + drinkPrice
}

/**
 * This function will update price on the form
 */
function updatePrice() {
    var string = calculatePrice().toString(); // Convert the price to String

    // Now we change it's format to match X.XX€
    const dec = string.split('.');
    if (dec[1]) {  
        if (dec[1].length == 1) { // If the length after "." is 1
            string += "0"
        }
    } else { // If the number did not have any decimal part
        string += ".00"
    }
    
    displayedPrice.innerHTML = string + "€";
}

updatePrice();
burgers.addEventListener('input', updatePrice);
fries.addEventListener('input', updatePrice);
drinks.addEventListener('input', updatePrice);

/**
 * This function will update the count for a given time in the form
 * @param {string} time : Time to update
 * @param {int} count : Count to update
 */
function updateCount(time, count) {
    const timeNode = document.getElementById("count-" + time);
    let originalContent = timeNode.innerHTML;

    // The string is in format "XXhXX (count/limit)"
    let limit = parseInt(originalContent.split(" ")[1].split("/")[1]);
    if (count >= limit) {
        timeNode.innerHTML = time + " (FULL)";
    } else {
        timeNode.innerHTML = time + " (" + count + "/" + limit + ")";
    }
    return;
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
            if (message[0] == "timeCountUpdate") {
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