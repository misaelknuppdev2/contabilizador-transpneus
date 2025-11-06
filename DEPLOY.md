# Deployment guide — Netlify and GitHub Pages

This project is ready to publish. Below are two recommended options. The scripts in `package.json` and `scripts/deploy.sh` make publishing straightforward; some steps require interactive login (Netlify) or creating a GitHub repo and SSH/HTTPS push rights.

## Option A — Netlify (recommended)

1. Install Netlify CLI (one-time):

```zsh
npm install -g netlify-cli
```

2. Login interactively (opens browser):

```zsh
netlify login
```

3. Deploy to production (interactive first-run):

```zsh
npm run deploy:netlify
```

Notes:

- On first `netlify deploy` you'll choose or create a site name. The CLI will remember your session for subsequent deploys.
- This produces a stable HTTPS URL and eliminates tunnel interstitials.

## Option B — GitHub Pages

1. Create a GitHub repository (via website or CLI). If using the website, create an empty repo named e.g. `contabilizador`.

2. Add remote and push:

```zsh
git remote add origin git@github.com:<your-user>/<your-repo>.git
git push -u origin master
```

3. Deploy with `gh-pages` (optional):

```zsh
npm run deploy:gh
```

This will publish the project contents to the `gh-pages` branch.

## Automated helper

There's a helper script `scripts/deploy.sh` that runs checks, then tries to deploy to Netlify (if `netlify` is available) and then to GitHub Pages (if a remote exists). You can inspect it and run it locally.

If you want, I can attempt the Netlify deploy for you now — I'll call the CLI which will ask you to login interactively. Say "yes, deploy now" and I'll run it.
