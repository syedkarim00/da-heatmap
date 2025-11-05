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

const shortDayFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
});

const DEFAULT_HEATMAP_VIEW = "month";
const DEFAULT_WEEKLY_TARGET = 3;

const DEFAULT_SETTINGS = {
  heatmapView: DEFAULT_HEATMAP_VIEW,
};

const HEATMAP_VIEWS = {
  weekDays: {
    key: "weekDays",
    label: "Week view",
    columns: 7,
    rows: 1,
    gridSize: "clamp(20px, 3.4vw, 30px)",
  },
  month: {
    key: "month",
    label: "Month view",
    columns: 15,
    gridSize: "clamp(18px, 3vw, 28px)",
  },
  week: {
    key: "week",
    label: "Weekly view",
    columns: 12,
    rows: 5,
    weeks: 52,
    gridSize: "clamp(14px, 2.6vw, 22px)",
  },
  year: {
    key: "year",
    label: "Year view",
    columns: 50,
    rows: 7,
    gridSize: "clamp(10px, 2vw, 16px)",
  },
};

const loadedData = loadData();
const today = new Date();
const initialSelectedDate = formatISO(today);
const state = {
  data: loadedData,
  viewAnchors: createInitialAnchors(today),
  selectedDate: initialSelectedDate,
  selectedCalendarMonth: startOfMonth(today),
  selectedHabitId: null,
  searchTerm: "",
  habitEditing: null,
  lastToggledTodo: null,
  lastLoggedHabit: null,
  libraryFilter: "active",
  heatmapSettingsHabit: null,
};

const elements = {
  monthLabel: document.getElementById("monthLabel"),
  prevMonth: document.getElementById("prevMonth"),
  nextMonth: document.getElementById("nextMonth"),
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
  calendarViewLabel: document.getElementById("calendarViewLabel"),
  selectedDayCalendar: document.getElementById("selectedDayCalendar"),
  todoForm: document.getElementById("todoForm"),
  todoInput: document.getElementById("todoInput"),
  todoList: document.getElementById("todoList"),
  clearCompletedTodos: document.getElementById("clearCompletedTodos"),
  resetData: document.getElementById("resetData"),
  heatmapSettingsDialog: document.getElementById("heatmapSettingsDialog"),
  heatmapSettingsForm: document.getElementById("heatmapSettingsForm"),
  heatmapSettingsCancel: document.getElementById("heatmapSettingsCancel"),
  heatmapSettingsTitle: document.getElementById("heatmapSettingsTitle"),
  heatmapWeeklyTargetRow: document.getElementById("heatmapWeeklyTargetRow"),
  heatmapWeeklyTarget: document.getElementById("heatmapWeeklyTarget"),
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

function ensureSettingsObject() {
  if (!state.data.settings || typeof state.data.settings !== "object") {
    state.data.settings = { ...DEFAULT_SETTINGS };
  }
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfWeek(date) {
  const reference = new Date(date);
  const day = reference.getDay();
  reference.setDate(reference.getDate() - day);
  reference.setHours(0, 0, 0, 0);
  return reference;
}

function startOfYear(date) {
  return new Date(date.getFullYear(), 0, 1);
}

function addDays(date, amount) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function formatISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function updateSelectedDate(iso, syncCalendar = true) {
  state.selectedDate = iso;
  if (syncCalendar) {
    const selected = parseISO(iso);
    state.selectedCalendarMonth = startOfMonth(selected);
  }
}

function isValidHeatmapView(view) {
  return !!(view && HEATMAP_VIEWS[view]);
}

function getViewConfig(view) {
  if (view && HEATMAP_VIEWS[view]) {
    return HEATMAP_VIEWS[view];
  }
  return HEATMAP_VIEWS[DEFAULT_SETTINGS.heatmapView];
}

function getAnchorForView(view, referenceDate) {
  const ref = new Date(referenceDate);
  switch (view) {
    case "weekDays":
      return startOfWeek(ref);
    case "week":
      const weekConfig = getViewConfig("week");
      const totalWeeks = weekConfig.weeks || Math.max(1, (weekConfig.columns || 1) * (weekConfig.rows || 1));
      return addDays(startOfWeek(ref), -7 * Math.max(0, totalWeeks - 1));
    case "year":
      return startOfYear(ref);
    case "month":
    default:
      return startOfMonth(ref);
  }
}

function getTotalDaysForView(anchor, view) {
  if (view === "week") {
    const config = getViewConfig("week");
    const weeks = config.weeks || Math.max(1, (config.columns || 1) * (config.rows || 1));
    return weeks * 7;
  }
  if (view === "weekDays") {
    return 7;
  }
  if (view === "year") {
    const year = anchor.getFullYear();
    const isLeap = new Date(year, 1, 29).getMonth() === 1;
    return isLeap ? 366 : 365;
  }
  const monthIndex = anchor.getMonth();
  const year = anchor.getFullYear();
  return new Date(year, monthIndex + 1, 0).getDate();
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

function createInitialAnchors(referenceDate) {
  const anchors = {};
  Object.keys(HEATMAP_VIEWS).forEach((viewKey) => {
    anchors[viewKey] = getAnchorForView(viewKey, referenceDate);
  });
  return anchors;
}

function getViewAnchor(view) {
  if (!state.viewAnchors) {
    state.viewAnchors = createInitialAnchors(new Date());
  }
  if (!state.viewAnchors[view]) {
    state.viewAnchors[view] = getAnchorForView(view, new Date());
  }
  return new Date(state.viewAnchors[view]);
}

function updateViewAnchor(view, referenceDate) {
  if (!state.viewAnchors) {
    state.viewAnchors = createInitialAnchors(referenceDate);
    return;
  }
  state.viewAnchors[view] = getAnchorForView(view, referenceDate);
}

function getViewRange(view, anchor) {
  const base = new Date(anchor);
  if (view === "week") {
    const config = getViewConfig("week");
    const start = base;
    const totalWeeks = config.weeks || Math.max(1, (config.columns || 1) * (config.rows || 1));
    const end = addDays(start, totalWeeks * 7 - 1);
    return { start, end };
  }
  if (view === "weekDays") {
    const start = startOfWeek(base);
    const end = addDays(start, 6);
    return { start, end };
  }
  if (view === "year") {
    const start = startOfYear(base);
    const end = new Date(start.getFullYear(), 11, 31);
    return { start, end };
  }
  const start = startOfMonth(base);
  const end = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate() + getTotalDaysForView(start, "month") - 1
  );
  return { start, end };
}

function clampDate(date, min, max) {
  const minTime = min.getTime();
  const maxTime = max.getTime();
  const value = date.getTime();
  const clamped = Math.min(Math.max(value, minTime), maxTime);
  return new Date(clamped);
}

function isDateInRange(date, start, end) {
  return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
}

function sanitizeWeeklyTarget(value) {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.min(7, Math.round(parsed));
  }
  return DEFAULT_WEEKLY_TARGET;
}

function getHabitView(habit) {
  if (habit && isValidHeatmapView(habit.heatmapView)) {
    return habit.heatmapView;
  }
  const fallback =
    state.data.settings && isValidHeatmapView(state.data.settings.heatmapView)
      ? state.data.settings.heatmapView
      : DEFAULT_SETTINGS.heatmapView;
  return getViewConfig(fallback).key;
}

function getHabitWeeklyTarget(habit) {
  if (!habit) {
    return DEFAULT_WEEKLY_TARGET;
  }
  return sanitizeWeeklyTarget(habit.weeklyTarget);
}

function ratioToIntensity(ratio) {
  if (!ratio || ratio <= 0) {
    return 0;
  }
  if (ratio >= 1) return 4;
  if (ratio >= 0.75) return 3;
  if (ratio >= 0.5) return 2;
  return 1;
}

function createSeedData() {
  return {
    habits: [],
    entries: {},
    todos: [],
    settings: { ...DEFAULT_SETTINGS },
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

  const fallbackView =
    data &&
    data.settings &&
    isValidHeatmapView(data.settings.heatmapView)
      ? data.settings.heatmapView
      : DEFAULT_SETTINGS.heatmapView;

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
    if (!isValidHeatmapView(cloned.heatmapView)) {
      cloned.heatmapView = fallbackView;
    }
    cloned.heatmapView = getViewConfig(cloned.heatmapView).key;
    cloned.weeklyTarget = sanitizeWeeklyTarget(cloned.weeklyTarget);
    return cloned;
  });

  if (!next.entries || typeof next.entries !== "object") {
    next.entries = {};
  }

  if (!next.settings || typeof next.settings !== "object") {
    next.settings = { ...DEFAULT_SETTINGS };
  } else {
    next.settings = { ...DEFAULT_SETTINGS, ...next.settings };
    if (!isValidHeatmapView(next.settings.heatmapView)) {
      next.settings.heatmapView = DEFAULT_SETTINGS.heatmapView;
    }
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

function ensureSelectedDateWithinView() {
  const habit = getHabitById(state.selectedHabitId);
  const view = getHabitView(habit);
  const selectedDate = parseISO(state.selectedDate);
  let anchor = getViewAnchor(view);
  let range = getViewRange(view, anchor);

  if (selectedDate < range.start || selectedDate > range.end) {
    updateViewAnchor(view, selectedDate);
    anchor = getViewAnchor(view);
    range = getViewRange(view, anchor);
  }

  const clampedSelected = clampDate(selectedDate, range.start, range.end);
  const iso = formatISO(clampedSelected);
  const changed = iso !== state.selectedDate;
  updateSelectedDate(iso, changed);
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

function getWeeklyProgress(startDate, habit) {
  const weekStart = startOfWeek(startDate);
  const target = getHabitWeeklyTarget(habit);
  let completedDays = 0;
  for (let offset = 0; offset < 7; offset += 1) {
    const iso = formatISO(addDays(weekStart, offset));
    if (isHabitComplete(iso, habit)) {
      completedDays += 1;
    }
  }
  const ratio = target > 0 ? completedDays / target : 0;
  return {
    completedDays,
    target,
    intensity: ratioToIntensity(ratio),
  };
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

function getCalendarMatrix(anchorDate, view, habit) {
  const config = getViewConfig(view);
  const anchor = new Date(anchorDate);

  if (view === "year") {
    const columns = config.columns;
    const rows = config.rows || Math.ceil(getTotalDaysForView(anchor, view) / columns);
    const totalCells = rows * columns;

    const buildFallback = () => {
      const start = startOfYear(anchor);
      const total = getTotalDaysForView(start, view);
      const fallbackDates = [];
      for (let index = 0; index < total; index += 1) {
        fallbackDates.push(addDays(start, index));
      }
      return createCalendarMatrixFromDates(fallbackDates, columns, rows, config.gridSize);
    };

    if (!habit) {
      return buildFallback();
    }

    const selected = parseISO(state.selectedDate);
    if (!selected || Number.isNaN(selected.getTime())) {
      return buildFallback();
    }

    const windowStart = addDays(selected, -364);
    const earliestCompletion = findEarliestCompletionDateInRange(
      habit,
      windowStart,
      selected
    );

    const minStart = addDays(selected, -(totalCells - 1));
    let startDate = earliestCompletion ? earliestCompletion : minStart;
    if (startDate < minStart) {
      startDate = minStart;
    }

    const maxWindowEnd = addDays(selected, 364);
    const padded = [];
    for (let i = 0; i < totalCells; i += 1) {
      const current = addDays(startDate, i);
      if (current > maxWindowEnd) {
        padded.push(null);
      } else {
        padded.push(new Date(current));
      }
    }

    return createCalendarMatrixFromDates(padded, columns, rows, config.gridSize);
  }

  const dates = [];
  if (view === "week") {
    const weekConfig = getViewConfig("week");
    const totalWeeks =
      weekConfig.weeks || Math.max(1, (weekConfig.columns || 1) * (weekConfig.rows || 1));
    const start = new Date(anchor);
    for (let index = 0; index < totalWeeks; index += 1) {
      dates.push(addDays(start, index * 7));
    }
  } else if (view === "weekDays") {
    const start = startOfWeek(anchor);
    for (let index = 0; index < 7; index += 1) {
      dates.push(addDays(start, index));
    }
  } else {
    const start = startOfMonth(anchor);
    const monthIndex = start.getMonth();
    const year = start.getFullYear();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day += 1) {
      dates.push(new Date(year, monthIndex, day));
    }
  }

  const rows = config.rows || Math.ceil(dates.length / config.columns);
  return createCalendarMatrixFromDates(dates, config.columns, rows, config.gridSize);
}

function createCalendarMatrixFromDates(dates, columns, rows, gridSize) {
  const normalizedColumns = columns || 1;
  const normalizedRows = rows || Math.ceil(dates.length / normalizedColumns);
  const totalCells = normalizedRows * normalizedColumns;
  const padded = dates.slice();
  while (padded.length < totalCells) {
    padded.push(null);
  }

  const matrix = [];
  for (let row = 0; row < normalizedRows; row += 1) {
    const startIndex = row * normalizedColumns;
    matrix.push(padded.slice(startIndex, startIndex + normalizedColumns));
  }

  return {
    matrix,
    columns: normalizedColumns,
    gridSize,
  };
}

function findLatestCompletionIndex(habit, dates) {
  if (!habit || !Array.isArray(dates)) {
    return -1;
  }

  for (let index = dates.length - 1; index >= 0; index -= 1) {
    const date = dates[index];
    if (!date) {
      continue;
    }
    const iso = formatISO(date);
    const progress = getHabitProgress(iso, habit);
    if (progress.done > 0) {
      return index;
    }
  }

  return -1;
}

function findEarliestCompletionDateInRange(habit, startDate, endDate) {
  if (!habit || !startDate || !endDate) {
    return null;
  }

  const cursor = new Date(startDate);
  cursor.setHours(0, 0, 0, 0);
  const boundary = new Date(endDate);
  boundary.setHours(0, 0, 0, 0);

  while (cursor <= boundary) {
    const iso = formatISO(cursor);
    const progress = getHabitProgress(iso, habit);
    if (progress.done > 0) {
      return new Date(cursor);
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return null;
}

function intensityForHabitDay(dateIso, habit) {
  const progress = getHabitProgress(dateIso, habit);
  if (progress.total === 0) {
    return 0;
  }
  const ratio = progress.done / progress.total;
  return ratioToIntensity(ratio);
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

function openHeatmapSettings(habit) {
  ensureSettingsObject();
  if (habit && habit.id) {
    state.selectedHabitId = habit.id;
    state.heatmapSettingsHabit = habit.id;
  }
  if (!elements.heatmapSettingsForm || !elements.heatmapSettingsDialog) {
    return;
  }
  const activeHabit = getHabitById(state.heatmapSettingsHabit) || habit;
  const view = getHabitView(activeHabit);
  const radios = elements.heatmapSettingsForm.querySelectorAll('input[name="heatmapView"]');
  radios.forEach((radio) => {
    radio.checked = radio.value === view;
  });
  if (elements.heatmapSettingsTitle) {
    const titleHabit = activeHabit && activeHabit.name ? activeHabit.name : "habit";
    elements.heatmapSettingsTitle.textContent = `Heatmap view for ${titleHabit}`;
  }
  syncWeeklyTargetField(view, activeHabit);
  elements.heatmapSettingsDialog.showModal();
}

function closeHeatmapSettings() {
  if (elements.heatmapSettingsDialog && elements.heatmapSettingsDialog.open) {
    elements.heatmapSettingsDialog.close();
  }
}

function syncWeeklyTargetField(view, habit) {
  if (!elements.heatmapWeeklyTargetRow || !elements.heatmapWeeklyTarget) {
    return;
  }
  if (view === "week") {
    elements.heatmapWeeklyTargetRow.classList.remove("is-hidden");
    const target = habit ? getHabitWeeklyTarget(habit) : DEFAULT_WEEKLY_TARGET;
    elements.heatmapWeeklyTarget.value = target;
  } else {
    elements.heatmapWeeklyTargetRow.classList.add("is-hidden");
  }
}

function applyHeatmapSettings(view, weeklyTargetValue) {
  const habitId = state.heatmapSettingsHabit || state.selectedHabitId;
  const habit = getHabitById(habitId);
  if (!habit) {
    return;
  }
  const config = getViewConfig(view);
  habit.heatmapView = config.key;
  if (config.key === "week") {
    const sanitizedTarget =
      weeklyTargetValue !== null && weeklyTargetValue !== undefined && `${weeklyTargetValue}`.trim() !== ""
        ? sanitizeWeeklyTarget(weeklyTargetValue)
        : getHabitWeeklyTarget(habit);
    habit.weeklyTarget = sanitizedTarget;
  } else if (typeof habit.weeklyTarget === "undefined") {
    habit.weeklyTarget = DEFAULT_WEEKLY_TARGET;
  }
  state.selectedHabitId = habit.id;
  ensureSettingsObject();
  state.data.settings.heatmapView = config.key;
  updateViewAnchor(config.key, parseISO(state.selectedDate));
  saveData();
  ensureSelectedDateWithinView();
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

function renderHeatmapMeta() {
  const habit = getHabitById(state.selectedHabitId);
  const view = getHabitView(habit);
  const anchor = getViewAnchor(view);
  const range = getViewRange(view, anchor);
  if (elements.calendarViewLabel) {
    if (view === "week") {
      const config = getViewConfig("week");
      const weeks = config.weeks || Math.max(1, (config.columns || 1) * (config.rows || 1));
      const targetText = habit
        ? ` • Goal ${getHabitWeeklyTarget(habit)}×/week`
        : "";
      elements.calendarViewLabel.textContent = `Weekly view • ${weeks} weeks${targetText}`;
    } else if (view === "weekDays") {
      elements.calendarViewLabel.textContent = "Week view • 7 days";
    } else if (view === "year") {
      const totalDays = getTotalDaysForView(range.start, "year");
      elements.calendarViewLabel.textContent = `Year view • ${totalDays} days`;
    } else {
      const totalDays = getTotalDaysForView(range.start, "month");
      elements.calendarViewLabel.textContent = `Month view • ${totalDays} days`;
    }
  }
}

function renderSelectedDate() {
  const date = parseISO(state.selectedDate);
  elements.selectedDayLabel.textContent = dayFormatter.format(date);
  ensureSelectedHabit();
}

function renderSelectedDayCalendar() {
  if (!elements.selectedDayCalendar) {
    return;
  }

  let month = state.selectedCalendarMonth
    ? new Date(state.selectedCalendarMonth)
    : startOfMonth(parseISO(state.selectedDate));

  if (Number.isNaN(month.getTime())) {
    month = startOfMonth(parseISO(state.selectedDate));
  }

  month = startOfMonth(month);
  state.selectedCalendarMonth = new Date(month);

  if (elements.monthLabel) {
    elements.monthLabel.textContent = monthFormatter.format(month);
  }

  const grid = elements.selectedDayCalendar;
  grid.innerHTML = "";
  grid.setAttribute("aria-label", `Calendar for ${monthFormatter.format(month)}`);

  const firstDay = month.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const firstCellDate = addDays(month, -firstDay);
  const todayIso = formatISO(new Date());
  const selectedIso = state.selectedDate;

  for (let index = 0; index < totalCells; index += 1) {
    const date = addDays(firstCellDate, index);
    const iso = formatISO(date);
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "selected-calendar-cell";
    cell.textContent = String(date.getDate());
    cell.setAttribute("aria-label", dayFormatter.format(date));

    if (date.getMonth() !== month.getMonth()) {
      cell.classList.add("is-outside-month");
    }

    if (iso === todayIso) {
      cell.classList.add("is-today");
    }

    if (iso === selectedIso) {
      cell.classList.add("is-selected");
      cell.setAttribute("aria-current", "date");
    }

    cell.addEventListener("click", () => {
      updateSelectedDate(iso);
      render();
    });

    grid.appendChild(cell);
  }
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
    remove.classList.add("trailing");

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

  const today = new Date();
  const todayIso = formatISO(today);
  const selectedIso = state.selectedDate;
  const selectedHabit =
    state.data.habits.find((habit) => habit.id === state.selectedHabitId) || active[0];
  const legendColor = selectedHabit && selectedHabit.color ? selectedHabit.color : varFallbackColor();
  document.documentElement.style.setProperty("--active-habit-color", legendColor);
  [1, 2, 3, 4].forEach((level) => {
    document.documentElement.style.setProperty(`--legend-shade-${level}`, shadeForIntensity(legendColor, level));
    document.documentElement.style.setProperty(`--legend-border-${level}`, borderForIntensity(legendColor, level));
  });

  active.forEach((habit) => {
    const habitBlock = document.createElement("div");
    habitBlock.className = "habit-calendar";
    const label = document.createElement("button");
    label.className = "habit-pill";
    label.style.setProperty("--habit-color", habit.color || varFallbackColor());
    label.textContent = habit.name;
    label.setAttribute("aria-haspopup", "dialog");
    label.title = "Open heatmap settings";
    label.addEventListener("click", () => {
      openHeatmapSettings(habit);
    });

    const cellsWrapper = document.createElement("div");
    cellsWrapper.className = "calendar-cells";

    const view = getHabitView(habit);
    const anchor = getViewAnchor(view);
    const { matrix, columns, gridSize } = getCalendarMatrix(anchor, view, habit);
    cellsWrapper.style.setProperty("--calendar-columns", columns);
    if (gridSize) {
      cellsWrapper.style.setProperty("--grid-size", gridSize);
    }

    matrix.forEach((rowDates) => {
      rowDates.forEach((date) => {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "calendar-cell";
        if (!date) {
          cell.classList.add("is-empty");
          cell.disabled = true;
          cell.setAttribute("aria-hidden", "true");
          cell.tabIndex = -1;
          cellsWrapper.appendChild(cell);
          return;
        }

        if (view === "week") {
          const weekStart = startOfWeek(date);
          const weekEnd = addDays(weekStart, 6);
          const metrics = getWeeklyProgress(weekStart, habit);
          const intensity = metrics.intensity;
          if (intensity > 0) {
            const shade = shadeForIntensity(habit.color, intensity);
            cell.classList.add("is-done", `level-${intensity}`);
            cell.style.setProperty("--cell-color", shade);
            cell.style.setProperty(
              "--cell-border-color",
              borderForIntensity(habit.color, intensity)
            );
          } else {
            cell.style.removeProperty("--cell-color");
            cell.style.removeProperty("--cell-border-color");
          }
          if (habit.id === state.selectedHabitId) {
            const selectedDate = parseISO(selectedIso);
            if (isDateInRange(selectedDate, weekStart, weekEnd)) {
              cell.classList.add("is-selected");
            }
          }
          if (weekStart > today) {
            cell.classList.add("is-future");
            cell.disabled = true;
          }
          cell.classList.add("is-aggregate");
          const labelText = `${habit.name} week of ${shortDayFormatter.format(
            weekStart
          )} – ${shortDayFormatter.format(weekEnd)}: ${metrics.completedDays}/${
            metrics.target
          } goal days`;
          cell.setAttribute("aria-label", labelText);
          cell.addEventListener("click", () => {
            state.selectedHabitId = habit.id;
            const focusDate = isDateInRange(today, weekStart, weekEnd)
              ? today
              : weekStart;
            updateSelectedDate(formatISO(focusDate));
            render();
          });
        } else {
          const iso = formatISO(date);
          if (iso > todayIso) {
            cell.classList.add("is-future");
            cell.disabled = true;
          }
          const progress = getHabitProgress(iso, habit);
          const intensity = intensityForHabitDay(iso, habit);
          if (intensity > 0) {
            const shade = shadeForIntensity(habit.color, intensity);
            cell.classList.add("is-done");
            cell.classList.add(`level-${intensity}`);
            cell.style.setProperty("--cell-color", shade);
            cell.style.setProperty(
              "--cell-border-color",
              borderForIntensity(habit.color, intensity)
            );
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
            updateSelectedDate(iso);
            state.selectedHabitId = habit.id;
            if (!cell.classList.contains("is-future")) {
              const complete = progress.total > 0 && progress.done === progress.total;
              toggleHabitCompletion(iso, habit, !complete);
              state.lastLoggedHabit = { id: habit.id, type: "habit", complete: !complete };
            }
            render();
          });
        }
        cellsWrapper.appendChild(cell);
      });
    });

    habitBlock.append(label, cellsWrapper);
    rows.appendChild(habitBlock);
  });
}

function render() {
  ensureSelectedHabit();
  ensureSelectedDateWithinView();
  renderHeatmapMeta();
  renderSelectedDate();
  renderSelectedDayCalendar();
  renderTodayList();
  renderQuickSearch();
  renderHabitLibrary();
  renderTodos();
  renderCalendar();
}

function shiftCalendarMonth(direction) {
  const base = state.selectedCalendarMonth
    ? new Date(state.selectedCalendarMonth)
    : startOfMonth(parseISO(state.selectedDate));

  if (Number.isNaN(base.getTime())) {
    return;
  }

  base.setMonth(base.getMonth() + direction);
  state.selectedCalendarMonth = startOfMonth(base);
  renderSelectedDayCalendar();
}

if (elements.prevMonth) {
  elements.prevMonth.addEventListener("click", () => {
    shiftCalendarMonth(-1);
  });
}

if (elements.nextMonth) {
  elements.nextMonth.addEventListener("click", () => {
    shiftCalendarMonth(1);
  });
}

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

if (elements.heatmapSettingsCancel) {
  elements.heatmapSettingsCancel.addEventListener("click", () => {
    closeHeatmapSettings();
  });
}

if (elements.heatmapSettingsForm) {
  elements.heatmapSettingsForm.addEventListener("change", (event) => {
    if (event.target && event.target.name === "heatmapView") {
      const view = event.target.value;
      const habit = getHabitById(state.heatmapSettingsHabit || state.selectedHabitId);
      if (typeof view === "string") {
        syncWeeklyTargetField(view, habit);
      }
    }
  });
  elements.heatmapSettingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(elements.heatmapSettingsForm);
    const view = formData.get("heatmapView");
    const weeklyTargetValue = formData.get("weeklyTarget");
    if (view && typeof view === "string") {
      applyHeatmapSettings(view, weeklyTargetValue);
    }
    closeHeatmapSettings();
    render();
  });
}

if (elements.heatmapSettingsDialog) {
  elements.heatmapSettingsDialog.addEventListener("close", () => {
    state.heatmapSettingsHabit = null;
  });
}

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
      heatmapView: getViewConfig(
        state.data.settings && state.data.settings.heatmapView
      ).key,
      weeklyTarget: DEFAULT_WEEKLY_TARGET,
    });
    state.selectedHabitId = id;
  }

  saveData();
  closeHabitForm();
  render();
});

elements.resetData.addEventListener("click", () => {
  if (confirm("Reset tracker and clear all saved data?")) {
    state.data = createSeedData();
    const now = new Date();
    state.viewAnchors = createInitialAnchors(now);
    updateSelectedDate(formatISO(now));
    state.selectedHabitId = null;
    state.searchTerm = "";
    state.libraryFilter = "active";
    state.heatmapSettingsHabit = null;
    saveData();
    render();
  }
});

render();
