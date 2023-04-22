import React, { useId } from "react";
import { useEffect, useState, useContext } from "react";
import Avatar from "./Avatar";
import Logo from "./Logo";
import { uniqBy } from "lodash";
import { userContext } from "./UserContext";
import { useRef } from "react";
import axios from "axios";
import Contact from "./Contact";

export default function Chat() {
  // useStates --
  const [onlinePeople, setOnlinePeople] = useState({}); //onlinePeople will be in Object so default is Object
  const [selectedUserID, setSelectedUserID] = useState(null);
  // OurUser
  const { username, id, setId, setUsername } = useContext(userContext);
  // WebSocket
  const [ws, setWs] = useState(null);
  // Msg
  const [newMessage, setNewMessage] = useState("");
  // Message to display in chatbox
  const [messages, setMessages] = useState([]);
  // to get Scroll on down when new Msg PopUp
  const divUnderMessages = useRef();
  // Setting Offline People
  const [offlinePeople, setOfflinePeople] = useState({});

  //UseEffects --
  // Connecting To ws for reconnecting
  useEffect(() => {
    connectToWs();
  }, [selectedUserID]);

  //for smooth scrolling
  useEffect(() => {
    const div = divUnderMessages.current;
    if (div) {
      div.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  // Getting Messages From the Database
  useEffect(() => {
    if (selectedUserID) {
      axios.get("/messages/" + selectedUserID).then((res) => {
        setMessages(res.data);
      });
    }
  }, [selectedUserID]);

  // Everytime Online People Changes (App Open)
  useEffect(() => {
    axios.get("/people").then((res) => {
      const offlinePeopleArray = res.data
        .filter((p) => p._id !== id)
        .filter((p) => !Object.keys(onlinePeople).includes(p._id));
      const offlinePeople = {};
      offlinePeopleArray.forEach((p) => {
        offlinePeople[p._id] = p;
      });
      setOfflinePeople(offlinePeople);
    });
  }, [onlinePeople]);

  // Functions ----

  // Stay Users Online
  function connectToWs() {
    const ws = new WebSocket("ws://localhost:5000");
    setWs(ws);

    ws.addEventListener("message", handleMessage);
    // AfterDisconnection we are Reconnecting
    ws.addEventListener("close", () => {
      setTimeout(() => {
        console.log("Disconnected");
        connectToWs();
      }, 1000);
    });
  }

  // LogOff
  let signout = () => {
    axios.post("/signout").then(() => {
      setWs(null);
      setId(null);
      setUsername(null);
    });
  };

  function showOnlinePeople(peopleArray) {
    // For making users Unique !
    const people = {};
    peopleArray.forEach(({ userId, username }) => {
      people[userId] = username;
    });
    setOnlinePeople(people);
  }

  // To Show Online People
  function handleMessage(ev) {
    const messageData = JSON.parse(ev.data);
    console.log({ ev, messageData });
    if ("online" in messageData) {
      showOnlinePeople(messageData.online);
    } else if ("text" in messageData) {
      // For Incoming Messages Display
      // only if sender and reciever is same !!
      if (messageData.sender === selectedUserID) {
        setMessages((prev) => [...prev, { ...messageData }]);
      }
    }
  }

  // Send mssg
  function sendMessage(ev, file = null) {
    if (ev) {
      ev.preventDefault(); //So not reloading
    }

    ws.send(
      JSON.stringify({
        recipient: selectedUserID,
        text: newMessage,
        file,
      })
    );

    if (file) {
      axios.get("/messages/" + selectedUserID).then((res) => {
        setMessages(res.data);
      });
    } else {
      setNewMessage(""); //will set to empty after send
      //  For Outgoing Messages Display
      setMessages((prev) => [
        ...prev,
        {
          text: newMessage,
          sender: id,
          recipient: selectedUserID,
          _id: Date.now(),
        },
      ]);
    }
  }

  // Uploading File -- Atttachments

  let uploadFile = (event) => {
    // converting to Base64 for data
    const reader = new FileReader();
    reader.readAsDataURL(event.target.files[0]);
    reader.onload = () => [
      // reader.result will have the data
      sendMessage(null, {
        name: event.target.files[0].name,
        data: reader.result,
      }),
    ];
  };

  // a copy of object of our user
  const onlinePeopleExcludigMe = { ...onlinePeople };
  delete onlinePeopleExcludigMe[id];

  // USing Lodash for Only One unique Message
  const messageWithoutDupes = uniqBy(messages, "_id");

  return (
    <div className="flex h-screen">
      <div className="bg-white w-1/3 flex flex-col ">
        <div className="flex-grow">
          <Logo />
          {/* {username} */}
          {/* Now Showing Connected Users here */}
          {Object.keys(onlinePeopleExcludigMe).map((userId) => (
            <Contact
              key={userId}
              id={userId}
              online={true}
              username={onlinePeopleExcludigMe[userId]}
              onClick={() => setSelectedUserID(userId)}
              selected={userId === selectedUserID}
            />
          ))}
          {Object.keys(offlinePeople).map((userId) => (
            <Contact
              key={userId}
              id={userId}
              online={false}
              username={offlinePeople[userId].username}
              onClick={() => setSelectedUserID(userId)}
              selected={userId === selectedUserID}
            />
          ))}
        </div>

        <div className="p-2 text-center flex items-center justify-center ">
          <span className="mr-10 items-center text-sm text-gray-500 flex ">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 mr-1 h-6">
              <path
                fillRule="evenodd"
                d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
                clipRule="evenodd"
              />
            </svg>
            {username}
          </span>
          <button
            onClick={signout}
            className="text-sm text-gray-600 bg-blue-100 py-1 px-2 border rounded-l">
            Logout
          </button>
        </div>
      </div>
      <div className="flex flex-col bg-blue-100 w-2/3 p-2">
        <div className="flex-grow">
          {!selectedUserID && (
            <div className="flex h-full items-center justify-center">
              <div className="text-gray-400">Inbox</div>
            </div>
          )}
          {!!selectedUserID && (
            <div className="relative h-full ">
              <div className="overflow-y-scroll absolute top-0 left-0 right-0 bottom-2">
                {messageWithoutDupes.map((message) => (
                  <div
                    key={message._id}
                    className={
                      message.sender === id ? "text-right" : "text-left"
                    }>
                    <div
                      className={
                        "text-left inline-block p-2 my-2 rounded-xl text " +
                        (message.sender === id
                          ? " bg-blue-500 text-white"
                          : "bg-white text-gray-500")
                      }>
                      {message.text}
                      {message.file && (
                        <div className="">
                          <a
                            target="_blank"
                            className="underline flex items-center gap-1"
                            href={
                              axios.defaults.baseURL +
                              "/uploads/" +
                              message.file
                            }>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-4 h-4">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                              />
                            </svg>
                            {message.file}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={divUnderMessages}></div>
              </div>
            </div>
          )}
        </div>
        {!!selectedUserID && (
          <form className="flex gap-2 " onSubmit={sendMessage}>
            <input
              value={newMessage}
              onChange={(ev) => setNewMessage(ev.target.value)}
              type="text"
              className="bg-white flex-grow border p-2 rounded-md"
              placeholder="Send a Msg"
            />
            {/* Attachments */}
            <label
              type="button"
              className="bg-blue-200 p-2 text-gray-600 rounded-md border-blue-200 cursor-pointer">
              {/* Using this to attach */}
              <input type="file" className="hidden " onChange={uploadFile} />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                />
              </svg>
            </label>
            <button
              type="submit"
              className="bg-blue-500 p-2 text-white rounded-md">
              {/* Airplane Icon from heroIcons */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
