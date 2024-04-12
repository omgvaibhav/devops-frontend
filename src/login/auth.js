import axios from 'axios';

export async function login(username, password) {
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const response = await axios.post(`${apiUrl}/login`, { username, password });
  //console.log(response.data);
  localStorage.setItem('accessToken', response.data.token);
  return {
    accessToken: response.data.message,
  };
}

export function getAccessToken() {
  return localStorage.getItem('accessToken');
}