// This part of the code is responsible for the popup that allows the user to create a new database

const tableAdderForm = "\
<h1> Create a new database </h1>\
<form action=\"/spadmin/createDatabase\" method=\"POST\">\
    <div class=\"input-div\">\
        <label for=\"foodName\"> Name of the new database : </label>\
        <input type=\"text\" id=\"foodName\" name=\"foodName\" maxlength=\"32\" placeholder=\"Burgers\"/>\
    </div>\
    <input type=\"submit\" value=\"Submit\" id=\"submit-button\" disabled/>\
</form>\
"

const tableAdderButton = document.querySelector(".database-adder");
const tableAdderButtonClassic = document.getElementById("database-adder-classic");

// Selecting the button that was toggled on depending of the display chosen
const tableAdderButtonSelected = (tableAdderButton) ? tableAdderButton : tableAdderButtonClassic;

tableAdderButtonSelected.addEventListener('click', () => {
    popup.innerHTML = tableAdderForm;

    // Adding input validation to the popup
    const submitButton = document.getElementById('submit-button');
    const databaseName = document.getElementById('foodName');

    databaseName.addEventListener('input', () => {
        if (databaseName.value.length >= 1 && databaseName.value.length <= 100) {
            submitButton.disabled = false;
        } else {
            submitButton.disabled = true;
        }
    })

    // Showing the actual popup
    popupVeil.classList.toggle("invisible");
})

// This part of the code is responsible for the button that allows to switch between the classic and the modern display

const displaySwitcher = document.getElementById("display-switcher");

displaySwitcher.addEventListener('click', () => {
    let currentTheme = displaySwitcher.dataset.theme;
    if (currentTheme == "classic")
        document.cookie = "theme=minimized";
    else if (currentTheme == "minimized")
        document.cookie = "theme=classic";
    location.reload();
})

// This part of the code is responsible for the popup that allows the user to add an element to a database

const elementAdderButtons = document.querySelectorAll(".element-adder");

function generateElementAdderForm(databaseName, databaseId) {
    return `
    <h1> ${databaseName} content manager </h1>
    <form action="/spadmin/add/${databaseId}/minimized" method="POST">
    <div class="input-div">
        <label for="name"> Name </label>
        <input type="text" id="name" name="name" required>
    </div>
    <div class="input-div">
        <label for="description"> Description </label>
        <input type="text" id="description" name="description" placeholder="Optional">
    </div>
    <div class="input-div">
        <label for="price"> Price </label>
        <input type="text" id="price" name="price" placeholder="Optional, float">
    </div>
    <input type="submit" value="Add a new item in ${databaseName}" id="Add a new ${databaseName}" />
    </form>
    `
}

if (elementAdderButtons) {
    for (let i = 0; i < elementAdderButtons.length; i++) {
        elementAdderButtons[i].addEventListener('click', (evt) => {
            popup.innerHTML = generateElementAdderForm(evt.target.dataset.databasename, evt.target.dataset.databaseid);
            popupVeil.classList.toggle("invisible");
        })
    }
}