const STORAGE_KEY = "habit-tracker-data-v2";
const LEGACY_STORAGE_KEYS = ["lod-tracker-data-v2"];

const monthFormatter = new Intl.DateTimeFormat("en", {
  month: "long",
  year: "numeric",
});

const dayFormatter = new Intl.DateTimeFormat("en", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

const state = {
  data: loadData(),
  viewMonth: startOfMonth(new Date()),
  selectedDate: formatISO(new Date()),
  selectedHabitId: null,
  searchTerm: "",
  habitEditing: null,
  lastToggledTodo: null,
  lastLoggedHabit: null,
  libraryFilter: "active",
};

const elements = {
  monthLabel: document.getElementById("monthLabel"),
  prevMonth: document.getElementById("prevMonth"),
  nextMonth: document.getElementById("nextMonth"),
  dateSelector: document.getElementById("dateSelector"),
  selectedDayLabel: document.getElementById("selectedDayLabel"),
  todayHabitList: document.getElementById("todayHabitList"),
  habitSearch: document.getElementById("habitSearch"),
  searchResults: document.getElementById("searchResults"),
  habitLibrary: document.getElementById("habitLibrary"),
  openHabitDialog: document.getElementById("openHabitDialog"),
  habitTabActive: document.getElementById("habitTabActive"),
  habitTabArchived: document.getElementById("habitTabArchived"),
  habitDialog: document.getElementById("habitDialog"),
  habitForm: document.getElementById("habitForm"),
  habitFormTitle: document.getElementById("habitFormTitle"),
  habitName: document.getElementById("habitName"),
  habitColor: document.getElementById("habitColor"),
  habitArchived: document.getElementById("habitArchived"),
  habitCancel: document.getElementById("habitCancel"),
  addSubHabit: document.getElementById("addSubHabit"),
  subHabitList: document.getElementById("subHabitList"),
  calendarRows: document.getElementById("calendarRows"),
  todoForm: document.getElementById("todoForm"),
  todoInput: document.getElementById("todoInput"),
  todoList: document.getElementById("todoList"),
  clearCompletedTodos: document.getElementById("clearCompletedTodos"),
  resetData: document.getElementById("resetData"),
};

function loadData() {
  try {
    let sourceKey = STORAGE_KEY;
    let stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      for (const legacyKey of LEGACY_STORAGE_KEYS) {
        const legacyValue = localStorage.getItem(legacyKey);
        if (legacyValue) {
          stored = legacyValue;
          sourceKey = legacyKey;
          break;
        }
      }
    }

    if (!stored) {
      const seed = createSeedData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }

    const parsed = JSON.parse(stored);
    const normalized = migrateData(parsed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    if (sourceKey !== STORAGE_KEY) {
      localStorage.removeItem(sourceKey);
    }
    return normalized;
  } catch (error) {
    console.warn("Failed to parse stored data, resetting", error);
    const seed = createSeedData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
  LEGACY_STORAGE_KEYS.forEach((legacyKey) => {
    if (legacyKey !== STORAGE_KEY) {
      localStorage.removeItem(legacyKey);
    }
  });
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createUniqueId(prefix) {
  const unique =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}-${unique}`;
}

function parseISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function createSeedData() {
  const today = new Date();
  const habits = [
    {
      id: "habit-prayer",
      name: "Daily prayers",
      color: "#38bdf8",
      archived: false,
      createdAt: new Date(today.getFullYear(), today.getMonth() - 2, 1).toISOString(),
      subHabits: [
        { id: "habit-prayer-fajr", name: "Fajr" },
        { id: "habit-prayer-dhuhr", name: "Dhuhr" },
        { id: "habit-prayer-asr", name: "Asr" },
        { id: "habit-prayer-maghrib", name: "Maghrib" },
        { id: "habit-prayer-isha", name: "Isha" },
      ],
    },
    {
      id: "habit-reading",
      name: "Read 10 pages",
      color: "#f97316",
      archived: false,
      createdAt: new Date(today.getFullYear(), today.getMonth() - 2, 5).toISOString(),
      subHabits: [{ id: "habit-reading-session", name: "Reading session" }],
    },
    {
      id: "habit-meals",
      name: "Nutritious meals",
      color: "#22d3ee",
      archived: false,
      createdAt: new Date(today.getFullYear(), today.getMonth() - 1, 8).toISOString(),
      subHabits: [
        { id: "habit-meals-breakfast", name: "Breakfast" },
        { id: "habit-meals-lunch", name: "Lunch" },
        { id: "habit-meals-dinner", name: "Dinner" },
      ],
    },
    {
      id: "habit-steps",
      name: "5k walk",
      color: "#a855f7",
      archived: false,
      createdAt: new Date(today.getFullYear(), today.getMonth() - 1, 12).toISOString(),
      subHabits: [{ id: "habit-steps-route", name: "Walk complete" }],
    },
  ];

  const entries = {};
  const todos = [
    {
      id: "todo-focus",
      text: "Plan tomorrow in 5 minutes",
      done: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
    },
    {
      id: "todo-review",
      text: "Review notes after evening routine",
      done: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
    },
  ];

  for (let i = 0; i < 40; i += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const iso = formatISO(date);
    const dayEntries = {};

    if (i % 2 === 0) {
      const subHabits = {
        "habit-prayer-fajr": true,
        "habit-prayer-dhuhr": true,
        "habit-prayer-maghrib": true,
      };
      if (i % 4 !== 0) {
        subHabits["habit-prayer-asr"] = true;
      }
      if (i % 6 !== 0) {
        subHabits["habit-prayer-isha"] = true;
      }
      dayEntries["habit-prayer"] = {
        subHabits,
        updatedAt: new Date().toISOString(),
      };
    }

    if (i % 3 !== 0) {
      dayEntries["habit-reading"] = {
        subHabits: {
          "habit-reading-session": true,
        },
        updatedAt: new Date().toISOString(),
      };
    }

    if (i % 5 !== 0) {
      const mealSubs = {
        "habit-meals-breakfast": true,
        "habit-meals-dinner": true,
      };
      if (i % 7 !== 0) {
        mealSubs["habit-meals-lunch"] = true;
      }
      dayEntries["habit-meals"] = {
        subHabits: mealSubs,
        updatedAt: new Date().toISOString(),
      };
    }

    if (i % 4 !== 0) {
      dayEntries["habit-steps"] = {
        subHabits: {
          "habit-steps-route": true,
        },
        updatedAt: new Date().toISOString(),
      };
    }

    if (Object.keys(dayEntries).length > 0) {
      entries[iso] = dayEntries;
    }
  }

  return {
    habits,
    entries,
    todos,
  };
}

function migrateData(data) {
  const next = { ...data };
  if (!Array.isArray(next.habits)) {
    throw new Error("Invalid data");
  }
  if (!Array.isArray(next.todos)) {
    next.todos = [];
  }

  next.habits = next.habits.map((habit) => {
    const cloned = { ...habit };
    const baseId = cloned.id || createUniqueId("habit");
    cloned.id = baseId;
    const subHabits = Array.isArray(cloned.subHabits) ? cloned.subHabits : [];
    const normalizedSubs = subHabits
      .map((sub, index) => {
        const subId = sub && sub.id ? sub.id : `${baseId}-sub-${index + 1}`;
        const name = sub && sub.name ? sub.name : `Checkpoint ${index + 1}`;
        return { id: subId, name };
      })
      .filter(Boolean);
    if (normalizedSubs.length === 0) {
      normalizedSubs.push({ id: `${baseId}-sub-1`, name: cloned.name || "Habit" });
    }
    cloned.subHabits = normalizedSubs;
    return cloned;
  });

  if (!next.entries || typeof next.entries !== "object") {
    next.entries = {};
  }

  Object.entries(next.entries).forEach(([dateIso, habitEntries]) => {
    Object.entries(habitEntries).forEach(([habitId, entry]) => {
      const habit = next.habits.find((item) => item.id === habitId);
      if (!habit) {
        delete habitEntries[habitId];
        return;
      }
      const normalized = { subHabits: {}, updatedAt: entry && entry.updatedAt ? entry.updatedAt : new Date().toISOString() };
      if (entry && entry.subHabits && typeof entry.subHabits === "object") {
        habit.subHabits.forEach((sub) => {
          if (entry.subHabits[sub.id]) {
            normalized.subHabits[sub.id] = true;
          }
        });
      } else if (entry && entry.done) {
        habit.subHabits.forEach((sub) => {
          normalized.subHabits[sub.id] = true;
        });
      }

      if (Object.keys(normalized.subHabits).length === 0) {
        delete habitEntries[habitId];
      } else {
        habitEntries[habitId] = normalized;
      }
    });

    if (Object.keys(habitEntries).length === 0) {
      delete next.entries[dateIso];
    }
  });

  delete next.journals;

  return next;
}

function getActiveHabits() {
  return state.data.habits.filter((habit) => !habit.archived);
}

function ensureSelectedHabit() {
  const active = getActiveHabits();
  if (active.length === 0) {
    state.selectedHabitId = null;
    return;
  }
  if (!state.selectedHabitId || !active.some((habit) => habit.id === state.selectedHabitId)) {
    state.selectedHabitId = active[0].id;
  }
}

function getDayEntries(dateIso) {
  return state.data.entries[dateIso] || {};
}

function getEntry(dateIso, habitId) {
  const entries = getDayEntries(dateIso);
  return entries[habitId] || null;
}

function getHabitById(habitId) {
  return state.data.habits.find((habit) => habit.id === habitId) || null;
}

function getHabitProgress(dateIso, habit) {
  const entry = getEntry(dateIso, habit.id);
  const total = Math.max(habit.subHabits ? habit.subHabits.length : 0, 1);
  if (!entry || !entry.subHabits) {
    return { done: 0, total };
  }
  const done = habit.subHabits.reduce((count, sub) => {
    return entry.subHabits[sub.id] ? count + 1 : count;
  }, 0);
  return { done, total };
}

function isHabitComplete(dateIso, habit) {
  const progress = getHabitProgress(dateIso, habit);
  if (progress.total === 0) {
    return false;
  }
  return progress.done >= progress.total;
}

function toggleSubHabit(dateIso, habit, subHabitId) {
  const entries = state.data.entries[dateIso] ? { ...state.data.entries[dateIso] } : {};
  const current = entries[habit.id] ? { ...entries[habit.id] } : { subHabits: {}, updatedAt: new Date().toISOString() };
  const subHabits = { ...(current.subHabits || {}) };

  if (subHabits[subHabitId]) {
    delete subHabits[subHabitId];
  } else {
    subHabits[subHabitId] = true;
  }

  if (Object.keys(subHabits).length === 0) {
    delete entries[habit.id];
  } else {
    current.subHabits = subHabits;
    current.updatedAt = new Date().toISOString();
    entries[habit.id] = current;
  }

  if (Object.keys(entries).length === 0) {
    delete state.data.entries[dateIso];
  } else {
    state.data.entries[dateIso] = entries;
  }

  saveData();
}

function toggleHabitCompletion(dateIso, habit, complete) {
  const entries = state.data.entries[dateIso] ? { ...state.data.entries[dateIso] } : {};
  if (complete) {
    const subHabits = {};
    habit.subHabits.forEach((sub) => {
      subHabits[sub.id] = true;
    });
    entries[habit.id] = {
      subHabits,
      updatedAt: new Date().toISOString(),
    };
  } else {
    delete entries[habit.id];
  }

  if (Object.keys(entries).length === 0) {
    delete state.data.entries[dateIso];
  } else {
    state.data.entries[dateIso] = entries;
  }

  saveData();
}

function addTodo(text) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const id = createUniqueId("todo");

  state.data.todos.push({
    id,
    text: trimmed,
    done: false,
    createdAt: new Date().toISOString(),
    completedAt: null,
  });
  saveData();
  return id;
}

function toggleTodo(id) {
  const todo = state.data.todos.find((item) => item.id === id);
  if (!todo) return;
  todo.done = !todo.done;
  todo.completedAt = todo.done ? new Date().toISOString() : null;
  saveData();
}

function removeTodo(id) {
  state.data.todos = state.data.todos.filter((item) => item.id !== id);
  saveData();
}

function clearCompletedTodos() {
  const remaining = state.data.todos.filter((item) => !item.done);
  if (remaining.length === state.data.todos.length) {
    return;
  }
  state.data.todos = remaining;
  saveData();
}

function calculateStreak(habitId, uptoIso = state.selectedDate) {
  const habit = getHabitById(habitId);
  if (!habit) {
    return 0;
  }
  let streak = 0;
  const uptoDate = parseISO(uptoIso);
  const todayIso = formatISO(new Date());

  for (let offset = 0; offset < 365; offset += 1) {
    const check = new Date(uptoDate);
    check.setDate(uptoDate.getDate() - offset);
    const iso = formatISO(check);
    if (iso > todayIso) {
      continue;
    }
    if (isHabitComplete(iso, habit)) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

function getCalendarMatrix(viewMonth) {
  const first = startOfMonth(viewMonth);
  const start = new Date(first);
  const day = first.getDay();
  const mondayOffset = (day + 6) % 7;
  start.setDate(first.getDate() - mondayOffset);

  const weeks = [];
  for (let week = 0; week < 6; week += 1) {
    const days = [];
    for (let d = 0; d < 7; d += 1) {
      const current = new Date(start);
      current.setDate(start.getDate() + week * 7 + d);
      days.push(current);
    }
    weeks.push(days);
  }
  return weeks;
}

function intensityForHabit(dateIso, habit) {
  const progress = getHabitProgress(dateIso, habit);
  if (progress.total === 0 || progress.done === 0) {
    return 0;
  }
  const ratio = progress.done / progress.total;
  if (ratio >= 1) return 4;
  if (ratio >= 0.75) return 3;
  if (ratio >= 0.5) return 2;
  return 1;
}

function hexToRgb(color) {
  if (!color) {
    return { r: 56, g: 189, b: 248 };
  }
  let hex = color.replace("#", "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }
  const int = parseInt(hex, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

function shadeForIntensity(color, intensity) {
  const { r, g, b } = hexToRgb(color || varFallbackColor());
  const alphaMap = {
    1: 0.35,
    2: 0.55,
    3: 0.75,
    4: 0.92,
  };
  const alpha = alphaMap[intensity] || 0.35;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function borderForIntensity(color, intensity) {
  const { r, g, b } = hexToRgb(color || varFallbackColor());
  const alphaMap = {
    1: 0.35,
    2: 0.45,
    3: 0.55,
    4: 0.7,
  };
  return `rgba(${r}, ${g}, ${b}, ${alphaMap[intensity] || 0.35})`;
}

function createSubHabitRow(subHabit) {
  const row = document.createElement("li");
  row.className = "subhabit-row";
  const id = subHabit && subHabit.id ? subHabit.id : createUniqueId("sub");
  row.dataset.subhabitId = id;

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "e.g. Fajr";
  input.value = subHabit && subHabit.name ? subHabit.name : "";
  input.required = true;

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "ghost";
  remove.textContent = "Remove";
  remove.addEventListener("click", () => {
    row.remove();
    ensureSubHabitRow();
  });

  row.append(input, remove);
  return row;
}

function ensureSubHabitRow() {
  const rows = elements.subHabitList.querySelectorAll(".subhabit-row");
  if (rows.length === 0) {
    elements.subHabitList.appendChild(createSubHabitRow({ name: "" }));
  }
  updateSubHabitRemoveState();
}

function updateSubHabitRemoveState() {
  const rows = elements.subHabitList.querySelectorAll(".subhabit-row");
  rows.forEach((row) => {
    const button = row.querySelector("button");
    if (!button) return;
    button.disabled = rows.length === 1;
  });
}

function populateSubHabitForm(habit) {
  elements.subHabitList.innerHTML = "";
  const subs = habit && Array.isArray(habit.subHabits) ? habit.subHabits : [];
  if (subs.length === 0) {
    elements.subHabitList.appendChild(createSubHabitRow({ name: "" }));
  } else {
    subs.forEach((sub) => {
      elements.subHabitList.appendChild(createSubHabitRow(sub));
    });
  }
  updateSubHabitRemoveState();
}

function collectSubHabitsFromForm() {
  const rows = Array.from(elements.subHabitList.querySelectorAll(".subhabit-row"));
  const subs = rows
    .map((row, index) => {
      const input = row.querySelector("input[type=\"text\"]");
      if (!input) return null;
      const name = input.value.trim();
      if (!name) return null;
      const id = row.dataset.subhabitId || createUniqueId("sub");
      return { id, name, order: index };
    })
    .filter(Boolean)
    .map(({ id, name }) => ({ id, name }));

  if (subs.length === 0) {
    subs.push({ id: createUniqueId("sub"), name: "Checkpoint" });
  }
  return subs;
}

function pruneHabitEntries(habit) {
  const valid = new Set(habit.subHabits.map((sub) => sub.id));
  Object.entries(state.data.entries).forEach(([dateIso, dayEntries]) => {
    const entry = dayEntries[habit.id];
    if (!entry || !entry.subHabits) {
      return;
    }
    Object.keys(entry.subHabits).forEach((subId) => {
      if (!valid.has(subId)) {
        delete entry.subHabits[subId];
      }
    });
    if (Object.keys(entry.subHabits).length === 0) {
      delete dayEntries[habit.id];
    }
    if (Object.keys(dayEntries).length === 0) {
      delete state.data.entries[dateIso];
    }
  });
}

function deleteHabit(habitId) {
  const index = state.data.habits.findIndex((habit) => habit.id === habitId);
  if (index === -1) {
    return;
  }
  state.data.habits.splice(index, 1);
  Object.entries(state.data.entries).forEach(([dateIso, dayEntries]) => {
    if (dayEntries[habitId]) {
      delete dayEntries[habitId];
    }
    if (Object.keys(dayEntries).length === 0) {
      delete state.data.entries[dateIso];
    }
  });
  if (state.selectedHabitId === habitId) {
    state.selectedHabitId = null;
  }
  saveData();
  render();
}

function openHabitForm(habit) {
  if (habit) {
    elements.habitFormTitle.textContent = "Edit habit";
    elements.habitName.value = habit.name;
    elements.habitColor.value = habit.color;
    elements.habitArchived.checked = habit.archived;
    state.selectedHabitId = habit.id;
    state.habitEditing = habit.id;
    populateSubHabitForm(habit);
  } else {
    elements.habitFormTitle.textContent = "New habit";
    elements.habitName.value = "";
    elements.habitColor.value = "#2563eb";
    elements.habitArchived.checked = false;
    state.habitEditing = null;
    populateSubHabitForm(null);
  }
  elements.habitDialog.showModal();
}

function closeHabitForm() {
  elements.habitDialog.close();
}

function renderMonthControls() {
  elements.monthLabel.textContent = monthFormatter.format(state.viewMonth);
}

function renderSelectedDate() {
  const date = parseISO(state.selectedDate);
  elements.selectedDayLabel.textContent = dayFormatter.format(date);
  elements.dateSelector.value = state.selectedDate;
  ensureSelectedHabit();
}

function renderTodayList() {
  const list = elements.todayHabitList;
  list.innerHTML = "";
  const active = getActiveHabits();
  const entryMap = getDayEntries(state.selectedDate);
  const lastLogged = state.lastLoggedHabit;
  if (active.length === 0) {
    const empty = document.createElement("li");
    empty.className = "muted";
    empty.textContent = "Add your first habit to begin tracking.";
    list.appendChild(empty);
    state.lastLoggedHabit = null;
    return;
  }
  active.forEach((habit) => {
    const item = document.createElement("li");
    item.className = "habit-log-item";

    const header = document.createElement("div");
    header.className = "habit-log-header";

    const title = document.createElement("div");
    title.className = "habit-log-title";

    const name = document.createElement("span");
    name.className = "habit-name";
    name.textContent = habit.name;
    name.style.color = habit.color || varFallbackColor();

    const progress = getHabitProgress(state.selectedDate, habit);
    const progressLabel = document.createElement("span");
    progressLabel.className = "habit-progress";
    const noun = progress.total === 1 ? "checkpoint" : "checkpoints";
    progressLabel.textContent = `${progress.done}/${progress.total} ${noun}`;

    title.append(name, progressLabel);

    const logButton = document.createElement("button");
    logButton.type = "button";
    logButton.className = "log-habit-button";
    logButton.style.setProperty("--habit-color", habit.color || varFallbackColor());
    const isComplete = progress.total > 0 && progress.done === progress.total;
    if (isComplete) {
      logButton.classList.add("is-complete");
      logButton.textContent = "Reset day";
    } else {
      logButton.textContent = "Log habit";
    }

    logButton.addEventListener("click", () => {
      const nextComplete = !isComplete;
      toggleHabitCompletion(state.selectedDate, habit, nextComplete);
      state.selectedHabitId = habit.id;
      state.lastLoggedHabit = { id: habit.id, type: "habit", complete: nextComplete };
      render();
    });

    header.append(title, logButton);
    item.appendChild(header);

    const entry = entryMap[habit.id];
    if (habit.subHabits && habit.subHabits.length > 0) {
      const subList = document.createElement("ul");
      subList.className = "subhabit-list";
      habit.subHabits.forEach((sub) => {
        const subItem = document.createElement("li");
        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "subhabit-toggle";
        toggle.textContent = sub.name;
        const done = Boolean(entry && entry.subHabits && entry.subHabits[sub.id]);
        toggle.setAttribute("aria-pressed", done ? "true" : "false");
        toggle.addEventListener("click", () => {
          state.selectedHabitId = habit.id;
          toggleSubHabit(state.selectedDate, habit, sub.id);
          state.lastLoggedHabit = { id: habit.id, type: "sub", subId: sub.id, complete: !done };
          render();
        });
        subItem.appendChild(toggle);
        subList.appendChild(subItem);
      });
      item.appendChild(subList);
    }

    list.appendChild(item);

    if (lastLogged && lastLogged.id === habit.id && lastLogged.type === "habit" && lastLogged.complete) {
      requestAnimationFrame(() => {
        logButton.classList.add("is-burst");
        setTimeout(() => {
          logButton.classList.remove("is-burst");
        }, 600);
      });
    }
  });

  state.lastLoggedHabit = null;
}

function renderQuickSearch() {
  const input = elements.habitSearch;
  input.value = state.searchTerm;
  const list = elements.searchResults;
  list.innerHTML = "";
  const term = state.searchTerm.trim().toLowerCase();
  if (!term) {
    return;
  }
  const matches = getActiveHabits().filter((habit) => habit.name.toLowerCase().includes(term));
  matches.slice(0, 5).forEach((habit) => {
    const item = document.createElement("li");
    const meta = document.createElement("div");
    meta.className = "habit-meta";
    const title = document.createElement("span");
    title.className = "habit-name";
    title.textContent = habit.name;
    meta.append(title);

    const action = document.createElement("button");
    action.type = "button";
    const progress = getHabitProgress(state.selectedDate, habit);
    const isComplete = progress.total > 0 && progress.done === progress.total;
    action.textContent = isComplete ? "Reset" : "Log all";
    action.addEventListener("click", () => {
      state.selectedHabitId = habit.id;
      toggleHabitCompletion(state.selectedDate, habit, !isComplete);
      state.lastLoggedHabit = { id: habit.id, type: "habit", complete: !isComplete };
      render();
    });

    item.append(meta, action);
    list.appendChild(item);
  });
}

function renderHabitLibrary() {
  const list = elements.habitLibrary;
  list.innerHTML = "";

  const isActiveFilter = state.libraryFilter === "active";
  const activeButton = elements.habitTabActive;
  const archivedButton = elements.habitTabArchived;

  if (activeButton && archivedButton) {
    activeButton.classList.toggle("is-active", isActiveFilter);
    archivedButton.classList.toggle("is-active", !isActiveFilter);
    activeButton.setAttribute("aria-selected", isActiveFilter ? "true" : "false");
    archivedButton.setAttribute("aria-selected", !isActiveFilter ? "true" : "false");
  }

  const habits = state.data.habits
    .filter((habit) => (isActiveFilter ? !habit.archived : habit.archived))
    .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

  if (habits.length === 0) {
    const empty = document.createElement("li");
    empty.className = "muted";
    empty.textContent = isActiveFilter
      ? "No active habits yet. Create one to get started."
      : "No archived habits. Archive habits you want to hide.";
    list.appendChild(empty);
    return;
  }

  habits.forEach((habit) => {
    const item = document.createElement("li");
    item.className = "habit-library-item";

    const meta = document.createElement("div");
    meta.className = "habit-meta";

    const title = document.createElement("div");
    title.className = "habit-name-tag";
    const dot = document.createElement("span");
    dot.className = "habit-dot";
    dot.style.color = habit.color || varFallbackColor();
    dot.style.background = habit.color || varFallbackColor();
    const name = document.createElement("span");
    name.className = "habit-name-text";
    name.textContent = habit.name;
    title.append(dot, name);

    meta.append(title);
    item.append(meta);

    const actions = document.createElement("div");
    actions.className = "habit-actions";

    const edit = document.createElement("button");
    edit.type = "button";
    edit.textContent = "Edit";
    edit.addEventListener("click", () => openHabitForm(habit));

    const archive = document.createElement("button");
    archive.type = "button";
    archive.textContent = habit.archived ? "Unarchive" : "Archive";
    archive.addEventListener("click", () => {
      habit.archived = !habit.archived;
      saveData();
      render();
    });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "danger icon-only";
    remove.setAttribute("aria-label", `Delete ${habit.name}`);
    remove.innerHTML = "<span aria-hidden=\"true\">🗑</span>";
    remove.addEventListener("click", () => {
      const message = `Delete \"${habit.name}\" and remove its history? This can’t be undone.`;
      if (window.confirm(message)) {
        deleteHabit(habit.id);
      }
    });

    actions.append(edit, archive, remove);
    item.append(actions);
    list.appendChild(item);
  });
}

function renderTodos() {
  const list = elements.todoList;
  list.innerHTML = "";

  const todos = state.data.todos
    .slice()
    .sort((a, b) => {
      if (a.done === b.done) {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      return a.done ? 1 : -1;
    });

  if (todos.length === 0) {
    const empty = document.createElement("li");
    empty.className = "muted empty-message";
    empty.textContent = "Add a focus to-do to keep discipline sharp.";
    list.appendChild(empty);
    elements.clearCompletedTodos.disabled = true;
    elements.clearCompletedTodos.setAttribute("aria-disabled", "true");
    state.lastToggledTodo = null;
    return;
  }

  let hasCompleted = false;

  todos.forEach((todo) => {
    const item = document.createElement("li");
    item.className = "todo-item";
    if (todo.done) {
      item.classList.add("is-done");
      hasCompleted = true;
    }

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "todo-toggle";
    toggle.setAttribute("aria-pressed", todo.done ? "true" : "false");
    toggle.setAttribute(
      "aria-label",
      todo.done ? `Mark ${todo.text} as not done` : `Mark ${todo.text} as done`
    );
    toggle.addEventListener("click", () => {
      state.lastToggledTodo = { id: todo.id, done: !todo.done };
      toggleTodo(todo.id);
      render();
    });

    const checkmark = document.createElement("span");
    checkmark.className = "checkmark";
    toggle.appendChild(checkmark);

    const text = document.createElement("span");
    text.className = "todo-text";
    text.textContent = todo.text;

    const actions = document.createElement("div");
    actions.className = "todo-actions";

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "ghost icon-only";
    removeButton.setAttribute("aria-label", `Remove ${todo.text}`);
    removeButton.innerHTML = "&times;";
    removeButton.addEventListener("click", () => {
      removeTodo(todo.id);
      render();
    });

    actions.appendChild(removeButton);

    item.append(toggle, text, actions);
    list.appendChild(item);

    if (state.lastToggledTodo && state.lastToggledTodo.id === todo.id && todo.done) {
      requestAnimationFrame(() => {
        item.classList.add("is-burst");
        setTimeout(() => {
          item.classList.remove("is-burst");
        }, 600);
      });
    }
  });

  elements.clearCompletedTodos.disabled = !hasCompleted;
  elements.clearCompletedTodos.setAttribute("aria-disabled", hasCompleted ? "false" : "true");
  state.lastToggledTodo = null;
}

function varFallbackColor() {
  return "#38bdf8";
}

function renderCalendar() {
  const rows = elements.calendarRows;
  rows.innerHTML = "";
  const active = getActiveHabits();
  if (active.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "Add habits to generate a heatmap.";
    rows.appendChild(empty);
    return;
  }

  const weeks = getCalendarMatrix(state.viewMonth);
  const monthIndex = state.viewMonth.getMonth();
  const todayIso = formatISO(new Date());
  const selectedIso = state.selectedDate;
  const selectedHabit = state.data.habits.find((habit) => habit.id === state.selectedHabitId);
  const legendColor = selectedHabit && selectedHabit.color ? selectedHabit.color : varFallbackColor();
  document.documentElement.style.setProperty("--active-habit-color", legendColor);
  [1, 2, 3, 4].forEach((level) => {
    document.documentElement.style.setProperty(`--legend-shade-${level}`, shadeForIntensity(legendColor, level));
    document.documentElement.style.setProperty(`--legend-border-${level}`, borderForIntensity(legendColor, level));
  });

  active.forEach((habit) => {
    const row = document.createElement("div");
    row.className = "calendar-row";
    const label = document.createElement("button");
    label.className = "habit-pill";
    label.style.setProperty("--habit-color", habit.color || varFallbackColor());
    label.textContent = habit.name;
    label.addEventListener("click", () => {
      state.selectedHabitId = habit.id;
      render();
    });

    const cellsWrapper = document.createElement("div");
    cellsWrapper.className = "calendar-cells";

    weeks.forEach((week) => {
      week.forEach((date) => {
        const iso = formatISO(date);
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "calendar-cell";
        if (date.getMonth() !== monthIndex) {
          cell.classList.add("is-outside");
        }
        if (iso > todayIso) {
          cell.classList.add("is-future");
          cell.disabled = true;
        }
        const progress = getHabitProgress(iso, habit);
        const intensity = intensityForHabit(iso, habit);
        if (intensity > 0) {
          const shade = shadeForIntensity(habit.color, intensity);
          cell.classList.add("is-done");
          cell.classList.add(`level-${intensity}`);
          cell.style.setProperty("--cell-color", shade);
          cell.style.setProperty("--cell-border-color", borderForIntensity(habit.color, intensity));
        } else {
          cell.style.removeProperty("--cell-color");
          cell.style.removeProperty("--cell-border-color");
        }
        if (iso === selectedIso && habit.id === state.selectedHabitId) {
          cell.classList.add("is-selected");
        }

        const labelText = `${habit.name} on ${dayFormatter.format(date)}: ${progress.done}/${progress.total} checkpoints`; 
        cell.setAttribute("aria-label", labelText);

        cell.addEventListener("click", () => {
          state.selectedDate = iso;
          state.selectedHabitId = habit.id;
          if (!cell.classList.contains("is-future")) {
            const complete = progress.total > 0 && progress.done === progress.total;
            toggleHabitCompletion(iso, habit, !complete);
            state.lastLoggedHabit = { id: habit.id, type: "habit", complete: !complete };
          }
          render();
        });

        cellsWrapper.appendChild(cell);
      });
    });

    row.append(label, cellsWrapper);
    rows.appendChild(row);
  });
}

function render() {
  ensureSelectedHabit();
  renderMonthControls();
  renderSelectedDate();
  renderTodayList();
  renderQuickSearch();
  renderHabitLibrary();
  renderTodos();
  renderCalendar();
}

elements.prevMonth.addEventListener("click", () => {
  const view = new Date(state.viewMonth);
  view.setMonth(state.viewMonth.getMonth() - 1);
  state.viewMonth = startOfMonth(view);
  const selected = parseISO(state.selectedDate);
  if (selected.getMonth() !== state.viewMonth.getMonth() || selected.getFullYear() !== state.viewMonth.getFullYear()) {
    state.selectedDate = formatISO(state.viewMonth);
  }
  render();
});

elements.nextMonth.addEventListener("click", () => {
  const view = new Date(state.viewMonth);
  view.setMonth(state.viewMonth.getMonth() + 1);
  state.viewMonth = startOfMonth(view);
  const selected = parseISO(state.selectedDate);
  if (selected.getMonth() !== state.viewMonth.getMonth() || selected.getFullYear() !== state.viewMonth.getFullYear()) {
    state.selectedDate = formatISO(state.viewMonth);
  }
  render();
});

elements.dateSelector.addEventListener("change", (event) => {
  const value = event.target.value;
  if (!value) return;
  state.selectedDate = value;
  const date = parseISO(value);
  state.viewMonth = startOfMonth(date);
  render();
});

elements.habitSearch.addEventListener("input", (event) => {
  state.searchTerm = event.target.value;
  renderQuickSearch();
});

elements.habitSearch.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    const term = state.searchTerm.trim().toLowerCase();
    if (!term) return;
    const matches = getActiveHabits().filter((habit) => habit.name.toLowerCase().includes(term));
    if (matches.length > 0) {
      const habit = matches[0];
      state.selectedHabitId = habit.id;
      const progress = getHabitProgress(state.selectedDate, habit);
      const isComplete = progress.total > 0 && progress.done === progress.total;
      toggleHabitCompletion(state.selectedDate, habit, !isComplete);
      state.lastLoggedHabit = { id: habit.id, type: "habit", complete: !isComplete };
      render();
    }
  }
});

elements.openHabitDialog.addEventListener("click", () => openHabitForm());

if (elements.habitTabActive) {
  elements.habitTabActive.addEventListener("click", () => {
    if (state.libraryFilter !== "active") {
      state.libraryFilter = "active";
      renderHabitLibrary();
    }
  });
}

if (elements.habitTabArchived) {
  elements.habitTabArchived.addEventListener("click", () => {
    if (state.libraryFilter !== "archived") {
      state.libraryFilter = "archived";
      renderHabitLibrary();
    }
  });
}

elements.habitCancel.addEventListener("click", () => closeHabitForm());

elements.addSubHabit.addEventListener("click", () => {
  const row = createSubHabitRow({ name: "" });
  elements.subHabitList.appendChild(row);
  updateSubHabitRemoveState();
  const input = row.querySelector("input[type=\"text\"]");
  if (input) {
    input.focus();
  }
});

elements.habitDialog.addEventListener("close", () => {
  state.habitEditing = null;
});

elements.todoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = elements.todoInput.value.trim();
  if (!value) {
    return;
  }
  const id = addTodo(value);
  elements.todoInput.value = "";
  state.lastToggledTodo = { id, done: false };
  render();
  elements.todoInput.focus();
});

elements.clearCompletedTodos.addEventListener("click", () => {
  clearCompletedTodos();
  render();
});

elements.habitForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = elements.habitName.value.trim();
  if (!name) {
    return;
  }
  const color = elements.habitColor.value || varFallbackColor();
  const archived = elements.habitArchived.checked;
  const subHabits = collectSubHabitsFromForm();

  if (state.habitEditing) {
    const habit = state.data.habits.find((item) => item.id === state.habitEditing);
    if (habit) {
      habit.name = name;
      habit.color = color;
      habit.archived = archived;
      habit.subHabits = subHabits;
      pruneHabitEntries(habit);
    }
  } else {
    const id = createUniqueId("habit");
    state.data.habits.push({
      id,
      name,
      color,
      archived,
      createdAt: new Date().toISOString(),
      subHabits,
    });
    state.selectedHabitId = id;
  }

  saveData();
  closeHabitForm();
  render();
});

elements.resetData.addEventListener("click", () => {
  if (confirm("Reset tracker to seeded demo data?")) {
    state.data = createSeedData();
    state.viewMonth = startOfMonth(new Date());
    state.selectedDate = formatISO(new Date());
    state.searchTerm = "";
    state.libraryFilter = "active";
    saveData();
    render();
  }
});

render();
