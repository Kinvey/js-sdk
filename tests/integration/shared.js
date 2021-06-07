const fs = require('fs');
const path = require('path');
const axios = require('axios');
const otplib = require('otplib');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

axios.defaults.baseURL = 'https://console.kinvey.com/_api/v4/';
axios.defaults.headers.post['Content-Type'] = 'application/json';

function login(retries=3) {
  const twoFactorToken = process.env.ACCOUNT_SECRET ? otplib.authenticator.generate(process.env.ACCOUNT_SECRET) : undefined;
  return axios({
    method: 'POST',
    url: '/session',
    data: {
      email: process.env.ACCOUNT_EMAIL,
      password: process.env.ACCOUNT_PASSWORD,
      twoFactorToken
    },
  }).then(({ data }) => {
    axios.defaults.headers.common['Authorization'] = `Kinvey ${data.token}`;
    return data;
  }).catch((err) => {
    console.error(err.response.data);
    return login(--retries);
  })
}

module.exports = {
  login
};
