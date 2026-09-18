# Uploading CineLog to GitHub

## 1. Install Git, if you don't have it

Check first:

```bash
git --version
```

If that fails, get it from [git-scm.com](https://git-scm.com/downloads)
(Windows: this also installs Git Bash). macOS/Linux users likely already
have it.

## 2. Double-check nothing secret is about to be committed

This repo's root `.gitignore` already excludes `node_modules/` and `.env`,
so your real API keys in `backend/.env` won't be tracked. Confirm before
your first commit:

```bash
cd cinelog
cat .gitignore
```

You should see `node_modules/` and `.env` listed. **If you don't see this
file, or `backend/.env` isn't covered, stop and add it before continuing** -
committing real API keys to a public GitHub repo means they're
compromised the moment you push, even if you delete them in a later commit.

## 3. Create the GitHub repository

On [github.com](https://github.com), click **New repository**. Name it
(e.g. `cinelog`), leave it empty - **do not** check "Add a README" or "Add
.gitignore", since this project already has both and GitHub would create a
merge conflict on your first push otherwise. Create it, then copy the
repository URL it shows you (starts with `https://github.com/`).

## 4. Push the project

From the `cinelog` project root (the folder containing `backend/`,
`frontend/`, `docs/`, `.gitignore`, and `README.md`):

```bash
git init
git add .
git status
```

Read the output of `git status` before committing - confirm you see
`backend/`, `frontend/`, `docs/`, `.gitignore`, `README.md` listed, and
**do not** see `backend/node_modules/` or `backend/.env`. If either shows
up, your `.gitignore` isn't being picked up (check you're running this from
the `cinelog` root, not from inside `backend/`).

```bash
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/cinelog.git
git push -u origin main
```

Replace the URL with the one you copied in step 3. If this is your first
time pushing to GitHub from this machine, it'll prompt you to sign in
through the browser.

## 5. Verify

Refresh the repository page on GitHub. You should see `backend/`,
`frontend/`, `docs/`, `.gitignore`, and `README.md` - and if you click into
`backend/`, you should **not** see a `node_modules` folder or a `.env`
file. If you do, remove them from git tracking (`git rm -r --cached
backend/node_modules backend/.env`), commit, and push again.

## Making changes later

```bash
git add .
git commit -m "describe what changed"
git push
```
