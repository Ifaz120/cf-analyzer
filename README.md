# Codeforces Profile Analyzer

A small web app that loads any Codeforces handle and shows the profile, rating graph, tag analysis and solved problems.

**Live demo:** https://ifaz120.github.io/cf-analyzer/

**Screenshot:** _add a screenshot here_

## Features

- Landing page with a hero section, feature overview and a smooth scroll down to the analyzer
- Handle search (button or Enter key) with loading skeletons and error alerts
- Profile card with coloured rank, ratings, country, organization and solved count
- Solved problems list with duplicates removed
- Saved handles sidebar (saved in localStorage)
- Search by name, filter by tag, filter by min/max rating, sort by rating or newest
- Bookmarks ("Solve later") saved in localStorage
- Dark / light theme toggle (saved in localStorage)
- Rating line chart and top-10 tag bar chart (Chart.js)
- Last searched handle loads automatically after a refresh

## Tech Stack

- HTML
- Tailwind CSS
- DaisyUI
- JavaScript (ES modules, no frameworks)
- Chart.js
- Codeforces API

## How to Run Locally

1. Open the `cf-analyzer` folder in VS Code.
2. Install the **Live Server** extension.
3. Right-click `index.html` and choose **Open with Live Server**.

No build step or `npm install` is needed. The page also works on GitHub Pages.

## Rubric Mapping

| Requirement | Where it is done |
|---|---|
| DOM manipulation and dynamic rendering | `js/render.js` (`renderProfile`, `renderProblems`, `renderSavedHandles`, `renderBookmarks`, `makeElement`); filtering in `js/main.js` (`getVisibleProblems`) |
| Event handling and JS logic | `js/main.js` (`handleSearch`, `handleProblemListClick`, `handleSavedListClick`, event delegation); array methods in `getVisibleProblems`, `getSolvedProblems`, `drawTagChart` |
| API integration and async | `js/api.js` (`callApi`, `fetchUserInfo`, `fetchSubmissions`, `fetchRating`); `loadHandle` in `js/main.js`; loading, error and empty states in `js/render.js` |
| Local storage | `js/storage.js` (`readList`, `writeList`, saved handles, bookmarks, theme, last handle) |
