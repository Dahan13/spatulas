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