import axios from "axios";
import { createContext, useEffect, useState } from "react";

export const userContext = createContext({});

export function UsercontextProvider({ children }) {
  const [username, setUsername] = useState(null);
  const [id, setId] = useState(null);

  // whenever this is used, we gonna do
  useEffect(() => {
    axios.get("/profile").then((response) => {
      setId(response.data.userId);
      setUsername(response.data.username);
    });
  }, []);

  return (
    <userContext.Provider value={{ username, setUsername, id, setId }}>
      {children}
    </userContext.Provider>
  );
}
