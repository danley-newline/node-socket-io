var socket = io.connect("http://localhost:8080");

while (!pseudo) {
  var pseudo = prompt("Quel est ton  nom");
}

//EVENTS

socket.emit("pseudo", pseudo);
document.title = pseudo + " - " + document.title;

document.getElementById("chatForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const textInput = document.getElementById("msgInput").value;
  document.getElementById("msgInput").value = "";

  if (textInput.length > 0) {
    socket.emit("newMessage", textInput);
    creatElementFunction("newMessageMe", textInput);
  } else {
    return;
  }
});


socket.on("newUser", (pseudo) => {
  creatElementFunction("newUser", pseudo);
});

socket.on("newMessageAll", (content) => {
    creatElementFunction("newMessageAll", content);
});


socket.on("oldMessages", (messages) => {
    messages.forEach(message => {
        if (message.sender === pseudo) {
            creatElementFunction('oldMessagesMe', message);
        } else {
            creatElementFunction('oldMessages', message);
        }
    });
});

socket.on("writting", (pseudo) => {
    document.getElementById("isWritting").textContent = pseudo + " est entrain d'ecrire";
});


socket.on("notWritting", () => {
    document.getElementById("isWritting").textContent = "";

});

socket.on("quitUser", (pseudo) => {
  creatElementFunction("quitUser", pseudo);
});




//FUNCTIONS 


function writting(){
    socket.emit("writting", pseudo);
}

function notWritting(){
    socket.emit("notWritting");
}

function creatElementFunction(element, content) {
  const newElement = document.createElement("div");

  switch (element) {
    case "newUser":
        newElement.classList.add(element, "message");
        newElement.textContent = content + " a rejoint le chat ";
        document.getElementById("msgContainer").appendChild(newElement);
        break;
    case "newMessageMe":
        newElement.classList.add(element, "message");
        newElement.innerHTML = pseudo + ": " + content;
        document.getElementById("msgContainer").appendChild(newElement);
        break;
    case "newMessageAll":
        newElement.classList.add(element, "message");
        newElement.innerHTML = content.pseudo + ": " + content.message;
        document.getElementById("msgContainer").appendChild(newElement);
        break;
    case "oldMessages":
        newElement.classList.add(element, "message");
        newElement.innerHTML = content.sender + ": " + content.content;
        document.getElementById("msgContainer").appendChild(newElement);
        break;
    case "oldMessagesMe":
        newElement.classList.add('newMessageMe', "message");
        newElement.innerHTML = content.sender + ": " + content.content;
        document.getElementById("msgContainer").appendChild(newElement);
        break;

    case "quitUser":
        newElement.classList.add(element, "message");
        newElement.textContent = content + " a quitté le chat ";
        document.getElementById("msgContainer").appendChild(newElement);
        break;

    default:
      break;
  }
}
