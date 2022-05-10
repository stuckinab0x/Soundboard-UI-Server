// TODO: add state to oAuth2?

const buttonContainer = document.getElementById('btn-container');

function fetchUser() {
  fetch('/user')
    .then(response => response.json())
    .then(data => {
      document.getElementById('username').innerHTML = data.name;
      document.getElementById('avatar').src = `https://cdn.discordapp.com/avatars/${ data.userID }/${ data.avatar }.png`;
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

const postSound = debounce(soundButton => {
  fetch('/soundrequest', {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain'
    },
    body: soundButton.innerHTML,
  })
  .catch(error => console.log(error));
  soundButton.classList.remove('btn-red')
  soundButton.classList.add('btn-green')
  setTimeout(() => soundButton.classList.remove('btn-green'), 1)
}, 2000, true)

const skipRequest = debounce(async (all = false) => {
  await fetch(`/skip?skipAll=${ all }`, { 
    headers: {
      'Content-Type': 'text/plain'
    },
  })
  .catch(error => console.log(error))
}, 500, true)

async function logOut() {
  await fetch('/logout')
  .catch(error => console.log(error))
  window.location.reload();
}

document.addEventListener('DOMContentLoaded', () => fetchUser());

document.addEventListener('click', e => {
  const logOutMenu = document.getElementById('log-out-menu')
  const avatar = document.getElementById('avatar');
  if (e.target === document.getElementById('skip-one')) skipRequest();
  if (e.target === document.getElementById('skip-all')) skipRequest(true);
  if (e.target === avatar) logOutMenu.classList.toggle('log-out-menu-hide');
  if (e.target !== avatar) logOutMenu.classList.add('log-out-menu-hide');
  if (e.target.classList.contains('sound-btn')) {
    e.target.classList.add('btn-red');
    postSound(e.target);
    setTimeout(() => e.target.classList.remove('btn-red'), 1)
  }
})

function debounce(func, wait, immediate) {
  var timeout;

  return function executedFunction() {
    var context = this;
    var args = arguments;
	    
    var later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };

    var callNow = immediate && !timeout;
	
    clearTimeout(timeout);

    timeout = setTimeout(later, wait);
	
    if (callNow) func.apply(context, args);
  };
};
