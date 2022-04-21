import express from 'express';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import environment from './environment.js';
import UIClient from './ui-client.js';

async function hasAuth(req, res, next) {
  if (req.query.code) {
    const client = new UIClient();
    await client.authenticate(req.query.code)
    .then(() => {
      if (client.accessToken) {
      res.cookie('accesstoken', client.accessToken, { httpOnly: true });
      res.cookie('refreshtoken', client.refreshToken, { httpOnly: true });
      res.redirect('/')
      }
    })
  return;
  }
  if (req.cookies.accesstoken) {
    const client = new UIClient(req.cookies);
    await client.getUser();
    if (client.accessToken !== req.cookies.accesstoken) {
      res.cookie('accesstoken', client.accessToken, { httpOnly: true });
      res.cookie('refreshtoken', client.refreshToken, { httpOnly: true });
    }
    client.userData.name ? next() : res.redirect(environment.AuthURL);
  return;
  }
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.redirect(environment.AuthURL);
}

const app = express();
app.use(cookieParser());
app.use(cors());
app.use(express.text());
app.use('/', hasAuth, express.static('public'));

app.get('/user', async (req, res) => {
  const client = new UIClient(req.cookies);
  await client.getUser();
  await client.getBotSounds();
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.send(client.userData);
})

app.get('/logout', (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.clearCookie('accesstoken');
  res.clearCookie('refreshtoken');
  res.end();
})

app.post('/soundrequest', async (req, res) => {
  const client = new UIClient(req.cookies);
  await client.getUser();
  client.soundRequest(req.body);
  res.end();
})

app.listen(8080, () => {
  console.log('listening...')
})
