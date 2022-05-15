import express from 'express';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import environment from './environment.js';
import UIClient from './ui-client.js';

const authURL = `https://discord.com/api/oauth2/authorize?client_id=${ environment.clientID }&redirect_uri=${ encodeURI
(environment.UIServerURL) }&response_type=code&scope=identify&prompt=none`;

async function hasAuth(req, res, next) {
  if (req.query.code) {
    const client = new UIClient();
    await client.authenticate(req.query.code)
      .then(() => {
        if (client.accessToken) {
          res.cookie('accesstoken', client.accessToken, { httpOnly: true, maxAge: 1000 * 60 * 30 });
          res.cookie('refreshtoken', client.refreshToken, { httpOnly: true, maxAge: 1000 * 60 * 60 * 48 });
          res.redirect('/')
        }
      })
    return;
  }

  if (req.cookies.accesstoken || req.cookies.refreshtoken) {
    const client = new UIClient(req.cookies);
    await client.getUser();
    if (client.accessToken !== req.cookies.accesstoken) {
      res.cookie('accesstoken', client.accessToken, { httpOnly: true, maxAge: 1000 * 60 * 30 });
      res.cookie('refreshtoken', client.refreshToken, { httpOnly: true, maxAge: 1000 * 60 * 60 * 48 });
    }
    req.client = client;
    client.userData.name ? next() : res.redirect(authURL);
    return;
  }

  res.redirect(authURL);
}

const app = express();
const serveStatic = express.static('public', { extensions: ['html'] });

app.use(cookieParser());
app.use(cors({ origin: environment.UIServerURL }));
app.use(express.text());

app.get('/logout', (req, res, next) => {
  res.clearCookie('accesstoken');
  res.clearCookie('refreshtoken');
  next();
}, serveStatic)

app.use(hasAuth);

app.get('/user', async (req, res) => {
  await req.client.getBotSounds();
  res.send(req.client.userData);
})

app.post('/soundrequest', async (req, res) => {
  console.log('Sound request.')
  await req.client.soundRequest(req.body);
  res.end();
})

app.get('/skip', async (req, res) => {
  console.log(`Skip request. All: ${ req.query.skipAll }`)
  if (req.query.skipAll === 'true') await req.client.skipRequest(true, req.client.userData.userID);
  else await req.client.skipRequest(false, req.client.userData.userID);
  res.end();
})

app.use(serveStatic);

app.listen(environment.port, () => {
  console.log('listening...')
})
