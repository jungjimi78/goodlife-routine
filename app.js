const STORAGE_KEY = "godsaeng-routine-final";

let state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
  routines: [
    { id: crypto.randomUUID(), title: "운동" },
    { id: crypto.randomUUID(), title: "독서" },
    { id: crypto.randomUUID(), title: "물 마시기" }
  ],
  checks: {},
  notes: {}
};

let selectedDate = new Date();
let todayChart = null;
let monthChart = null;

const $ = (id) => document.getElementById(id);

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function dateKey(date = selectedDate) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDate(value) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function getDoneCount(date = selectedDate) {
  const checked = state.checks[dateKey(date)] || {};
  return state.routines.filter((r) => checked[r.id]).length;
}

function renderHome() {
  const key = dateKey();

  if (!state.checks[key]) state.checks[key] = {};
  if (!state.notes[key]) state.notes[key] = { gratitude: "", important: "" };

  $("datePicker").value = key;
  $("todayLabel").textContent = selectedDate.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long"
  });

  renderRoutines();
  renderNotes();
  renderTodayChart();
}

function renderRoutines() {
  const key = dateKey();
  const list = $("routineList");
  list.innerHTML = "";

  state.routines.forEach((routine) => {
    const item = document.createElement("div");
    item.className = "routine-item";

    if (state.checks[key][routine.id]) {
      item.classList.add("done");
    }

    item.innerHTML = `
      <span class="routine-title">${routine.title}</span>
      <button class="check-btn">${state.checks[key][routine.id] ? "✓" : ""}</button>
      <button class="delete-btn">삭제</button>
    `;

    item.querySelector(".check-btn").onclick = () => {
      state.checks[key][routine.id] = !state.checks[key][routine.id];
      save();
      renderHome();
      renderRecord();
    };

    item.querySelector(".delete-btn").onclick = () => {
      state.routines = state.routines.filter((r) => r.id !== routine.id);

      Object.values(state.checks).forEach((day) => {
        delete day[routine.id];
      });

      save();
      renderHome();
      renderRecord();
    };

    list.appendChild(item);
  });
}

function renderNotes() {
  const key = dateKey();

  $("gratitudeNote").value = state.notes[key].gratitude || "";
  $("importantNote").value = state.notes[key].important || "";
}

function saveNotes() {
  const key = dateKey();

  state.notes[key] = {
    gratitude: $("gratitudeNote").value,
    important: $("importantNote").value
  };

  save();
}

function renderTodayChart() {
  const done = getDoneCount();
  const total = state.routines.length;

  $("todayCountText").textContent = `${done}개 완료 / 전체 ${total}개`;

  if (todayChart) todayChart.destroy();

  todayChart = new Chart($("todayChart"), {
    type: "bar",
    data: {
      labels: ["오늘"],
      datasets: [{
        data: [done],
        backgroundColor: "#111"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          min: 0,
          max: Math.max(total, 1),
          ticks: { stepSize: 1 }
        },
        x: { grid: { display: false } }
      }
    }
  });
}

function renderRecord() {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();

  $("monthLabel").textContent = `${year}년 ${month + 1}월`;

  const labels = [];
  const values = [];

  for (let day = 1; day <= lastDay; day++) {
    const d = new Date(year, month, day);
    labels.push(String(day));
    values.push(getDoneCount(d));
  }

  if (monthChart) monthChart.destroy();

  monthChart = new Chart($("monthChart"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        data: values,
        borderColor: "#111",
        backgroundColor: "#111",
        pointRadius: 3,
        tension: 0.2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          min: 0,
          max: Math.max(state.routines.length, 1),
          ticks: { stepSize: 1 }
        },
        x: {
          ticks: { maxTicksLimit: 8 },
          grid: { display: false }
        }
      }
    }
  });

  renderCalendar(year, month, lastDay);
}

function renderCalendar(year, month, lastDay) {
  const grid = $("monthGrid");
  grid.innerHTML = "";

  const firstDay = new Date(year, month, 1).getDay();

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    empty.className = "day empty";
    grid.appendChild(empty);
  }

  for (let day = 1; day <= lastDay; day++) {
    const d = new Date(year, month, day);
    const count = getDoneCount(d);

    const el = document.createElement("div");
    el.className = count > 0 ? "day done" : "day";
    el.innerHTML = `${day}<br><small>${count}</small>`;

    grid.appendChild(el);
  }
}

function addRoutine() {
  const title = prompt("루틴 이름?");
  if (!title) return;

  state.routines.push({
    id: crypto.randomUUID(),
    title: title.trim()
  });

  save();
  renderHome();
  renderRecord();
}

function bindEvents() {
  $("addRoutineBtn").onclick = addRoutine;

  $("datePicker").onchange = (e) => {
    selectedDate = parseDate(e.target.value);
    renderHome();
    renderRecord();
  };

  $("gratitudeNote").oninput = saveNotes;
  $("importantNote").oninput = saveNotes;

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.onclick = () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));

      tab.classList.add("active");
      $(tab.dataset.tab).classList.add("active");

      renderHome();
      renderRecord();
    };
  });
}

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  renderHome();
  renderRecord();
});
