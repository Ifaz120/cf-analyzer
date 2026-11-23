// Startup code and all event listeners.

import { fetchUserInfo, fetchSubmissions, fetchRating, getSolvedProblems } from "./api.js";
import {
  getSavedHandles,
  isHandleSaved,
  saveHandle,
  removeHandle,
  getBookmarks,
  isBookmarked,
  addBookmark,
  removeBookmark,
  getTheme,
  setTheme,
  setLastHandle,
  getLastHandle,
} from "./storage.js";
import {
  showLoading,
  showError,
  showResults,
  renderProfile,
  updateSaveButton,
  populateTagSelect,
  resetFilterInputs,
  setBookmarkButton,
  renderProblems,
  renderSavedHandles,
  renderBookmarks,
} from "./render.js";
import { drawRatingChart, drawTagChart, redrawCharts } from "./charts.js";

const searchForm = document.querySelector("#search-form");
const heroForm = document.querySelector("#hero-form");
const heroInput = document.querySelector("#hero-input");
const hero = document.querySelector("#hero");
const analyzerSection = document.querySelector("#analyzer");
const handleInput = document.querySelector("#handle-input");
const searchBtn = document.querySelector("#search-btn");
const themeToggle = document.querySelector("#theme-toggle");
const profileBox = document.querySelector("#profile");
const savedList = document.querySelector("#saved-list");
const bookmarkList = document.querySelector("#bookmark-list");
const filtersBox = document.querySelector("#filters");
const problemList = document.querySelector("#problem-list");

const filterName = document.querySelector("#filter-name");
const filterTag = document.querySelector("#filter-tag");
const filterMin = document.querySelector("#filter-min");
const filterMax = document.querySelector("#filter-max");
const filterSort = document.querySelector("#filter-sort");

let currentHandle = ""; // the handle that is currently shown
let allSolved = []; // all unique solved problems of the current handle
let isLoading = false; // stops a second search while one is running
const PAGE_SIZE = 20; // how many problem cards to add each time
let shownCount = PAGE_SIZE; // how many problem cards are currently listed

// ---------- Loading a handle ----------

// Loads one handle: fetches the data one request after another, then draws the page.
async function loadHandle(handle) {
  if (isLoading) {
    return;
  }
  isLoading = true;
  searchBtn.disabled = true;
  showLoading();

  try {
    // Requests are made one after another (not at the same time) to respect the API limit
    const user = await fetchUserInfo(handle);
    const submissions = await fetchSubmissions(user.handle);
    const ratingHistory = await fetchRating(user.handle);

    allSolved = getSolvedProblems(submissions);
    currentHandle = user.handle;
    handleInput.value = user.handle;
    heroInput.value = user.handle;
    setLastHandle(user.handle);

    // The results area must be visible before charts are drawn, so they get the right size
    showResults();
    renderProfile(user, allSolved.length, isHandleSaved(user.handle));
    populateTagSelect(allSolved);
    resetFilterInputs();
    applyFilters();
    drawRatingChart(ratingHistory);
    drawTagChart(allSolved);
  } catch (error) {
    showError(error.message);
  } finally {
    // runs on success and on error
    isLoading = false;
    searchBtn.disabled = false;
  }
}

// ---------- Filtering and sorting ----------

// Returns the solved problems that match the filters, in the chosen order.
function getVisibleProblems() {
  const searchText = filterName.value.trim().toLowerCase();
  const tag = filterTag.value;
  const hasRatingFilter = filterMin.value !== "" || filterMax.value !== "";
  const minRating = filterMin.value === "" ? 0 : Number(filterMin.value);
  const maxRating = filterMax.value === "" ? Infinity : Number(filterMax.value);

  // Filtering: a problem stays only if it passes every check
  const filtered = allSolved.filter((problem) => {
    const matchesName = problem.name.toLowerCase().includes(searchText);
    const matchesTag = tag === "" || problem.tags.includes(tag);
    // Unrated problems have no rating, so they are hidden when a rating limit is set
    const matchesRating =
      !hasRatingFilter ||
      (problem.rating !== undefined && problem.rating >= minRating && problem.rating <= maxRating);
    return matchesName && matchesTag && matchesRating;
  });

  // Sorting: sort a copy so the original order stays untouched
  const sorted = [...filtered];
  if (filterSort.value === "newest") {
    sorted.sort((a, b) => b.solvedAt - a.solvedAt);
  } else if (filterSort.value === "rating-desc") {
    sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else {
    sorted.sort((a, b) => (a.rating || 0) - (b.rating || 0));
  }
  return sorted;
}

// Draws the problem list with the current filters, showing only the first "shownCount" problems.
function drawProblems() {
  const bookmarkedIds = getBookmarks().map((problem) => problem.id);
  renderProblems(getVisibleProblems(), allSolved.length, bookmarkedIds, shownCount);
}

// Runs when a filter, sort or search changes: go back to the first page, then draw.
function applyFilters() {
  shownCount = PAGE_SIZE;
  drawProblems();
}

// ---------- Event handlers ----------

// Smoothly scrolls down from the landing page to the analyzer section.
function scrollToAnalyzer() {
  const top = analyzerSection.getBoundingClientRect().top + window.scrollY - 64; // 64 = height of the top bar
  window.scrollTo({ top: top, behavior: "smooth" });
}

// Handles both search forms (top bar and hero): works for the button click and the Enter key.
function handleSearch(event) {
  event.preventDefault(); // stop the page from reloading
  const input = event.currentTarget.querySelector("input"); // the input inside the form that was submitted
  const handle = input.value.trim();

  // Keep both search boxes showing the same text
  handleInput.value = handle;
  heroInput.value = handle;
  scrollToAnalyzer();

  // Validate empty input
  if (handle === "") {
    showError("Please enter a Codeforces handle.");
    return;
  }
  loadHandle(handle);
}

// Handles clicks on the example handles in the hero (event delegation).
function handleHeroClick(event) {
  const button = event.target.closest("[data-action='try']");
  if (!button) {
    return;
  }
  const handle = button.dataset.handle;
  handleInput.value = handle;
  heroInput.value = handle;
  scrollToAnalyzer();
  loadHandle(handle);
}

// Handles clicks inside the profile card (event delegation for the Save button).
function handleProfileClick(event) {
  const saveBtn = event.target.closest("#save-btn");
  if (!saveBtn || currentHandle === "") {
    return;
  }
  saveHandle(currentHandle);
  renderSavedHandles(getSavedHandles());
  updateSaveButton(true);
}

// Handles clicks in the saved handles list (event delegation: one listener for all buttons).
function handleSavedListClick(event) {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }
  const handle = button.dataset.handle;

  if (button.dataset.action === "load") {
    loadHandle(handle);
  } else if (button.dataset.action === "remove") {
    removeHandle(handle);
    renderSavedHandles(getSavedHandles());
    // If the removed handle is the one on screen, the Save button becomes active again
    if (handle.toLowerCase() === currentHandle.toLowerCase()) {
      updateSaveButton(false);
    }
  }
}

// Handles clicks in the problem list: bookmark buttons and "Clear filters" (event delegation).
function handleProblemListClick(event) {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  if (button.dataset.action === "clear-filters") {
    resetFilterInputs();
    applyFilters();
  } else if (button.dataset.action === "show-more") {
    shownCount += PAGE_SIZE; // list 20 more problems
    drawProblems();
  } else if (button.dataset.action === "bookmark") {
    const id = button.dataset.id;
    // Find the full problem object, then add or remove it from the bookmarks
    const problem = allSolved.find((item) => item.id === id);
    if (isBookmarked(id)) {
      removeBookmark(id);
    } else {
      addBookmark(problem);
    }
    setBookmarkButton(button, isBookmarked(id));
    renderBookmarks(getBookmarks());
  }
}

// Handles clicks in the bookmarks list (event delegation for the × buttons).
function handleBookmarkListClick(event) {
  const button = event.target.closest("button");
  if (!button || button.dataset.action !== "remove-bookmark") {
    return;
  }
  const id = button.dataset.id;
  removeBookmark(id);
  renderBookmarks(getBookmarks());

  // If that problem is on screen, switch its bookmark button back to "Solve later"
  const cardButton = document.querySelector(`[data-action="bookmark"][data-id="${id}"]`);
  if (cardButton) {
    setBookmarkButton(cardButton, false);
  }
}

// ---------- Theme ----------

// Applies a theme to the page and updates the toggle button text.
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeToggle.textContent = theme === "dark" ? "Light" : "Dark";
}

// Switches between light and dark and saves the choice.
function handleThemeToggle() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  setTheme(next);
  redrawCharts(); // chart text colors depend on the theme
}

// ---------- Startup ----------

// Sets up the page when it first opens.
function startApp() {
  applyTheme(getTheme());

  searchForm.addEventListener("submit", handleSearch);
  heroForm.addEventListener("submit", handleSearch);
  hero.addEventListener("click", handleHeroClick);
  themeToggle.addEventListener("click", handleThemeToggle);
  profileBox.addEventListener("click", handleProfileClick);
  savedList.addEventListener("click", handleSavedListClick);
  bookmarkList.addEventListener("click", handleBookmarkListClick);
  problemList.addEventListener("click", handleProblemListClick);
  // "input" fires for typing in text boxes and for changes in select boxes
  filtersBox.addEventListener("input", applyFilters);

  renderSavedHandles(getSavedHandles());
  renderBookmarks(getBookmarks());

  // Load the last searched handle automatically after a refresh
  const lastHandle = getLastHandle();
  if (lastHandle !== "") {
    handleInput.value = lastHandle;
    heroInput.value = lastHandle;
    loadHandle(lastHandle); // loads quietly: the page stays on the landing section
  }
}

startApp();
