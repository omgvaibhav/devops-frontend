import SummaryTable from "./report table/Table";
import { getAccessToken } from "./login/auth";
import LoginPage from "./login/loginPage";
import { useEffect, useState } from "react";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    const storedToken = getAccessToken();
    if (storedToken) {
      setIsLoggedIn(true);
    }
  }, []);

  function loginWithGitHub(){
    window.location.assign("https://github.com/login/oauth/authorize?client_id=00454ee01e983c133293")
  }

  const logout = () => {
    localStorage.removeItem("accessToken");
    setIsLoggedIn(false);
  };

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
            }}
            onClick={logout}
          >
            Logout
          </button>
          <SummaryTable />
        </>
      ) : (
        <LoginPage onLogin={() => setIsLoggedIn(true)} />
      )}
    </>
  );
}

export default App;
