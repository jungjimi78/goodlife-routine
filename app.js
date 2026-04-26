const STORAGE_KEY = "godsaeng-routine-final-v3";

let state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
  routines: [
    { id: crypto.randomUUID(), title: "운동" },
    { id: crypto.randomUUID(), title: "독서" },
    { id: crypto.randomUUID(), title: "물 마시기" }
  ],
  checks: {},
  notes: {},
  color: "#111111"
};

let selectedDate = new Date();
let weekChart = null;
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

function getWeekData() {
  const start = new Date(selectedDate);
  start.setDate(selectedDate.getDate() - selectedDate.getDay());

  const labels = ["일", "월", "화", "수", "목", "금", "토"];
  const values = [];
  let total = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);

    const count = getDoneCount(d);
    values.push(count);
    total += count;
  }

  return { labels, values, total };
}

function renderHome() {
  const key = dateKey();

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

  $("dateButton").textContent = selectedDate.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long"
  });

  $("colorPicker").value = state.color || "#111111";

  renderRoutines();
  renderNotes();
  renderWeekChart();
}

function renderRoutines() {
  const key = dateKey();
  const list = $("routineList");

  list.innerHTML = "";

  state.routines.forEach((routine) => {
    const wrap = document.createElement("div");
    wrap.className = "routine-wrap";

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "삭제";

    deleteBtn.onclick = () => {
      state.routines = state.routines.filter((r) => r.id !== routine.id);

      Object.values(state.checks).forEach((day) => {
        delete day[routine.id];
      });

      save();
      renderHome();
      renderRecord();
    };

    const item = document.createElement("div");
    item.className = "routine-item";

    if (state.checks[key][routine.id]) {
      item.classList.add("done");
    }

    item.innerHTML = `
      <span class="routine-title">${routine.title}</span>
      <button class="check-btn">${state.checks[key][routine.id] ? "✓" : ""}</button>
    `;

    item.querySelector(".check-btn").onclick = (e) => {
      e.stopPropagation();

      state.checks[key][routine.id] = !state.checks[key][routine.id];

      save();
      renderHome();
      renderRecord();
    };

    let startX = 0;
    let endX = 0;

    item.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
      endX = startX;
    });

    item.addEventListener("touchmove", (e) => {
      endX = e.touches[0].clientX;
    });

    item.addEventListener("touchend", () => {
      const diff = endX - startX;

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

    wrap.appendChild(deleteBtn);
    wrap.appendChild(item);
    list.appendChild(wrap);
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

function renderWeekChart() {
  const week = getWeekData();
  const totalRoutines = Math.max(state.routines.length, 1);

  $("weekCountText").textContent = `이번 주 ${week.total}개 완료`;

  if (weekChart) {
    weekChart.destroy();
  }

  weekChart = new Chart($("weekChart"), {
    type: "line",
    data: {
      labels: week.labels,
      datasets: [
        {
          data: week.values,
          borderColor: state.color,
          backgroundColor: state.color,
          pointBackgroundColor: state.color,
          pointBorderColor: state.color,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 3,
          tension: 0.25
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,

      animation: {
        duration: 700,
        easing: "easeOutQuart"
      },

      plugins: {
        legend: {
          display: false
        }
      },

      scales: {
        y: {
          min: 0,
          max: totalRoutines,
          ticks: {
            stepSize: 1
          }
        },
        x: {
          grid: {
            display: false
          }
        }
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

  if (monthChart) {
    monthChart.destroy();
  }

  monthChart = new Chart($("monthChart"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          data: values,
          borderColor: state.color,
          backgroundColor: state.color,
          pointBackgroundColor: state.color,
          pointBorderColor: state.color,
          pointRadius: 3,
          pointHoverRadius: 5,
          borderWidth: 3,
          tension: 0.22
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,

      animation: {
        duration: 700,
        easing: "easeOutQuart"
      },

      plugins: {
        legend: {
          display: false
        }
      },

      scales: {
        y: {
          min: 0,
          max: Math.max(state.routines.length, 1),
          ticks: {
            stepSize: 1
          }
        },
        x: {
          ticks: {
            maxTicksLimit: 8
          },
          grid: {
            display: false
          }
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

    if (count > 0) {
      el.style.backgroundColor = state.color;
      el.style.color = "#ffffff";
    }

    grid.appendChild(el);
  }
}

function addRoutine() {
  const title = prompt("루틴 이름?");

  if (!title) {
    return;
  }

  state.routines.push({
    id: crypto.randomUUID(),
    title: title.trim()
  });

  save();
  renderHome();
  renderRecord();
}

function openDatePicker() {
  const picker = $("datePicker");

  picker.focus();

  if (typeof picker.showPicker === "function") {
    picker.showPicker();
  } else {
    picker.click();
  }
}

function bindEvents() {
  $("addRoutineBtn").onclick = addRoutine;

  $("dateButton").onclick = openDatePicker;

  $("datePicker").onchange = (e) => {
    selectedDate = parseDate(e.target.value);

    renderHome();
    renderRecord();
  };

  $("colorPicker").onchange = (e) => {
    state.color = e.target.value;

    save();
    renderHome();
    renderRecord();
  };

  $("gratitudeNote").oninput = saveNotes;
  $("importantNote").oninput = saveNotes;

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
