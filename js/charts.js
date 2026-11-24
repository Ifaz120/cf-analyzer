// The two Chart.js charts (Chart is a global from the CDN script).

let ratingChart = null;
let tagChart = null;

let lastHistory = null;
let lastProblems = null;

function applyThemeDefaults(canvas) {
  Chart.defaults.color = getComputedStyle(canvas).color;
  Chart.defaults.borderColor = "rgba(128, 128, 128, 0.2)";
  Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, system-ui, sans-serif";
}

export function drawRatingChart(history) {
  const canvas = document.querySelector("#rating-chart");
  const message = document.querySelector("#rating-empty");
  lastHistory = history;

  if (ratingChart) {
    ratingChart.destroy();
    ratingChart = null;
  }

  if (history.length === 0) {
    canvas.classList.add("hidden");
    message.classList.remove("hidden");
    return;
  }
  canvas.classList.remove("hidden");
  message.classList.add("hidden");
  applyThemeDefaults(canvas);

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
          pointRadius: 0,
          pointHoverRadius: 5,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      scales: { x: { ticks: { maxTicksLimit: 8, maxRotation: 0 } } },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => history[items[0].dataIndex].contestName,
            label: (item) => `Rating: ${item.parsed.y}`,
          },
        },
      },
    },
  });
}

export function drawTagChart(problems) {
  const canvas = document.querySelector("#tag-chart");
  const message = document.querySelector("#tag-empty");
  lastProblems = problems;

  if (tagChart) {
    tagChart.destroy();
    tagChart = null;
  }

  if (problems.length === 0) {
    canvas.classList.add("hidden");
    message.classList.remove("hidden");
    return;
  }
  canvas.classList.remove("hidden");
  message.classList.add("hidden");
  applyThemeDefaults(canvas);

  const counts = problems.reduce((totals, problem) => {
    problem.tags.forEach((tag) => {
      totals[tag] = (totals[tag] || 0) + 1;
    });
    return totals;
  }, {});

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
      indexAxis: "y",
      maintainAspectRatio: false,
      scales: { y: { ticks: { autoSkip: false } } },
      plugins: { legend: { display: false } },
    },
  });
}

export function redrawCharts() {
  if (lastHistory !== null) {
    drawRatingChart(lastHistory);
  }
  if (lastProblems !== null) {
    drawTagChart(lastProblems);
  }
}
