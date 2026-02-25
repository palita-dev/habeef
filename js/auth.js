// ===== AUTH SYSTEM =====
// Server base URL (auto-detects whether running from file:// or http://)
var SERVER_BASE = (window.location.protocol === 'file:')
    ? 'http://localhost:4000'
    : window.location.origin;

// Default admin account
var DEFAULT_ADMIN = { username: 'admin', password: '1234', role: 'admin', name: 'ผู้ดูแลระบบ' };

// ===== IN-MEMORY CACHE =====
// We fetch from server, but keep a local sync copy for backward-compat with sync code
var _ordersCache = JSON.parse(localStorage.getItem('habeef_orders') || '[]');
var _usersCache = JSON.parse(localStorage.getItem('habeef_users') || '[]');
if (_usersCache.length === 0) _usersCache = [DEFAULT_ADMIN];

// ===== SYNC FROM SERVER =====
function syncFromServer() {
    fetch(SERVER_BASE + '/api/orders')
        .then(function (r) { return r.json(); })
        .then(function (data) {
            if (Array.isArray(data)) {
                _ordersCache = data;
                localStorage.setItem('habeef_orders', JSON.stringify(data));
            }
        }).catch(function () { });

    fetch(SERVER_BASE + '/api/users')
        .then(function (r) { return r.json(); })
        .then(function (data) {
            if (Array.isArray(data) && data.length > 0) {
                _usersCache = data;
                localStorage.setItem('habeef_users', JSON.stringify(data));
            }
        }).catch(function () { });
}

// Auto-sync every 3 seconds
setInterval(syncFromServer, 3000);
syncFromServer(); // Initial sync

// ===== USERS =====
function getUsers() {
    return _usersCache;
}

function saveUsers(users) {
    _usersCache = users;
    localStorage.setItem('habeef_users', JSON.stringify(users));
    fetch(SERVER_BASE + '/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(users)
    }).catch(function () { });
}

function initUsers() {
    var users = getUsers();
    if (users.length === 0) {
        users.push(DEFAULT_ADMIN);
        saveUsers(users);
    }
    return users;
}

function login(username, password) {
    var users = initUsers();
    var user = users.find(function (u) {
        return u.username === username && u.password === password;
    });
    if (user) {
        sessionStorage.setItem('habeef_current_user', JSON.stringify(user));
        return user;
    }
    return null;
}

function getCurrentUser() {
    var data = sessionStorage.getItem('habeef_current_user');
    return data ? JSON.parse(data) : null;
}

function logout() {
    sessionStorage.removeItem('habeef_current_user');
    window.location.href = 'login.html';
}

function requireAuth(allowedRoles) {
    var user = getCurrentUser();
    if (!user || (allowedRoles && allowedRoles.indexOf(user.role) === -1)) {
        window.location.href = 'login.html';
        return null;
    }
    return user;
}

function addUser(username, password, role, name) {
    var users = getUsers();
    if (users.find(function (u) { return u.username === username; })) return false;
    users.push({ username: username, password: password, role: role, name: name || username });
    saveUsers(users);
    return true;
}

function updateUser(oldUsername, newData) {
    var users = getUsers();
    var idx = users.findIndex(function (u) { return u.username === oldUsername; });
    if (idx === -1) return false;
    users[idx] = Object.assign(users[idx], newData);
    saveUsers(users);
    return true;
}

function deleteUser(username) {
    var users = getUsers();
    users = users.filter(function (u) { return u.username !== username; });
    saveUsers(users);
    return true;
}

// ===== SHARED UTILITIES =====
function showToast(msg) {
    var t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    setTimeout(function () { t.classList.remove('show'); }, 2000);
}

function formatDateThai(isoStr) {
    var d = new Date(isoStr);
    var day = d.getDate().toString().padStart(2, '0');
    var month = (d.getMonth() + 1).toString().padStart(2, '0');
    var year = d.getFullYear() + 543;
    var h = d.getHours().toString().padStart(2, '0');
    var m = d.getMinutes().toString().padStart(2, '0');
    return day + '/' + month + '/' + year + ' เวลา ' + h + ':' + m + ' น.';
}

function getDateKey(d) {
    if (!d) return '';
    var shift = new Date(d.getTime());
    shift.setHours(shift.getHours() - 4);
    var year = shift.getFullYear();
    var month = (shift.getMonth() + 1).toString().padStart(2, '0');
    var day = shift.getDate().toString().padStart(2, '0');
    return year + '-' + month + '-' + day;
}

var THAI_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

var MENU_EMOJIS = {
    'nam-khon': '🍜', 'haeng': '🥢', 'tom-yam': '🌶️',
    'tom-yam-seafood': '🦐', 'kao-lao': '🥣'
};

// ===== ORDERS =====
function getOrders() {
    return _ordersCache;
}

function saveOrders(orders) {
    _ordersCache = orders;
    localStorage.setItem('habeef_orders', JSON.stringify(orders));
    fetch(SERVER_BASE + '/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orders)
    }).catch(function () { });
}

function saveOrder(order) {
    _ordersCache.push(order);
    localStorage.setItem('habeef_orders', JSON.stringify(_ordersCache));
    fetch(SERVER_BASE + '/api/orders/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
    }).catch(function () { });
}

// ===== INGREDIENTS =====
function getIngredientUsage() {
    return JSON.parse(localStorage.getItem('habeef_ingredients') || '[]');
}

function saveIngredientUsage(ingredients, date) {
    var log = getIngredientUsage();
    log.push({ date: date.toISOString(), ingredients: ingredients });
    localStorage.setItem('habeef_ingredients', JSON.stringify(log));
    fetch(SERVER_BASE + '/api/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log)
    }).catch(function () { });
}
