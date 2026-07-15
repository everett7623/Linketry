import './styles.css';

const menuButton = document.querySelector<HTMLButtonElement>('[data-menu-button]');
const navigation = document.querySelector<HTMLElement>('[data-navigation]');

function closeMenu() {
  menuButton?.setAttribute('aria-expanded', 'false');
  navigation?.removeAttribute('data-open');
}

menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  navigation?.toggleAttribute('data-open', !open);
});

navigation?.addEventListener('click', (event) => {
  if ((event.target as HTMLElement).closest('a')) closeMenu();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 760) closeMenu();
});

document.querySelectorAll<HTMLElement>('[data-year]').forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});
