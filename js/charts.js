// The two Chart.js charts (Chart is a global from the CDN script).

let ratingChart = null;
let tagChart = null;

// The last data drawn, kept so the charts can be redrawn when the theme changes
let lastHistory = null;
let lastProblems = null;

// Sets chart text, grid and font so they match the current theme.
function applyThemeDefaults(canvas) {
  Chart.defaults.color = getComputedStyle(canvas).color; // follows the page text color
  Chart.defaults.borderColor = "rgba(128, 128, 128, 0.2)"; // soft grid lines in both themes
  Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, system-ui, sans-serif";
}

// Draws the rating line chart, or shows a message if the user has no rated contests.
export function drawRatingChart(history) {
  const canvas = document.querySelector("#rating-chart");
  const message = document.querySelector("#rating-empty");
  lastHistory = history;

  // Destroy the old chart first, otherwise Chart.js cannot reuse the canvas
  if (ratingChart) {
    ratingChart.destroy();
    ratingChart = null;
  }

  // Empty state
  if (history.length === 0) {
    canvas.classList.add("hidden");
    message.classList.remove("hidden");
    return;
  }
  canvas.classList.remove("hidden");
  message.classList.add("hidden");
  applyThemeDefaults(canvas);

  // Build chart data: x-axis = contest date as text, y-axis = rating after the contest
  const labels = history.map((contest) =>
    new Date(contest.ratingUpdateTimeSeconds * 1000).toLocaleDateString()
  );
  const ratings = history.map((contest) => contest.newRating);

  ratingChart = new Chart(canvas, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Rating",
          data: ratings,
          borderColor: "#0a84ff",
          backgroundColor: "rgba(10, 132, 255, 0.12)",
          borderWidth: 2.5,
          fill: true,
          tension: 0.3,
          pointRadius: 0, // clean line, points only appear on hover
          pointHoverRadius: 5,
        },
      ],
    },
    options: {
      maintainAspectRatio: false, // fill the fixed-height box around the canvas
      scales: { x: { ticks: { maxTicksLimit: 8, maxRotation: 0 } } }, // fewer, flat date labels
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            // Tooltip title = contest name, body = rating
            title: (items) => history[items[0].dataIndex].contestName,
            label: (item) => `Rating: ${item.parsed.y}`,
          },
        },
      },
    },
  });
}

// Draws the bar chart of the 10 most common tags among solved problems.
export function drawTagChart(problems) {
  const canvas = document.querySelector("#tag-chart");
  const message = document.querySelector("#tag-empty");
  lastProblems = problems;

  if (tagChart) {
    tagChart.destroy();
    tagChart = null;
  }

  // Empty state
  if (problems.length === 0) {
    canvas.classList.add("hidden");
    message.classList.remove("hidden");
    return;
  }
  canvas.classList.remove("hidden");
  message.classList.add("hidden");
  applyThemeDefaults(canvas);

  // Count problems per tag with reduce, e.g. { dp: 40, greedy: 55 }
  const counts = problems.reduce((totals, problem) => {
    problem.tags.forEach((tag) => {
      totals[tag] = (totals[tag] || 0) + 1;
    });
    return totals;
  }, {});

  // Turn the object into [tag, count] pairs, sort by count (biggest first), keep the top 10
  const topTags = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  tagChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: topTags.map((pair) => pair[0]),
      datasets: [
        {
          label: "Solved problems",
          data: topTags.map((pair) => pair[1]),
          backgroundColor: "#0a84ff",
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    },
    options: {
      indexAxis: "y", // horizontal bars so long tag names stay readable
      maintainAspectRatio: false,
      scales: { y: { ticks: { autoSkip: false } } }, // show all 10 tag names
      plugins: { legend: { display: false } },
    },
  });
}

// Redraws both charts with the last data (used after the theme changes, so text colors update).
export function redrawCharts() {
  if (lastHistory !== null) {
    drawRatingChart(lastHistory);
  }
  if (lastProblems !== null) {
    drawTagChart(lastProblems);
  }
}
