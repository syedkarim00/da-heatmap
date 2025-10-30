const STORAGE_KEY = "lod-tracker-data-v2";

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
  noteContext: null,
  habitEditing: null,
};

const elements = {
  monthLabel: document.getElementById("monthLabel"),
  prevMonth: document.getElementById("prevMonth"),
  nextMonth: document.getElementById("nextMonth"),
  dateSelector: document.getElementById("dateSelector"),
  jumpToday: document.getElementById("jumpToday"),
  selectedDayLabel: document.getElementById("selectedDayLabel"),
  metricDone: document.getElementById("metricDone"),
  metricRate: document.getElementById("metricRate"),
  metricStreak: document.getElementById("metricStreak"),
  todayHabitList: document.getElementById("todayHabitList"),
  habitSearch: document.getElementById("habitSearch"),
  searchResults: document.getElementById("searchResults"),
  habitLibrary: document.getElementById("habitLibrary"),
  openHabitDialog: document.getElementById("openHabitDialog"),
  habitDialog: document.getElementById("habitDialog"),
  habitForm: document.getElementById("habitForm"),
  habitFormTitle: document.getElementById("habitFormTitle"),
  habitName: document.getElementById("habitName"),
  habitColor: document.getElementById("habitColor"),
  habitArchived: document.getElementById("habitArchived"),
  habitCancel: document.getElementById("habitCancel"),
  calendarRows: document.getElementById("calendarRows"),
  journalDateLabel: document.getElementById("journalDateLabel"),
  dayJournal: document.getElementById("dayJournal"),
  saveJournal: document.getElementById("saveJournal"),
  journalStatus: document.getElementById("journalStatus"),
  journalHistory: document.getElementById("journalHistory"),
  noteDialog: document.getElementById("noteDialog"),
  noteForm: document.getElementById("noteForm"),
  noteText: document.getElementById("noteText"),
  noteCancel: document.getElementById("noteCancel"),
  noteContext: document.getElementById("noteContext"),
  resetData: document.getElementById("resetData"),
};

function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const seed = createSeedData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(stored);
    if (!parsed.habits || !Array.isArray(parsed.habits)) {
      throw new Error("Invalid data");
    }
    return parsed;
  } catch (error) {
    console.warn("Failed to parse stored data, resetting", error);
    const seed = createSeedData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
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

function parseISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function createSeedData() {
  const today = new Date();
  const habits = [
    {
      id: "habit-morning",
      name: "Morning prayer",
      color: "#38bdf8",
      archived: false,
      createdAt: new Date(today.getFullYear(), today.getMonth() - 2, 1).toISOString(),
    },
    {
      id: "habit-reading",
      name: "Read 10 pages",
      color: "#f97316",
      archived: false,
      createdAt: new Date(today.getFullYear(), today.getMonth() - 2, 5).toISOString(),
    },
    {
      id: "habit-steps",
      name: "5k walk",
      color: "#a855f7",
      archived: false,
      createdAt: new Date(today.getFullYear(), today.getMonth() - 1, 12).toISOString(),
    },
  ];

  const entries = {};
  const journals = {};

  for (let i = 0; i < 40; i += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const iso = formatISO(date);
    const dayEntries = {};

    if (i % 2 === 0) {
      dayEntries["habit-morning"] = {
        done: true,
        note: i % 7 === 0 ? "Up before sunrise today." : "",
        updatedAt: new Date().toISOString(),
      };
    }

    if (i % 3 !== 0) {
      dayEntries["habit-reading"] = {
        done: true,
        note: i % 5 === 0 ? "Finished a chapter." : "",
        updatedAt: new Date().toISOString(),
      };
    }

    if (i % 4 !== 0) {
      dayEntries["habit-steps"] = {
        done: true,
        note: "Evening walk with a podcast.",
        updatedAt: new Date().toISOString(),
      };
    }

    if (Object.keys(dayEntries).length > 0) {
      entries[iso] = dayEntries;
    }

    if (i % 6 === 0) {
      journals[iso] = "Reflected on progress and stayed consistent despite a busy schedule.";
    }
  }

  return {
    habits,
    entries,
    journals,
  };
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

function toggleEntry(dateIso, habitId) {
  const entries = state.data.entries[dateIso] ? { ...state.data.entries[dateIso] } : {};
  const current = entries[habitId] || { done: false, note: "" };
  const updated = {
    ...current,
    done: !current.done,
    updatedAt: new Date().toISOString(),
  };

  if (!updated.done && !updated.note) {
    delete entries[habitId];
  } else {
    entries[habitId] = updated;
  }

  if (Object.keys(entries).length === 0) {
    delete state.data.entries[dateIso];
  } else {
    state.data.entries[dateIso] = entries;
  }

  saveData();
}

function setEntryNote(dateIso, habitId, note) {
  const entries = state.data.entries[dateIso] ? { ...state.data.entries[dateIso] } : {};
  const current = entries[habitId] || { done: false, note: "" };
  const trimmed = note.trim();
  const updated = {
    ...current,
    note: trimmed,
    updatedAt: new Date().toISOString(),
  };

  if (!updated.done && !updated.note) {
    delete entries[habitId];
  } else {
    entries[habitId] = updated;
  }

  if (Object.keys(entries).length === 0) {
    delete state.data.entries[dateIso];
  } else {
    state.data.entries[dateIso] = entries;
  }

  saveData();
}

function setJournal(dateIso, content) {
  const trimmed = content.trim();
  if (!trimmed) {
    delete state.data.journals[dateIso];
  } else {
    state.data.journals[dateIso] = trimmed;
  }
  saveData();
}

function calculateCompletion(dateIso) {
  const active = getActiveHabits();
  if (active.length === 0) {
    return { done: 0, total: 0 };
  }
  const entries = getDayEntries(dateIso);
  const done = active.reduce((count, habit) => {
    const entry = entries[habit.id];
    return entry && entry.done ? count + 1 : count;
  }, 0);
  return { done, total: active.length };
}

function calculateStreak(habitId, uptoIso = state.selectedDate) {
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
    const entry = getEntry(iso, habitId);
    if (entry && entry.done) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

function calculateTotalCompletions(habitId) {
  return Object.values(state.data.entries).reduce((count, dayEntries) => {
    const entry = dayEntries[habitId];
    return entry && entry.done ? count + 1 : count;
  }, 0);
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

function intensityForHabit(dateIso, habitId) {
  const entry = getEntry(dateIso, habitId);
  if (!entry || !entry.done) {
    return 0;
  }
  const streak = calculateStreak(habitId, dateIso);
  if (streak >= 21) return 4;
  if (streak >= 14) return 3;
  if (streak >= 7) return 2;
  return 1;
}

function openHabitForm(habit) {
  if (habit) {
    elements.habitFormTitle.textContent = "Edit habit";
    elements.habitName.value = habit.name;
    elements.habitColor.value = habit.color;
    elements.habitArchived.checked = habit.archived;
    state.selectedHabitId = habit.id;
    state.habitEditing = habit.id;
  } else {
    elements.habitFormTitle.textContent = "New habit";
    elements.habitName.value = "";
    elements.habitColor.value = "#2563eb";
    elements.habitArchived.checked = false;
    state.habitEditing = null;
  }
  elements.habitDialog.showModal();
}

function closeHabitForm() {
  elements.habitDialog.close();
}

function openNoteDialog(dateIso, habit) {
  state.noteContext = { dateIso, habitId: habit.id };
  const entry = getEntry(dateIso, habit.id);
  elements.noteContext.textContent = `${habit.name} • ${dayFormatter.format(parseISO(dateIso))}`;
  elements.noteText.value = entry && entry.note ? entry.note : "";
  elements.noteDialog.showModal();
}

function closeNoteDialog() {
  state.noteContext = null;
  elements.noteDialog.close();
}

function renderMonthControls() {
  elements.monthLabel.textContent = monthFormatter.format(state.viewMonth);
}

function renderSelectedDate() {
  const date = parseISO(state.selectedDate);
  elements.selectedDayLabel.textContent = dayFormatter.format(date);
  elements.dateSelector.value = state.selectedDate;
  elements.journalDateLabel.textContent = dayFormatter.format(date);

  const completion = calculateCompletion(state.selectedDate);
  elements.metricDone.textContent = `${completion.done}/${completion.total}`;
  const rate = completion.total === 0 ? 0 : Math.round((completion.done / completion.total) * 100);
  elements.metricRate.textContent = `${rate}%`;

  ensureSelectedHabit();
  if (state.selectedHabitId) {
    const streak = calculateStreak(state.selectedHabitId, state.selectedDate);
    elements.metricStreak.textContent = `${streak} day${streak === 1 ? "" : "s"}`;
  } else {
    elements.metricStreak.textContent = "0 days";
  }
}

function renderTodayList() {
  const list = elements.todayHabitList;
  list.innerHTML = "";
  const active = getActiveHabits();
  const completion = getDayEntries(state.selectedDate);
  if (active.length === 0) {
    const empty = document.createElement("li");
    empty.className = "muted";
    empty.textContent = "Add your first habit to begin tracking.";
    list.appendChild(empty);
    return;
  }
  active.forEach((habit) => {
    const item = document.createElement("li");
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(completion[habit.id] && completion[habit.id].done);
    checkbox.addEventListener("change", () => {
      state.selectedHabitId = habit.id;
      toggleEntry(state.selectedDate, habit.id);
      render();
    });

    const name = document.createElement("span");
    name.className = "habit-name";
    name.textContent = habit.name;
    name.style.color = habit.color;

    label.append(checkbox, name);
    const noteButton = document.createElement("button");
    noteButton.type = "button";
    noteButton.className = "ghost";
    noteButton.textContent = completion[habit.id] && completion[habit.id].note ? "Edit note" : "Add note";
    noteButton.addEventListener("click", () => openNoteDialog(state.selectedDate, habit));

    item.append(label, noteButton);
    list.appendChild(item);
  });
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
  const matches = state.data.habits.filter((habit) => habit.name.toLowerCase().includes(term));
  matches.slice(0, 5).forEach((habit) => {
    const item = document.createElement("li");
    const meta = document.createElement("div");
    meta.className = "habit-meta";
    const title = document.createElement("span");
    title.className = "habit-name";
    title.textContent = habit.name;
    const stats = document.createElement("span");
    stats.className = "habit-stats";
    const streak = calculateStreak(habit.id);
    stats.textContent = `${calculateTotalCompletions(habit.id)} logs • ${streak} day streak`;
    meta.append(title, stats);

    const action = document.createElement("button");
    action.type = "button";
    const entry = getEntry(state.selectedDate, habit.id);
    action.textContent = entry && entry.done ? "Undo" : "Log";
    action.addEventListener("click", () => {
      state.selectedHabitId = habit.id;
      toggleEntry(state.selectedDate, habit.id);
      render();
    });

    item.append(meta, action);
    list.appendChild(item);
  });
}

function renderHabitLibrary() {
  const list = elements.habitLibrary;
  list.innerHTML = "";
  if (state.data.habits.length === 0) {
    const empty = document.createElement("li");
    empty.className = "muted";
    empty.textContent = "No habits yet. Create one to get started.";
    list.appendChild(empty);
    return;
  }

  state.data.habits
    .slice()
    .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
    .forEach((habit) => {
      const item = document.createElement("li");
      const meta = document.createElement("div");
      meta.className = "habit-meta";

      const title = document.createElement("div");
      title.className = "habit-name-tag";
      const dot = document.createElement("span");
      dot.className = "habit-dot";
      dot.style.color = habit.color || varFallbackColor();
      dot.style.background = habit.color || varFallbackColor();
      const name = document.createElement("span");
      name.textContent = habit.name;
      title.append(dot, name);

      const stats = document.createElement("div");
      stats.className = "habit-stats";
      const status = habit.archived ? "Archived" : "Active";
      stats.textContent = `${status} • ${calculateTotalCompletions(habit.id)} logs total`;

      meta.append(title, stats);

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
      actions.append(edit, archive);

      item.append(meta, actions);
      list.appendChild(item);
    });
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
        const entry = getEntry(iso, habit.id);
        if (entry && entry.done) {
          cell.classList.add("is-done");
          const intensity = intensityForHabit(iso, habit.id);
          cell.classList.add(`level-${intensity}`);
        }
        if (entry && entry.note) {
          cell.classList.add("has-note");
        }
        if (iso === selectedIso && habit.id === state.selectedHabitId) {
          cell.classList.add("is-selected");
        }

        const labelText = `${habit.name} on ${dayFormatter.format(date)}: ${entry && entry.done ? "done" : "not done"}${
          entry && entry.note ? ". Note: " + entry.note : ""
        }`;
        cell.setAttribute("aria-label", labelText);

        cell.addEventListener("click", () => {
          state.selectedDate = iso;
          state.selectedHabitId = habit.id;
          if (!cell.classList.contains("is-future")) {
            toggleEntry(iso, habit.id);
          }
          render();
        });

        cell.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          state.selectedDate = iso;
          state.selectedHabitId = habit.id;
          openNoteDialog(iso, habit);
        });

        cellsWrapper.appendChild(cell);
      });
    });

    row.append(label, cellsWrapper);
    rows.appendChild(row);
  });
}

function renderJournal() {
  const journal = state.data.journals[state.selectedDate] || "";
  elements.dayJournal.value = journal;
  elements.journalStatus.textContent = "";

  const entries = Object.entries(state.data.journals)
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, 6);
  elements.journalHistory.innerHTML = "";
  entries.forEach(([dateIso, content]) => {
    const item = document.createElement("li");
    const heading = document.createElement("h4");
    heading.textContent = dayFormatter.format(parseISO(dateIso));
    const snippet = document.createElement("p");
    snippet.className = "journal-snippet";
    snippet.textContent = content.length > 160 ? `${content.slice(0, 157)}…` : content;
    item.append(heading, snippet);
    elements.journalHistory.appendChild(item);
  });
}

function render() {
  ensureSelectedHabit();
  renderMonthControls();
  renderSelectedDate();
  renderTodayList();
  renderQuickSearch();
  renderHabitLibrary();
  renderCalendar();
  renderJournal();
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

elements.jumpToday.addEventListener("click", () => {
  const today = new Date();
  state.selectedDate = formatISO(today);
  state.viewMonth = startOfMonth(today);
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
    const matches = state.data.habits.filter((habit) => habit.name.toLowerCase().includes(term));
    if (matches.length > 0) {
      state.selectedHabitId = matches[0].id;
      toggleEntry(state.selectedDate, matches[0].id);
      render();
    }
  }
});

elements.openHabitDialog.addEventListener("click", () => openHabitForm());

elements.habitCancel.addEventListener("click", () => closeHabitForm());

elements.habitDialog.addEventListener("close", () => {
  state.habitEditing = null;
});

elements.habitForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = elements.habitName.value.trim();
  if (!name) {
    return;
  }
  const color = elements.habitColor.value || varFallbackColor();
  const archived = elements.habitArchived.checked;

  if (state.habitEditing) {
    const habit = state.data.habits.find((item) => item.id === state.habitEditing);
    if (habit) {
      habit.name = name;
      habit.color = color;
      habit.archived = archived;
    }
  } else {
    const unique =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const id = `habit-${unique}`;
    state.data.habits.push({
      id,
      name,
      color,
      archived,
      createdAt: new Date().toISOString(),
    });
    state.selectedHabitId = id;
  }

  saveData();
  closeHabitForm();
  render();
});

elements.saveJournal.addEventListener("click", () => {
  setJournal(state.selectedDate, elements.dayJournal.value);
  elements.journalStatus.textContent = "Saved";
  setTimeout(() => {
    elements.journalStatus.textContent = "";
  }, 2000);
  renderJournal();
});

elements.noteCancel.addEventListener("click", () => {
  closeNoteDialog();
});

elements.noteDialog.addEventListener("close", () => {
  state.noteContext = null;
});

elements.noteForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!state.noteContext) {
    closeNoteDialog();
    return;
  }
  setEntryNote(state.noteContext.dateIso, state.noteContext.habitId, elements.noteText.value);
  closeNoteDialog();
  render();
});

elements.resetData.addEventListener("click", () => {
  if (confirm("Reset tracker to seeded demo data?")) {
    state.data = createSeedData();
    state.viewMonth = startOfMonth(new Date());
    state.selectedDate = formatISO(new Date());
    state.searchTerm = "";
    saveData();
    render();
  }
});

render();
