// This part manage the popup search form
const searchButton = document.getElementById("search-button");

const searchForm = "\
<form action=\"queue\">\
    <h2> Search a command's number </h2>\
    <div class=\"input-div\">\
        <label for=\"last-name\"> Last Name </label>\
        <input type=\"text\" id=\"last-name\" name=\"last-name\" placeholder=\"Doe\">\
    </div>\
    <div class=\"input-div\">\
        <label for=\"first-name\"> First Name </label>\
        <input type=\"text\" id=\"first-name\" name=\"first-name\" placeholder=\"John\">\
    </div>\
    <input type=\"submit\" value=\"Search\" id=\"submit-button\" disabled/>\
</form>\
"




searchButton.addEventListener('click', () => {
    popup.innerHTML = searchForm;

    // Configuring user input checks
    const firstNameInput = document.getElementById("first-name");
    const lastNameInput = document.getElementById("last-name");
    const submitButton = document.getElementById("submit-button");

    function inputsChecker() {
        if (firstNameInput.value.length >= 1 && lastNameInput.value.length >= 1 && submitButton.disabled) {
            submitButton.disabled = false;
        } else if (firstNameInput.value.length < 1 || lastNameInput.value.length < 1) {
            submitButton.disabled = true;
        }
    }

    firstNameInput.addEventListener('input', inputsChecker);
    lastNameInput.addEventListener('input', inputsChecker);

    // Showing the actual popup
    popupVeil.classList.toggle("invisible");
})

// This part handle the reload system
const lastReloadTime = document.getElementById('last-update-time');
const d = new Date();
lastReloadTime.innerHTML = "" + d.getHours() + "h" + d.getMinutes();

const reloadButton = document.getElementById('reload-button');
reloadButton.addEventListener('click', () => {
    window.location.reload();
})