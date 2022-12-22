// This code will handle the general popup system. Custom functions still need to make it appears (popupVeil.classList.toggle("invisible");) and fill the popup with content.
const popupVeil = document.querySelector(".veil");
const popup = document.querySelector(".popup");

popupVeil.addEventListener('click', (event) => {
    if (event.target == popupVeil) {
        popupVeil.classList.toggle("invisible");
        popup.innerHTML = "";
    }
    return;
})