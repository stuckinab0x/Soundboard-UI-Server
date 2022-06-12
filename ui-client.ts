import axios, { AxiosRequestConfig } from 'axios';
import environment from './environment';

declare global {
  namespace Express {
    interface Request {
      client: UIClient;
    }
  }
}

interface UserData {
  name: string;
  userID: string;
  avatar: string;
  soundList: string[];
}

export default class UIClient {
  public accessToken: string;
  public refreshToken: string;
  public userData: UserData;
  private botConfig: AxiosRequestConfig;
  
  constructor(cookies?: any) {
    cookies ? this.accessToken = cookies.accesstoken : this.accessToken = '';
    cookies ? this.refreshToken = cookies.refreshtoken : this.refreshToken = '';
    this.userData = {
      name: '',
      userID: '',
      avatar: '',
      soundList: [],
    }
    this.botConfig = {
      headers : {
        Authorization: environment.botApiKey,
      }
    }
  }

  async authenticate(authCode?: string) {
    const params = new URLSearchParams({
      client_id: environment.clientID,
      client_secret: environment.clientSecret,
    })
    if (authCode) {
    params.append('grant_type', 'authorization_code');
    params.append('code', authCode);
    params.append('redirect_uri', environment.UIServerURL);
    } else {
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', this.refreshToken);
    }
    try {
      const res = await axios.post('https://discord.com/api/oauth2/token', params);
      this.accessToken = res.data.access_token;
      this.refreshToken = res.data.refresh_token;
      console.log(`token response from discord`);
    }
    catch (error) {
      console.log(error);
    }
  }

  async getUser(retry?: boolean) {
    try {
      const res = await axios.get('https://discord.com/api/users/@me', {
        headers: { "Authorization": `Bearer ${ this.accessToken }` },
      })
      this.userData.name = res.data.username;
      this.userData.userID = res.data.id;
      this.userData.avatar = res.data.avatar;
    }
    catch (error) {
      console.log(`getUser failed. refresh token tried yet: ${ retry? 'yes' : 'no' }. ${ error }`)
    }
    if (retry) return;
    if (!this.userData.name) {
      await this.authenticate();
      await this.getUser(true);
    }
  }

  getBotSounds() {
    return axios.get(`${ environment.botURL }/soundlist`, this.botConfig)
      .then(res => { this.userData.soundList = res.data; })
      .catch(error => console.log(error));
  }

  soundRequest(soundRequest: string){
    const body = {
      userID: this.userData.userID,
      soundRequest: soundRequest,
    }
    return axios.post(`${ environment.botURL }/soundrequest`, body, this.botConfig)
      .catch(error => console.log(error));
  }

  skipRequest(all: boolean, userID: string) {
    return axios.post(`${ environment.botURL }/skip`, { skipAll: all, userID: userID }, this.botConfig)
      .catch(error => console.log(error))
  }
}