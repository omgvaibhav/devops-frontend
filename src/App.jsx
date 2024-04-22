import SummaryTable from "./report table/Table";
import { getAccessToken, login, getAdmin } from "./login/auth";
// import LoginPage from "./login/loginPage";
import { useEffect, useState } from "react";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const storedToken = getAccessToken();
    const storedAdmin = getAdmin();
    if (storedToken) {
      setIsLoggedIn(true);
      console.log("Logged in");
      console.log(`admin: ${storedAdmin}`);
    }
    const query = window.location.search;
    const params = new URLSearchParams(query);
    const codeParam = params.get("code");
    //console.log(`code: ${codeParam}`);
    if (codeParam && localStorage.getItem("accessToken") === null) {
      setIsLoggedIn(true);
      const handleLogin = async () => {
        try {
          const { accessToken } = await login(codeParam);
          //console.log(accessToken.token);
          if (accessToken) {
            alert("login successful!");
            window.location.reload();
          }
        } catch (error) {
          console.error("Login failed", error);
        }
      };

      handleLogin();
    }
  }, []);

  const loginWithGitHub = async (event) => {
    event.preventDefault();
    try {
      window.location.assign(
        `https://github.com/login/oauth/authorize?client_id=${
          import.meta.env.VITE_APP_CLIENT_ID
        }`
      );
    } catch (error) {
      alert("login failed");
      console.error("Login failed", error);
    }
  };

  function logOut() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("adminStatus");
    setIsLoggedIn(!isLoggedIn);
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete("code");
    window.history.pushState({}, "", currentUrl.toString());
  }

  return (
    <>
      {isLoggedIn ? (
        <>
          <button
            style={{
              padding: "10px 20px",
              border: "none",
              borderRadius: "5px",
              backgroundColor: "#007bff",
              color: "white",
              cursor: "pointer",
              marginBottom: "10px",
            }}
            onClick={logOut}
          >
            Logout
          </button>
          <SummaryTable />
        </>
      ) : (
        <button
          style={{
            padding: "10px 20px",
            border: "none",
            borderRadius: "5px",
            backgroundColor: "#007bff",
            color: "white",
            cursor: "pointer",
          }}
          onClick={loginWithGitHub}
        >
          log in with GitHub
        </button>
      )}
    </>
  );
}

export default App;
