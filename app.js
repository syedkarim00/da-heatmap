const STORAGE_KEY = "da-heatmap-data-v1";
const today = new Date();
let selectedDate = new Date();

const defaultData = {
  habits: [
    {
      id: "habit-walk",
      name: "Walk 10 min",
      frequency: "daily",
      category: "health",
      color: "#38bdf8",
      isActive: true,
      createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 18).toISOString(),
    },
    {
      id: "habit-pray",
      name: "Morning prayer",
      frequency: "daily",
      category: "faith",
      color: "#f97316",
      isActive: true,
      createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 25).toISOString(),
    },
    {
      id: "habit-read",
      name: "Read 2 pages",
      frequency: "weekdays",
      category: "learning",
      color: "#a855f7",
      isActive: true,
      createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7).toISOString(),
    },
  ],
  entries: {},
  settings: {
    heatmapMode: "combined",
    skipAllowancePerWeek: 1,
    graceDays: {},
  },
};

const ui = {
  habitList: document.querySelector("#habitList"),
  habitForm: document.querySelector("#habitForm"),
  heatmapContainer: document.querySelector("#heatmapContainer"),
  heatmapMode: document.querySelector("#heatmapMode"),
  datePicker: document.querySelector("#datePicker"),
  streakInfo: document.querySelector("#streakInfo"),
  weeklySummary: document.querySelector("#weeklySummary"),
  graceButton: document.querySelector("#graceDayButton"),
};

const state = {
  data: loadData(),
};

initialize();

function initialize() {
  selectedDate = new Date();
  ui.datePicker.value = formatDateInput(selectedDate);
  ui.heatmapMode.value = state.data.settings.heatmapMode;
  bindEvents();
  renderAll();
}

function bindEvents() {
  ui.datePicker.addEventListener("change", () => {
    selectedDate = parseDateInput(ui.datePicker.value) ?? new Date();
    renderAll();
  });

  ui.habitForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.target;
    const name = form.habitName.value.trim();
    if (!name) return;

    const newHabit = {
      id: crypto.randomUUID(),
      name,
      frequency: form.habitFrequency.value,
      category: form.habitCategory.value.trim() || null,
      color: form.habitColor.value,
      isActive: form.habitActive.checked,
      createdAt: new Date().toISOString(),
    };

    state.data.habits.push(newHabit);
    form.reset();
    form.habitColor.value = generateNextColor();
    form.habitActive.checked = true;
    saveData();
    renderAll();
  });

  ui.heatmapMode.addEventListener("change", () => {
    state.data.settings.heatmapMode = ui.heatmapMode.value;
    saveData();
    renderHeatmap();
  });

  ui.graceButton.addEventListener("click", () => {
    useGraceDay();
  });
}

function renderAll() {
  renderHabitList();
  renderHeatmap();
  renderStreakInfo();
  renderWeeklySummary();
  updateGraceButton();
}

function renderHabitList() {
  ui.habitList.innerHTML = "";
  const template = document.querySelector("#habitItemTemplate");
  const dateKey = formatDateKey(selectedDate);
  const todaysEntries = new Set(state.data.entries[dateKey] || []);

  getActiveHabits()
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .forEach((habit) => {
      const node = template.content.cloneNode(true);
      const li = node.querySelector(".habit-item");
      const checkbox = node.querySelector(".habit-checkbox");
      const nameNode = node.querySelector(".habit-name");
      const metaNode = node.querySelector(".habit-meta");

      checkbox.checked = todaysEntries.has(habit.id);
      checkbox.dataset.habitId = habit.id;
      checkbox.addEventListener("change", (event) => {
        const checked = event.target.checked;
        toggleHabitCompletion(habit.id, dateKey, checked);
      });

      nameNode.textContent = habit.name;
      nameNode.style.setProperty("--habit-color", habit.color);
      metaNode.textContent = buildHabitMeta(habit);

      li.style.borderColor = withAlpha(habit.color, 0.45);
      li.style.boxShadow = `0 10px 25px ${withAlpha(habit.color, 0.15)}`;

      ui.habitList.appendChild(node);
    });
}

function buildHabitMeta(habit) {
  const freqText = formatFrequency(habit.frequency);
  const age = calculateHabitAge(habit.createdAt);
  const streak = calculateHabitStreak(habit.id, selectedDate);
  return `${freqText} • Day ${age} • 🔥 ${streak}-day streak`;
}

function formatFrequency(freq) {
  switch (freq) {
    case "daily":
      return "Daily";
    case "3_per_week":
      return "3x per week";
    case "weekdays":
      return "Weekdays";
    case "custom":
      return "Custom rhythm";
    default:
      return "Flexible";
  }
}

function calculateHabitAge(createdAt) {
  if (!createdAt) return 1;
  const created = new Date(createdAt);
  const reference = new Date(selectedDate);
  created.setHours(0, 0, 0, 0);
  reference.setHours(0, 0, 0, 0);
  const diff = Math.max(0, reference.getTime() - created.getTime());
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

function toggleHabitCompletion(habitId, dateKey, isCompleted) {
  const dayEntries = new Set(state.data.entries[dateKey] || []);
  if (isCompleted) {
    dayEntries.add(habitId);
    removeGraceDay(dateKey);
  } else {
    dayEntries.delete(habitId);
  }
  if (dayEntries.size) {
    state.data.entries[dateKey] = Array.from(dayEntries);
  } else {
    delete state.data.entries[dateKey];
  }
  saveData();
  renderAll();
}

function renderHeatmap() {
  ui.heatmapContainer.innerHTML = "";
  const mode = state.data.settings.heatmapMode;
  switch (mode) {
    case "per-habit":
      renderPerHabitHeatmap();
      break;
    case "streak":
      renderStreakHeatmap();
      break;
    case "weekly":
      renderWeeklyHeatmap();
      break;
    default:
      renderCombinedHeatmap();
  }
}

function renderCombinedHeatmap() {
  const { startDate, endDate } = getHeatmapRange();
  const grid = document.createElement("div");
  grid.className = "calendar-grid";

  const days = enumerateDays(startDate, endDate);
  days.forEach((date) => {
    const dateKey = formatDateKey(date);
    const cell = document.createElement("div");
    cell.className = "calendar-cell";
    const level = getDayLevel(dateKey);
    cell.dataset.level = level;

    const tooltip = document.createElement("div");
    tooltip.className = "cell-tooltip";
    tooltip.textContent = formatCellLabel(dateKey, level);
    cell.appendChild(tooltip);

    grid.appendChild(cell);
  });

  ui.heatmapContainer.appendChild(grid);
}

function renderPerHabitHeatmap() {
  const { startDate, endDate } = getHeatmapRange();
  const days = enumerateDays(startDate, endDate);

  getActiveHabits().forEach((habit) => {
    const row = document.createElement("div");
    row.className = "habit-row";

    const label = document.createElement("div");
    label.className = "habit-row-name";
    label.textContent = habit.name;
    row.appendChild(label);

    const grid = document.createElement("div");
    grid.className = "calendar-grid";

    days.forEach((date) => {
      const dateKey = formatDateKey(date);
      const cell = document.createElement("div");
      cell.className = "calendar-cell";
      const completed = Boolean(state.data.entries[dateKey]?.includes(habit.id));
      const level = completed ? 3 : isGraceDay(dateKey) ? "skip" : 0;
      cell.dataset.level = level;

      const tooltip = document.createElement("div");
      tooltip.className = "cell-tooltip";
      tooltip.textContent = completed ? "✅" : isGraceDay(dateKey) ? "🕊️" : "";
      cell.appendChild(tooltip);

      grid.appendChild(cell);
    });

    row.appendChild(grid);
    ui.heatmapContainer.appendChild(row);
  });
}

function renderStreakHeatmap() {
  const container = document.createElement("div");
  container.className = "weekly-summary";

  getActiveHabits()
    .map((habit) => ({
      habit,
      streak: calculateHabitStreak(habit.id, selectedDate),
    }))
    .sort((a, b) => b.streak - a.streak)
    .forEach(({ habit, streak }) => {
      const card = document.createElement("div");
      card.className = "summary-card";
      card.style.borderColor = withAlpha(habit.color, 0.35);
      card.innerHTML = `<strong>${habit.name}</strong><span>🔥 ${streak}-day streak</span>`;
      container.appendChild(card);
    });

  ui.heatmapContainer.appendChild(container);
}

function renderWeeklyHeatmap() {
  const weeks = collectRecentWeeks(12);
  const grid = document.createElement("div");
  grid.className = "calendar-grid";
  grid.style.gridTemplateColumns = "repeat(6, 1fr)";

  weeks.forEach((week) => {
    const cell = document.createElement("div");
    cell.className = "calendar-cell";
    const completionRate = calculateWeekCompletionRate(week);
    const level = completionRate >= 0.9 ? 3 : completionRate >= 0.6 ? 2 : completionRate >= 0.3 ? 1 : 0;
    cell.dataset.level = level;

    const tooltip = document.createElement("div");
    tooltip.className = "cell-tooltip";
    tooltip.textContent = `${Math.round(completionRate * 100)}%`;
    cell.appendChild(tooltip);

    grid.appendChild(cell);
  });

  ui.heatmapContainer.appendChild(grid);
}

function getDayLevel(dateKey) {
  if (isGraceDay(dateKey) && !state.data.entries[dateKey]) {
    return "skip";
  }

  const count = state.data.entries[dateKey]?.length || 0;
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  return 3;
}

function formatCellLabel(dateKey, level) {
  const date = new Date(dateKey);
  const formatted = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (level === "skip") return `${formatted} • Grace day`;
  const count = state.data.entries[dateKey]?.length || 0;
  return `${formatted} • ${count} habit${count === 1 ? "" : "s"}`;
}

function renderStreakInfo() {
  const streaks = calculateAllHabitStreaks(selectedDate);
  const topHabit = streaks.sort((a, b) => b.streak - a.streak)[0];
  const overallStreak = calculateOverallStreak(selectedDate);

  if (topHabit && overallStreak > 0) {
    ui.streakInfo.textContent = `🔥 ${overallStreak}-day chain intact. Best habit: ${topHabit.habit.name} (${topHabit.streak} days).`;
  } else if (topHabit) {
    ui.streakInfo.textContent = `Today is day ${calculateHabitAge(topHabit.habit.createdAt)} of ${topHabit.habit.name}. Tap to start the streak.`;
  } else {
    ui.streakInfo.textContent = "Add a habit to start building momentum.";
  }
}

function renderWeeklySummary() {
  ui.weeklySummary.innerHTML = "";
  const summary = calculateWeeklySummary(selectedDate);

  const cards = [
    {
      title: "Days you showed up",
      value: `${summary.daysShowedUp}/${summary.totalDays}`,
      description: "Grace days count as showing up—nicely done.",
    },
    {
      title: "Habits tracked",
      value: `${summary.totalHabits}`,
      description: `${summary.completedHabitsToday} checked off today`,
    },
    {
      title: "Top streak",
      value: summary.bestHabit ? `${summary.bestHabit.habit.name}` : "—",
      description: summary.bestHabit ? `${summary.bestHabit.streak} days running` : "Tap your first check to start a chain.",
    },
  ];

  cards.forEach((card) => {
    const node = document.createElement("div");
    node.className = "summary-card";
    node.innerHTML = `<strong>${card.value}</strong><span>${card.title}</span><p>${card.description}</p>`;
    ui.weeklySummary.appendChild(node);
  });
}

function updateGraceButton() {
  const dateKey = formatDateKey(selectedDate);
  const weekKey = getWeekKey(selectedDate);
  const entries = state.data.entries[dateKey];
  const graceUsed = state.data.settings.graceDays[weekKey] || [];
  const allowance = state.data.settings.skipAllowancePerWeek;
  const alreadyGrace = graceUsed.includes(dateKey);

  ui.graceButton.disabled = Boolean(entries && entries.length) || alreadyGrace || graceUsed.length >= allowance;
  ui.graceButton.textContent = alreadyGrace
    ? "Grace day used"
    : `Use grace day (${allowance - graceUsed.length} left)`;
}

function useGraceDay() {
  const dateKey = formatDateKey(selectedDate);
  const weekKey = getWeekKey(selectedDate);
  if (state.data.entries[dateKey]?.length) return;

  const graceDays = state.data.settings.graceDays[weekKey] || [];
  const allowance = state.data.settings.skipAllowancePerWeek;
  if (graceDays.includes(dateKey) || graceDays.length >= allowance) return;

  graceDays.push(dateKey);
  state.data.settings.graceDays[weekKey] = graceDays;
  saveData();
  renderAll();
}

function removeGraceDay(dateKey) {
  const weekKey = getWeekKey(new Date(dateKey));
  const graceDays = state.data.settings.graceDays[weekKey];
  if (!graceDays) return;
  const next = graceDays.filter((date) => date !== dateKey);
  if (next.length) {
    state.data.settings.graceDays[weekKey] = next;
  } else {
    delete state.data.settings.graceDays[weekKey];
  }
}

function isGraceDay(dateKey) {
  const weekKey = getWeekKey(new Date(dateKey));
  return Boolean(state.data.settings.graceDays[weekKey]?.includes(dateKey));
}

function calculateWeekCompletionRate(weekKey) {
  const days = enumerateDaysOfWeek(weekKey);
  const activeHabits = getActiveHabits().length;
  if (activeHabits === 0) return 0;

  const totalOpportunities = activeHabits * days.length;
  let completions = 0;

  days.forEach((day) => {
    const dateKey = formatDateKey(day);
    completions += state.data.entries[dateKey]?.length || 0;
  });

  return completions / totalOpportunities;
}

function enumerateDaysOfWeek(weekKey) {
  const [yearStr, weekStr] = weekKey.split("-W");
  const year = Number(yearStr);
  const week = Number(weekStr);
  const firstThursday = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const dayOfWeek = firstThursday.getUTCDay();
  const isoWeekStart = new Date(firstThursday);
  const diff = dayOfWeek <= 4 ? dayOfWeek - 1 : dayOfWeek - 8;
  isoWeekStart.setUTCDate(firstThursday.getUTCDate() - diff);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(isoWeekStart);
    date.setUTCDate(isoWeekStart.getUTCDate() + i);
    days.push(date);
  }
  return days;
}

function calculateWeeklySummary(referenceDate) {
  const days = enumerateDaysAround(referenceDate, 6);
  let daysShowedUp = 0;
  let completedHabitsToday = 0;
  const todaysKey = formatDateKey(referenceDate);
  const bestHabit = calculateAllHabitStreaks(referenceDate).sort((a, b) => b.streak - a.streak)[0] || null;

  days.forEach((date) => {
    const key = formatDateKey(date);
    if ((state.data.entries[key] && state.data.entries[key].length) || isGraceDay(key)) {
      daysShowedUp += 1;
    }
  });

  completedHabitsToday = state.data.entries[todaysKey]?.length || 0;

  return {
    daysShowedUp,
    totalDays: days.length,
    totalHabits: getActiveHabits().length,
    completedHabitsToday,
    bestHabit,
  };
}

function calculateAllHabitStreaks(referenceDate) {
  return getActiveHabits().map((habit) => ({
    habit,
    streak: calculateHabitStreak(habit.id, referenceDate),
  }));
}

function calculateHabitStreak(habitId, referenceDate) {
  let streak = 0;
  const cursor = new Date(referenceDate);
  cursor.setHours(0, 0, 0, 0);
  let graceBuffer = state.data.settings.skipAllowancePerWeek;
  while (true) {
    const dateKey = formatDateKey(cursor);
    const completed = state.data.entries[dateKey]?.includes(habitId);
    const grace = isGraceDay(dateKey);

    if (completed) {
      streak += 1;
    } else if (grace && graceBuffer > 0) {
      graceBuffer -= 1;
      // grace day keeps streak but does not increment
    } else {
      break;
    }

    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function calculateOverallStreak(referenceDate) {
  let streak = 0;
  const cursor = new Date(referenceDate);
  cursor.setHours(0, 0, 0, 0);
  let graceBuffer = state.data.settings.skipAllowancePerWeek;

  while (true) {
    const key = formatDateKey(cursor);
    const hasProgress = Boolean(state.data.entries[key]?.length);
    const grace = isGraceDay(key);

    if (hasProgress) {
      streak += 1;
    } else if (grace && graceBuffer > 0) {
      graceBuffer -= 1;
      // streak preserved but not incremented
    } else {
      break;
    }

    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function calculateHabitStreakToday(habitId) {
  return calculateHabitStreak(habitId, selectedDate);
}

function getHeatmapRange() {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - 90);
  return { startDate, endDate };
}

function enumerateDays(startDate, endDate) {
  const dates = [];
  const cursor = new Date(startDate);
  cursor.setHours(0, 0, 0, 0);
  while (cursor <= endDate) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function enumerateDaysAround(referenceDate, daysBack) {
  const dates = [];
  const start = new Date(referenceDate);
  start.setDate(start.getDate() - daysBack);
  return enumerateDays(start, referenceDate);
}

function collectRecentWeeks(count) {
  const weeks = [];
  const reference = new Date();
  for (let i = 0; i < count; i++) {
    const weekDate = new Date(reference);
    weekDate.setDate(reference.getDate() - i * 7);
    weeks.push(getWeekKey(weekDate));
  }
  return weeks.reverse();
}

function getWeekKey(date) {
  const isoDate = new Date(date);
  isoDate.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year.
  isoDate.setDate(isoDate.getDate() + 3 - ((isoDate.getDay() + 6) % 7));
  const week1 = new Date(isoDate.getFullYear(), 0, 4);
  const weekNumber = 1 + Math.round(((isoDate.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${isoDate.getFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

function getActiveHabits() {
  return state.data.habits.filter((habit) => habit.isActive !== false);
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultData);
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(defaultData),
      ...parsed,
      habits: parsed.habits || structuredClone(defaultData.habits),
      entries: parsed.entries || {},
      settings: {
        ...structuredClone(defaultData.settings),
        ...(parsed.settings || {}),
      },
    };
  } catch (error) {
    console.warn("Failed to load saved data", error);
    return structuredClone(defaultData);
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
  } catch (error) {
    console.warn("Failed to save data", error);
  }
}

function formatDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDateInput(date) {
  return formatDateKey(date);
}

function parseDateInput(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function withAlpha(color, alpha) {
  const ctx = document.createElement("canvas").getContext("2d");
  ctx.fillStyle = color;
  const { data } = ctx.getImageData(0, 0, 1, 1);
  return `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${alpha})`;
}

const starterPalette = ["#38bdf8", "#f97316", "#a855f7", "#22c55e", "#eab308", "#f43f5e"];
let paletteIndex = 0;
function generateNextColor() {
  const color = starterPalette[paletteIndex % starterPalette.length];
  paletteIndex += 1;
  return color;
}

// hydrate palette index based on existing habits
paletteIndex = state.data.habits.length;

// For browsers that do not support crypto.randomUUID
if (!crypto.randomUUID) {
  crypto.randomUUID = () => `habit-${Math.random().toString(16).slice(2)}`;
}
