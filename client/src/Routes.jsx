import React, { useContext } from "react";
import RegisterandLogin from "./RegisterandLogin";
import { userContext } from "./UserContext";
import Chat from "./Chat";

export default function Routes() {
  const { username, id } = useContext(userContext);

  if (username) {
    return <Chat />;
  }
  return <RegisterandLogin />;
}
