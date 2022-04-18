// TODO: add state to oAuth2 

const buttonContainer = document.getElementById('btn-container');
const serverURL = 'http://localhost:8080'

function fetchUser() {
  fetch('/user', { method: 'GET' })
    .then(response => response.json())
    .then(data => {
      console.log(data.avatar);
      window.sessionStorage.setItem('userID', data.userID);
      window.sessionStorage.setItem('avatar', data.avatar);
      window.sessionStorage.setItem('username', data.name);
      document.getElementById('username').innerHTML = data.name;
      document.getElementById('mobile-username').innerHTML = data.name;
      document.getElementById('avatar').src = `https://cdn.discordapp.com/avatars/${ data.userID }/${ data.avatar }.png`;
      document.getElementById('m-avatar').src = `https://cdn.discordapp.com/avatars/${ data.userID }/${ data.avatar }.png`;
      makeButtons(data.soundList);
    })
    .catch(error => {
      console.error(error);
        document.getElementById('body').classList.add('body-error')
        document.getElementById('error-container').classList.add('message-container-show')
        document.getElementById('search-container').classList.add('search-hide');
    });
}

function makeButtons(data) {
    data.forEach(i => {
      const e = document.createElement('button');
      e.innerHTML = i;
      e.classList.add('btn', 'sound-btn')
      buttonContainer.appendChild(e);
  })
}

function postSound(soundChoice) {
  console.log(soundChoice)
  fetch('/soundrequest', {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain'
    },
    body: soundChoice,
  })
  .then(response => response.json())
  .catch(error => console.log(error))
}

function searchFilter() {
  const searchMessage = document.getElementById('empty-search-container');
  searchMessage.classList.remove('message-container-show');
  const buttons = Array.from(buttonContainer.children);
  const searchInput = document.getElementById('search').value;
  buttons.forEach(i => i.classList.add('btn-hide'))
  buttons.forEach(i => { 
    const btnName = i.innerHTML.toUpperCase();
    if (btnName.includes(searchInput.toUpperCase())) i.classList.remove('btn-hide'); 
  })
  if (buttons.every(i => i.classList.contains('btn-hide'))) searchMessage.classList.add('message-container-show');
}

async function logOut() {
  sessionStorage.clear();
  await fetch('/logout', { method: 'GET' })
  .catch(error => console.log(error))
  window.location.reload();
}

document.addEventListener('DOMContentLoaded', () => {
  fetchUser();
})

document.addEventListener('click', e => {
  const logOutMenus = Array.from(document.getElementsByClassName('log-out-menu'));
  const avatar = document.getElementById('avatar');
  const mobileAvatar = document.getElementById('m-avatar');
  if (e.target.classList.contains('sound-btn')) postSound(e.target.innerHTML);
  if (e.target === avatar || e.target === mobileAvatar) logOutMenus.forEach(i => i.classList.toggle('log-out-menu-hide'));
  if (e.target !== avatar && e.target !== mobileAvatar) logOutMenus.forEach(i => i.classList.add('log-out-menu-hide'));
})
