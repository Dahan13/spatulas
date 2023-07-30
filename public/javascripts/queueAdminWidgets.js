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
    // In case there is no timestamps on the webpage, childnodes will be different
    let childNode = command.childNodes[1].childNodes[9]
    if (childNode == undefined) {
        childNode = command.childNodes[1].childNodes[7]
    }
    widgets.push(childNode.childNodes[1])
    widgets.push(childNode.childNodes[3])
    widgets.push(childNode.childNodes[5])
    return widgets
}