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

  if (req.cookies.accesstoken) {
    const client = new UIClient(req.cookies);
    await client.getUser();
    if (client.accessToken !== req.cookies.accesstoken) {
      res.cookie('accesstoken', client.accessToken, { httpOnly: true, maxAge: 1000 * 60 * 30 });
      res.cookie('refreshtoken', client.refreshToken, { httpOnly: true, maxAge: 1000 * 60 * 60 * 48 });
    }
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
  const client = new UIClient(req.cookies);
  await client.getUser();
  await client.getBotSounds();
  res.send(client.userData);
})

app.post('/soundrequest', async (req, res) => {
  console.log('Sound request.')
  const client = new UIClient(req.cookies);
  await client.getUser();
  await client.soundRequest(req.body);
  res.end();
})

app.get('/skip', async (req, res) => {
  const client = new UIClient(req.cookies);
  await client.getUser();
  console.log(`Skip request. All: ${ req.query.skipAll }`)
  if (req.query.skipAll === 'true') await client.skipRequest(true, client.userData.userID);
  else await client.skipRequest(false, client.userData.userID);
  res.end();
})

app.use(serveStatic);

app.listen(environment.port, () => {
  console.log('listening...')
})
