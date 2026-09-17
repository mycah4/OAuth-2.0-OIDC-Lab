# OAuth-2.0-OIDC-Lab

# OAuth 2.0 / OIDC Lab
 
A hands-on lab demonstrating the OAuth 2.0 Authorization Code flow using [Keycloak](https://www.keycloak.org/) as the Authorization Server and a minimal Node.js/Express app as the Client.
 
## Overview
 
This lab walks through:
- Standing up an OAuth 2.0 Authorization Server (Keycloak) in Docker
- Configuring a Realm, Client, and test User
- Building a Client app that initiates the Authorization Code flow
- Exchanging an authorization code for an access token, refresh token, and ID token
- Inspecting the resulting JWT to see its claims
## Architecture
 
```
Browser  →  Client (Node/Express, :3000)  →  Authorization Server (Keycloak, :8080)
   ↑                    |
   └────── redirect ────┘
```
 
1. User hits `/login` on the Client
2. Client redirects the browser to Keycloak's authorization endpoint
3. User authenticates against Keycloak
4. Keycloak redirects back to the Client's `/callback` with an authorization `code`
5. Client exchanges the `code` for tokens via Keycloak's token endpoint
## Prerequisites
 
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js](https://nodejs.org/) (LTS)
- A code editor (e.g. [VS Code](https://code.visualstudio.com/))
## Setup
 
### 1. Run Keycloak
 
```bash
docker run -d --name keycloak -p 8080:8080 \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:latest start-dev
```
 
> **Windows Command Prompt users:** the multi-line `\` syntax above is bash-only. Run it as a single line instead, or use PowerShell with `` ` `` as the line-continuation character.
 
Confirm it's running:
 
```bash
docker ps
docker logs -f keycloak   # wait for "Listening on: http://0.0.0.0:8080"
```
 
Open `http://localhost:8080` and log into the Administration Console with `admin` / `admin`.
 
### 2. Configure Keycloak
 
| Step | Where | Value |
|---|---|---|
| Create Realm | top-left dropdown → Create Realm | `oauth-lab` |
| Create Client | Clients → Create client | Client ID: `lab-client` |
| Enable auth | Client settings → Capability config | Client authentication: **On** |
| Redirect URI | Client settings | `http://localhost:3000/callback` |
| Copy secret | Client → Credentials tab | copy the **Client secret** |
| Create user | Users → Add user | e.g. `testuser` |
| Set password | User → Credentials tab | set password, **Temporary: Off** |
 
### 3. Set up the Client app
 
```bash
mkdir oauth-lab-client
cd oauth-lab-client
npm init -y
npm install express axios
```
 
> **Windows tip:** create the project folder somewhere in your user directory (e.g. `Documents`), not inside a protected system folder like `C:\Windows\System32` — you'll hit `EPERM` errors otherwise. If `npm` fails with a PowerShell execution-policy error, run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`, or use a Command Prompt terminal instead.
 
Create `app.js`:
 
```js
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
```
 
> ⚠️ Don't commit real client secrets. For a real repo, move `CLIENT_SECRET` into a `.env` file and load it with `dotenv`, then add `.env` to `.gitignore`.
 
### 4. Run it
 
```bash
node app.js
```
 
Visit `http://localhost:3000/login`, log in as your test user, and you'll be redirected to `/callback` with a JSON response containing:
 
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "id_token": "eyJ...",
  "expires_in": 300
}
```
 
### 5. Inspect the token
 
Paste the `access_token` into [jwt.io](https://jwt.io) to decode its header, payload (claims like `sub`, `iss`, `exp`, `scope`), and signature.
 
## What this lab demonstrates
 
- The **Authorization Code grant**, the most widely used OAuth 2.0 flow for server-side web apps
- The client/auth-server redirect handshake
- Token exchange (code → access/refresh/ID token)
- JWT structure and claims

## Useful commands
 
```bash
docker ps                  # check container status
docker logs -f keycloak    # tail Keycloak logs
docker stop keycloak       # stop without deleting
docker start keycloak      # resume
docker rm -f keycloak      # delete container entirely
```
