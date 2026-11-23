// Fetch functions for the Codeforces API, plus the logic that cleans submissions.

const BASE_URL = "https://codeforces.com/api/";

// Turns a Codeforces error comment into a message that is friendly for the user.
function makeFriendlyMessage(comment) {
  if (comment.includes("not found")) {
    return "User not found. Please check the handle and try again.";
  }
  if (comment.includes("limit exceeded")) {
    return "Too many requests, please try again in a few seconds.";
  }
  return comment;
}

// Calls one Codeforces endpoint and returns its "result", or throws an Error with a friendly message.
async function callApi(endpoint) {
  let data;
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    data = await response.json();
  } catch (error) {
    // fetch fails only when the network is down or the response is not JSON
    throw new Error("Network error. Please check your connection and try again.");
  }

  // Codeforces answers { status: "FAILED", comment: "..." } when something is wrong
  if (data.status !== "OK") {
    throw new Error(makeFriendlyMessage(data.comment || "Unknown error"));
  }
  return data.result;
}

// Gets the profile info of one user (the API returns an array, we want the first item).
export async function fetchUserInfo(handle) {
  const result = await callApi(`user.info?handles=${encodeURIComponent(handle)}`);
  return result[0];
}

// Gets every submission made by one user.
export async function fetchSubmissions(handle) {
  return await callApi(`user.status?handle=${encodeURIComponent(handle)}`);
}

// Gets the rating history (one entry per rated contest) of one user.
export async function fetchRating(handle) {
  return await callApi(`user.rating?handle=${encodeURIComponent(handle)}`);
}

// Turns raw submissions into a list of unique solved problems.
export function getSolvedProblems(submissions) {
  // Keep only accepted submissions
  const accepted = submissions.filter((sub) => sub.verdict === "OK");

  // Remove duplicates: a problem can be accepted many times, so remember the ids we have seen.
  // Submissions come newest first, so we keep the most recent accepted one.
  const seenIds = new Set();
  const unique = accepted.filter((sub) => {
    const id = `${sub.problem.contestId}${sub.problem.index}`;
    if (seenIds.has(id)) {
      return false;
    }
    seenIds.add(id);
    return true;
  });

  // Keep only the fields we need
  return unique.map((sub) => ({
    id: `${sub.problem.contestId}${sub.problem.index}`,
    contestId: sub.problem.contestId,
    index: sub.problem.index,
    name: sub.problem.name,
    rating: sub.problem.rating, // can be undefined for unrated problems
    tags: sub.problem.tags,
    solvedAt: sub.creationTimeSeconds,
  }));
}
