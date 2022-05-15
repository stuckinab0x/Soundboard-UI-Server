// TODO: add state to oAuth2?

const buttonContainer = document.getElementById('btn-container');
const searchCancel = document.getElementById('search-cancel');
const favorites = {
  list: [],
  save() {
    window.localStorage.setItem('favorites', JSON.stringify(this.list));
  },
  load() {
    const stored = JSON.parse(window.localStorage.getItem('favorites'));
    if (stored) this.list = stored;
  },
  remove(soundName) {
    this.list = this.list.filter(i => i !== soundName);
  }
}


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
      const div = document.createElement('div');
      const btn = document.createElement('button');
      const fav = document.createElement('span');
      fav.classList.add('material-icons', 'favStar', 'icon-btn');
      favorites.load();
      if (favorites.list.find(x => x === i)) {
        div.classList.add('fav');
        fav.innerHTML = 'star';
        fav.classList.add('fav-set');
      } else fav.innerHTML = 'star_outline';
      btn.innerHTML = i;
      btn.classList.add('btn', 'sound-btn');
      div.id = i;
      div.classList.add('sound-tile');
      div.appendChild(btn);
      div.appendChild(fav);
      buttonContainer.appendChild(div);
  })
}

function searchFilter(cancelButton = false) {
  let search = document.getElementById('search');
  if (cancelButton) search.value = '';
  search.focus();
  search.value ? searchCancel.classList.add('search-cancel-show') : searchCancel.classList.remove('search-cancel-show');
  const searchMessage = document.getElementById('empty-search-container');
  searchMessage.classList.remove('message-container-show');
  const buttons = Array.from(buttonContainer.children);
  buttons.forEach(i => i.classList.add('btn-hide'))
  buttons.forEach(i => {
    const btnName = i.id.toUpperCase();
    if (btnName.includes(search.value.toUpperCase())) i.classList.remove('btn-hide');
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

document.addEventListener('DOMContentLoaded', () => fetchUser());

document.addEventListener('click', e => {
  const logOutMenu = document.getElementById('log-out-menu')
  const avatar = document.getElementById('avatar');
  const favsBtn = document.getElementById('favorites-btn');
  if (e.target === document.getElementById('skip-one')) skipRequest();
  if (e.target === document.getElementById('skip-all')) skipRequest(true);
  if (e.target === avatar) logOutMenu.classList.toggle('log-out-menu-hide');
  if (e.target !== avatar) logOutMenu.classList.add('log-out-menu-hide');
  if (e.target === searchCancel) searchFilter(true);
  if (e.target === favsBtn && e.target.classList.contains('filter-btn-on')){
    e.target.classList.remove('filter-btn-on');
    const buttons = Array.from(buttonContainer.children)
    buttons.forEach(i => i.classList.remove('btn-filter-fav'));
  } else if (e.target === favsBtn) {
    e.target.classList.add('filter-btn-on');
    const buttons = Array.from(buttonContainer.children);
    buttons.forEach(i => {
      if (!i.classList.contains('fav')) i.classList.add('btn-filter-fav');
    })
  }
  if (e.target.classList.contains('sound-btn')) {
    e.target.classList.add('btn-red');
    postSound(e.target);
    setTimeout(() => e.target.classList.remove('btn-red'), 1)
  }
  if (e.target.classList.contains('favStar') && e.target.classList.contains('fav-set')) {
    const favStar = e.target;
    favStar.innerHTML = 'star_outline';
    favStar.classList.remove('fav-set');
    favStar.parentElement.classList.remove('fav');
    favorites.remove(e.target.parentElement.id);
    favorites.save();
  }
  else if (e.target.classList.contains('favStar')) {
    const favStar = e.target;
    favStar.parentElement.classList.add('fav');
    favStar.innerHTML = 'star';
    favStar.classList.add('fav-set');
    favorites.list.push(e.target.parentElement.id);
    favorites.save();
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
}
