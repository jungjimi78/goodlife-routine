const STORAGE_KEY = "godsaeng-routine-v1";

const defaultRoutines = [
  "기상 후 스트레칭",
  "독서 30분",
  "물 2L 마시기",
  "운동 30분",
  "일기 쓰기"
];

let state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
  routines: defaultRoutines.map((title) => ({
    id: Date.now() + Math.random(),
    title
  })),
  checks: {},
  notes: {}
};

let viewDate = new Date();
let miniChart = null;
let monthChart = null;

const $ = (id) => document.getElementById(id);

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function dateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function monthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

function daysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getDayPercent(date) {
  const key = dateKey(date);
  const checked = state.checks[key] || {};
  const total = state.routines.length || 1;
  const done = state.routines.filter((r) => checked[r.id]).length;
  return Math.round((done / total) * 100);
}

function getMonthData(date) {
  const totalDays = daysInMonth(date);
  const today = new Date();
  const isThisMonth = monthKey(date) === monthKey(today);
  const endDay = isThisMonth ? today.getDate() : totalDays;

  const labels = [];
  const values = [];
  let perfectDays = 0;

  for (let day = 1; day <= totalDays; day++) {
    const d = new Date(date.getFullYear(), date.getMonth(), day);
    const percent = day <= endDay ? getDayPercent(d) : null;

    labels.push(String(day));
    values.push(percent);

    if (percent === 100) perfectDays++;
  }

  const available = values.filter((v) => v !== null);
  const avg = available.length
    ? Math.round(available.reduce((a, b) => a + b, 0) / available.length)
    : 0;

  return { labels, values, avg, perfectDays, totalDays };
}

function renderHome() {
  const today = new Date();
  const key = dateKey(today);

  if (!state.checks[key]) state.checks[key] = {};

  if ($("todayText")) {
    $("todayText").textContent = today.toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
      weekday: "long"
    });
  }

  if ($("routineList")) {
    $("routineList").innerHTML = "";

    state.routines.forEach((routine) => {
      const item = document.createElement("button");
      item.className = "routine-item";

      if (state.checks[key][routine.id]) {
        item.classList.add("done");
      }

      item.innerHTML = `
        <span>${routine.title}</span>
        <span class="check">${state.checks[key][routine.id] ? "✓" : ""}</span>
      `;

      item.onclick = () => {
        state.checks[key][routine.id] = !state.checks[key][routine.id];
        save();
        renderAll();
      };

      $("routineList").appendChild(item);
    });
  }

  const data = getMonthData(today);

  if ($("monthlyPercent")) $("monthlyPercent").textContent = `${data.avg}%`;
  if ($("monthlyCount")) $("monthlyCount").textContent = `${data.perfectDays}일 / ${data.totalDays}일`;

  renderChart("miniChart", data, true);
}

function renderRecord() {
  const data = getMonthData(viewDate);

  if ($("monthTitle")) {
    $("monthTitle").textContent = `${viewDate.getFullYear()}년 ${viewDate.getMonth() + 1}월`;
  }

  if ($("recordPercent")) $("recordPercent").textContent = `${data.avg}%`;
  if ($("recordCount")) $("recordCount").textContent = `${data.perfectDays}일 / ${data.totalDays}일`;
  if ($("doneDays")) $("doneDays").textContent = `${data.perfectDays}일`;

  renderChart("monthChart", data, false);
  renderCalendar();
}

function renderCalendar() {
  const grid = $("monthGrid");
  if (!grid) return;

  grid.innerHTML = "";

  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const totalDays = daysInMonth(viewDate);
  const todayKey = dateKey(new Date());

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    empty.className = "day empty";
    grid.appendChild(empty);
  }

  for (let day = 1; day <= totalDays; day++) {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const el = document.createElement("div");
    el.className = "day";

    if (getDayPercent(d) === 100) el.classList.add("good");
    if (dateKey(d) === todayKey) el.classList.add("today");

    el.textContent = day;
    grid.appendChild(el);
  }
}

function renderNotes() {
  const key = dateKey();

  if (!state.notes[key]) {
    state.notes[key] = {
      gratitude: "",
      important: ""
    };
  }

  if ($("noteDateText")) {
    $("noteDateText").textContent = new Date().toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
      weekday: "long"
    });
  }

  if ($("gratitudeNote")) {
    $("gratitudeNote").value = state.notes[key].gratitude || "";
    $("gratitudeCount").textContent = $("gratitudeNote").value.length;
  }

  if ($("importantNote")) {
    $("importantNote").value = state.notes[key].important || "";
    $("importantCount").textContent = $("importantNote").value.length;
  }
}

function saveNotes() {
  const key = dateKey();

  state.notes[key] = {
    gratitude: $("gratitudeNote") ? $("gratitudeNote").value : "",
    important: $("importantNote") ? $("importantNote").value : ""
  };

  save();
  renderNotes();
}

function renderManage() {
  const list = $("manageList");
  if (!list) return;

  list.innerHTML = "";

  state.routines.forEach((routine) => {
    const row = document.createElement("div");
    row.className = "manage-row";

    row.innerHTML = `
      <strong>${routine.title}</strong>
      <button class="small-btn edit-btn">수정</button>
      <button class="small-btn delete-btn">삭제</button>
    `;

    row.querySelector(".edit-btn").onclick = () => {
      const newTitle = prompt("루틴 이름 수정", routine.title);
      if (!newTitle) return;

      routine.title = newTitle;
      save();
      renderAll();
    };

    row.querySelector(".delete-btn").onclick = () => {
      if (!confirm("이 루틴 삭제할까?")) return;

      state.routines = state.routines.filter((r) => r.id !== routine.id);

      Object.values(state.checks).forEach((day) => {
        delete day[routine.id];
      });

      save();
      renderAll();
    };

    list.appendChild(row);
  });
}

function renderChart(canvasId, data, mini) {
  const canvas = $(canvasId);
  if (!canvas || typeof Chart === "undefined") return;

  if (canvasId === "miniChart" && miniChart) miniChart.destroy();
  if (canvasId === "monthChart" && monthChart) monthChart.destroy();

  const chart = new Chart(canvas, {
    type: "line",
    data: {
      labels: data.labels,
      datasets: [
        {
          data: data.values,
          borderColor: "#ffffff",
          backgroundColor: "#ffffff",
          borderWidth: mini ? 2 : 2.5,
          pointRadius: mini ? 2 : 3.5,
          pointBackgroundColor: "#ffffff",
          tension: 0.25
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          min: 0,
          max: 100,
          ticks: {
            color: "rgba(255,255,255,.55)",
            callback: (v) => `${v}%`
          },
          grid: {
            color: "rgba(255,255,255,.12)"
          }
        },
        x: {
          ticks: {
            color: "rgba(255,255,255,.55)"
          },
          grid: {
            display: false
          }
        }
      }
    }
  });

  if (canvasId === "miniChart") miniChart = chart;
  if (canvasId === "monthChart") monthChart = chart;
}

function addRoutine() {
  const title = prompt("새 루틴 이름?");
  if (!title) return;

  state.routines.push({
    id: Date.now() + Math.random(),
    title
  });

  save();
  renderAll();
}

function bindEvents() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.onclick = () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));

      tab.classList.add("active");
      $(tab.dataset.tab).classList.add("active");

      renderAll();
    };
  });

  if ($("addRoutineBtn")) $("addRoutineBtn").onclick = addRoutine;

  if ($("prevMonth")) {
    $("prevMonth").onclick = () => {
      viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
      renderAll();
    };
  }

  if ($("nextMonth")) {
    $("nextMonth").onclick = () => {
      viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
      renderAll();
    };
  }

  if ($("gratitudeNote")) $("gratitudeNote").oninput = saveNotes;
  if ($("importantNote")) $("importantNote").oninput = saveNotes;

  if ($("resetBtn")) {
    $("resetBtn").onclick = () => {
      if (!confirm("진짜 전체 초기화할까?")) return;

      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    };
  }
}

function renderAll() {
  renderHome();
  renderRecord();
  renderNotes();
  renderManage();
}

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  renderAll();
});
