const STORAGE_KEY = "godsaeng-routine-v2";

const oldData = localStorage.getItem("godsaeng-routine-v1");

const defaultRoutines = [
  "기상 후 스트레칭",
  "독서 30분",
  "물 2L 마시기",
  "운동 30분",
  "일기 쓰기"
];

let state = loadState();
let selectedDate = new Date();
let viewDate = new Date();
let homeChart = null;
let monthChart = null;

const $ = (id) => document.getElementById(id);

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (saved) {
    return JSON.parse(saved);
  }

  if (oldData) {
    try {
      const old = JSON.parse(oldData);

      return {
        routines: old.routines?.length
          ? old.routines
          : defaultRoutines.map((title) => ({
              id: crypto.randomUUID(),
              title
            })),
        checks: old.checks || {},
        notes: old.notes || {}
      };
    } catch (e) {}
  }

  return {
    routines: defaultRoutines.map((title) => ({
      id: crypto.randomUUID(),
      title
    })),
    checks: {},
    notes: {}
  };
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function dateKey(date = selectedDate) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

function parseLocalDate(value) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function daysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getDoneCount(date) {
  const checked = state.checks[dateKey(date)] || {};
  return state.routines.filter((r) => checked[r.id]).length;
}

function getMonthData(date) {
  const totalDays = daysInMonth(date);
  const labels = [];
  const values = [];
  let total = 0;
  let doneDays = 0;

  for (let day = 1; day <= totalDays; day++) {
    const d = new Date(date.getFullYear(), date.getMonth(), day);
    const count = getDoneCount(d);

    labels.push(String(day));
    values.push(count);

    total += count;

    if (count > 0) {
      doneDays++;
    }
  }

  return {
    labels,
    values,
    total,
    doneDays,
    totalDays
  };
}

function renderHome() {
  const key = dateKey(selectedDate);

  if (!state.checks[key]) {
    state.checks[key] = {};
  }

  if (!state.notes[key]) {
    state.notes[key] = {
      gratitude: "",
      important: ""
    };
  }

  $("datePicker").value = key;

  const done = getDoneCount(selectedDate);
  const total = state.routines.length;

  $("todayDoneText").textContent = `${done}개 완료`;
  $("todaySubText").textContent = `${total}개 중 ${done}개 완료`;

  renderHomeChart();
  renderRoutineList();
  renderNotes();
}

function renderRoutineList() {
  const key = dateKey(selectedDate);
  const list = $("routineList");

  list.innerHTML = "";

  state.routines.forEach((routine) => {
    const wrap = document.createElement("div");
    wrap.className = "routine-wrap";

    const del = document.createElement("button");
    del.className = "delete-action";
    del.textContent = "Delete";

    del.onclick = () => {
      state.routines = state.routines.filter((r) => r.id !== routine.id);

      Object.values(state.checks).forEach((day) => {
        delete day[routine.id];
      });

      save();
      renderAll();
    };

    const item = document.createElement("button");
    item.className = "routine-item";

    if (state.checks[key][routine.id]) {
      item.classList.add("done");
    }

    item.innerHTML = `
      <span>${escapeHtml(routine.title)}</span>
      <span class="check">${state.checks[key][routine.id] ? "✓" : ""}</span>
    `;

    item.onclick = () => {
      if (wrap.classList.contains("open")) {
        wrap.classList.remove("open");
        return;
      }

      state.checks[key][routine.id] = !state.checks[key][routine.id];

      save();
      renderAll();
    };

    let startX = 0;
    let currentX = 0;

    item.addEventListener(
      "touchstart",
      (e) => {
        startX = e.touches[0].clientX;
      },
      { passive: true }
    );

    item.addEventListener(
      "touchmove",
      (e) => {
        currentX = e.touches[0].clientX;
      },
      { passive: true }
    );

    item.addEventListener("touchend", () => {
      const diff = currentX - startX;

      document.querySelectorAll(".routine-wrap.open").forEach((el) => {
        if (el !== wrap) {
          el.classList.remove("open");
        }
      });

      if (diff < -35) {
        wrap.classList.add("open");
      }

      if (diff > 35) {
        wrap.classList.remove("open");
      }

      startX = 0;
      currentX = 0;
    });

    item.addEventListener("mousedown", (e) => {
      startX = e.clientX;
    });

    item.addEventListener("mouseup", (e) => {
      const diff = e.clientX - startX;

      if (diff < -35) {
        wrap.classList.add("open");
      }

      if (diff > 35) {
        wrap.classList.remove("open");
      }
    });

    wrap.appendChild(del);
    wrap.appendChild(item);
    list.appendChild(wrap);
  });
}

function renderNotes() {
  const key = dateKey(selectedDate);

  $("gratitudeNote").value = state.notes[key]?.gratitude || "";
  $("importantNote").value = state.notes[key]?.important || "";

  $("gratitudeCount").textContent = $("gratitudeNote").value.length;
  $("importantCount").textContent = $("importantNote").value.length;
}

function saveNotes() {
  const key = dateKey(selectedDate);

  state.notes[key] = {
    gratitude: $("gratitudeNote").value,
    important: $("importantNote").value
  };

  save();

  $("gratitudeCount").textContent = $("gratitudeNote").value.length;
  $("importantCount").textContent = $("importantNote").value.length;
}

function renderHomeChart() {
  const data = getMonthData(selectedDate);
  makeLineChart("homeChart", data, true);
}

function renderRecord() {
  const data = getMonthData(viewDate);

  $("monthTitle").textContent = `${viewDate.getFullYear()}년 ${viewDate.getMonth() + 1}월`;
  $("monthTotalText").textContent = `${data.total}개`;
  $("doneDays").textContent = `${data.doneDays}일`;

  makeLineChart("monthChart", data, false);
  renderCalendar();
}

function renderCalendar() {
  const grid = $("monthGrid");

  grid.innerHTML = "";

  const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const total = daysInMonth(viewDate);
  const today = dateKey(new Date());

  for (let i = 0; i < first; i++) {
    const empty = document.createElement("div");
    empty.className = "day empty";
    grid.appendChild(empty);
  }

  for (let day = 1; day <= total; day++) {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const count = getDoneCount(d);

    const el = document.createElement("div");
    el.className = "day";

    if (count > 0) {
      el.classList.add("good");
    }

    if (dateKey(d) === today) {
      el.classList.add("today");
    }

    el.innerHTML = `${day}<br><small>${count}</small>`;

    grid.appendChild(el);
  }
}

function makeLineChart(canvasId, data, isHome) {
  const canvas = $(canvasId);

  if (!canvas || typeof Chart === "undefined") {
    return;
  }

  if (canvasId === "homeChart" && homeChart) {
    homeChart.destroy();
  }

  if (canvasId === "monthChart" && monthChart) {
    monthChart.destroy();
  }

  const maxRoutine = Math.max(state.routines.length, 1);

  const chart = new Chart(canvas, {
    type: "line",
    data: {
      labels: data.labels,
      datasets: [
        {
          data: data.values,
          borderColor: "#111111",
          backgroundColor: "#111111",
          borderWidth: 2.5,
          pointRadius: isHome ? 3 : 3.5,
          pointHoverRadius: 5,
          pointBackgroundColor: "#111111",
          pointBorderColor: "#111111",
          tension: 0.18,
          spanGaps: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.raw}개 완료`
          }
        }
      },

      scales: {
        y: {
          min: 0,
          max: maxRoutine,
          ticks: {
            stepSize: 1,
            color: "#777777",
            callback: (v) => `${v}개`
          },
          grid: {
            color: "#eeeeee"
          },
          border: {
            display: false
          }
        },

        x: {
          ticks: {
            color: "#777777",
            maxTicksLimit: isHome ? 7 : 10
          },
          grid: {
            display: false
          },
          border: {
            display: false
          }
        }
      }
    }
  });

  if (canvasId === "homeChart") {
    homeChart = chart;
  }

  if (canvasId === "monthChart") {
    monthChart = chart;
  }
}

function addRoutine() {
  const title = prompt("새 루틴 이름?");

  if (!title) {
    return;
  }

  state.routines.push({
    id: crypto.randomUUID(),
    title: title.trim()
  });

  save();
  renderAll();
}

function bindEvents() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.onclick = () => {
      document.querySelectorAll(".tab").forEach((t) => {
        t.classList.remove("active");
      });

      document.querySelectorAll(".screen").forEach((s) => {
        s.classList.remove("active");
      });

      tab.classList.add("active");
      $(tab.dataset.tab).classList.add("active");

      renderAll();
    };
  });

  $("addRoutineBtn").onclick = addRoutine;

  $("datePicker").onchange = (e) => {
    selectedDate = parseLocalDate(e.target.value);
    viewDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);

    renderAll();
  };

  $("prevDay").onclick = () => {
    selectedDate.setDate(selectedDate.getDate() - 1);
    viewDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);

    renderAll();
  };

  $("nextDay").onclick = () => {
    selectedDate.setDate(selectedDate.getDate() + 1);
    viewDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);

    renderAll();
  };

  $("prevMonth").onclick = () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);

    renderAll();
  };

  $("nextMonth").onclick = () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);

    renderAll();
  };

  $("gratitudeNote").oninput = saveNotes;
  $("importantNote").oninput = saveNotes;
}

function renderAll() {
  renderHome();
  renderRecord();
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  renderAll();
});
