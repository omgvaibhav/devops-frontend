import axios from "axios";

export async function login(codeParam) {
  try {
    const apiUrl = process.env.REACT_APP_API_BASE_URL;
    const response = await axios.get(`${apiUrl}/login?code=${codeParam}`);
    //console.log(response.data);
    localStorage.setItem("accessToken", response.data.token);
    localStorage.setItem("adminStatus", response.data.admin);
    return {
      accessToken: response.data,
    };
  } catch (e) {
    console.error(`error in authjs:\n ${e}`);
  }
}

export function getAccessToken() {
  return localStorage.getItem("accessToken");
}

export function getAdmin() {
  const adminString = localStorage.getItem("adminStatus");
  return JSON.parse(adminString);
}
