const express = require('express');
const axios = require('axios');
const app = express();

const CLIENT_ID = 'lab-client';
const CLIENT_SECRET = 'PASTE_YOUR_CLIENT_SECRET_HERE';
const REDIRECT_URI = 'http://localhost:3000/callback';
const AUTH_URL = 'http://localhost:8080/realms/oauth-lab/protocol/openid-connect/auth';
const TOKEN_URL = 'http://localhost:8080/realms/oauth-lab/protocol/openid-connect/token';

app.get('/login', (req, res) => {
  const url = `${AUTH_URL}?client_id=${CLIENT_ID}&response_type=code&scope=openid&redirect_uri=${REDIRECT_URI}`;
  res.redirect(url);
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const tokenRes = await axios.post(TOKEN_URL, new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }));
    res.json(tokenRes.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json(err.response?.data || { error: 'token exchange failed' });
  }
});

app.listen(3000, () => console.log('Client running on http://localhost:3000'));
