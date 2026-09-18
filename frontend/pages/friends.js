import { apiRequest } from '../api/client.js';

export default function renderFriends(root) {
  root.innerHTML = `
    <div class="friends-page">
      <section>
        <h2>Add a friend</h2>
        <form id="request-form">
          <input id="to-username" placeholder="Their username" required />
          <button type="submit">Send request</button>
        </form>
        <p id="request-status" class="status" hidden></p>
      </section>

      <section>
        <h2>Pending requests</h2>
        <div id="pending-list"><p class="status">Loading…</p></div>
      </section>

      <section>
        <h2>Your friends</h2>
        <div id="friends-list"><p class="status">Loading…</p></div>
      </section>
    </div>
  `;

  wireRequestForm(root);
  loadPending(root);
  loadFriends(root);
}

function wireRequestForm(root) {
  const form = root.querySelector('#request-form');
  const status = root.querySelector('#request-status');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.hidden = true;
    const toUsername = root.querySelector('#to-username').value.trim();

    try {
      const friendship = await apiRequest('/friends/request', { method: 'POST', body: { toUsername } });
      status.className = 'status';
      status.textContent = `Request sent - friendship id ${friendship._id} (share it so they can accept).`;
      status.hidden = false;
      form.reset();
    } catch (err) {
      status.className = 'status error';
      status.textContent = err.message;
      status.hidden = false;
    }
  });
}

async function loadPending(root) {
  const listEl = root.querySelector('#pending-list');
  listEl.innerHTML = '<p class="status">Loading…</p>';

  try {
    const pending = await apiRequest('/friends/pending');
    if (pending.length === 0) {
      listEl.innerHTML = '<p class="status">No pending requests.</p>';
      return;
    }
    listEl.innerHTML = '';
    for (const req of pending) {
      const row = document.createElement('div');
      row.className = 'friend-row';
      row.innerHTML = `
        <div class="friend-row-header"><strong>${req.fromUsername}</strong> sent you a request</div>
        <button class="accept-btn" data-id="${req.friendshipId}">Accept</button>
      `;
      row.querySelector('.accept-btn').addEventListener('click', async (e) => {
        const btn = e.target;
        btn.disabled = true;
        try {
          await apiRequest(`/friends/${req.friendshipId}/accept`, { method: 'POST' });
          btn.textContent = 'Accepted!';
          loadFriends(root);
          setTimeout(() => row.remove(), 1000);
        } catch (err) {
          btn.disabled = false;
          alert('Failed to accept: ' + err.message);
        }
      });
      listEl.appendChild(row);
    }
  } catch (err) {
    listEl.innerHTML = `<p class="status error">${err.message}</p>`;
  }
}

async function loadFriends(root) {
  const listEl = root.querySelector('#friends-list');
  listEl.innerHTML = '<p class="status">Loading…</p>';

  try {
    const friends = await apiRequest('/friends');
    if (friends.length === 0) {
      listEl.innerHTML = '<p class="status">No friends yet.</p>';
      return;
    }
    listEl.innerHTML = '';
    for (const friend of friends) {
      listEl.appendChild(friendRow(friend));
    }
  } catch (err) {
    listEl.innerHTML = `<p class="status error">${err.message}</p>`;
  }
}

function friendRow(friend) {
  const row = document.createElement('div');
  row.className = 'friend-row';
  row.innerHTML = `
    <div class="friend-row-header"><strong>${friend.username}</strong></div>
    <form class="pitch-form">
      <input class="pitch-tmdb-id" placeholder="TMDB ID" required />
      <button type="submit">Generate pitch</button>
    </form>
    <p class="pitch-result status" hidden></p>
  `;

  row.querySelector('.pitch-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const tmdbId = row.querySelector('.pitch-tmdb-id').value.trim();
    const resultEl = row.querySelector('.pitch-result');
    resultEl.hidden = true;
    if (!tmdbId) return;

    try {
      const data = await apiRequest(`/compatibility/${friend.id}/${tmdbId}`, { method: 'POST' });
      resultEl.className = 'pitch-result status';
      resultEl.textContent = data.pitch;
      resultEl.hidden = false;
    } catch (err) {
      resultEl.className = 'pitch-result status error';
      resultEl.textContent = err.message;
      resultEl.hidden = false;
    }
  });

  return row;
}
