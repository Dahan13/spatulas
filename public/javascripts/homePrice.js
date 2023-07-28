const displayedPrice = document.getElementById("price-range");

// Updating price and setting up all event listeners on page load
updatePrice();
for (let i = 0; i < selectInputs.length; i++) {
    selectInputs[i].addEventListener('input', updatePrice);
}

/**
 * This function return the total price of current selected options
 * @return {float} price Total price of current selected options
 */
function getSelectsPrice() {
    let price = 0;
    for (let i = 0; i < selectInputs.length; i++) {
        selectPrice = parseFloat(selectInputs[i].options[selectInputs[i].selectedIndex].dataset.price);
        if (selectPrice) {
            price += selectPrice;
        }
    }
    return price;
}

/**
 * This function will calculates the price of the current selected command
 * @return {float} price Total price of current selected options
 */
function calculatePrice() {
    return getSelectsPrice();
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

/**
 * This function will update the count for a given time in the form
 * @param {string} time : Time to update
 * @param {int} count : Count to update
 */
function updateCount(time, count) {
    const timeNode = document.getElementById("count-" + time);
    let originalContent = timeNode.innerHTML;

    originalContent = originalContent.split(" ");
    time = (originalContent.length == 3) ? originalContent[0] + " " + originalContent[1] : originalContent[0];
    let limit = parseInt(originalContent[originalContent.length - 1].split("/")[1]);
    if (count >= limit) {
        timeNode.innerHTML = time + " (FULL)";
    } else {
        timeNode.innerHTML = time + " (" + count + "/" + limit + ")";
    }
    return;
}