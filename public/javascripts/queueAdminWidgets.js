setTimeout(() => {
    window.location.reload();
}, 600000);



// Defining utility functions
function getCommand(id) {
    return document.getElementById(id);
}

function getWidgets(id) {
    let command = getCommand(id);   
    let widgets = [];
    widgets.push(command.childNodes[1].childNodes[9].childNodes[1])
    widgets.push(command.childNodes[1].childNodes[9].childNodes[3])
    widgets.push(command.childNodes[1].childNodes[9].childNodes[5])
    return widgets
}