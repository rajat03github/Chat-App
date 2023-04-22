import { React, useContext, useState } from "react";
import Axios from "axios";
import { userContext } from "./UserContext";
// Using Tailwind CSS

export default function RegisterandLogin() {
  // States
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { setUsername: setLoggedInUsername, setId } = useContext(userContext);
  const [isLoginorRegister, setIsLoginorRegister] = useState("login");

  async function handleSubmit(ev) {
    ev.preventDefault(); //this will save from not sending to another link

    const url = isLoginorRegister === "register" ? "register" : "login";

    const { data } = await Axios.post(url, { username, password });
    setLoggedInUsername(username);
    setId(data.id);
  }

  return (
    <div className="bg-blue-50 h-screen flex items-center">
      <form className="w-64 mx-auto mb-12" onSubmit={handleSubmit}>
        {/* Username */}
        <input
          value={username}
          onChange={(ev) => setUsername(ev.target.value)} //OnChange will run this State
          type="text"
          placeholder="Username"
          className="block w-full rounded-sm p-2 mb-2 border"
        />

        {/* Password */}
        <input
          value={password}
          type="password"
          onChange={(ev) => setPassword(ev.target.value)} //OnChange will run this State
          placeholder="Password"
          className="block w-full rounded-sm p-2 mb-2 border"
        />

        {/* button */}
        <button className="bg-blue-400 text-white block w-full rounded-md p-2">
          {isLoginorRegister === "register" ? "Register" : "Login"}
        </button>
        <div className="text-center mt-2">
          {isLoginorRegister === "register" && (
            <div>
              Not a New user?
              <button
                className="ml-1"
                onClick={() => setIsLoginorRegister("login")}>
                Login Here
              </button>
            </div>
          )}
          {isLoginorRegister === "login" && (
            <div>
              Don't have an Account ?
              <button
                className="ml-1"
                onClick={() => setIsLoginorRegister("register")}>
                Register
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
