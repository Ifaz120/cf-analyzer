const SAVED_KEY = "cf-saved-handles";
const BOOKMARKS_KEY = "cf-bookmarks";
const THEME_KEY = "cf-theme";
const LAST_HANDLE_KEY = "cf-last-handle";

function readList(key) {
  const text = localStorage.getItem(key);
  if (text === null) {
    return [];
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    return [];
  }
}

function writeList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

export function getSavedHandles() {
  return readList(SAVED_KEY);
}

export function isHandleSaved(handle) {
  return getSavedHandles().some((saved) => saved.toLowerCase() === handle.toLowerCase());
}

export function saveHandle(handle) {
  if (isHandleSaved(handle)) {
    return;
  }
  const handles = getSavedHandles();
  handles.push(handle);
  writeList(SAVED_KEY, handles);
}

export function removeHandle(handle) {
  const handles = getSavedHandles().filter((saved) => saved !== handle);
  writeList(SAVED_KEY, handles);
}

export function getBookmarks() {
  return readList(BOOKMARKS_KEY);
}

export function isBookmarked(problemId) {
  return getBookmarks().some((problem) => problem.id === problemId);
}

export function addBookmark(problem) {
  if (isBookmarked(problem.id)) {
    return;
  }
  const bookmarks = getBookmarks();
  bookmarks.push(problem);
  writeList(BOOKMARKS_KEY, bookmarks);
}

export function removeBookmark(problemId) {
  const bookmarks = getBookmarks().filter((problem) => problem.id !== problemId);
  writeList(BOOKMARKS_KEY, bookmarks);
}

export function getTheme() {
  return localStorage.getItem(THEME_KEY) || "light";
}

export function setTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

export function setLastHandle(handle) {
  localStorage.setItem(LAST_HANDLE_KEY, handle);
}

export function getLastHandle() {
  return localStorage.getItem(LAST_HANDLE_KEY) || "";
}
