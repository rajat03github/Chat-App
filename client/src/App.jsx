import axios from "axios";
import { UsercontextProvider } from "./UserContext";
import Routes from "./Routes";

function App() {
  axios.defaults.baseURL = "http://localhost:5000";
  axios.defaults.withCredentials = true;

  // Using Tailwind
  return (
    <UsercontextProvider>
      <Routes />
    </UsercontextProvider>
  );
}

export default App;
