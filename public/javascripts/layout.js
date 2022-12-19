const popupVeil = document.querySelector(".veil");

popupVeil.addEventListener('click', (event) => {
    if (event.target == popupVeil) {
        popupVeil.classList.toggle("invisible");
    }
    return;
})