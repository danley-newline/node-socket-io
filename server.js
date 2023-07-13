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



app.get("/", async (req, res) => {
    try {
        const users = await User.find();
        if (users) {
          const channels = await Room.find();
          if (channels) {
            res.render("index.ejs", { users: users, channels: channels });
          }else{
            res.render("index.ejs", { users: users });
          }
          res.render("index.ejs", { users: users });
        }else {
          const channels = await Room.find();
          if (channels) {
            res.render("index.ejs", { channels: channels });
          }else{
            res.render("index.ejs");
          }
          res.render("index.ejs");

        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Erreur de serveur");
    }
});

app.use((req, res, next) => {
    res.setHeader("Content-type","text/html");
    res.status(404).send("Page not found!");
});

var io = require('socket.io')(server);
var connectedUsers = [];
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

          _joinRoom("salon1");
          connectedUsers.push(socket);
          
          const messages = await Chat.find({ receiver: 'all'});
          socket.emit('oldMessages', messages);
          socket.broadcast.emit('newUserInDb', pseudo);

        } catch (err) {
            console.log(err);
          // Gérer les erreurs ici
        }
      });

      socket.on("oldWhispers", async (pseudo) => {
        const messages = await Chat.find({ receiver: pseudo}).limit(3);

        if (messages) {
            socket.emit("oldWhispers", messages);
        }

      })

      socket.on("newMessage", async (message, receiver) => {
        if (receiver == "all") {
          var chat = new Chat();
          chat.content = message;
          chat.sender = socket.pseudo;
          chat.receiver = "all";
          await chat.save();
      
          socket.broadcast.emit("newMessageAll", { message: message, pseudo: socket.pseudo });
        } else {
          try {
            const user = await User.findOne({ pseudo: receiver }).exec();
      
            if (user) {
              const socketReceiver = connectedUsers.find((socket) => socket.pseudo === user.pseudo);
      
              if (socketReceiver) {
                socketReceiver.emit("whisper", { sender: socket.pseudo, message: message });
              }
      
              var chat = new Chat();
              chat.content = message;
              chat.sender = socket.pseudo;
              chat.receiver = receiver;
              await chat.save();
            } else {
              console.log("User not found");
              return false;
            }
          } catch (err) {
            console.error(err);
            return false;
          }
        }
      });

    socket.on("writting", (pseudo) => {
        socket.broadcast.emit("writting", pseudo);
    });

    socket.on("notWritting", () => {
        socket.broadcast.emit("notWritting");
    });



    socket.on('disconnect', () => {
        var index = connectedUsers.indexOf(socket);
        if (index > -1) {
            connectedUsers.splice(index, 1);
        }

        socket.broadcast.emit("quitUser", socket.pseudo);
    });

    
     async function _joinRoom(channelParam){
      socket.leaveAll();
      socket.join(channelParam);
      socket.channel = channelParam;

      const roomChannel = await Room.findOne({ name: socket.channel }).exec();
        if (roomChannel) {
        
        }else {
          var room = new Room();
          room.name = socket.channel;
          await room.save();

          socket.broadcast.emit("newChannel", socket.channel);
        }

    }
});



server.listen(8080, () => {
    connect(); 
    console.log("Server started at 8080");
})