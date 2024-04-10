import { useState, useEffect } from "react";
import { login, getAccessToken } from "./auth";
import "./loginPage.css";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const storedToken = getAccessToken();
    if (storedToken) {
      console.log("Logged in");
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const { accessToken } = await login(username, password);
      //localStorage.setItem('accessToken', accessToken);
      if (accessToken) {
        alert(accessToken);
        window.location.reload();
      }
    } catch (error) {
        alert("login failed");
      console.error("Login failed", error);
    }
  };

  return (
    <>
      <form className="loginform" onSubmit={handleSubmit}>
        <h2>Login</h2>
        <label htmlFor="useranme">Username</label>
        <input
          id="useranme"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <label htmlFor="password">Password </label>

        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Login</button>
      </form>
    </>
  );
}
