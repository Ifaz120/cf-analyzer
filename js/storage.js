// localStorage helpers: saved handles, bookmarks, theme and the last searched handle.

const SAVED_KEY = "cf-saved-handles";
const BOOKMARKS_KEY = "cf-bookmarks";
const THEME_KEY = "cf-theme";
const LAST_HANDLE_KEY = "cf-last-handle";

// Reads an array from localStorage (returns an empty array if nothing is stored).
function readList(key) {
  const text = localStorage.getItem(key);
  if (text === null) {
    return [];
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    return []; // stored text was broken, start fresh
  }
}

// Writes an array to localStorage as JSON text.
function writeList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

// ---------- Saved handles ----------

// Returns the saved handles array.
export function getSavedHandles() {
  return readList(SAVED_KEY);
}

// Checks if a handle is already saved (handles are not case sensitive on Codeforces).
export function isHandleSaved(handle) {
  return getSavedHandles().some((saved) => saved.toLowerCase() === handle.toLowerCase());
}

// Adds a handle to the saved list unless it is already there.
export function saveHandle(handle) {
  if (isHandleSaved(handle)) {
    return;
  }
  const handles = getSavedHandles();
  handles.push(handle);
  writeList(SAVED_KEY, handles);
}

// Removes a handle from the saved list.
export function removeHandle(handle) {
  const handles = getSavedHandles().filter((saved) => saved !== handle);
  writeList(SAVED_KEY, handles);
}

// ---------- Bookmarks ----------

// Returns the bookmarked problems array.
export function getBookmarks() {
  return readList(BOOKMARKS_KEY);
}

// Checks if a problem id is bookmarked.
export function isBookmarked(problemId) {
  return getBookmarks().some((problem) => problem.id === problemId);
}

// Adds a problem to the bookmarks unless it is already there.
export function addBookmark(problem) {
  if (isBookmarked(problem.id)) {
    return;
  }
  const bookmarks = getBookmarks();
  bookmarks.push(problem);
  writeList(BOOKMARKS_KEY, bookmarks);
}

// Removes a problem from the bookmarks by its id.
export function removeBookmark(problemId) {
  const bookmarks = getBookmarks().filter((problem) => problem.id !== problemId);
  writeList(BOOKMARKS_KEY, bookmarks);
}

// ---------- Theme and last handle ----------

// Returns the saved theme ("light" if none was saved).
export function getTheme() {
  return localStorage.getItem(THEME_KEY) || "light";
}

// Saves the chosen theme.
export function setTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

// Remembers the last searched handle so it can load again after a refresh.
export function setLastHandle(handle) {
  localStorage.setItem(LAST_HANDLE_KEY, handle);
}

// Returns the last searched handle, or an empty string if there is none.
export function getLastHandle() {
  return localStorage.getItem(LAST_HANDLE_KEY) || "";
}
