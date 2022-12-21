// This code will handle the general popup system. Custom functions still need to make it appears (popupVeil.classList.toggle("invisible");) and fill the popup with content.
const popupVeil = document.querySelector(".veil");

popupVeil.addEventListener('click', (event) => {
    if (event.target == popupVeil) {
        popupVeil.classList.toggle("invisible");
    }
    return;
})