// Functions that build the DOM. Text from the API is always set with textContent.

const statusBox = document.querySelector("#status");
const resultsBox = document.querySelector("#results");
const profileBox = document.querySelector("#profile");
const filtersBox = document.querySelector("#filters");
const countText = document.querySelector("#count-text");
const problemList = document.querySelector("#problem-list");
const savedList = document.querySelector("#saved-list");
const bookmarkList = document.querySelector("#bookmark-list");
const tagSelect = document.querySelector("#filter-tag");

// Official Codeforces rank colors
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

// Creates an element with optional classes and text (text is set safely with textContent).
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

// Returns the color for a rank name (gray if the user is unrated).
function getRankColor(rank) {
  return RANK_COLORS[rank] || "#808080";
}

// Returns the Codeforces rank color that matches a rating number (gray if unrated).
function getRatingColor(rating) {
  if (!rating || rating < 1200) return "#808080";
  if (rating < 1400) return "#008000";
  if (rating < 1600) return "#03a89e";
  if (rating < 1900) return "#0000ff";
  if (rating < 2100) return "#aa00aa";
  if (rating < 2400) return "#ff8c00";
  return "#ff0000";
}

// Mixes a color with the page text color so it stays readable in both light and dark themes.
function readableText(color) {
  return `color-mix(in srgb, ${color} 80%, var(--color-base-content))`;
}

// Makes a soft see-through version of a color for badge backgrounds.
function tint(color) {
  return `color-mix(in srgb, ${color} 15%, transparent)`;
}

// ---------- Loading / error / results visibility ----------

// Shows skeleton placeholders while data is loading.
export function showLoading() {
  statusBox.replaceChildren();
  // Blocks shaped like the profile card, the charts and the problem list
  const heights = ["h-52", "h-64", "h-40"];
  heights.forEach((height) => {
    statusBox.append(makeElement("div", `skeleton ${height} w-full mb-4`));
  });
  resultsBox.classList.add("hidden");
}

// Shows an error alert with a message.
export function showError(message) {
  statusBox.replaceChildren();
  const alert = makeElement("div", "alert alert-error");
  alert.setAttribute("role", "alert");
  alert.append(makeElement("span", "", message));
  statusBox.append(alert);
  resultsBox.classList.add("hidden");
}

// Clears the loading skeletons / error message and shows the results area.
export function showResults() {
  statusBox.replaceChildren();
  resultsBox.classList.remove("hidden");
}

// ---------- Profile ----------

// Builds one stat block for the DaisyUI stats component (value can have its own color).
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

// Builds the profile card (avatar, handle, rank, country, organization, stats, Save button).
export function renderProfile(user, solvedCount, isSaved) {
  const rank = user.rank || "unrated";
  const color = getRankColor(user.rank);

  const card = makeElement("div", "card bg-base-100 shadow-sm border border-base-300");
  const body = makeElement("div", "card-body gap-6 p-6 sm:p-8");

  // Top row: avatar with a rank-colored ring + names
  const top = makeElement("div", "flex items-center gap-5 flex-wrap");
  const avatar = makeElement("img", "w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover");
  avatar.style.outline = `3px solid ${color}`;
  avatar.style.outlineOffset = "3px";
  // The API sometimes gives links starting with "//", so add https:
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

  // Stats row
  const stats = makeElement("div", "stats stats-vertical sm:stats-horizontal w-full bg-base-200/60");
  stats.append(makeStat("Current Rating", user.rating ?? "Unrated", getRatingColor(user.rating)));
  stats.append(makeStat("Max Rating", user.maxRating ?? "Unrated", getRatingColor(user.maxRating)));
  stats.append(makeStat("Problems Solved", solvedCount));
  body.append(stats);

  // Save button
  const actions = makeElement("div", "card-actions");
  const saveBtn = makeElement("button");
  saveBtn.id = "save-btn";
  actions.append(saveBtn);
  body.append(actions);

  card.append(body);
  profileBox.replaceChildren(card);
  updateSaveButton(isSaved);
}

// Updates the Save button text and disables it if the handle is already saved.
export function updateSaveButton(isSaved) {
  const saveBtn = document.querySelector("#save-btn");
  if (!saveBtn) {
    return;
  }
  saveBtn.className = isSaved ? "btn rounded-full px-6" : "btn btn-primary rounded-full px-6";
  saveBtn.textContent = isSaved ? "Saved ✓" : "Save handle";
  saveBtn.disabled = isSaved;
}

// ---------- Filters ----------

// Fills the tag select with every tag found in the solved problems (plus "All tags").
export function populateTagSelect(problems) {
  // flatMap joins all tag arrays into one, Set removes duplicates, sort puts them in order
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

// Puts all filter and sort controls back to their default values.
export function resetFilterInputs() {
  document.querySelector("#filter-name").value = "";
  document.querySelector("#filter-tag").value = "";
  document.querySelector("#filter-min").value = "";
  document.querySelector("#filter-max").value = "";
  document.querySelector("#filter-sort").value = "newest";
}

// ---------- Problems ----------

// Sets a bookmark button to look "bookmarked" or "not bookmarked".
export function setBookmarkButton(button, isBookmarked) {
  button.className = `btn btn-sm rounded-full ${isBookmarked ? "btn-warning" : "btn-ghost bg-base-200"}`;
  button.textContent = isBookmarked ? "★ Bookmarked" : "☆ Solve later";
}

// Builds one problem card (name, rating badge, tag badges, link, bookmark button).
function makeProblemCard(problem, isBookmarked) {
  const card = makeElement(
    "div",
    "card bg-base-100 shadow-sm border border-base-300 transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
  );
  const body = makeElement("div", "card-body p-5 gap-3");

  body.append(makeElement("h3", "font-semibold leading-snug tracking-tight", problem.name));

  // Rating badge uses the Codeforces color for that rating
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

// Shows the visible problems, the "Showing X of Y" text, and the empty states.
export function renderProblems(visibleProblems, totalCount, bookmarkedIds, shownCount) {
  problemList.replaceChildren();
  countText.textContent = `Showing ${visibleProblems.length} of ${totalCount}`;

  // Empty state 1: the user has not solved anything
  if (totalCount === 0) {
    filtersBox.classList.add("hidden");
    const empty = makeElement("div", "alert");
    empty.append(makeElement("span", "", "No solved problems yet."));
    problemList.append(empty);
    return;
  }
  filtersBox.classList.remove("hidden");

  // Empty state 2: filters hide everything
  if (visibleProblems.length === 0) {
    const empty = makeElement("div", "alert flex-wrap");
    empty.append(makeElement("span", "", "No problems match your filters."));
    const clearBtn = makeElement("button", "btn btn-sm btn-primary rounded-full", "Clear filters");
    clearBtn.dataset.action = "clear-filters";
    empty.append(clearBtn);
    problemList.append(empty);
    return;
  }

  // Only draw the first "shownCount" cards so the page stays light and tidy
  const pageOfProblems = visibleProblems.slice(0, shownCount);
  const grid = makeElement("div", "grid grid-cols-1 md:grid-cols-2 gap-4");
  pageOfProblems.forEach((problem) => {
    grid.append(makeProblemCard(problem, bookmarkedIds.includes(problem.id)));
  });
  problemList.append(grid);

  // "Show more" button while some matching problems are still hidden
  const remaining = visibleProblems.length - pageOfProblems.length;
  if (remaining > 0) {
    const moreBox = makeElement("div", "flex justify-center mt-6");
    const moreBtn = makeElement("button", "btn btn-outline rounded-full px-8", `Show more (${remaining} left)`);
    moreBtn.dataset.action = "show-more";
    moreBox.append(moreBtn);
    problemList.append(moreBox);
  }
}

// ---------- Sidebar lists ----------

// Builds the sidebar list of saved handles (each has a load button and a × remove button).
export function renderSavedHandles(handles) {
  savedList.replaceChildren();

  // Empty state
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

// Builds the sidebar list of bookmarked problems (each has a link and a × remove button).
export function renderBookmarks(bookmarks) {
  bookmarkList.replaceChildren();

  // Empty state
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
