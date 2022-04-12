// TODO: add state to oAuth2 

const body = document.getElementById('body');
const buttonContainer = document.getElementById('btn-container');
const welcomeMessage = document.getElementById('welcome-container');
const errorMessage = document.getElementById('error-container');
const avatarContainer = document.getElementById('avatar-container');
const searchInput = document.getElementById('search').value;
const searchMessage = document.getElementById('empty-search-container');

const serverURL = 'http://localhost:8080'

function fetchUser() {
  fetch(`${ serverURL }/user`, {
    method: 'GET'
  })
    .then(response => response.json())
    .then(data => {
      console.log(data.avatar);
      window.sessionStorage.setItem('userID', data.userID);
      window.sessionStorage.setItem('avatar', data.avatar);
      window.sessionStorage.setItem('username', data.name);
      avatarContainer.classList.add('avatar-container-show')
      document.getElementById('username').innerHTML = data.name;
      document.getElementById('avatar').src = `https://cdn.discordapp.com/avatars/${ data.userID }/${ data.avatar }.png`;
      makeButtons(data.soundList);
    })
    .catch(error => {
      console.error(error);
      body.classList.add('body-error');
      errorMessage.classList.add('message-container-show');
    });
}

function makeButtons(data) {
    data.forEach(i => {
      const e = document.createElement('button');
      e.innerHTML = i;
      e.classList.add('btn')
      buttonContainer.appendChild(e);
  })
}

function postSound(soundChoice) {
  console.log(soundChoice)
  fetch(`${ serverURL }/soundrequest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain'
    },
    body: soundChoice,
  })
  .then(response => response.json())
  .catch(error => console.log('no response from server', error))
}

document.addEventListener('DOMContentLoaded', () => {
  fetchUser();
})

document.addEventListener('click', function(e) {
  if (e.target.classList.contains('btn')) {
  postSound(e.target.innerHTML)
  }
})

function searchFilter() {
  searchMessage.classList.remove('message-container-show');
  const buttons = Array.from(buttonContainer.children);
  const searchInput = document.getElementById('search').value;
  buttons.forEach(i => i.classList.add('btn-hide'))
  buttons.forEach(i => { if (i.innerHTML.startsWith(searchInput)) i.classList.remove('btn-hide'); })
  if (buttons.every(i => i.classList.contains('btn-hide'))) searchMessage.classList.add('message-container-show');
}
