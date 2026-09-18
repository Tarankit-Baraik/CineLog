import { apiRequest, setToken } from '../api/client.js';

export default function renderAuth(root) {
  root.innerHTML = `
    <div class="auth-page">
      <h1>CineLog</h1>
      <div class="auth-tabs">
        <button id="tab-login" class="active" type="button">Log in</button>
        <button id="tab-register" type="button">Register</button>
      </div>
      <form id="auth-form">
        <input id="username" placeholder="Username" required autocomplete="username" />
        <div id="email-field" hidden>
          <input id="email" type="email" placeholder="Email" autocomplete="email" />
        </div>
        <input id="password" type="password" placeholder="Password" required autocomplete="current-password" />
        <button type="submit">Continue</button>
      </form>
      <p id="auth-error" class="status error" hidden></p>
    </div>
  `;

  let mode = 'login';
  const tabLogin = root.querySelector('#tab-login');
  const tabRegister = root.querySelector('#tab-register');
  const emailField = root.querySelector('#email-field');
  const errorEl = root.querySelector('#auth-error');
  const form = root.querySelector('#auth-form');

  function setMode(next) {
    mode = next;
    tabLogin.classList.toggle('active', mode === 'login');
    tabRegister.classList.toggle('active', mode === 'register');
    emailField.hidden = mode === 'login';
    errorEl.hidden = true;
  }

  tabLogin.addEventListener('click', () => setMode('login'));
  tabRegister.addEventListener('click', () => setMode('register'));

  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.hidden = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Please wait…';

    const username = root.querySelector('#username').value.trim();
    const password = root.querySelector('#password').value;
    const email = root.querySelector('#email').value.trim();

    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register';
      const body = mode === 'login' ? { username, password } : { username, password, email };
      const data = await apiRequest(path, { method: 'POST', body, auth: false });
      setToken(data.token);
      location.hash = '#/dashboard';
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Continue';
    }
  });
}
