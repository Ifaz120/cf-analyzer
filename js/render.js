const statusBox = document.querySelector("#status");
const resultsBox = document.querySelector("#results");
const profileBox = document.querySelector("#profile");
const filtersBox = document.querySelector("#filters");
const countText = document.querySelector("#count-text");
const problemList = document.querySelector("#problem-list");
const savedList = document.querySelector("#saved-list");
const bookmarkList = document.querySelector("#bookmark-list");
const tagSelect = document.querySelector("#filter-tag");

const RANK_COLORS = {
  newbie: "#808080",
  pupil: "#008000",
  specialist: "#03a89e",
  expert: "#0000ff",
  "candidate master": "#aa00aa",
  master: "#ff8c00",
  "international master": "#ff8c00",
  grandmaster: "#ff0000",
  "international grandmaster": "#ff0000",
  "legendary grandmaster": "#ff0000",
};

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}

function getRankColor(rank) {
  return RANK_COLORS[rank] || "#808080";
}

function getRatingColor(rating) {
  if (!rating || rating < 1200) return "#808080";
  if (rating < 1400) return "#008000";
  if (rating < 1600) return "#03a89e";
  if (rating < 1900) return "#0000ff";
  if (rating < 2100) return "#aa00aa";
  if (rating < 2400) return "#ff8c00";
  return "#ff0000";
}

function readableText(color) {
  return `color-mix(in srgb, ${color} 80%, var(--color-base-content))`;
}

function tint(color) {
  return `color-mix(in srgb, ${color} 15%, transparent)`;
}

export function showLoading() {
  statusBox.replaceChildren();
  const heights = ["h-52", "h-64", "h-40"];
  heights.forEach((height) => {
    statusBox.append(makeElement("div", `skeleton ${height} w-full mb-4`));
  });
  resultsBox.classList.add("hidden");
}

export function showError(message) {
  statusBox.replaceChildren();
  const alert = makeElement("div", "alert alert-error");
  alert.setAttribute("role", "alert");
  alert.append(makeElement("span", "", message));
  statusBox.append(alert);
  resultsBox.classList.add("hidden");
}

export function showResults() {
  statusBox.replaceChildren();
  resultsBox.classList.remove("hidden");
}

function makeStat(title, value, color) {
  const stat = makeElement("div", "stat");
  stat.append(makeElement("div", "stat-title text-xs uppercase tracking-wider", title));
  const valueBox = makeElement("div", "stat-value text-3xl font-semibold tracking-tight tabular-nums", String(value));
  if (color) {
    valueBox.style.color = readableText(color);
  }
  stat.append(valueBox);
  return stat;
}

export function renderProfile(user, solvedCount, isSaved) {
  const rank = user.rank || "unrated";
  const color = getRankColor(user.rank);

  const card = makeElement("div", "card bg-base-100 shadow-sm border border-base-300");
  const body = makeElement("div", "card-body gap-6 p-6 sm:p-8");

  const top = makeElement("div", "flex items-center gap-5 flex-wrap");
  const avatar = makeElement("img", "w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover");
  avatar.style.outline = `3px solid ${color}`;
  avatar.style.outlineOffset = "3px";
  avatar.src = user.titlePhoto.startsWith("//") ? `https:${user.titlePhoto}` : user.titlePhoto;
  avatar.alt = `${user.handle} avatar`;
  top.append(avatar);

  const names = makeElement("div", "space-y-1");
  const handleTitle = makeElement("h2", "text-3xl sm:text-4xl font-semibold tracking-tight", user.handle);
  handleTitle.style.color = readableText(color);
  const rankPill = makeElement("span", "badge badge-lg border-0 font-medium capitalize", rank);
  rankPill.style.color = readableText(color);
  rankPill.style.backgroundColor = tint(color);
  names.append(handleTitle, rankPill);
  names.append(makeElement("p", "text-sm opacity-60 pt-1", `Country: ${user.country || "Not specified"}`));
  names.append(makeElement("p", "text-sm opacity-60", `Organization: ${user.organization || "Not specified"}`));
  top.append(names);
  body.append(top);

  const stats = makeElement("div", "stats stats-vertical sm:stats-horizontal w-full bg-base-200/60");
  stats.append(makeStat("Current Rating", user.rating ?? "Unrated", getRatingColor(user.rating)));
  stats.append(makeStat("Max Rating", user.maxRating ?? "Unrated", getRatingColor(user.maxRating)));
  stats.append(makeStat("Problems Solved", solvedCount));
  body.append(stats);

  const actions = makeElement("div", "card-actions");
  const saveBtn = makeElement("button");
  saveBtn.id = "save-btn";
  actions.append(saveBtn);
  body.append(actions);

  card.append(body);
  profileBox.replaceChildren(card);
  updateSaveButton(isSaved);
}

export function updateSaveButton(isSaved) {
  const saveBtn = document.querySelector("#save-btn");
  if (!saveBtn) {
    return;
  }
  saveBtn.className = isSaved ? "btn rounded-full px-6" : "btn btn-primary rounded-full px-6";
  saveBtn.textContent = isSaved ? "Saved ✓" : "Save handle";
  saveBtn.disabled = isSaved;
}

export function populateTagSelect(problems) {
  const tags = [...new Set(problems.flatMap((problem) => problem.tags))].sort();

  tagSelect.replaceChildren();
  const allOption = makeElement("option", "", "All tags");
  allOption.value = "";
  tagSelect.append(allOption);

  tags.forEach((tag) => {
    const option = makeElement("option", "", tag);
    option.value = tag;
    tagSelect.append(option);
  });
}

export function resetFilterInputs() {
  document.querySelector("#filter-name").value = "";
  document.querySelector("#filter-tag").value = "";
  document.querySelector("#filter-min").value = "";
  document.querySelector("#filter-max").value = "";
  document.querySelector("#filter-sort").value = "newest";
}

export function setBookmarkButton(button, isBookmarked) {
  button.className = `btn btn-sm rounded-full ${isBookmarked ? "btn-warning" : "btn-ghost bg-base-200"}`;
  button.textContent = isBookmarked ? "★ Bookmarked" : "☆ Solve later";
}

function makeProblemCard(problem, isBookmarked) {
  const card = makeElement(
    "div",
    "card bg-base-100 shadow-sm border border-base-300 transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
  );
  const body = makeElement("div", "card-body p-5 gap-3");

  body.append(makeElement("h3", "font-semibold leading-snug tracking-tight", problem.name));

  const badges = makeElement("div", "flex flex-wrap gap-1.5");
  const ratingColor = getRatingColor(problem.rating);
  const ratingBadge = makeElement(
    "span",
    "badge border-0 font-semibold tabular-nums",
    problem.rating ? String(problem.rating) : "Unrated"
  );
  ratingBadge.style.color = readableText(ratingColor);
  ratingBadge.style.backgroundColor = tint(ratingColor);
  badges.append(ratingBadge);
  problem.tags.forEach((tag) => {
    badges.append(makeElement("span", "badge badge-ghost badge-sm", tag));
  });
  body.append(badges);

  const bottom = makeElement("div", "flex items-center justify-between gap-2 mt-auto pt-1");
  const link = makeElement("a", "link link-primary link-hover text-sm font-medium", "Open on Codeforces ↗");
  link.href = `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`;
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  const bookmarkBtn = makeElement("button");
  bookmarkBtn.dataset.action = "bookmark";
  bookmarkBtn.dataset.id = problem.id;
  setBookmarkButton(bookmarkBtn, isBookmarked);

  bottom.append(link, bookmarkBtn);
  body.append(bottom);

  card.append(body);
  return card;
}

export function renderProblems(visibleProblems, totalCount, bookmarkedIds, shownCount) {
  problemList.replaceChildren();
  countText.textContent = `Showing ${visibleProblems.length} of ${totalCount}`;

  if (totalCount === 0) {
    filtersBox.classList.add("hidden");
    const empty = makeElement("div", "alert");
    empty.append(makeElement("span", "", "No solved problems yet."));
    problemList.append(empty);
    return;
  }
  filtersBox.classList.remove("hidden");

  if (visibleProblems.length === 0) {
    const empty = makeElement("div", "alert flex-wrap");
    empty.append(makeElement("span", "", "No problems match your filters."));
    const clearBtn = makeElement("button", "btn btn-sm btn-primary rounded-full", "Clear filters");
    clearBtn.dataset.action = "clear-filters";
    empty.append(clearBtn);
    problemList.append(empty);
    return;
  }

  const pageOfProblems = visibleProblems.slice(0, shownCount);
  const grid = makeElement("div", "grid grid-cols-1 md:grid-cols-2 gap-4");
  pageOfProblems.forEach((problem) => {
    grid.append(makeProblemCard(problem, bookmarkedIds.includes(problem.id)));
  });
  problemList.append(grid);

  const remaining = visibleProblems.length - pageOfProblems.length;
  if (remaining > 0) {
    const moreBox = makeElement("div", "flex justify-center mt-6");
    const moreBtn = makeElement("button", "btn btn-outline rounded-full px-8", `Show more (${remaining} left)`);
    moreBtn.dataset.action = "show-more";
    moreBox.append(moreBtn);
    problemList.append(moreBox);
  }
}

export function renderSavedHandles(handles) {
  savedList.replaceChildren();

  if (handles.length === 0) {
    savedList.append(makeElement("li", "text-sm opacity-60 py-1", "No saved handles yet."));
    return;
  }

  handles.forEach((handle) => {
    const item = makeElement("li", "flex flex-row items-center gap-1 rounded-xl hover:bg-base-200");

    const loadBtn = makeElement("button", "btn btn-ghost btn-sm flex-1 justify-start font-medium", handle);
    loadBtn.dataset.action = "load";
    loadBtn.dataset.handle = handle;

    const removeBtn = makeElement("button", "btn btn-ghost btn-sm btn-circle opacity-50 hover:opacity-100 hover:text-error", "×");
    removeBtn.dataset.action = "remove";
    removeBtn.dataset.handle = handle;
    removeBtn.setAttribute("aria-label", `Remove ${handle}`);

    item.append(loadBtn, removeBtn);
    savedList.append(item);
  });
}

export function renderBookmarks(bookmarks) {
  bookmarkList.replaceChildren();

  if (bookmarks.length === 0) {
    bookmarkList.append(makeElement("li", "text-sm opacity-60 py-1", "No bookmarks yet."));
    return;
  }

  bookmarks.forEach((problem) => {
    const item = makeElement("li", "flex flex-row items-center gap-1 rounded-xl hover:bg-base-200 pl-3");

    const link = makeElement("a", "link link-hover flex-1 text-sm py-1", problem.name);
    link.href = `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    const removeBtn = makeElement("button", "btn btn-ghost btn-sm btn-circle opacity-50 hover:opacity-100 hover:text-error", "×");
    removeBtn.dataset.action = "remove-bookmark";
    removeBtn.dataset.id = problem.id;
    removeBtn.setAttribute("aria-label", `Remove bookmark ${problem.name}`);

    item.append(link, removeBtn);
    bookmarkList.append(item);
  });
}
