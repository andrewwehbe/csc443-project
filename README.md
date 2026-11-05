# CSC443 Project

CSC443 Web Programming, Fall 2026, Section 31. Phase 1 (front end) is due Monday 9 November 2026 at 23:59.

**Live site:** https://andrewwehbe.github.io/csc443-project/

## Team

Team name: _to be added_

| Member | Student ID |
| --- | --- |
| Andrew Wehbe | _to be added_ |
| Elio El Koussa | _to be added_ |
| Marc Hebbo | _to be added_ |
| Njteh Balian | _to be added_ |

## Topic

Topic number: _to be added_
Brief reference code (from the footer of the topic spec): _to be added_

## Entities and fields

_To be added once the topic is confirmed._

## Who owns what

Each member owns two surfaces (a surface is a screen with its own route). This table is what the individual examination is built from, so it must stay accurate.

| Member | Surfaces (routes) | Files |
| --- | --- | --- |
| Andrew Wehbe | | |
| Elio El Koussa | | |
| Marc Hebbo | | |
| Njteh Balian | | |

Shared files: `src/App.jsx` (routes), `src/components/Layout.jsx` (navigation shell).

## Mock data

Phase 1 has no server. The data is a JavaScript array in `src/data/`, held in React state. Adding or editing an item updates that state; reloading the page resets it. This is expected for Phase 1.

## Run it locally

You need Git and Node.js 24 (22.22 or newer also works; React Router refuses older versions). Check with `node -v`.

```bash
git clone https://github.com/andrewwehbe/csc443-project.git
cd csc443-project
npm install
npm run dev
```

Then open the address Vite prints (http://localhost:5173/csc443-project/).

`npm run build` makes the production files in `dist/`. `npm run preview` serves that build locally.

## How we work with Git

- `main` always runs. Nobody pushes broken code to it.
- Work on a branch named after the change, for example `rides-list` or `request-form`.
- Commit messages say what changed and why, for example `Add seat counter that stops at ride capacity`. Never just `fix` or `update`.
- Open a pull request into `main`; merge it once it runs.

```bash
git checkout main
git pull
git checkout -b rides-list
# ...work, then:
git add .
git commit -m "Add rides list with search kept in the URL"
git push -u origin rides-list
```

## Deployment

Every push to `main` runs `.github/workflows/deploy.yml`, which builds the app and publishes it to GitHub Pages.

Two settings make the app work on GitHub Pages:

1. `base: '/csc443-project/'` in `vite.config.js`, because the site lives under the repository name and not at the root of the domain. `BrowserRouter` uses the same value as its `basename`.
2. A `404.html` that is a copy of `index.html`. GitHub Pages has no file for a route like `/csc443-project/rides/12`, so it serves `404.html`. Because that file is the app, React loads, React Router reads the URL and shows the right page. Without it, refreshing any page other than the home page shows GitHub's own 404 page.

## Screenshots

_To be added._
