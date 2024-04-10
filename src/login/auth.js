import axios from 'axios';

export async function login(username, password) {
  const response = await axios.post('http://localhost:3001/login', { username, password });
  //console.log(response.data);
  localStorage.setItem('accessToken', response.data.token);
  return {
    accessToken: response.data.message,
  };
}

export function getAccessToken() {
  return localStorage.getItem('accessToken');
}