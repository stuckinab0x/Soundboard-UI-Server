import axios from 'axios'
import environment from './environment.js'

export default class UIClient {
  constructor(cookies = null) {
    cookies ? this.accessToken = cookies.accesstoken : this.accessToken = '';
    cookies ? this.refreshToken = cookies.refreshtoken : this.refreshToken = '';
    this.name = '';
    this.userID = '';
    this.avatar = '';
    this.soundList = [];
  }

  async authenticate(authCode = null) {
    const params = new URLSearchParams({
      client_id: environment.clientID,
      client_secret: environment.clientSecret,
    })
    if (authCode) {
    params.append('grant_type', 'authorization_code');
    params.append('code', authCode);
    params.append('redirect_uri', environment.uiServerURL);
    } else {
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', this.refreshToken);
    }
    await axios.post('https://discord.com/api/oauth2/token', params)
    .then(res => res.data)
    .then(data => {
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      console.log(`retrieved token from discord: ${ data.access_token }`);
    })
    .catch(error => console.log(error));
  }

  async getUser(retry = false) {
    await axios.get('https://discord.com/api/users/@me', {
      // eslint-disable-next-line @typescript-eslint/quotes, quote-props
      headers: { "Authorization": `Bearer ${ this.accessToken }` },
    })
      .then(res => res.data)
      .then(data => {
        this.name = data.username;
        this.userID = data.id;
        this.avatar = data.avatar;
      })
      .catch(error => console.log(`getUser failed. refresh token tried yet: ${ retry }. ${ error }`));
    if (retry) return;
    if (!this.name) await this.authenticate()
      .then(() => this.getUser(true))
      .catch(error => console.log(error))
  }

  async getBotSounds() {
    let soundList;
    await axios.get(`${ environment.botURL }/soundlist`)
      .then(res => res.data)
      .then(data => { soundList = data; })
      .catch(error => console.log(error))
    this.soundList = soundList;
  }

  async postSoundRequest(soundRequest){
    const body = {
      userID: this.userID,
      soundRequest: soundRequest,
    }
    axios.post(`${ environment.botURL }/soundrequest`, body)
      .catch(error => console.log(error));
  }
}
