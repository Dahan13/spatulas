// Handle the widget to add a new time entry
let addTimeButton = document.querySelector(".time-adder");
let format = addTimeButton.dataset.format;

// Generating the form depending on the format
let adderForm = "Format not recognized, please contact the administrator.";
if (format == "day") {
    adderForm = `
    <form action="/spadmin/time/addTime" method="POST">
        <div class="time-selector">
            <label for="time"> Time :</label>
            <div class="time-input">
                <img id="time-button" src="/images/spadmin/clock.webp">
                <input type="text" name="time" for="time" readonly id="time" required>
            </div>
        </div>
        <div class="date-selector">
            <label for="date"> Date :</label>
            <aeon-datepicker locale="en-us">
                <input type="date" name="date" for="date" id="date" required>
            </aeon-datepicker>
        </div>
        <input type="submit" value="Submit" id="submit-button" disabled/>
    </form>
    `;
} else if (format == "hour") {
    adderForm = `
    <form action="/spadmin/time/addTime" method="POST">
        <div class="time-selector">
            <label for="time"> Time :</label>
            <div class="time-input">
                <img id="time-button" src="/images/spadmin/clock.webp">
                <input type="text" name="time" for="time" readonly id="time" required>
            </div>
        </div>
        <input type="submit" value="Submit" id="submit-button" disabled/>
    </form>
    `;
}

addTimeButton.addEventListener('click', () => {
    // Displaying the popup
    popup.innerHTML = adderForm;
    popupVeil.classList.toggle("invisible");

    var timePicker = new TimePicker('#time-button', {
        lang: 'en',
        theme: 'dark'
    });
    
    // Setting up the time picker
    let timePickerButton = document.getElementById("time-button");
    let timePickerInput = document.getElementById("time");
    timePickerButton.addEventListener('click', () => {
        timePicker.show();
    });

    let submitButton = document.getElementById("submit-button");
    timePicker.on('change', function(evt) {
        var value = (evt.hour || '00') + ':' + (evt.minute || '00');
        timePickerInput.value = value;
        // enabling submit button if the value is valid
        if (value.length >= 4) {
            submitButton.disabled = false;
        } else {
            submitButton.disabled = true;
        }
    });
})

// This part is used to handle the custom limits editing part

const customLimitsButton = document.querySelectorAll(".limit")

for (let i = 0; i < customLimitsButton.length; i++) {
    customLimitsButton[i].addEventListener('click', (evt) => {
        let id = evt.target.dataset.id;
        let limit = evt.target.dataset.limit;

        let popupContent = `
        <form action="/spadmin/time/editLimit/${id}" method="POST">
        <label for="limit"> Limit :</label>
        <input type="number" name="limit" for="limit" id="limit" value="${limit}" required>
        <input type="submit" value="Submit" id="submit-button"/>
        </form>
        `;

        popup.innerHTML = popupContent;
        popupVeil.classList.toggle("invisible");
    })
}