import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const STORAGE_KEY = "habit-tracker-data-v2";
const LEGACY_STORAGE_KEYS = ["lod-tracker-data-v2"];
const ACCOUNT_STORAGE_KEY = "habit-tracker-accounts";
const CLOUD_SETTINGS_KEY = "habit-tracker-cloud-settings";
const SESSION_STORAGE_KEY = "habit-tracker-session";

const SUPABASE_URL = "https://peuiedofnbmjodoeiknk.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBldWllZG9mbmJtam9kb2Vpa25rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzOTE3OTUsImV4cCI6MjA3Nzk2Nzc5NX0.-lcNxCD7ceVnSfIp49_TF2iMKLpsyfbQssv774Eh72w";
const SUPABASE_ACCOUNTS_TABLE = "tracker_accounts";
const SUPABASE_DATA_TABLE = "tracker_profiles";
const DEFAULT_SYNC_SETTINGS = {
  enabled: true,
  provider: "supabase",
  supabase: {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    table: SUPABASE_DATA_TABLE,
  },
};
const DEFAULT_CLOUD_SETTINGS = {
  supabase: {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    accountsTable: SUPABASE_ACCOUNTS_TABLE,
    dataTable: SUPABASE_DATA_TABLE,
  },
};

const REMOTE_PUSH_DEBOUNCE = 800;
const MIN_PASSWORD_LENGTH = 8;

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

const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const DEFAULT_HEATMAP_VIEW = "month";
const DEFAULT_WEEKLY_TARGET = 3;

const DEFAULT_SETTINGS = {
  heatmapView: DEFAULT_HEATMAP_VIEW,
};

const LEGEND_CYCLE_INTERVAL = 2000;
const SELECTION_GLOW_DURATION = 10000;
const SESSION_REFRESH_THRESHOLD = 60 * 1000;
const SESSION_EXPIRY_BUFFER = 30 * 1000;
const SESSION_FALLBACK_TTL = 60 * 60 * 1000;

const MOVE_ICON_SVG = `
  <svg class="icon icon-move" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      fill="currentColor"
      d="M12 2.25l3 3H12.75V9h3.75V6.75l3 3-3 3V10.5h-3.75v3.75H15l-3 3-3-3h2.25V10.5H7.5V12.75l-3-3 3-3V9h3.75V5.25H9l3-3z"
    />
  </svg>
`;

const EYE_OPEN_ICON = `
  <svg class="icon icon-eye" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z"
    ></path>
    <circle cx="12" cy="12" r="3" fill="currentColor"></circle>
  </svg>
`;

const EYE_CLOSED_ICON = `
  <svg class="icon icon-eye-off" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      d="M3 8c2.4-3.2 5.7-4.75 9-4.75S18.6 4.8 21 8"
    ></path>
    <path
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      d="M3 16c2.4 3.2 5.7 4.75 9 4.75s6.6-1.55 9-4.75"
    ></path>
    <line
      x1="4"
      y1="4"
      x2="20"
      y2="20"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
    ></line>
  </svg>
`;

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

const today = new Date();
const initialSelectedDate = formatISO(today);
const state = {
  accountStore: loadAccountStore(),
  cloudSettings: loadCloudSettings(),
  currentUserId: null,
  isAuthenticated: false,
  authMode: "signIn",
  authSession: null,
  data: createSeedData(),
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
  legendColors: [],
  legendColorIndex: 0,
  legendAnimationTimer: null,
  selectionGlowActive: true,
  selectionGlowTimer: null,
  draggingHabitId: null,
  dragHandleActive: null,
  remoteSync: {
    pending: false,
    lastSyncedAt: null,
    lastError: null,
    pushTimer: null,
    inFlight: null,
    pollTimer: null,
    realtimeClient: null,
    realtimeChannel: null,
    realtimeRemoteId: null,
    realtimeReconnectTimer: null,
    lastRemoteUpdate: null,
    shouldReconnect: false,
  },
};

Object.values(state.accountStore.users).forEach((account) => {
  account.sync = normalizeSyncSettings(account.sync);
});
saveAccountStore(state.accountStore);

const elements = {
  appShell: document.getElementById("appShell"),
  authGate: document.getElementById("authGate"),
  signInForm: document.getElementById("signInForm"),
  registerForm: document.getElementById("registerForm"),
  signInEmail: document.getElementById("signInEmail"),
  signInPassword: document.getElementById("signInPassword"),
  registerEmail: document.getElementById("registerEmail"),
  registerPassword: document.getElementById("registerPassword"),
  registerConfirm: document.getElementById("registerConfirm"),
  showRegister: document.getElementById("showRegister"),
  showSignIn: document.getElementById("showSignIn"),
  authError: document.getElementById("authError"),
  authSubtitle: document.getElementById("authSubtitle"),
  accountChip: document.getElementById("accountChip"),
  accountChipInitial: document.getElementById("accountChipInitial"),
  accountChipEmail: document.getElementById("accountChipEmail"),
  syncStatus: document.getElementById("syncStatus"),
  signOut: document.getElementById("signOut"),
  accountMenuDialog: document.getElementById("accountMenuDialog"),
  accountMenuClose: document.getElementById("accountMenuClose"),
  changePasswordForm: document.getElementById("changePasswordForm"),
  changePasswordNew: document.getElementById("changePasswordNew"),
  changePasswordConfirm: document.getElementById("changePasswordConfirm"),
  changePasswordError: document.getElementById("changePasswordError"),
  changePasswordSuccess: document.getElementById("changePasswordSuccess"),
  deleteAccountButton: document.getElementById("deleteAccountButton"),
  accountMenuError: document.getElementById("accountMenuError"),
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

function cloneCloudSettings() {
  return {
    supabase: { ...DEFAULT_CLOUD_SETTINGS.supabase },
  };
}

function normalizeCloudSettings() {
  return cloneCloudSettings();
}

function loadCloudSettings() {
  try {
    localStorage.removeItem(CLOUD_SETTINGS_KEY);
  } catch (error) {
    console.warn("Failed to clear stored cloud settings", error);
  }
  return cloneCloudSettings();
}

function saveCloudSettings() {
  try {
    localStorage.removeItem(CLOUD_SETTINGS_KEY);
  } catch (error) {
    console.warn("Failed to clear stored cloud settings", error);
  }
}

function cloneDefaultSyncSettings() {
  return {
    enabled: DEFAULT_SYNC_SETTINGS.enabled,
    provider: DEFAULT_SYNC_SETTINGS.provider,
    supabase: { ...DEFAULT_SYNC_SETTINGS.supabase },
  };
}

function deriveAccountSyncSettings() {
  return cloneDefaultSyncSettings();
}

function isSupabaseConfigured(settings = state.cloudSettings) {
  if (!settings || !settings.supabase) {
    return false;
  }
  const supabase = settings.supabase;
  return Boolean(supabase.url && supabase.anonKey && supabase.accountsTable && supabase.dataTable);
}

function normalizeSyncSettings(sync) {
  return cloneDefaultSyncSettings();
}

function loadAccountStore() {
  try {
    const stored = localStorage.getItem(ACCOUNT_STORAGE_KEY);
    if (!stored) {
      return { users: {} };
    }
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object" || typeof parsed.users !== "object") {
      return { users: {} };
    }
    const users = {};
    Object.entries(parsed.users).forEach(([id, record]) => {
      if (!record || typeof record !== "object") {
        return;
      }
      const normalizedId = (id || "").toLowerCase();
      const remoteId =
        record && typeof record.remoteId === "string" && record.remoteId
          ? record.remoteId
          : record && typeof record.supabaseUserId === "string" && record.supabaseUserId
          ? record.supabaseUserId
          : normalizedId;
      users[normalizedId] = {
        id: normalizedId,
        email: record.email || normalizedId,
        passwordHash: record.passwordHash || "",
        createdAt: record.createdAt || null,
        lastLoginAt: record.lastLoginAt || null,
        remoteId,
        sync: normalizeSyncSettings(record.sync),
      };
    });
    return { users };
  } catch (error) {
    console.warn("Failed to parse account store", error);
    return { users: {} };
  }
}

function saveAccountStore(store) {
  try {
    localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(store));
  } catch (error) {
    console.warn("Failed to persist account store", error);
  }
}

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function loadSession() {
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) {
      return null;
    }
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object" || !parsed.userId) {
      return null;
    }
    const normalizedId = normalizeEmail(parsed.userId);
    return {
      userId: normalizedId,
      email: typeof parsed.email === "string" ? parsed.email : null,
      remoteId: typeof parsed.remoteId === "string" ? parsed.remoteId : null,
      accessToken: typeof parsed.accessToken === "string" ? parsed.accessToken : null,
      refreshToken: typeof parsed.refreshToken === "string" ? parsed.refreshToken : null,
      expiresAt: typeof parsed.expiresAt === "number" ? parsed.expiresAt : null,
    };
  } catch (error) {
    console.warn("Failed to parse saved session", error);
  }
  return null;
}

function saveSession(userId, session = null) {
  if (!userId) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }
  try {
    const normalizedId = normalizeEmail(userId);
    const payload = {
      userId: normalizedId,
      email: session && session.email ? session.email : null,
      remoteId: session && session.remoteId ? session.remoteId : null,
      accessToken: session && session.accessToken ? session.accessToken : null,
      refreshToken: session && session.refreshToken ? session.refreshToken : null,
      expiresAt: session && typeof session.expiresAt === "number" ? session.expiresAt : null,
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("Failed to persist session", error);
  }
}

function clearSession() {
  state.authSession = null;
  localStorage.removeItem(SESSION_STORAGE_KEY);
  applyRealtimeAuth(null);
}

function setAuthSession(session) {
  if (!session || !session.userId) {
    clearSession();
    return;
  }
  const normalizedId = normalizeEmail(session.userId);
  const normalized = {
    userId: normalizedId,
    email: session.email || normalizedId,
    remoteId: session.remoteId || null,
    accessToken: session.accessToken || null,
    refreshToken: session.refreshToken || null,
    expiresAt: typeof session.expiresAt === "number" ? session.expiresAt : null,
  };
  state.authSession = normalized.accessToken ? normalized : null;
  saveSession(normalizedId, normalized);
}

function getUserStorageKey(userId) {
  return `${STORAGE_KEY}:${userId}`;
}

function clearLegacyKeys() {
  localStorage.removeItem(STORAGE_KEY);
  LEGACY_STORAGE_KEYS.forEach((legacyKey) => {
    localStorage.removeItem(legacyKey);
  });
}

function ensureDataMeta(data) {
  if (!data.meta || typeof data.meta !== "object") {
    data.meta = {};
  }
  if (!data.meta.updatedAt) {
    data.meta.updatedAt = new Date().toISOString();
  }
}

function touchData(data) {
  ensureDataMeta(data);
  data.meta.updatedAt = new Date().toISOString();
}

function getDataTimestamp(data) {
  if (!data || !data.meta || !data.meta.updatedAt) {
    return null;
  }
  const date = new Date(data.meta.updatedAt);
  return Number.isNaN(date.getTime()) ? null : date;
}

function hasMeaningfulData(data) {
  if (!data || typeof data !== "object") {
    return false;
  }
  const hasHabits = Array.isArray(data.habits) && data.habits.length > 0;
  const hasEntries =
    data.entries &&
    typeof data.entries === "object" &&
    Object.values(data.entries).some((habitEntries) => {
      return (
        habitEntries &&
        typeof habitEntries === "object" &&
        Object.keys(habitEntries).length > 0
      );
    });
  const hasTodos = Array.isArray(data.todos) && data.todos.length > 0;
  return hasHabits || hasEntries || hasTodos;
}

function loadUserData(userId) {
  if (!userId) {
    return createSeedData();
  }
  try {
    let sourceKey = getUserStorageKey(userId);
    let stored = localStorage.getItem(sourceKey);
    if (!stored) {
      const legacyKeys = [STORAGE_KEY, ...LEGACY_STORAGE_KEYS];
      for (const legacyKey of legacyKeys) {
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
      persistUserData(userId, seed, { skipTouch: true });
      return seed;
    }

    const parsed = JSON.parse(stored);
    const normalized = migrateData(parsed);
    persistUserData(userId, normalized, { skipTouch: true });
    if (sourceKey !== getUserStorageKey(userId)) {
      clearLegacyKeys();
    }
    return normalized;
  } catch (error) {
    console.warn("Failed to parse stored data, resetting", error);
    const seed = createSeedData();
    persistUserData(userId, seed, { skipTouch: true });
    return seed;
  }
}

function persistUserData(userId, data, options = {}) {
  if (!userId || !data) {
    return;
  }
  const { skipTouch = false } = options;
  if (skipTouch) {
    ensureDataMeta(data);
  } else {
    touchData(data);
  }
  try {
    localStorage.setItem(getUserStorageKey(userId), JSON.stringify(data));
  } catch (error) {
    console.warn("Failed to persist tracker data", error);
  }
}

function saveData() {
  if (!state.isAuthenticated || !state.currentUserId) {
    return;
  }
  touchData(state.data);
  persistUserData(state.currentUserId, state.data, { skipTouch: true });
  scheduleRemotePush();
}

function cancelRemotePush() {
  if (state.remoteSync.pushTimer) {
    clearTimeout(state.remoteSync.pushTimer);
    state.remoteSync.pushTimer = null;
  }
}

function scheduleRemotePush() {
  const account = getCurrentAccountRecord();
  if (!account || !isSyncEnabled(account)) {
    updateSyncStatus();
    return;
  }
  cancelRemotePush();
  state.remoteSync.pending = true;
  state.remoteSync.lastError = null;
  updateSyncStatus();
  state.remoteSync.pushTimer = setTimeout(async () => {
    state.remoteSync.pushTimer = null;
    try {
      await pushRemoteData(account);
    } catch (error) {
      console.error("Failed to sync data", error);
      state.remoteSync.pending = false;
      state.remoteSync.lastError = error && error.message ? error.message : String(error);
      updateSyncStatus();
    }
  }, REMOTE_PUSH_DEBOUNCE);
}

function stopRemoteSyncPolling() {
  state.remoteSync.shouldReconnect = false;
  if (state.remoteSync.pollTimer) {
    clearInterval(state.remoteSync.pollTimer);
    state.remoteSync.pollTimer = null;
  }
  clearRealtimeReconnectTimer();
  if (state.remoteSync.realtimeChannel) {
    const channel = state.remoteSync.realtimeChannel;
    state.remoteSync.realtimeChannel = null;
    try {
      const result = channel.unsubscribe();
      if (result && typeof result.catch === "function") {
        result.catch((error) => {
          console.warn("Failed to unsubscribe from realtime channel", error);
        });
      }
    } catch (error) {
      console.warn("Failed to unsubscribe from realtime channel", error);
    }
  } else {
    state.remoteSync.realtimeChannel = null;
  }
  state.remoteSync.realtimeRemoteId = null;
}

function startRemoteSyncPolling() {
  stopRemoteSyncPolling();
  state.remoteSync.shouldReconnect = true;
  subscribeToRealtimeChanges().catch((error) => {
    console.warn("Failed to subscribe to realtime updates", error);
    scheduleRealtimeReconnect(5000);
  });
}

function getRealtimeClient() {
  if (state.remoteSync.realtimeClient) {
    return state.remoteSync.realtimeClient;
  }
  const supabase = getSupabaseAccountConfig();
  if (!supabase || !supabase.url || !supabase.anonKey) {
    return null;
  }
  state.remoteSync.realtimeClient = createClient(supabase.url, supabase.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 5,
      },
    },
  });
  return state.remoteSync.realtimeClient;
}

function clearRealtimeReconnectTimer() {
  if (state.remoteSync.realtimeReconnectTimer) {
    clearTimeout(state.remoteSync.realtimeReconnectTimer);
    state.remoteSync.realtimeReconnectTimer = null;
  }
}

function scheduleRealtimeReconnect(delay = 2000) {
  clearRealtimeReconnectTimer();
  if (!state.remoteSync.shouldReconnect) {
    return;
  }
  state.remoteSync.realtimeReconnectTimer = setTimeout(() => {
    startRemoteSyncPolling();
  }, delay);
}

async function applyRealtimeAuth(session) {
  if (!session || !session.accessToken) {
    if (state.remoteSync.realtimeClient) {
      try {
        state.remoteSync.realtimeClient.realtime.setAuth(null);
      } catch (error) {
        console.warn("Failed to clear realtime auth", error);
      }
    }
    return null;
  }
  const client = getRealtimeClient();
  if (!client) {
    return null;
  }
  try {
    client.realtime.setAuth(session.accessToken);
  } catch (error) {
    console.warn("Failed to set realtime auth token", error);
  }
  if (session.refreshToken) {
    try {
      const { error } = await client.auth.setSession({
        access_token: session.accessToken,
        refresh_token: session.refreshToken,
      });
      if (error) {
        console.warn("Failed to persist realtime auth session", error);
      }
    } catch (error) {
      console.warn("Failed to persist realtime auth session", error);
    }
  }
  return client;
}

async function subscribeToRealtimeChanges() {
  const account = getCurrentAccountRecord();
  if (!isSyncEnabled(account)) {
    return;
  }
  const session = await ensureSupabaseSession();
  if (!session || !session.accessToken) {
    throw new Error("Supabase session required for realtime sync.");
  }
  const client = await applyRealtimeAuth(session);
  if (!client) {
    throw new Error("Unable to initialize realtime client.");
  }
  const remoteId = account.remoteId || account.id;
  if (!remoteId) {
    throw new Error("Missing remote identifier for realtime sync.");
  }
  const reconnectPreference = state.remoteSync.shouldReconnect;
  if (state.remoteSync.realtimeChannel) {
    state.remoteSync.shouldReconnect = false;
    try {
      await state.remoteSync.realtimeChannel.unsubscribe();
    } catch (error) {
      console.warn("Failed to clean up previous realtime channel", error);
    } finally {
      state.remoteSync.realtimeChannel = null;
      state.remoteSync.shouldReconnect = reconnectPreference;
    }
  }
  clearRealtimeReconnectTimer();
  state.remoteSync.realtimeRemoteId = remoteId;
  state.remoteSync.lastRemoteUpdate = null;
  const filter = `user_id=eq.${remoteId}`;
  const channel = client
    .channel(`tracker-profiles-${remoteId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: SUPABASE_DATA_TABLE, filter },
      (payload) => {
        handleRealtimeChange(payload);
      }
    );
  state.remoteSync.realtimeChannel = channel;
  const { error } = await channel.subscribe((status) => {
    if (channel !== state.remoteSync.realtimeChannel) {
      return;
    }
    if (!state.remoteSync.shouldReconnect) {
      return;
    }
    if (status === "SUBSCRIBED") {
      performSync({ forcePush: false }).catch((syncError) => {
        console.warn("Realtime resync failed", syncError);
      });
    }
    if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
      scheduleRealtimeReconnect();
    }
    if (status === "CLOSED") {
      scheduleRealtimeReconnect(4000);
    }
  });
  if (error) {
    scheduleRealtimeReconnect();
    if (state.remoteSync.realtimeChannel === channel) {
      state.remoteSync.realtimeChannel = null;
    }
    throw error;
  }
}

function handleRealtimeChange(payload) {
  const account = getCurrentAccountRecord();
  if (!isSyncEnabled(account)) {
    return;
  }
  const newRecord = payload && payload.new ? payload.new : null;
  const updatedAtIso = newRecord && newRecord.updated_at ? newRecord.updated_at : null;
  if (updatedAtIso) {
    if (state.remoteSync.lastRemoteUpdate && updatedAtIso <= state.remoteSync.lastRemoteUpdate) {
      return;
    }
    const remoteTimestamp = new Date(updatedAtIso);
    const localTimestamp = getDataTimestamp(state.data);
    if (localTimestamp && remoteTimestamp <= localTimestamp) {
      state.remoteSync.lastRemoteUpdate = updatedAtIso;
      return;
    }
    state.remoteSync.lastRemoteUpdate = updatedAtIso;
  }
  performSync({ forcePush: false })
    .then(() => {
      render();
    })
    .catch((error) => {
      console.warn("Realtime sync failed", error);
    });
}

async function hashPassword(password) {
  if (typeof password !== "string") {
    return "";
  }
  const input = password.normalize();
  if (globalThis.crypto && globalThis.crypto.subtle && typeof globalThis.crypto.subtle.digest === "function") {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }
  return simpleHash(input);
}

function simpleHash(value) {
  let hash = 0;
  if (!value) {
    return "";
  }
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return hash.toString(16);
}

function getCurrentAccountRecord() {
  if (!state.currentUserId) {
    return null;
  }
  return state.accountStore.users[state.currentUserId] || null;
}

function resetRemoteSyncState() {
  cancelRemotePush();
  stopRemoteSyncPolling();
  state.remoteSync.pending = false;
  state.remoteSync.lastError = null;
  state.remoteSync.lastSyncedAt = null;
  state.remoteSync.inFlight = null;
  state.remoteSync.lastRemoteUpdate = null;
  state.remoteSync.shouldReconnect = false;
}

function isSyncEnabled(account) {
  if (!account || !account.sync) {
    return false;
  }
  if (!account.sync.enabled || account.sync.provider !== "supabase") {
    return false;
  }
  const supabase = account.sync.supabase || {};
  return Boolean(supabase.url && supabase.anonKey && supabase.table);
}

function setAuthMode(mode) {
  state.authMode = mode === "register" ? "register" : "signIn";
  const isRegister = state.authMode === "register";
  if (elements.signInForm) {
    elements.signInForm.classList.toggle("is-hidden", isRegister);
  }
  if (elements.registerForm) {
    elements.registerForm.classList.toggle("is-hidden", !isRegister);
  }
  if (elements.showRegister) {
    elements.showRegister.classList.toggle("is-hidden", isRegister);
  }
  if (elements.showSignIn) {
    elements.showSignIn.classList.toggle("is-hidden", !isRegister);
  }
  updateAuthSubtitle();
  clearAuthError();
}

function updateAuthSubtitle() {
  if (!elements.authSubtitle) {
    return;
  }
  const isRegister = state.authMode === "register";
  elements.authSubtitle.textContent = isRegister
    ? "Create an account to start tracking everywhere."
    : "Sign in to access your habits on any device.";
}

function setAuthError(message) {
  if (elements.authError) {
    elements.authError.textContent = message || "";
  }
}

function clearAuthError() {
  if (elements.authError) {
    elements.authError.textContent = "";
  }
}

function showAuthGate() {
  if (elements.authGate) {
    elements.authGate.classList.remove("is-hidden");
  }
  if (elements.appShell) {
    elements.appShell.classList.add("is-hidden");
  }
  setAuthMode(state.authMode);
}

function hideAuthGate() {
  if (elements.authGate) {
    elements.authGate.classList.add("is-hidden");
  }
  if (elements.appShell) {
    elements.appShell.classList.remove("is-hidden");
  }
}

function resetUiState(referenceDate = new Date()) {
  const anchorDate = new Date(referenceDate);
  state.viewAnchors = createInitialAnchors(anchorDate);
  updateSelectedDate(formatISO(anchorDate));
  state.selectedCalendarMonth = startOfMonth(anchorDate);
  state.selectedHabitId = null;
  state.searchTerm = "";
  state.habitEditing = null;
  state.libraryFilter = "active";
  state.heatmapSettingsHabit = null;
  state.lastLoggedHabit = null;
  state.lastToggledTodo = null;
}

function updateAccountBar() {
  const account = getCurrentAccountRecord();
  if (elements.accountChip) {
    if (account) {
      elements.accountChip.removeAttribute("hidden");
      const email = account.email || account.id || "";
      const initial = email ? email.charAt(0).toUpperCase() : "?";
      if (elements.accountChipInitial) {
        elements.accountChipInitial.textContent = initial;
      }
      if (elements.accountChipEmail) {
        elements.accountChipEmail.textContent = email;
      }
      elements.accountChip.setAttribute(
        "aria-label",
        email ? `Manage account for ${email}` : "Manage account"
      );
    } else {
      elements.accountChip.setAttribute("hidden", "hidden");
    }
  }
}

function formatTimeAgo(iso) {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  if (Math.abs(diffMinutes) < 1) {
    return "just now";
  }
  if (Math.abs(diffMinutes) < 60) {
    return relativeTimeFormatter.format(diffMinutes, "minute");
  }
  const diffHours = Math.round(diffMs / 3600000);
  if (Math.abs(diffHours) < 24) {
    return relativeTimeFormatter.format(diffHours, "hour");
  }
  const diffDays = Math.round(diffMs / 86400000);
  return relativeTimeFormatter.format(diffDays, "day");
}

function updateSyncStatus() {
  if (!elements.syncStatus) {
    return;
  }
  if (!state.isAuthenticated) {
    elements.syncStatus.textContent = "";
    return;
  }
  const account = getCurrentAccountRecord();
  if (!isSyncEnabled(account)) {
    elements.syncStatus.textContent = "Local only";
    return;
  }
  if (!state.authSession || !state.authSession.accessToken) {
    elements.syncStatus.textContent = "Cloud auth required";
    return;
  }
  if (state.remoteSync.pending || state.remoteSync.pushTimer || state.remoteSync.inFlight) {
    elements.syncStatus.textContent = "Syncing…";
    return;
  }
  if (state.remoteSync.lastError) {
    elements.syncStatus.textContent = `Sync error: ${state.remoteSync.lastError}`;
    return;
  }
  if (state.remoteSync.lastSyncedAt) {
    elements.syncStatus.textContent = `Synced ${formatTimeAgo(state.remoteSync.lastSyncedAt)}`;
    return;
  }
  elements.syncStatus.textContent = "Cloud sync ready";
}

function sanitizeSupabaseUrl(url) {
  if (!url) {
    return "";
  }
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function getSupabaseAccountConfig() {
  if (!isSupabaseConfigured()) {
    return null;
  }
  return state.cloudSettings.supabase;
}

function createSupabaseHeaders(anonKey, accessToken) {
  const headers = {
    apikey: anonKey,
    Accept: "application/json",
  };
  headers.Authorization = `Bearer ${accessToken || anonKey}`;
  return headers;
}

function parseSupabaseErrorMessage(status, payload) {
  if (!payload) {
    return `Supabase error ${status}`;
  }
  if (typeof payload === "string") {
    return payload;
  }
  if (typeof payload.error_description === "string" && payload.error_description) {
    return payload.error_description;
  }
  if (typeof payload.error === "string" && payload.error) {
    return payload.error;
  }
  if (typeof payload.message === "string" && payload.message) {
    return payload.message;
  }
  if (typeof payload.msg === "string" && payload.msg) {
    return payload.msg;
  }
  return `Supabase error ${status}`;
}

async function readSupabaseResponse(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
}

function computeSessionExpiry(expiresIn) {
  if (!Number.isFinite(expiresIn)) {
    return Date.now() + SESSION_FALLBACK_TTL;
  }
  const buffer = Math.max(0, expiresIn * 1000 - SESSION_EXPIRY_BUFFER);
  if (buffer <= 0) {
    return Date.now() + SESSION_REFRESH_THRESHOLD;
  }
  return Date.now() + buffer;
}

function normalizeSupabaseSessionPayload(payload, fallbackEmail, previous = null) {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const user = payload.user && typeof payload.user === "object" ? payload.user : {};
  const rawEmail =
    (typeof user.email === "string" && user.email) ||
    (typeof fallbackEmail === "string" && fallbackEmail) ||
    (previous && previous.email) ||
    null;
  const normalizedEmail = rawEmail ? normalizeEmail(rawEmail) : previous ? previous.userId : null;
  if (!normalizedEmail) {
    return null;
  }
  const accessToken = typeof payload.access_token === "string" ? payload.access_token : null;
  const refreshToken =
    typeof payload.refresh_token === "string"
      ? payload.refresh_token
      : previous && typeof previous.refreshToken === "string"
      ? previous.refreshToken
      : null;
  const expiresInRaw =
    typeof payload.expires_in === "number"
      ? payload.expires_in
      : typeof payload.expires_in === "string"
      ? Number.parseFloat(payload.expires_in)
      : null;
  const remoteId =
    (typeof user.id === "string" && user.id) ||
    (typeof user.sub === "string" && user.sub) ||
    (previous && previous.remoteId) ||
    null;
  let expiresAt =
    typeof expiresInRaw === "number" && Number.isFinite(expiresInRaw)
      ? computeSessionExpiry(expiresInRaw)
      : previous && typeof previous.expiresAt === "number"
      ? previous.expiresAt
      : null;
  if (accessToken && !expiresAt) {
    expiresAt = Date.now() + SESSION_FALLBACK_TTL;
  }
  return {
    userId: normalizedEmail,
    email: rawEmail || (previous && previous.email) || normalizedEmail,
    remoteId,
    accessToken,
    refreshToken,
    expiresAt,
  };
}

async function supabaseSignIn(email, password) {
  const supabase = getSupabaseAccountConfig();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }
  const baseUrl = sanitizeSupabaseUrl(supabase.url);
  const target = `${baseUrl}/auth/v1/token?grant_type=password`;
  const response = await fetch(target, {
    method: "POST",
    headers: {
      apikey: supabase.anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  const payload = await readSupabaseResponse(response);
  if (!response.ok) {
    throw new Error(parseSupabaseErrorMessage(response.status, payload));
  }
  const session = normalizeSupabaseSessionPayload(payload, email);
  if (!session || !session.accessToken) {
    throw new Error("Supabase did not return an access token. Confirm your email and try again.");
  }
  return session;
}

async function supabaseSignUp(email, password) {
  const supabase = getSupabaseAccountConfig();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }
  const baseUrl = sanitizeSupabaseUrl(supabase.url);
  const target = `${baseUrl}/auth/v1/signup`;
  const response = await fetch(target, {
    method: "POST",
    headers: {
      apikey: supabase.anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  const payload = await readSupabaseResponse(response);
  if (!response.ok) {
    throw new Error(parseSupabaseErrorMessage(response.status, payload));
  }
  let session = normalizeSupabaseSessionPayload(payload, email);
  if (!session || !session.accessToken) {
    try {
      session = await supabaseSignIn(email, password);
    } catch (error) {
      const message =
        (payload && typeof payload === "object" && payload.message) ||
        "Check your email to confirm the account before signing in.";
      throw new Error(message);
    }
  }
  return session;
}

async function refreshSupabaseSession(refreshToken, previous) {
  const supabase = getSupabaseAccountConfig();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }
  if (!refreshToken) {
    throw new Error("Missing refresh token");
  }
  const baseUrl = sanitizeSupabaseUrl(supabase.url);
  const target = `${baseUrl}/auth/v1/token?grant_type=refresh_token`;
  const response = await fetch(target, {
    method: "POST",
    headers: {
      apikey: supabase.anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  const payload = await readSupabaseResponse(response);
  if (!response.ok) {
    throw new Error(parseSupabaseErrorMessage(response.status, payload));
  }
  const session = normalizeSupabaseSessionPayload(payload, previous ? previous.email : null, previous);
  if (!session || !session.accessToken) {
    throw new Error("Unable to refresh Supabase session.");
  }
  return session;
}

async function ensureSupabaseSession() {
  if (!state.authSession || !state.authSession.accessToken) {
    return state.authSession || null;
  }
  if (!state.authSession.expiresAt) {
    return state.authSession;
  }
  const now = Date.now();
  if (state.authSession.expiresAt - now > SESSION_REFRESH_THRESHOLD) {
    return state.authSession;
  }
  if (!state.authSession.refreshToken) {
    return state.authSession;
  }
  try {
    const refreshed = await refreshSupabaseSession(state.authSession.refreshToken, state.authSession);
    state.authSession = refreshed;
    saveSession(refreshed.userId, refreshed);
    if (state.remoteSync.realtimeChannel || state.remoteSync.realtimeReconnectTimer) {
      await applyRealtimeAuth(refreshed);
    }
    return refreshed;
  } catch (error) {
    console.warn("Failed to refresh Supabase session", error);
    return state.authSession;
  }
}

async function fetchRemoteAccount(session) {
  const supabase = getSupabaseAccountConfig();
  if (!supabase || !session || !session.remoteId) {
    return null;
  }
  const baseUrl = sanitizeSupabaseUrl(supabase.url);
  const target = `${baseUrl}/rest/v1/${supabase.accountsTable}?select=user_id,email,password_hash,sync_settings,created_at,updated_at&user_id=eq.${encodeURIComponent(
    session.remoteId
  )}`;
  const response = await fetch(target, {
    headers: createSupabaseHeaders(supabase.anonKey, session.accessToken),
  });
  const payload = await readSupabaseResponse(response);
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(parseSupabaseErrorMessage(response.status, payload));
  }
  if (!payload || !Array.isArray(payload) || payload.length === 0) {
    return null;
  }
  const record = payload[0];
  let syncPayload = {};
  if (record.sync_settings) {
    if (typeof record.sync_settings === "string") {
      try {
        syncPayload = JSON.parse(record.sync_settings);
      } catch (error) {
        console.warn("Failed to parse remote sync settings", error);
        syncPayload = {};
      }
    } else if (typeof record.sync_settings === "object") {
      syncPayload = record.sync_settings;
    }
  }
  const normalizedEmail = normalizeEmail(record.email || session.email || session.userId);
  const syncSettings = normalizeSyncSettings({
    enabled: true,
    provider: "supabase",
    supabase: {
      url:
        syncPayload.supabase && syncPayload.supabase.url
          ? syncPayload.supabase.url
          : supabase.url,
      anonKey:
        syncPayload.supabase && syncPayload.supabase.anonKey
          ? syncPayload.supabase.anonKey
          : supabase.anonKey,
      table:
        syncPayload.supabase && syncPayload.supabase.table
          ? syncPayload.supabase.table
          : supabase.dataTable || DEFAULT_SYNC_SETTINGS.supabase.table,
    },
  });
  return {
    id: normalizedEmail,
    email: record.email || session.email || normalizedEmail,
    passwordHash: record.password_hash || "",
    createdAt: record.created_at || null,
    lastLoginAt: record.updated_at || null,
    remoteId: record.user_id || session.remoteId,
    sync: syncSettings,
  };
}

async function upsertRemoteAccount(account, session) {
  const supabase = getSupabaseAccountConfig();
  if (!supabase || !session || !session.accessToken) {
    return;
  }
  const baseUrl = sanitizeSupabaseUrl(supabase.url);
  const target = `${baseUrl}/rest/v1/${supabase.accountsTable}`;
  const payload = {
    user_id: session.remoteId || account.remoteId || account.id,
    email: account.email || account.id,
    password_hash: account.passwordHash,
    sync_settings: {
      enabled: account.sync.enabled,
      provider: account.sync.provider,
      supabase: account.sync.supabase,
    },
  };
  if (account.createdAt) {
    payload.created_at = account.createdAt;
  }
  const response = await fetch(target, {
    method: "POST",
    headers: {
      ...createSupabaseHeaders(supabase.anonKey, session.accessToken),
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(payload),
  });
  const result = await readSupabaseResponse(response);
  if (!response.ok) {
    throw new Error(parseSupabaseErrorMessage(response.status, result));
  }
}


async function pullRemoteData(account, session = null) {
  if (!isSyncEnabled(account)) {
    return null;
  }
  const activeSession = session || (await ensureSupabaseSession());
  if (!activeSession || !activeSession.accessToken) {
    throw new Error("Supabase session required for syncing.");
  }
  const supabase = account.sync.supabase || {};
  const remoteId = account.remoteId || account.id;
  const baseUrl = sanitizeSupabaseUrl(supabase.url);
  const requestUrl = `${baseUrl}/rest/v1/${supabase.table}?select=user_id,data,updated_at&user_id=eq.${encodeURIComponent(
    remoteId
  )}`;
  const response = await fetch(requestUrl, {
    headers: createSupabaseHeaders(supabase.anonKey, activeSession.accessToken),
  });
  const payload = await readSupabaseResponse(response);
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(parseSupabaseErrorMessage(response.status, payload));
  }
  if (!payload || !Array.isArray(payload) || payload.length === 0) {
    return null;
  }
  const record = payload[0];
  let data = record.data;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch (error) {
      console.warn("Failed to parse remote payload", error);
      data = null;
    }
  }
  return {
    data,
    updatedAt: record.updated_at || null,
  };
}

async function pushRemoteData(account, session = null) {
  if (!isSyncEnabled(account)) {
    return;
  }
  const activeSession = session || (await ensureSupabaseSession());
  if (!activeSession || !activeSession.accessToken) {
    throw new Error("Supabase session required for syncing.");
  }
  const supabase = account.sync.supabase || {};
  const remoteId = account.remoteId || account.id;
  const baseUrl = sanitizeSupabaseUrl(supabase.url);
  const target = `${baseUrl}/rest/v1/${supabase.table}`;
  touchData(state.data);
  persistUserData(account.id, state.data, { skipTouch: true });
  const payload = {
    user_id: remoteId,
    data: state.data,
    updated_at: state.data.meta ? state.data.meta.updatedAt : new Date().toISOString(),
  };
  const response = await fetch(target, {
    method: "POST",
    headers: {
      ...createSupabaseHeaders(supabase.anonKey, activeSession.accessToken),
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(payload),
  });
  const body = await readSupabaseResponse(response);
  if (!response.ok) {
    throw new Error(parseSupabaseErrorMessage(response.status, body));
  }
  if (Array.isArray(body) && body[0] && body[0].updated_at) {
    state.remoteSync.lastSyncedAt = body[0].updated_at;
  } else {
    state.remoteSync.lastSyncedAt = payload.updated_at;
  }
  state.remoteSync.pending = false;
  state.remoteSync.lastError = null;
  updateSyncStatus();
}

function runSyncPromise(promise) {
  state.remoteSync.inFlight = promise.finally(() => {
    if (state.remoteSync.inFlight === promise) {
      state.remoteSync.inFlight = null;
    }
  });
  return promise;
}

async function performSync(options = {}) {
  const { forcePush = false } = options;
  const account = getCurrentAccountRecord();
  if (!isSyncEnabled(account)) {
    updateSyncStatus();
    return;
  }
  if (state.remoteSync.inFlight) {
    return state.remoteSync.inFlight;
  }
  cancelRemotePush();
  const syncPromise = (async () => {
    try {
      state.remoteSync.pending = true;
      state.remoteSync.lastError = null;
      updateSyncStatus();
      const activeSession = await ensureSupabaseSession();
      if (!activeSession || !activeSession.accessToken) {
        throw new Error("Supabase session required for syncing.");
      }
      const remote = await pullRemoteData(account, activeSession);
      let localTimestamp = getDataTimestamp(state.data);
      let localHasContent = hasMeaningfulData(state.data);
      let remoteTimestamp = null;
      let remoteHasContent = false;
      if (remote && remote.data) {
        const normalized = migrateData(remote.data);
        remoteHasContent = hasMeaningfulData(normalized);
        remoteTimestamp = getDataTimestamp(normalized) || (remote.updatedAt ? new Date(remote.updatedAt) : null);
        const shouldAdoptRemote =
          remoteHasContent && (!localHasContent || !localTimestamp || (remoteTimestamp && localTimestamp && remoteTimestamp > localTimestamp));
        if (shouldAdoptRemote) {
          state.data = normalized;
          persistUserData(account.id, state.data, { skipTouch: true });
          render();
          localTimestamp = getDataTimestamp(state.data);
          localHasContent = hasMeaningfulData(state.data);
        }
      }
      const shouldPush = (() => {
        if (forcePush) {
          return true;
        }
        if (!remote) {
          return localHasContent;
        }
        if (!remoteHasContent) {
          return localHasContent;
        }
        if (!localHasContent) {
          return false;
        }
        if (!remoteTimestamp) {
          return Boolean(localTimestamp);
        }
        if (!localTimestamp) {
          return false;
        }
        return localTimestamp > remoteTimestamp;
      })();
      if (shouldPush) {
        await pushRemoteData(account, activeSession);
      } else {
        state.remoteSync.pending = false;
        state.remoteSync.lastError = null;
        state.remoteSync.lastSyncedAt = remoteTimestamp
          ? remoteTimestamp.toISOString()
          : remote && remote.updatedAt
          ? remote.updatedAt
          : state.remoteSync.lastSyncedAt;
        updateSyncStatus();
      }
    } catch (error) {
      state.remoteSync.pending = false;
      state.remoteSync.lastError = error && error.message ? error.message : String(error);
      updateSyncStatus();
      throw error;
    }
  })();
  return runSyncPromise(syncPromise);
}

async function completeSignIn(userId, options = {}) {
  const { skipSync = false, session = null } = options;
  const normalizedId = normalizeEmail(userId);
  const account = state.accountStore.users[normalizedId];
  if (!account) {
    throw new Error("Account not found");
  }
  state.currentUserId = normalizedId;
  state.isAuthenticated = true;
  state.selectionGlowActive = true;
  state.legendColors = [];
  resetRemoteSyncState();
  resetUiState(new Date());
  state.data = loadUserData(normalizedId);
  if (session && session.remoteId) {
    account.remoteId = session.remoteId;
  } else if (!account.remoteId) {
    account.remoteId = normalizedId;
  }
  account.lastLoginAt = new Date().toISOString();
  saveAccountStore(state.accountStore);
  if (session) {
    const normalizedSession = {
      userId: normalizedId,
      email: account.email,
      remoteId: account.remoteId,
      accessToken: session.accessToken || null,
      refreshToken: session.refreshToken || null,
      expiresAt: session.expiresAt || null,
    };
    setAuthSession(normalizedSession);
  } else {
    state.authSession = null;
    saveSession(normalizedId, null);
  }
  hideAuthGate();
  clearAuthError();
  triggerSelectionGlow();
  render();
  updateAccountBar();
  updateSyncStatus();
  if (!skipSync && isSyncEnabled(account)) {
    try {
      await performSync({ forcePush: false });
      render();
    } catch (error) {
      console.warn("Initial sync failed", error);
    }
  }
  if (isSyncEnabled(account)) {
    startRemoteSyncPolling();
  }
}

function handleSignOut() {
  if (!state.isAuthenticated) {
    return;
  }
  closeAccountMenu();
  clearSession();
  resetRemoteSyncState();
  stopLegendAnimation();
  clearSelectionGlowTimer();
  state.isAuthenticated = false;
  state.currentUserId = null;
  state.data = createSeedData();
  resetUiState(new Date());
  showAuthGate();
  updateAccountBar();
  updateSyncStatus();
}

function resetAccountMenuFeedback() {
  if (elements.changePasswordError) {
    elements.changePasswordError.textContent = "";
  }
  if (elements.changePasswordSuccess) {
    elements.changePasswordSuccess.textContent = "";
  }
  if (elements.accountMenuError) {
    elements.accountMenuError.textContent = "";
  }
}

function openAccountMenu() {
  if (!elements.accountMenuDialog) {
    return;
  }
  resetAccountMenuFeedback();
  if (elements.changePasswordForm) {
    elements.changePasswordForm.reset();
  }
  elements.accountMenuDialog.showModal();
}

function closeAccountMenu() {
  if (!elements.accountMenuDialog) {
    return;
  }
  elements.accountMenuDialog.close();
}

async function handleChangePasswordSubmit(event) {
  event.preventDefault();
  resetAccountMenuFeedback();
  const account = getCurrentAccountRecord();
  if (!account) {
    if (elements.changePasswordError) {
      elements.changePasswordError.textContent = "No account is currently active.";
    }
    return;
  }
  const newPassword = elements.changePasswordNew ? elements.changePasswordNew.value : "";
  const confirmPassword = elements.changePasswordConfirm ? elements.changePasswordConfirm.value : "";
  if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
    if (elements.changePasswordError) {
      elements.changePasswordError.textContent = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    return;
  }
  if (newPassword !== confirmPassword) {
    if (elements.changePasswordError) {
      elements.changePasswordError.textContent = "Passwords do not match.";
    }
    return;
  }
  const submitButton = elements.changePasswordForm
    ? elements.changePasswordForm.querySelector('button[type="submit"]')
    : null;
  if (submitButton) {
    submitButton.disabled = true;
  }
  try {
    const session = await ensureSupabaseSession();
    if (!session || !session.accessToken) {
      throw new Error("Sign in again to update your password.");
    }
    const supabase = getSupabaseAccountConfig();
    if (!supabase) {
      throw new Error("Supabase is not configured.");
    }
    const baseUrl = sanitizeSupabaseUrl(supabase.url);
    const target = `${baseUrl}/auth/v1/user`;
    const response = await fetch(target, {
      method: "PATCH",
      headers: {
        ...createSupabaseHeaders(supabase.anonKey, session.accessToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: newPassword }),
    });
    const payload = await readSupabaseResponse(response);
    if (!response.ok) {
      throw new Error(parseSupabaseErrorMessage(response.status, payload));
    }
    const passwordHash = await hashPassword(newPassword);
    account.passwordHash = passwordHash;
    saveAccountStore(state.accountStore);
    if (elements.changePasswordForm) {
      elements.changePasswordForm.reset();
    }
    if (elements.changePasswordSuccess) {
      elements.changePasswordSuccess.textContent = "Password updated.";
    }
  } catch (error) {
    if (elements.changePasswordError) {
      elements.changePasswordError.textContent = error && error.message ? error.message : "Unable to update password.";
    }
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
    }
  }
}

async function handleDeleteAccountClick() {
  resetAccountMenuFeedback();
  const account = getCurrentAccountRecord();
  if (!account) {
    if (elements.accountMenuError) {
      elements.accountMenuError.textContent = "No account is currently active.";
    }
    return;
  }
  const confirmed = window.confirm(
    "Deleting your account removes all saved habits across devices. This cannot be undone."
  );
  if (!confirmed) {
    return;
  }
  const deleteButton = elements.deleteAccountButton || null;
  if (deleteButton) {
    deleteButton.disabled = true;
  }
  try {
    const session = await ensureSupabaseSession();
    if (!session || !session.accessToken) {
      throw new Error("Sign in again to delete your account.");
    }
    const supabase = getSupabaseAccountConfig();
    if (!supabase) {
      throw new Error("Supabase is not configured.");
    }
    const baseUrl = sanitizeSupabaseUrl(supabase.url);
    const remoteId = session.remoteId || account.remoteId || account.id;
    const headers = createSupabaseHeaders(supabase.anonKey, session.accessToken);

    const profileResponse = await fetch(
      `${baseUrl}/rest/v1/${supabase.dataTable}?user_id=eq.${encodeURIComponent(remoteId)}`,
      {
        method: "DELETE",
        headers,
      }
    );
    if (!profileResponse.ok && profileResponse.status !== 404) {
      const payload = await readSupabaseResponse(profileResponse);
      throw new Error(parseSupabaseErrorMessage(profileResponse.status, payload));
    }

    const accountResponse = await fetch(
      `${baseUrl}/rest/v1/${supabase.accountsTable}?user_id=eq.${encodeURIComponent(remoteId)}`,
      {
        method: "DELETE",
        headers,
      }
    );
    if (!accountResponse.ok && accountResponse.status !== 404) {
      const payload = await readSupabaseResponse(accountResponse);
      throw new Error(parseSupabaseErrorMessage(accountResponse.status, payload));
    }

    const deleteResponse = await fetch(`${baseUrl}/auth/v1/user`, {
      method: "DELETE",
      headers,
    });
    if (!deleteResponse.ok) {
      const payload = await readSupabaseResponse(deleteResponse);
      throw new Error(parseSupabaseErrorMessage(deleteResponse.status, payload));
    }

    try {
      localStorage.removeItem(getUserStorageKey(account.id));
    } catch (storageError) {
      console.warn("Failed to remove local data for deleted account", storageError);
    }
    delete state.accountStore.users[account.id];
    saveAccountStore(state.accountStore);
    closeAccountMenu();
    handleSignOut();
  } catch (error) {
    if (elements.accountMenuError) {
      elements.accountMenuError.textContent = error && error.message ? error.message : "Unable to delete account.";
    }
  } finally {
    if (deleteButton) {
      deleteButton.disabled = false;
    }
  }
}

async function handleSignIn(event) {
  event.preventDefault();
  clearAuthError();
  const emailInput = elements.signInEmail ? elements.signInEmail.value : "";
  const email = normalizeEmail(emailInput);
  const password = elements.signInPassword ? elements.signInPassword.value : "";
  if (!email || !password) {
    setAuthError("Email and password are required.");
    return;
  }
  const passwordHash = await hashPassword(password);
  let account = state.accountStore.users[email] || null;
  let session = null;

  if (isSupabaseConfigured()) {
    try {
      session = await supabaseSignIn(emailInput.trim() || email, password);
    } catch (error) {
      setAuthError(error.message || "Unable to sign in with Supabase.");
      return;
    }
    try {
      const remoteAccount = await fetchRemoteAccount(session);
      if (remoteAccount) {
        remoteAccount.passwordHash = remoteAccount.passwordHash || passwordHash;
        remoteAccount.sync = normalizeSyncSettings(remoteAccount.sync);
        account = { ...(account || {}), ...remoteAccount };
      }
    } catch (error) {
      console.warn("Failed to load remote account", error);
    }
  }

  if (!account) {
    account = state.accountStore.users[email] || null;
  }

  if (!account) {
    setAuthError("Account not found.");
    return;
  }

  if (!session && account.passwordHash !== passwordHash) {
    setAuthError("Incorrect password.");
    return;
  }

  account.email = account.email || (emailInput.trim() || email);
  account.passwordHash = passwordHash;
  account.remoteId = session && session.remoteId ? session.remoteId : account.remoteId || email;
  account.sync = normalizeSyncSettings(account.sync);
  state.accountStore.users[email] = account;
  saveAccountStore(state.accountStore);

  if (session) {
    try {
      await upsertRemoteAccount(account, session);
    } catch (error) {
      console.warn("Failed to update remote account", error);
    }
  }

  await completeSignIn(email, { session, skipSync: !isSyncEnabled(account) });
  if (elements.signInForm) {
    elements.signInForm.reset();
  }
  if (elements.registerForm) {
    elements.registerForm.reset();
  }
}

async function handleRegister(event) {
  event.preventDefault();
  clearAuthError();
  const emailRaw = elements.registerEmail ? elements.registerEmail.value : "";
  const email = normalizeEmail(emailRaw);
  const password = elements.registerPassword ? elements.registerPassword.value : "";
  const confirm = elements.registerConfirm ? elements.registerConfirm.value : "";
  if (!email) {
    setAuthError("Email is required.");
    return;
  }
  if (state.accountStore.users[email]) {
    setAuthError("An account with this email already exists.");
    return;
  }
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    setAuthError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    return;
  }
  if (password !== confirm) {
    setAuthError("Passwords do not match.");
    return;
  }
  const passwordHash = await hashPassword(password);
  const syncSettings = deriveAccountSyncSettings();
  let session = null;
  if (isSupabaseConfigured()) {
    try {
      session = await supabaseSignUp(emailRaw.trim() || email, password);
    } catch (error) {
      setAuthError(error.message || "Unable to create cloud account.");
      return;
    }
  }
  const record = {
    id: email,
    email: emailRaw.trim() || email,
    passwordHash,
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
    sync: syncSettings,
    remoteId: session && session.remoteId ? session.remoteId : email,
  };
  state.accountStore.users[email] = record;
  saveAccountStore(state.accountStore);
  if (session) {
    try {
      await upsertRemoteAccount(record, session);
    } catch (error) {
      console.warn("Failed to persist remote account", error);
      delete state.accountStore.users[email];
      saveAccountStore(state.accountStore);
      setAuthError(`Unable to create cloud account: ${error.message || String(error)}`);
      return;
    }
  }
  await completeSignIn(email, { skipSync: !isSyncEnabled(record), session });
  if (elements.registerForm) {
    elements.registerForm.reset();
  }
  if (elements.signInForm) {
    elements.signInForm.reset();
  }
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

function clearSelectionGlowTimer() {
  if (state.selectionGlowTimer) {
    clearTimeout(state.selectionGlowTimer);
    state.selectionGlowTimer = null;
  }
}

function applySelectionGlowState() {
  const cells = document.querySelectorAll(
    ".calendar-cell.is-selected, .selected-calendar-cell.is-selected"
  );
  cells.forEach((cell) => {
    if (state.selectionGlowActive) {
      cell.classList.add("has-glow");
    } else {
      cell.classList.remove("has-glow");
    }
  });
}

function triggerSelectionGlow() {
  state.selectionGlowActive = true;
  clearSelectionGlowTimer();
  applySelectionGlowState();
  state.selectionGlowTimer = setTimeout(() => {
    state.selectionGlowActive = false;
    state.selectionGlowTimer = null;
    applySelectionGlowState();
  }, SELECTION_GLOW_DURATION);
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
    meta: { updatedAt: new Date().toISOString() },
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

  if (!next.meta || typeof next.meta !== "object") {
    next.meta = { updatedAt: new Date().toISOString() };
  } else if (!next.meta.updatedAt) {
    next.meta.updatedAt = new Date().toISOString();
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
    cloned.hideFuture = Boolean(cloned.hideFuture);
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

function reorderHabits(sourceId, targetId, beforeTarget) {
  if (!sourceId || sourceId === targetId) {
    return;
  }
  const habits = state.data.habits;
  const fromIndex = habits.findIndex((item) => item.id === sourceId);
  if (fromIndex === -1) {
    return;
  }
  const [moved] = habits.splice(fromIndex, 1);
  let toIndex = habits.findIndex((item) => item.id === targetId);
  if (toIndex === -1) {
    toIndex = habits.length;
  }
  if (!beforeTarget) {
    toIndex += 1;
  }
  if (toIndex < 0) {
    toIndex = 0;
  }
  if (toIndex > habits.length) {
    toIndex = habits.length;
  }
  habits.splice(toIndex, 0, moved);
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
  const selectedRaw = parseISO(state.selectedDate);
  const hasValidSelected = selectedRaw instanceof Date && !Number.isNaN(selectedRaw.getTime());
  const selected = hasValidSelected
    ? new Date(selectedRaw.getFullYear(), selectedRaw.getMonth(), selectedRaw.getDate())
    : null;

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

    if (!habit || !hasValidSelected || !selected) {
      return buildFallback();
    }

    const windowStart = addDays(selected, -364);
    const earliestCompletion = findEarliestCompletionDateInRange(
      habit,
      windowStart,
      selected
    );

    const minStart = addDays(selected, -(totalCells - 1));
    let startDate = earliestCompletion ? new Date(earliestCompletion) : new Date(minStart);
    if (startDate.getTime() < minStart.getTime()) {
      startDate = new Date(minStart);
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

  if (view === "week") {
    const totalWeeks =
      config.weeks || Math.max(1, (config.columns || 1) * (config.rows || 1));

    const buildFallback = () => {
      const fallbackDates = [];
      for (let index = 0; index < totalWeeks; index += 1) {
        fallbackDates.push(addDays(new Date(anchor), index * 7));
      }
      return createCalendarMatrixFromDates(
        fallbackDates,
        config.columns,
        config.rows,
        config.gridSize
      );
    };

    if (!habit || !hasValidSelected || !selected) {
      return buildFallback();
    }

    const selectedWeekStart = startOfWeek(selected);
    const minStart = addDays(selectedWeekStart, -7 * (totalWeeks - 1));
    const earliestCompletion = findEarliestCompletionDateInRange(
      habit,
      minStart,
      selected
    );
    let startDate = earliestCompletion
      ? startOfWeek(new Date(earliestCompletion))
      : new Date(minStart);
    if (startDate.getTime() < minStart.getTime()) {
      startDate = new Date(minStart);
    }

    const maxWindowEnd = addDays(selectedWeekStart, 7 * (totalWeeks - 1));
    const dates = [];
    for (let index = 0; index < totalWeeks; index += 1) {
      const current = addDays(startDate, index * 7);
      if (current > maxWindowEnd) {
        dates.push(null);
      } else {
        dates.push(new Date(current));
      }
    }

    return createCalendarMatrixFromDates(dates, config.columns, config.rows, config.gridSize);
  }

  if (view === "weekDays") {
    const totalDays = (config.rows || 1) * (config.columns || 7);

    const buildFallback = () => {
      const start = startOfWeek(anchor);
      const fallbackDates = [];
      for (let index = 0; index < totalDays; index += 1) {
        fallbackDates.push(addDays(start, index));
      }
      return createCalendarMatrixFromDates(
        fallbackDates,
        config.columns,
        config.rows,
        config.gridSize
      );
    };

    if (!habit || !hasValidSelected || !selected) {
      return buildFallback();
    }

    const minStart = addDays(selected, -(totalDays - 1));
    const earliestCompletion = findEarliestCompletionDateInRange(habit, minStart, selected);
    let startDate = earliestCompletion ? new Date(earliestCompletion) : new Date(minStart);
    if (startDate.getTime() < minStart.getTime()) {
      startDate = new Date(minStart);
    }

    const maxWindowEnd = addDays(selected, totalDays - 1);
    const dates = [];
    for (let index = 0; index < totalDays; index += 1) {
      const current = addDays(startDate, index);
      if (current > maxWindowEnd) {
        dates.push(null);
      } else {
        dates.push(new Date(current));
      }
    }

    return createCalendarMatrixFromDates(dates, config.columns, config.rows, config.gridSize);
  }

  // Month view fallback
  const buildMonthFallback = () => {
    const start = startOfMonth(anchor);
    const monthIndex = start.getMonth();
    const year = start.getFullYear();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const fallbackDates = [];
    for (let day = 1; day <= daysInMonth; day += 1) {
      fallbackDates.push(new Date(year, monthIndex, day));
    }
    const rows = config.rows || Math.ceil(fallbackDates.length / (config.columns || 1));
    return createCalendarMatrixFromDates(fallbackDates, config.columns, rows, config.gridSize);
  };

  if (!habit || !hasValidSelected || !selected) {
    return buildMonthFallback();
  }

  const daysInView = getTotalDaysForView(selected, "month");
  const minStart = addDays(selected, -(daysInView - 1));
  const earliestCompletion = findEarliestCompletionDateInRange(habit, minStart, selected);
  let startDate = earliestCompletion ? new Date(earliestCompletion) : new Date(minStart);
  if (startDate.getTime() < minStart.getTime()) {
    startDate = new Date(minStart);
  }

  const maxWindowEnd = addDays(selected, daysInView - 1);
  const dates = [];
  for (let index = 0; index < daysInView; index += 1) {
    const current = addDays(startDate, index);
    if (current > maxWindowEnd) {
      dates.push(null);
    } else {
      dates.push(new Date(current));
    }
  }

  const rows = config.rows || Math.ceil(dates.length / (config.columns || 1));
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

function uniqueHabitColors(habits) {
  const seen = new Set();
  const colors = [];
  habits.forEach((habit) => {
    if (!habit) return;
    const rawColor = typeof habit.color === "string" && habit.color.trim()
      ? habit.color.trim().toLowerCase()
      : varFallbackColor();
    if (!seen.has(rawColor)) {
      seen.add(rawColor);
      colors.push(rawColor);
    }
  });
  return colors;
}

function colorsMatch(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((value, index) => value === b[index]);
}

function applyLegendColor(color) {
  const resolved = color || varFallbackColor();
  document.documentElement.style.setProperty("--active-habit-color", resolved);
  [1, 2, 3, 4].forEach((level) => {
    document.documentElement.style.setProperty(
      `--legend-shade-${level}`,
      shadeForIntensity(resolved, level)
    );
    document.documentElement.style.setProperty(
      `--legend-border-${level}`,
      borderForIntensity(resolved, level)
    );
  });
}

function stopLegendAnimation() {
  if (state.legendAnimationTimer) {
    clearInterval(state.legendAnimationTimer);
    state.legendAnimationTimer = null;
  }
}

function startLegendAnimation(colors) {
  stopLegendAnimation();
  state.legendColors = colors.slice();
  state.legendColorIndex = 0;
  applyLegendColor(state.legendColors[0] || varFallbackColor());
  if (state.legendColors.length > 1) {
    state.legendAnimationTimer = setInterval(() => {
      state.legendColorIndex =
        (state.legendColorIndex + 1) % state.legendColors.length;
      const nextColor = state.legendColors[state.legendColorIndex];
      applyLegendColor(nextColor);
    }, LEGEND_CYCLE_INTERVAL);
  }
}

function syncLegendAnimation(habits) {
  const colors = uniqueHabitColors(habits);
  if (colors.length === 0) {
    stopLegendAnimation();
    state.legendColors = [];
    state.legendColorIndex = 0;
    applyLegendColor(varFallbackColor());
    return;
  }

  const colorsChanged = !colorsMatch(colors, state.legendColors);

  if (colorsChanged) {
    startLegendAnimation(colors);
    return;
  }

  if (state.legendColorIndex >= colors.length) {
    state.legendColorIndex = 0;
  }

  if (colors.length === 1) {
    stopLegendAnimation();
  }

  applyLegendColor(colors[state.legendColorIndex] || colors[0]);
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
  triggerSelectionGlow();
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
      if (state.selectionGlowActive) {
        cell.classList.add("has-glow");
      }
    }

    cell.addEventListener("click", () => {
      updateSelectedDate(iso);
      triggerSelectionGlow();
      render();
    });

    cell.addEventListener("mouseenter", () => {
      if (iso === state.selectedDate) {
        triggerSelectionGlow();
      }
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
      triggerSelectionGlow();
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
          triggerSelectionGlow();
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
      triggerSelectionGlow();
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

    actions.append(edit, remove);
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
  syncLegendAnimation(active);
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
  const selectedDateObj = parseISO(selectedIso);
  const hasValidSelectedDate = !Number.isNaN(selectedDateObj.getTime());

  let currentRow = null;
  let currentRowView = null;

  active.forEach((habit) => {
    const view = getHabitView(habit);
    const hideFutureCells = Boolean(habit.hideFuture);

    if (!currentRow || currentRowView !== view) {
      currentRow = document.createElement("div");
      currentRow.className = "habit-view-row";
      currentRow.dataset.view = view;
      rows.appendChild(currentRow);
      currentRowView = view;
    }

    const habitBlock = document.createElement("div");
    habitBlock.className = "habit-calendar";
    habitBlock.dataset.habitId = habit.id;
    habitBlock.dataset.view = view;
    habitBlock.draggable = true;

    const header = document.createElement("div");
    header.className = "habit-calendar-header";

    const dragHandle = document.createElement("button");
    dragHandle.type = "button";
    dragHandle.className = "habit-drag-handle";
    dragHandle.innerHTML = MOVE_ICON_SVG;
    dragHandle.setAttribute("aria-label", `Reorder ${habit.name}`);
    dragHandle.title = "Drag to reorder heatmap";
    dragHandle.addEventListener("mousedown", () => {
      state.dragHandleActive = habit.id;
    });
    dragHandle.addEventListener("touchstart", () => {
      state.dragHandleActive = habit.id;
    });
    dragHandle.addEventListener("mouseup", () => {
      state.dragHandleActive = null;
    });
    dragHandle.addEventListener("touchend", () => {
      state.dragHandleActive = null;
    });
    dragHandle.addEventListener("touchcancel", () => {
      state.dragHandleActive = null;
    });
    const label = document.createElement("button");
    label.className = "habit-pill";
    label.style.setProperty("--habit-color", habit.color || varFallbackColor());
    label.textContent = habit.name;
    label.setAttribute("aria-haspopup", "dialog");
    label.title = "Open heatmap settings";
    label.addEventListener("click", () => {
      openHeatmapSettings(habit);
    });

    const futureToggle = document.createElement("button");
    futureToggle.type = "button";
    futureToggle.className = "habit-visibility-toggle";
    futureToggle.classList.toggle("is-active", hideFutureCells);
    futureToggle.setAttribute(
      "aria-label",
      hideFutureCells
        ? `Show future days for ${habit.name}`
        : `Hide future days for ${habit.name}`
    );
    futureToggle.setAttribute(
      "aria-pressed",
      hideFutureCells ? "true" : "false"
    );
    futureToggle.title = hideFutureCells ? "Show future days" : "Hide future days";
    futureToggle.innerHTML = hideFutureCells ? EYE_CLOSED_ICON : EYE_OPEN_ICON;
    futureToggle.addEventListener("click", () => {
      habit.hideFuture = !Boolean(habit.hideFuture);
      saveData();
      render();
    });

    header.append(dragHandle, label, futureToggle);

    const cellsWrapper = document.createElement("div");
    cellsWrapper.className = "calendar-cells";

    habitBlock.addEventListener("dragstart", (event) => {
      if (state.dragHandleActive !== habit.id) {
        event.preventDefault();
        return;
      }
      state.draggingHabitId = habit.id;
      habitBlock.classList.add("is-dragging");
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", habit.id);
      }
    });

    habitBlock.addEventListener("dragend", () => {
      state.draggingHabitId = null;
      if (state.dragHandleActive === habit.id) {
        state.dragHandleActive = null;
      }
      habitBlock.classList.remove(
        "is-dragging",
        "drag-before",
        "drag-after",
        "drop-horizontal",
        "drop-vertical"
      );
    });

    habitBlock.addEventListener("dragover", (event) => {
      const draggingId = state.draggingHabitId;
      if (!draggingId || draggingId === habit.id) {
        return;
      }
      event.preventDefault();
      const rect = habitBlock.getBoundingClientRect();
      const container = habitBlock.parentElement || elements.calendarRows;
      const containerWidth = container ? container.clientWidth : rect.width;
      let gap = 0;
      if (container) {
        const containerStyles = window.getComputedStyle(container);
        const gapValue = containerStyles.columnGap || containerStyles.gap;
        if (gapValue) {
          gap = parseFloat(gapValue) || 0;
        }
      }
      const multiColumn = containerWidth >= rect.width * 2 + gap;
      const before = multiColumn
        ? event.clientX < rect.left + rect.width / 2
        : event.clientY < rect.top + rect.height / 2;
      habitBlock.classList.toggle("drop-horizontal", multiColumn);
      habitBlock.classList.toggle("drop-vertical", !multiColumn);
      habitBlock.classList.toggle("drag-before", before);
      habitBlock.classList.toggle("drag-after", !before);
    });

    habitBlock.addEventListener("dragleave", () => {
      habitBlock.classList.remove("drag-before", "drag-after", "drop-horizontal", "drop-vertical");
    });

    habitBlock.addEventListener("drop", (event) => {
      const draggingId = state.draggingHabitId;
      if (!draggingId || draggingId === habit.id) {
        return;
      }
      event.preventDefault();
      const rect = habitBlock.getBoundingClientRect();
      const container = habitBlock.parentElement || elements.calendarRows;
      const containerWidth = container ? container.clientWidth : rect.width;
      let gap = 0;
      if (container) {
        const containerStyles = window.getComputedStyle(container);
        const gapValue = containerStyles.columnGap || containerStyles.gap;
        if (gapValue) {
          gap = parseFloat(gapValue) || 0;
        }
      }
      const multiColumn = containerWidth >= rect.width * 2 + gap;
      const before = multiColumn
        ? event.clientX < rect.left + rect.width / 2
        : event.clientY < rect.top + rect.height / 2;
      habitBlock.classList.remove("drag-before", "drag-after", "drop-horizontal", "drop-vertical");
      state.draggingHabitId = null;
      state.dragHandleActive = null;
      reorderHabits(draggingId, habit.id, before);
      render();
    });

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
          if (hasValidSelectedDate && isDateInRange(selectedDateObj, weekStart, weekEnd)) {
            cell.classList.add("is-selected");
            if (state.selectionGlowActive) {
              cell.classList.add("has-glow");
            }
          }
          const isFutureWeek = weekStart > today;
          const weekContainsSelection =
            hasValidSelectedDate && isDateInRange(selectedDateObj, weekStart, weekEnd);
          if (isFutureWeek) {
            cell.classList.add("is-future");
            cell.disabled = true;
            if (hideFutureCells && !weekContainsSelection) {
              cell.classList.add("is-hidden-future");
              cell.setAttribute("aria-hidden", "true");
              cell.tabIndex = -1;
            }
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
            triggerSelectionGlow();
            render();
          });
          cell.addEventListener("mouseenter", () => {
            if (hasValidSelectedDate && isDateInRange(selectedDateObj, weekStart, weekEnd)) {
              triggerSelectionGlow();
            }
          });
        } else {
          const iso = formatISO(date);
          const isFutureDay = iso > todayIso;
          if (isFutureDay) {
            cell.classList.add("is-future");
            cell.disabled = true;
            const isSelectedDay = iso === selectedIso;
            if (hideFutureCells && !isSelectedDay) {
              cell.classList.add("is-hidden-future");
              cell.setAttribute("aria-hidden", "true");
              cell.tabIndex = -1;
            }
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
          if (iso === selectedIso) {
            cell.classList.add("is-selected");
            if (state.selectionGlowActive) {
              cell.classList.add("has-glow");
            }
          }

          const labelText = `${habit.name} on ${dayFormatter.format(date)}: ${progress.done}/${progress.total} checkpoints`;
          cell.setAttribute("aria-label", labelText);

          cell.addEventListener("click", () => {
            if (cell.disabled) {
              return;
            }
            state.selectedHabitId = habit.id;
            updateSelectedDate(iso);
            triggerSelectionGlow();
            render();
          });
          cell.addEventListener("mouseenter", () => {
            if (iso === state.selectedDate) {
              triggerSelectionGlow();
            }
          });
        }
        cellsWrapper.appendChild(cell);
      });
    });

    habitBlock.append(header, cellsWrapper);
    if (currentRow) {
      currentRow.appendChild(habitBlock);
    }
  });
}

function render() {
  if (!state.isAuthenticated) {
    return;
  }
  updateAccountBar();
  updateSyncStatus();
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
  applySelectionGlowState();
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

if (elements.signInForm) {
  elements.signInForm.addEventListener("submit", handleSignIn);
}

if (elements.registerForm) {
  elements.registerForm.addEventListener("submit", handleRegister);
}

if (elements.showRegister) {
  elements.showRegister.addEventListener("click", () => setAuthMode("register"));
}

if (elements.showSignIn) {
  elements.showSignIn.addEventListener("click", () => setAuthMode("signIn"));
}

if (elements.signOut) {
  elements.signOut.addEventListener("click", handleSignOut);
}

if (elements.accountChip) {
  elements.accountChip.addEventListener("click", openAccountMenu);
}

if (elements.accountMenuClose) {
  elements.accountMenuClose.addEventListener("click", () => {
    closeAccountMenu();
    resetAccountMenuFeedback();
  });
}

if (elements.accountMenuDialog) {
  elements.accountMenuDialog.addEventListener("close", () => {
    resetAccountMenuFeedback();
  });
}

if (elements.changePasswordForm) {
  elements.changePasswordForm.addEventListener("submit", handleChangePasswordSubmit);
}

if (elements.deleteAccountButton) {
  elements.deleteAccountButton.addEventListener("click", handleDeleteAccountClick);
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
      triggerSelectionGlow();
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
      hideFuture: false,
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
    triggerSelectionGlow();
    render();
  }
});

window.addEventListener("mouseup", () => {
  state.dragHandleActive = null;
});

window.addEventListener("touchend", () => {
  state.dragHandleActive = null;
});

window.addEventListener("touchcancel", () => {
  state.dragHandleActive = null;
});

window.addEventListener("beforeunload", () => {
  stopLegendAnimation();
  clearSelectionGlowTimer();
});

async function init() {
  showAuthGate();
  setAuthMode(state.authMode);
  updateAccountBar();
  updateSyncStatus();
  const storedSession = loadSession();
  let restoredSession = null;
  if (storedSession && storedSession.accessToken) {
    restoredSession = {
      userId: storedSession.userId,
      email: storedSession.email || storedSession.userId,
      remoteId:
        storedSession.remoteId ||
        (state.accountStore.users[storedSession.userId]
          ? state.accountStore.users[storedSession.userId].remoteId
          : null) ||
        storedSession.userId,
      accessToken: storedSession.accessToken,
      refreshToken: storedSession.refreshToken,
      expiresAt: storedSession.expiresAt,
    };
    state.authSession = restoredSession;
  }
  if (storedSession && storedSession.userId && state.accountStore.users[storedSession.userId]) {
    try {
      await completeSignIn(storedSession.userId, {
        session: restoredSession,
      });
    } catch (error) {
      console.warn("Failed to restore session", error);
      handleSignOut();
    }
  }
}

init();
