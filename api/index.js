//Server-Side to communicate
const mongoose = require("mongoose");
const express = require("express");
const User = require("./models/User");
const cookiesParser = require("cookie-parser");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const ws = require("ws");
const Message = require("./models/Message");
const fs = require("fs"); //fs - fileSystem library for Attachments

const bcryptSalt = bcrypt.genSaltSync(10);

const app = express(); //After adding Express = now we can define the app

// For Info of .env for MongoDB-URL and JWT
const dotenv = require("dotenv");
dotenv.config();

// Get User ID with TOken
async function getUserDatafromReq(req) {
  return new Promise((resolve, reject) => {
    const token = req.cookies?.token;
    if (token) {
      jwt.verify(token, jwtSecret, {}, (err, userData) => {
        if (err) throw err;
        resolve(userData);
      });
    } else {
      reject("No token");
    }
  });
}
// making Upload directory to use in THe Database
app.use("/uploads", express.static(__dirname + "/uploads"));

// CORS---
app.use(
  cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
  })
);

app.use(express.json());

// yarn add jsonwebtoken - security
const jwt = require("jsonwebtoken"); //For Auth
const cookieParser = require("cookie-parser");
const jwtSecret = process.env.JWT_SECRET;

// Connecting To DataBase
mongoose.connect(process.env.MONGO_URL, (err) => {
  if (err) throw err;
}); //connected With DataBase

// EndPoints-
// Creating User
app.post("/register", async (req, res) => {
  const { username, password } = req.body; // Grab The Input Data
  try {
    // hashing Password
    const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
    const createdUser = await User.create({
      username: username,
      password: hashedPassword,
    }); //Create The Entry in DB
    //  Authentication Of User-_id will give ID of User from MongoDB

    jwt.sign(
      { userId: createdUser._id, username },
      jwtSecret,
      {},
      (err, token) => {
        if (err) throw err;
        res
          .cookie("token", token, { sameSite: "none", secure: true })
          .status(201)
          .json({
            id: createdUser._id,
          });
      }
    );
  } catch (err) {
    if (err) throw err;
    res.status(500).json("error");
  }
});

// To authorize Cookies
app.use(cookieParser());

app.get("/profile", (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    jwt.verify(token, jwtSecret, {}, (err, userData) => {
      if (err) throw err;
      res.json(userData);
    });
  } else {
    res.status(200).json("no token");
  }
});

// Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const foundUser = await User.findOne({ username });
  if (foundUser) {
    const passOk = bcrypt.compareSync(password, foundUser.password);
    if (passOk) {
      jwt.sign(
        { userId: foundUser._id, username },
        jwtSecret,
        {},
        (err, token) => {
          res.cookie("token", token, { sameSite: "none", secure: true }).json({
            id: foundUser._id,
          });
        }
      );
    }
  }
});

// storing Messages
app.get("/messages/:userId", async (req, res) => {
  const { userId } = req.params; //userID
  const userData = await getUserDatafromReq(req);
  //OurId-
  const ourUserId = userData.userId;

  // from MessageModel
  const messages = await Message.find({
    sender: { $in: [userId, ourUserId] },
    recipient: { $in: [userId, ourUserId] },
  }).sort({ createdAt: 1 });
  res.json(messages);
});

// Online People -
app.get("/people", async (req, res) => {
  const users = await User.find({}, { _id: 1, username: 1 });
  res.json(users);
});

// LoggingOut -
app.post("/signout", (req, res) => {
  res.cookie("token", "", { sameSite: "none", secure: true }).json("ok");
});

// Server---
const server = app.listen(5000); //PORT-5000
// http://localhost:5000/test run this in new Tab after using Nodemon
// // Testing
app.get("/test", (req, res) => {
  res.json("test oKay");
});

// Web-Socket Server ---
// ws- is just library , wss- is server

const wss = new ws.WebSocketServer({ server });
wss.on("connection", (connection, req) => {
  // connection.isAlive = true; //onlineUser

  // // Offline Connection --
  connection.timer = setInterval(() => {
    connection.ping();
    connection.deathTimer = setTimeout(() => {
      connection.isAlive = false;
      clearInterval(connection.timer);
      connection.terminate();
      // Notify about Offline
      [...wss.clients].forEach((client) => {
        client.send(
          // Will give data
          JSON.stringify({
            online: [...wss.clients].map((c) => ({
              userId: c.userId,
              username: c.username,
            })),
          })
        );
      });
    }, 1000);
  }, 5000);

  // Callback for pong
  connection.on("pong", () => {
    clearTimeout(connection.deathTimer);
  });

  // to see active connections

  // Read username and Id from the cookie for this coonection
  const cookies = req.headers.cookie;
  if (cookies) {
    const tokenCookieString = cookies
      .split(";")
      .find((str) => str.startsWith("token="));

    if (tokenCookieString) {
      //we need only after token='part'
      const token = tokenCookieString.split("=")[1];
      if (token) {
        jwt.verify(token, jwtSecret, {}, (err, userData) => {
          if (err) throw err;
          // Put userData into Connection
          const { userId, username } = userData;
          // Saving Connected User
          connection.userId = userId;
          connection.username = username;
        });
      }
    }

    connection.on("message", async (message) => {
      // message is an object
      const messageData = JSON.parse(message.toString());
      const { recipient, text, file } = messageData;

      let filename = null;

      // ATTACHMENTS--
      //file is for attachments
      if (file) {
        // Extracting parts from"." and taking only last extension ex- png
        const parts = file.name.split(".");
        const ext = parts[parts.length - 1]; //will get last extension
        filename = Date.now() + "." + ext; //creating new File name

        //The Path for Storing  Attached File
        const path = __dirname + "/uploads/" + filename;

        //decoding the file data
        const bufferData = new Buffer(file.data.split(",")[1], "base64");

        fs.writeFile(path, bufferData, () => {
          console.log("file saved" + path);
        });
      }
      // Check for Msgs and file
      if (recipient && (text || file)) {
        // Saving Message To database
        const MessageDoc = await Message.create({
          sender: connection.userId,
          recipient,
          text,
          file: file ? filename : null,
        });

        [...wss.clients]
          .filter((c) => c.userId === recipient)
          .forEach((c) =>
            c.send(
              JSON.stringify({
                text,
                sender: connection.userId,
                recipient,
                file: file ? filename : null,
                _id: MessageDoc._id,
              })
            )
          );
      }
    });
  }
  // notify everyone about Online Connected People
  //this object of clients will transform into array
  [...wss.clients].forEach((client) => {
    client.send(
      // Will give data
      JSON.stringify({
        online: [...wss.clients].map((c) => ({
          userId: c.userId,
          username: c.username,
        })),
      })
    );
  });
});

// On Disconnection
// wss.on("close", (data) => {});
