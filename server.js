var express = require("express");
var app = express();
var server = require("http").createServer(app);
var dotenv = require("dotenv")
var mongoose = require("mongoose");

const ObjectId = mongoose.Types.ObjectId;
dotenv.config()


const connect = async ()=>{
    try {
        await mongoose.connect(process.env.MONGO);
        console.log("Connected to mongo db");
    } catch (error) {
        throw(error);
    }
};

require("./models/chat.js");
require("./models/user.js");
require("./models/room.js");

var User = mongoose.model("user");
var Room = mongoose.model("room");
var Chat = mongoose.model("chat");

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

    socket.on("pseudo", async (pseudo) => {
        try {
          const user = await User.findOne({ pseudo: pseudo });
      
          if (user) {
            socket.pseudo = pseudo;
            socket.broadcast.emit('newUser', pseudo);
          } else {
            const newUser = new User({ pseudo });
            await newUser.save();
          }
          
          const messages = await Chat.find();
          socket.emit('oldMessages', messages);

        } catch (err) {
            console.log(err);
          // Gérer les erreurs ici
        }
      });

    socket.on("newMessage", (message) => {
        var chat = new Chat();
        chat.content = message;
        chat.sender = socket.pseudo;
        chat.save();

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



server.listen(8080, () => {
    connect(); 
    console.log("Server started at 8080");
})