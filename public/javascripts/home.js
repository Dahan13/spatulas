// Input validation
const firstNameInput = document.getElementById("firstName");
const lastNameInput = document.getElementById("lastName");
const checkbox = document.getElementById("accept");
const submitButton = document.getElementById("submit-button");

/**
 * This function will checks if all inputs were filled, thus allowing the submit button to be used 
 */
function inputsChecker() {
    if (firstNameInput.value.length >= 1 && lastNameInput.value.length >= 1 && checkbox.checked && submitButton.disabled) {
        submitButton.disabled = false;
    } else if (firstNameInput.value.length < 1 || lastNameInput.value.length < 1 || !checkbox.checked) {
        submitButton.disabled = true;
    }
}
inputsChecker();

firstNameInput.addEventListener('input', inputsChecker);
lastNameInput.addEventListener('input', inputsChecker);
checkbox.addEventListener('input', inputsChecker);

// Price calculation
const burgers = document.getElementById("burger");
const fries = document.getElementById("fries");
const drinks = document.getElementById("drink");
const displayedPrice = document.getElementById("price-range");

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