const submitButton = document.getElementById('submit-button');
const databaseName = document.getElementById('foodName');

// Reseting on page load all inputs to the default value
databaseName.value = "";

// Validating input
databaseName.addEventListener('input', () => {
    if (databaseName.value.length >= 1 && databaseName.value.length <= 100) {
        submitButton.disabled = false;
    } else {
        submitButton.disabled = true;
    }
})