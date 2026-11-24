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

let currentHandle = "";
let allSolved = [];
let isLoading = false;
const PAGE_SIZE = 20;
let shownCount = PAGE_SIZE;

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
    isLoading = false;
    searchBtn.disabled = false;
  }
}

function getVisibleProblems() {
  const searchText = filterName.value.trim().toLowerCase();
  const tag = filterTag.value;
  const hasRatingFilter = filterMin.value !== "" || filterMax.value !== "";
  const minRating = filterMin.value === "" ? 0 : Number(filterMin.value);
  const maxRating = filterMax.value === "" ? Infinity : Number(filterMax.value);

  const filtered = allSolved.filter((problem) => {
    const matchesName = problem.name.toLowerCase().includes(searchText);
    const matchesTag = tag === "" || problem.tags.includes(tag);
    // Unrated problems have no rating, so they are hidden when a rating limit is set
    const matchesRating =
      !hasRatingFilter ||
      (problem.rating !== undefined && problem.rating >= minRating && problem.rating <= maxRating);
    return matchesName && matchesTag && matchesRating;
  });

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

function drawProblems() {
  const bookmarkedIds = getBookmarks().map((problem) => problem.id);
  renderProblems(getVisibleProblems(), allSolved.length, bookmarkedIds, shownCount);
}

function applyFilters() {
  shownCount = PAGE_SIZE;
  drawProblems();
}

function scrollToAnalyzer() {
  const top = analyzerSection.getBoundingClientRect().top + window.scrollY - 64; // 64 = height of the top bar
  window.scrollTo({ top: top, behavior: "smooth" });
}

function handleSearch(event) {
  event.preventDefault();
  const input = event.currentTarget.querySelector("input");
  const handle = input.value.trim();

  handleInput.value = handle;
  heroInput.value = handle;
  scrollToAnalyzer();

  if (handle === "") {
    showError("Please enter a Codeforces handle.");
    return;
  }
  loadHandle(handle);
}

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

function handleProfileClick(event) {
  const saveBtn = event.target.closest("#save-btn");
  if (!saveBtn || currentHandle === "") {
    return;
  }
  saveHandle(currentHandle);
  renderSavedHandles(getSavedHandles());
  updateSaveButton(true);
}

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
    if (handle.toLowerCase() === currentHandle.toLowerCase()) {
      updateSaveButton(false);
    }
  }
}

function handleProblemListClick(event) {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  if (button.dataset.action === "clear-filters") {
    resetFilterInputs();
    applyFilters();
  } else if (button.dataset.action === "show-more") {
    shownCount += PAGE_SIZE;
    drawProblems();
  } else if (button.dataset.action === "bookmark") {
    const id = button.dataset.id;
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

function handleBookmarkListClick(event) {
  const button = event.target.closest("button");
  if (!button || button.dataset.action !== "remove-bookmark") {
    return;
  }
  const id = button.dataset.id;
  removeBookmark(id);
  renderBookmarks(getBookmarks());

  const cardButton = document.querySelector(`[data-action="bookmark"][data-id="${id}"]`);
  if (cardButton) {
    setBookmarkButton(cardButton, false);
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeToggle.textContent = theme === "dark" ? "Light" : "Dark";
}

function handleThemeToggle() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  setTheme(next);
  redrawCharts();
}

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
  filtersBox.addEventListener("input", applyFilters);

  renderSavedHandles(getSavedHandles());
  renderBookmarks(getBookmarks());

  const lastHandle = getLastHandle();
  if (lastHandle !== "") {
    handleInput.value = lastHandle;
    heroInput.value = lastHandle;
    loadHandle(lastHandle);
  }
}

startApp();
