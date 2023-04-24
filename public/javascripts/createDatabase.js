const submitButton = document.getElementById('submit-button');
const databaseName = document.getElementById('foodName');
const itemName = document.getElementById('name');
const itemDescription = document.getElementById('description');
const itemPrice = document.getElementById('price');

// Reseting on page load all inputs to the default value
databaseName.value = "";
itemName.value = "";
itemDescription.value = "";
itemPrice.value = "";

// Validating input
databaseName.addEventListener('input', () => {
    if (databaseName.value.length >= 1 && databaseName.value.length <= 100) {
        submitButton.disabled = false;
    } else {
        submitButton.disabled = true;
    }
})