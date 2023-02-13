setTimeout(() => {
    window.location.reload();
}, 15000);

// Managing command count
const countPrompt = document.getElementById("command-count");
const commandsContainer = document.querySelector(".commands-container");

function updateCount() {
    if (commandsContainer) {
        countPrompt.innerHTML = commandsContainer.childElementCount;
    } else {
        countPrompt.innerHTML = 0;
    }
}

updateCount();
