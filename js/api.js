const BASE_URL = "https://codeforces.com/api/";

function makeFriendlyMessage(comment) {
  if (comment.includes("not found")) {
    return "User not found. Please check the handle and try again.";
  }
  if (comment.includes("limit exceeded")) {
    return "Too many requests, please try again in a few seconds.";
  }
  return comment;
}

async function callApi(endpoint) {
  let data;
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    data = await response.json();
  } catch (error) {
    throw new Error("Network error. Please check your connection and try again.");
  }

  // Codeforces answers { status: "FAILED", comment: "..." } when something is wrong
  if (data.status !== "OK") {
    throw new Error(makeFriendlyMessage(data.comment || "Unknown error"));
  }
  return data.result;
}

export async function fetchUserInfo(handle) {
  const result = await callApi(`user.info?handles=${encodeURIComponent(handle)}`);
  return result[0];
}

export async function fetchSubmissions(handle) {
  return await callApi(`user.status?handle=${encodeURIComponent(handle)}`);
}

export async function fetchRating(handle) {
  return await callApi(`user.rating?handle=${encodeURIComponent(handle)}`);
}

export function getSolvedProblems(submissions) {
  const accepted = submissions.filter((sub) => sub.verdict === "OK");

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
