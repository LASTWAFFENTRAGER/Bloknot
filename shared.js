// ─────────────────────────────────────────────
// БЛОКНОТ — общий модуль (shared.js)
// Единая точка: Firebase, утилиты, авторизация
// ─────────────────────────────────────────────
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js';
import { getFirestore, collection, doc, onSnapshot, setDoc, deleteDoc, serverTimestamp, getDocs, query, where, updateDoc, arrayUnion, arrayRemove, getDoc as getOne, addDoc, deleteField }
  from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut }
  from 'https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js';

// ── FIREBASE CONFIG ──
const app = initializeApp({
  apiKey:            "AIzaSyC8q_pr3kIOlb9UEKbxhAuKu9vz6vfQosw",
  authDomain:        "project-id-6ca36.firebaseapp.com",
  projectId:         "project-id-6ca36",
  storageBucket:     "project-id-6ca36.firebasestorage.app",
  messagingSenderId: "57707102531",
  appId:             "1:57707102531:web:5c279fb59d7b46c90baff6"
});

const auth = getAuth(app);
const db = getFirestore(app);

// ── ТЕМЫ ОФОРМЛЕНИЯ ──
const THEMES = [
  { id: 'strategic',    name: 'Стратегический', bg: '#0F0F0F', text: '#E8E2D9', accent: '#C8A96E', isDark: true  },
  { id: 'clean',        name: 'Чистый лист',    bg: '#F5F2EB', text: '#1E1E1E', accent: '#3B82F6', isDark: false },
  { id: 'sepia',        name: 'Уютная тетрадь',  bg: '#EFE8D8', text: '#3A3128', accent: '#D4A373', isDark: false },
  { id: 'cyber',        name: 'Кибер/Хай-тек',   bg: '#0A0A1A', text: '#E0E0FF', accent: '#00E5FF', isDark: true  },
  { id: 'nature',       name: 'Зелёный рост',    bg: '#1A2F1D', text: '#D1E8D5', accent: '#8BC34A', isDark: true  },
  { id: 'terminal',     name: 'Терминал',        bg: '#000000', text: '#00FF00', accent: '#00FF00', isDark: true  },
  { id: 'pastel',       name: 'Нежный',          bg: '#2D222B', text: '#E4D5DB', accent: '#F4A261', isDark: true  },
  { id: 'graphite',     name: 'Профессиональный', bg: '#1C1E22', text: '#CBD2D9', accent: '#6C8B9F', isDark: true  },
  { id: 'terracotta',   name: 'Осенний',         bg: '#1F1A16', text: '#DAC5B3', accent: '#C87A4A', isDark: true  },
  { id: 'lamp',         name: 'Ламповое чтение',  bg: '#181A1B', text: '#C3C9CD', accent: '#E5B567', isDark: true  }
];

function lighten(hex, pct) {
  const num = parseInt(hex.replace('#',''),16);
  const r = Math.min(255, (num>>16) + Math.floor(255*(pct/100)));
  const g = Math.min(255, ((num>>8)&0xFF) + Math.floor(255*(pct/100)));
  const b = Math.min(255, (num&0xFF) + Math.floor(255*(pct/100)));
  return '#' + (r<<16|g<<8|b).toString(16).padStart(6,'0');
}
function darken(hex, pct) {
  const num = parseInt(hex.replace('#',''),16);
  const r = Math.max(0, (num>>16) - Math.floor(255*(pct/100)));
  const g = Math.max(0, ((num>>8)&0xFF) - Math.floor(255*(pct/100)));
  const b = Math.max(0, (num&0xFF) - Math.floor(255*(pct/100)));
  return '#' + (r<<16|g<<8|b).toString(16).padStart(6,'0');
}

function applyTheme(theme) {
  const root = document.documentElement;
  const isDark = theme.isDark;

  root.style.setProperty('--bg',    theme.bg);
  root.style.setProperty('--bg2',   isDark ? lighten(theme.bg, 3) : darken(theme.bg, 3));
  root.style.setProperty('--bg3',   isDark ? lighten(theme.bg, 8) : darken(theme.bg, 7));
  root.style.setProperty('--bg4',   isDark ? lighten(theme.bg, 14) : darken(theme.bg, 12));
  root.style.setProperty('--border', isDark ? lighten(theme.bg, 14) : darken(theme.bg, 12));
  root.style.setProperty('--border2',isDark ? lighten(theme.bg, 20) : darken(theme.bg, 18));
  root.style.setProperty('--gold',  theme.accent);
  root.style.setProperty('--gold2', isDark ? lighten(theme.accent, -10) : darken(theme.accent, 10));
  root.style.setProperty('--text',  theme.text);
  root.style.setProperty('--muted', isDark ? darken(theme.text, 30) : lighten(theme.text, 40));
  root.style.setProperty('--dim',   isDark ? darken(theme.text, 55) : lighten(theme.text, 65));
}

function findThemeById(id) {
  return THEMES.find(t => t.id === id) || THEMES[0];
}

async function saveUserTheme(themeId) {
  if (!uid()) return;
  await setDoc(doc(db, 'users', uid()), { themeId }, { merge: true });
}

async function loadUserTheme() {
  if (!uid()) return;
  const snap = await getOne(doc(db, 'users', uid()));
  const data = snap.exists() ? snap.data() : {};
  const theme = findThemeById(data.themeId);
  applyTheme(theme);
  return theme;
}

// Применяем дефолтную тему сразу
applyTheme(THEMES[0]);

// ── КОНСТАНТЫ ──
const ICONS  = ['💡','✈','🏦','☕','🏭','🌐','🚀','📚','💼','🎯','🔬','🎨','🏠','❤️','⚡','🌿'];
const COLORS = ['#C8A96E','#7EB8A4','#E07B7B','#7BA7E0','#B07BE0','#E0B47B','#7BE0C8','#E07BB8','#A0E07B','#E0D47B'];
const AVATAR_CLRS = ['#C8A96E','#7EB8A4','#E07B7B','#7BA7E0','#B07BE0','#E0B47B','#7BE0C8','#E07BB8','#A0E07B','#E0D47B','#D4A87A','#7AA7D4'];
const DESK_AVATARS = ['👤','😊','😎','🧠','🚀','⚡','🌿','🔥','🎯','💡','🦊','🐺','🦁','🐉','🌙','⭐'];

// ── УТИЛИТЫ ──
const genId = () => 'id' + Date.now() + Math.random().toString(36).slice(2,6);
const esc = s => String(s||'').replace(/&/g,'&').replace(/</g,'<').replace(/>/g,'>').replace(/"/g,'"');
const fmt = ts => { if(!ts)return''; const d=ts.toDate?ts.toDate():new Date(ts); return d.toLocaleDateString('ru-RU',{day:'2-digit',month:'short',year:'2-digit',hour:'2-digit',minute:'2-digit'}); };
const wc = s => (s||'').trim().split(/\s+/).filter(Boolean).length;
function uid() { return auth.currentUser?.uid; }

function generateNumericId() {
  return Math.floor(100000 + Math.random() * 900000); // 6 цифр, единый формат
}

function getAvatar(handle) {
  if(!handle) return ['?','#444'];
  const sum = handle.split('').reduce((a,c)=>a+c.charCodeAt(0),0);
  const clr = AVATAR_CLRS[sum % AVATAR_CLRS.length];
  const init = handle.slice(0,2).toUpperCase();
  return [init, clr];
}

function avatarHTML(handle) {
  const [init, clr] = getAvatar(handle);
  return `<span class="avatar" style="background:${clr}">${esc(init)}</span>`;
}
function avatarSmallHTML(handle) {
  const [init, clr] = getAvatar(handle);
  return `<span class="avatar avatar-sm" style="background:${clr}">${esc(init)}</span>`;
}

function formatTime(ms) {
  const d = new Date(ms);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('ru', { day: 'numeric', month: 'short' });
}

// ── АВТОРИЗАЦИЯ ──
let authMode = 'login';

function toggleAuthMode() {
  authMode = authMode === 'login' ? 'register' : 'login';
  const submitBtn = document.getElementById('auth-submit');
  const toggleEl = document.getElementById('auth-toggle');
  if (submitBtn) submitBtn.textContent = authMode === 'login' ? 'Войти' : 'Зарегистрироваться';
  if (toggleEl) toggleEl.innerHTML = authMode === 'login'
    ? 'Нет аккаунта? <a id="auth-toggle-link">Зарегистрироваться</a>'
    : 'Уже есть аккаунт? <a id="auth-toggle-link">Войти</a>';
  const toggleLink = document.getElementById('auth-toggle-link');
  if (toggleLink) toggleLink.onclick = toggleAuthMode;
  const errorEl = document.getElementById('auth-error');
  if (errorEl) errorEl.style.display = 'none';
}

async function handleAuthSubmit() {
  const email = (document.getElementById('auth-email')?.value || '').trim();
  const password = document.getElementById('auth-password')?.value || '';
  const errorEl = document.getElementById('auth-error');
  const submitBtn = document.getElementById('auth-submit');
  if (!email || !password) {
    if (errorEl) { errorEl.textContent = 'Введите email и пароль'; errorEl.style.display = 'block'; }
    return;
  }
  if (errorEl) errorEl.style.display = 'none';
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = authMode === 'login' ? 'Вход...' : 'Регистрация...'; }
  try {
    if (authMode === 'login') {
      await signInWithEmailAndPassword(auth, email, password);
    } else {
      await createUserWithEmailAndPassword(auth, email, password);
    }
  } catch (err) {
    const msg = (err.message || '').replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim();
    if (errorEl) { errorEl.textContent = msg; errorEl.style.display = 'block'; }
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = authMode === 'login' ? 'Войти' : 'Зарегистрироваться'; }
  }
}

async function handleLogout() {
  // Отключение звонка, если активен
  if (window._callRoom) { window._callRoom.disconnect(); }
  await signOut(auth);
}

// ── ИНИЦИАЛИЗАЦИЯ АВТОРИЗАЦИИ (вызывается из desktop/mobile) ──
function initAuth(callbacks = {}) {
  const {
    onUserReady,       // вызывается когда пользователь залогинен и профиль готов
    onProfileNotFound, // вызывается когда нужен handle
    onSignOut,         // вызывается при выходе
    onLoading,         // вызывается при начале загрузки
    onError            // вызывается при ошибке
  } = callbacks;

  // Привязка событий к формам авторизации
  const authSubmit = document.getElementById('auth-submit');
  const authToggleLink = document.getElementById('auth-toggle-link');
  const authPassword = document.getElementById('auth-password');
  if (authSubmit) authSubmit.onclick = handleAuthSubmit;
  if (authToggleLink) authToggleLink.onclick = toggleAuthMode;
  if (authPassword) {
    authPassword.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); handleAuthSubmit(); }
    });
  }

  onAuthStateChanged(auth, async user => {
    if (user) {
      // Пользователь залогинен
      if (onLoading) onLoading();
      try {
        let profileSnap = await getOne(doc(db, 'users', user.uid));
        if (!profileSnap.exists()) {
          // Проверить по uid
          const altSnap = await getDocs(query(collection(db, 'users'), where('uid', '==', user.uid)));
          if (!altSnap.empty) profileSnap = altSnap.docs[0];
        }
        if (!profileSnap.exists()) {
          if (onProfileNotFound) onProfileNotFound(user);
        } else {
          if (onUserReady) onUserReady(user, profileSnap.data());
        }
      } catch (err) {
        console.error('Auth init error:', err);
        if (onError) onError(err);
      }
    } else {
      // Пользователь вышел
      if (onSignOut) onSignOut();
    }
  });
}

// ── ПРОФИЛЬ (общая логика) ──
async function ensureUniqueHandle(handle) {
  const snap = await getDocs(query(collection(db, 'users'), where('handle', '==', handle)));
  return snap.empty;
}

async function ensureUniqueNumericId() {
  for (let i = 0; i < 10; i++) {
    const numericId = generateNumericId();
    const snap = await getDocs(query(collection(db, 'users'), where('numericId', '==', numericId)));
    if (snap.empty) return numericId;
  }
  return generateNumericId(); // fallback после 10 попыток
}

async function saveUserProfile(data) {
  if (!uid()) throw new Error('Not authenticated');
  await setDoc(doc(db, 'users', uid()), data, { merge: true });
}

async function loadUserProfile(userUid) {
  const snap = await getOne(doc(db, 'users', userUid));
  if (snap && snap.exists()) {
    return { uid: userUid, ...snap.data() };
  }
  return null;
}

// ── ДРУЗЬЯ ──
async function loadFriends() {
  if (!uid()) return {};
  const snap = await getDocs(collection(db, 'users', uid(), 'friends'));
  const result = {};
  snap.docs.forEach(d => { result[d.id] = { id: d.id, ...d.data() }; });
  return result;
}

async function sendFriendRequest(targetHandle) {
  const clean = targetHandle.replace('@', '').replace('#', '').toLowerCase().trim();
  let targetUid = null, targetUserHandle = null;

  // Поиск по handle
  if (!/^\d+$/.test(clean)) {
    const snap = await getDocs(query(collection(db, 'users'), where('handle', '==', clean)));
    if (!snap.empty) { targetUid = snap.docs[0].id; targetUserHandle = snap.docs[0].data().handle; }
  }
  // Поиск по numericId (6 цифр)
  if (!targetUid && /^\d+$/.test(clean)) {
    const snap = await getDocs(query(collection(db, 'users'), where('numericId', '==', parseInt(clean))));
    if (!snap.empty) { targetUid = snap.docs[0].id; targetUserHandle = snap.docs[0].data().handle; }
  }

  if (!targetUid) throw new Error('Пользователь не найден');
  if (targetUid === uid()) throw new Error('Нельзя добавить себя');

  const existing = await getOne(doc(db, 'users', uid(), 'friends', targetUid));
  if (existing.exists()) {
    const st = existing.data().status;
    if (st === 'accepted') throw new Error('Уже в друзьях');
    if (st === 'pending') throw new Error('Заявка уже отправлена');
  }

  const myProfile = await loadUserProfile(uid());
  await setDoc(doc(db, 'users', uid(), 'friends', targetUid), {
    status: 'pending', handle: targetUserHandle || targetUid, createdAt: Date.now()
  });
  await setDoc(doc(db, 'users', targetUid, 'friends', uid()), {
    status: 'incoming', handle: myProfile?.handle || '', createdAt: Date.now()
  });
  return true;
}

async function respondFriendRequest(friendUid, action) {
  if (action === 'accept') {
    await setDoc(doc(db, 'users', uid(), 'friends', friendUid), { status: 'accepted' }, { merge: true });
    await setDoc(doc(db, 'users', friendUid, 'friends', uid()), { status: 'accepted' }, { merge: true });
  } else {
    await deleteDoc(doc(db, 'users', uid(), 'friends', friendUid));
    await deleteDoc(doc(db, 'users', friendUid, 'friends', uid()));
  }
}

// ── ЛИНИИ (общие функции) ──
function myRole(line) {
  if (!line || !line.members) return null;
  return line.members[uid()]?.role || (line.ownerId === uid() ? 'admin' : null);
}

function canWrite(line) {
  if (!line || !line.members) return true; // личная линия
  const r = myRole(line);
  return r === 'admin' || r === 'partner';
}

function canDelete(line) {
  if (!line || !line.members) return true;
  return myRole(line) === 'admin';
}

function canManage(line) {
  if (!line || !line.members) return false;
  return line.ownerId === uid();
}

// ── Firestore helpers ──
function syncDot(state) {
  const d = document.getElementById('sync-dot');
  if (d) d.className = 'sync-dot' + (state === 'syncing' ? ' syncing' : state === 'error' ? ' error' : '');
}

// ── Экспорт в глобальную область (для совместимости с inline-скриптами) ──
window._shared = {
  app, auth, db,
  ICONS, COLORS, AVATAR_CLRS, DESK_AVATARS,
  genId, esc, fmt, wc, uid, getAvatar, avatarHTML, avatarSmallHTML, formatTime,
  generateNumericId,
  authMode, toggleAuthMode, handleAuthSubmit, handleLogout, initAuth,
  ensureUniqueHandle, ensureUniqueNumericId, saveUserProfile, loadUserProfile,
  loadFriends, sendFriendRequest, respondFriendRequest,
  myRole, canWrite, canDelete, canManage,
  syncDot,
  // Темы
  THEMES, applyTheme, findThemeById, saveUserTheme, loadUserTheme,
  // Firestore функции
  collection, doc, onSnapshot, setDoc, deleteDoc, serverTimestamp,
  getDocs, query, where, updateDoc, arrayUnion, arrayRemove, getOne, addDoc,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut,
  deleteField, onAuthStateChanged
};
