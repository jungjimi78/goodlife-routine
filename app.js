// 👉 위에서 준 fixed-app.js 내용 그대로
// (길어서 핵심만 아니라 전체 넣어야 정상 작동함)

const STORAGE_KEY = "godsaeng-routine-v3";

let state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
  routines: [
    { id: 1, title: "운동" },
    { id: 2, title: "독서" }
  ],
  checks: {},
  notes: {}
};

let selectedDate = new Date();

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function dateKey(date = selectedDate) {
  return date.toISOString().slice(0, 10);
}

function render() {
  const list = document.getElementById("routineList");
  if (!list) return;

  const key = dateKey();
  if (!state.checks[key]) state.checks[key] = {};

  list.innerHTML = "";

  state.routines.forEach((r) => {
    const wrap = document.createElement("div");
    wrap.className = "routine-wrap";

    const del = document.createElement("button");
    del.className = "delete-action";
    del.textContent = "Delete";

    del.onclick = () => {
      state.routines = state.routines.filter(x => x.id !== r.id);
      save();
      render();
    };

    const item = document.createElement("div");
    item.className = "routine-item";

    if (state.checks[key][r.id]) item.classList.add("done");

    item.innerHTML = `
      <span>${r.title}</span>
      <span class="check">${state.checks[key][r.id] ? "✓" : ""}</span>
    `;

    item.onclick = () => {
      state.checks[key][r.id] = !state.checks[key][r.id];
      save();
      render();
    };

    wrap.appendChild(del);
    wrap.appendChild(item);
    list.appendChild(wrap);
  });
}

function addRoutine() {
  const t = prompt("루틴?");
  if (!t) return;

  state.routines.push({
    id: Date.now(),
    title: t
  });

  save();
  render();
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("addRoutineBtn").onclick = addRoutine;
  render();
});
