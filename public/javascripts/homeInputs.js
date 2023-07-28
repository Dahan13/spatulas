// Input validation
const firstNameInput = document.getElementById("firstName");
const lastNameInput = document.getElementById("lastName");
const checkbox = document.getElementById("accept");
const submitButton = document.getElementById("submit-button");
const times = document.getElementById("time");
const selectInputs = document.querySelectorAll('select');

// Reseting on page load all inputs to the default value
firstNameInput.value = "";
lastNameInput.value = "";
checkbox.checked = false;
submitButton.disabled = true;
if (times) times.selectedIndex = 0;
resetSelects();

/**
 * This function will checks if all inputs were filled, thus allowing the submit button to be used 
 */
function inputsChecker() {
    if (firstNameInput.value.length >= 1 && lastNameInput.value.length >= 1 && checkbox.checked && submitButton.disabled && checkSelects()) {
        if ((times && times.options[times.selectedIndex].value != "none") || (!times)) {
            submitButton.disabled = false;
        }
    } else if (firstNameInput.value.length < 1 || lastNameInput.value.length < 1 || !checkbox.checked || !checkSelects()) {
        submitButton.disabled = true;
    } else if (times && times.options[times.selectedIndex].value == "none" ) {
        submitButton.disabled = true;
    }
}
inputsChecker();

// Adding event listeners to all inputs to check if they are filled
firstNameInput.addEventListener('input', inputsChecker);
lastNameInput.addEventListener('input', inputsChecker);
checkbox.addEventListener('input', inputsChecker);
if (times) times.addEventListener('input', inputsChecker);
for (let i = 0; i < selectInputs.length; i++) {
    selectInputs[i].addEventListener('input', inputsChecker);
}

/**
 * This function will reset all select inputs to the default value
 */
function resetSelects() {
    for (let i = 0; i < selectInputs.length; i++) {
        selectInputs[i].selectedIndex = 0;
    }
}

/**
 * This function will check if all select inputs are filled
 * @return boolean : True if all select inputs are filled, false otherwise
 */
function checkSelects() {
    for (let i = 0; i < selectInputs.length; i++) {
        if (selectInputs[i].options[selectInputs[i].selectedIndex].value == "none") {
            return false;
        }
    }
    return true;
}




