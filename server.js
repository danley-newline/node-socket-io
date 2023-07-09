var express = require("express");
var app = express();
var server = require("http").createServer(app);
var mongoose = require("mongoose");

app.use(express.static(__dirname + '/public'));

app.get("/", (req, res) => {
    res.render("index.ejs");
});

app.use((req, res, next) => {
    res.setHeader("Content-type","text/html");
    res.status(404).send("Page not found!");
});

var io = require('socket.io')(server);
io.on("connection", (socket) => {

    socket.on("pseudo", (pseudo) => {
        socket.pseudo = pseudo;
        socket.broadcast.emit('newUser', pseudo);
    });

    socket.on("newMessage", (message) => {
        socket.broadcast.emit("newMessageAll", { message: message, pseudo: socket.pseudo });
    });

    socket.on("writting", (pseudo) => {
        socket.broadcast.emit("writting", pseudo);
    });

    socket.on("notWritting", () => {
        socket.broadcast.emit("notWritting");
    });



    socket.on('disconnect', () => {
        socket.broadcast.emit("quitUser", socket.pseudo);
    });

    
    
})



server.listen(8080, () => console.log(`Server started at port 8080`));