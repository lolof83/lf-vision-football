const button = document.querySelector('#menu');
const nav = document.querySelector('nav');

button.addEventListener('click', () => {
  nav.classList.toggle('open');
});

document.querySelectorAll('nav a').forEach(a => {
  a.addEventListener('click', () => nav.classList.remove('open'));
});
