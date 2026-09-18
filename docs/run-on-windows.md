# Running CineLog Locally on Windows

These steps use PowerShell, which comes with Windows. If you have Git Bash
installed (it ships with Git for Windows), the commands in the main
`README.md` will also work as-is inside it - this guide is only needed if
you're using PowerShell or Command Prompt.

## 1. Install Node.js

Download the LTS installer from [nodejs.org](https://nodejs.org) and run it
(default options are fine), or install via winget:

```powershell
winget install OpenJS.NodeJS.LTS
```

Close and reopen PowerShell, then confirm:

```powershell
node -v
npm -v
```

You need Node 18 or newer - the backend uses the built-in `fetch`, which
doesn't exist in older Node versions.

## 2. Get the project onto your machine

If you downloaded a zip, extract it anywhere - e.g. `C:\Users\you\cinelog`.
If you're cloning from GitHub instead:

```powershell
git clone https://github.com/your-username/cinelog.git
cd cinelog
```

## 3. Set up the backend

```powershell
cd backend
npm install
Copy-Item .env.example .env
notepad .env
```

Fill in `MONGODB_URI`, `JWT_SECRET`, `TMDB_API_KEY`, `OMDB_API_KEY`, and
`ANTHROPIC_API_KEY`, save, and close Notepad.

```powershell
npm start
```

You should see `CineLog backend listening on port 4000`. Leave this window
open - closing it stops the server.

**If `npm install` or `npm start` fails with a script-execution error**
("running scripts is disabled on this system"), PowerShell's default
execution policy is blocking it. Fix it once, for your user only:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

**If Windows Defender Firewall pops up** asking whether to allow Node.js to
communicate on public/private networks - click **Allow**. This is normal;
Express is opening a port to listen on.

## 4. Set up the frontend

Open a **second** PowerShell window (keep the backend running in the first
one). From the project root:

```powershell
npx serve frontend
```

`npx` will offer to install `serve` the first time - accept it. It'll print
a local URL, usually `http://localhost:3000`. Open that in your browser
with `/public/index.html` appended:

```
http://localhost:3000/public/index.html
```

## 5. Verify it's working

- The CineLog page loads and immediately redirects you to a login screen.
- Register an account - you should land on the Search page.
- Search for a movie and confirm results appear.

If search returns an error, double check `TMDB_API_KEY` in `backend\.env`
and that the backend terminal window is still running without errors.

## Running two servers at once

You need both the backend (`npm start` in `backend\`) and the frontend
(`npx serve frontend` from the project root) running at the same time, in
two separate terminal windows or tabs. Windows Terminal (pre-installed on
Windows 11, free from the Microsoft Store on Windows 10) supports split
panes if you'd rather not juggle two windows: right-click the tab bar → Split
Pane.

## Common issues

- **`EADDRINUSE` on port 4000 or 3000** - something else is already using
  that port. Find and stop it, or for the backend, change `PORT` in `.env`
  and restart (`npm start` again).
- **`ECONNREFUSED` in the browser console when searching** - the backend
  isn't running, or `window.CINELOG_API_URL` in
  `frontend\public\index.html` doesn't match the port your backend is
  actually listening on.
- **`npm install` hangs or fails on a slow network** - retry with
  `npm install --fetch-timeout=60000`.
