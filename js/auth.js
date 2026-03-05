// ===== AUTH SYSTEM =====
// Server base URL: Points to the root (where api/ folder is)
var SERVER_BASE = window.location.origin;

// Default admin account
var DEFAULT_ADMIN = { username: 'admin', password: '1234', role: 'admin', name: 'ผู้ดูแลระบบ' };

// ===== IN-MEMORY CACHE =====
// We fetch from server, but keep a local sync copy for backward-compat with sync code
var _ordersCache = JSON.parse(localStorage.getItem('habeef_orders') || '[]');
var _usersCache = JSON.parse(localStorage.getItem('habeef_users') || '[]');
if (_usersCache.length === 0) _usersCache = [DEFAULT_ADMIN];

// ===== SYNC FROM SERVER =====
function syncFromServer() {
    fetch(SERVER_BASE + '/api/orders.php')
        .then(function (r) { return r.json(); })
        .then(function (serverData) {
            if (Array.isArray(serverData)) {
                // Keep locally-saved orders that aren't in the server response yet
                // (they may still be in-flight to the DB)
                var localOrders = getOrders();
                var serverIds = serverData.map(function (o) { return o.orderId; });
                var localOnly = localOrders.filter(function (o) {
                    return o.orderId && serverIds.indexOf(o.orderId) === -1;
                });
                var merged = serverData.concat(localOnly);
                _ordersCache = merged;
                localStorage.setItem('habeef_orders', JSON.stringify(merged));
            }
        }).catch(function () { });

    fetch(SERVER_BASE + '/api/users.php')
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
    fetch(SERVER_BASE + '/api/users.php', {
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
    var SECRET_SALT = 'habeef_secret_2024';
    var encoded = btoa(encodeURIComponent('staff_login|' + SECRET_SALT));
    window.location.href = 'login.html?s=' + encodeURIComponent(encoded);
}

function requireAuth(allowedRoles) {
    var user = getCurrentUser();
    if (!user || (allowedRoles && allowedRoles.indexOf(user.role) === -1)) {
        var SECRET_SALT = 'habeef_secret_2024';
        var encoded = btoa(encodeURIComponent('staff_login|' + SECRET_SALT));
        window.location.href = 'login.html?s=' + encodeURIComponent(encoded);
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

// ===== NOTIFICATIONS (Forgot Password) =====
function getNotifications() {
    return JSON.parse(localStorage.getItem('habeef_notifications') || '[]');
}

function saveNotifications(notifs) {
    localStorage.setItem('habeef_notifications', JSON.stringify(notifs));
}

function addNotification(username) {
    var notifs = getNotifications();
    notifs.push({
        id: Date.now(),
        username: username,
        message: 'ขอเปลี่ยนรหัสผ่าน',
        createdAt: new Date().toISOString(),
        read: false
    });
    saveNotifications(notifs);
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

var MENU_IMAGES = {
    'nam-khon': 'images/ก๋วยเตี๋ยวน้ำข้น.jpg',
    'haeng': 'images/ก๋วยเตี๋ยวแห้ง.jpg',
    'tom-yam': 'images/ก๋วยเตี๋ยวต้มยำ.jpg',
    'tom-yam-seafood': 'images/ก๋วยเตี๋ยวต้มยำทะเล.png',
    'kao-lao': 'images/เกาเหลา.jpg'
};

// ===== ORDERS =====
function getOrders() {
    var saved = localStorage.getItem('habeef_orders');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) { }
    }
    return _ordersCache;
}

function saveOrders(orders) {
    _ordersCache = orders;
    localStorage.setItem('habeef_orders', JSON.stringify(orders));
    fetch(SERVER_BASE + '/api/orders.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orders)
    }).catch(function () { });
}

function saveOrder(order) {
    var currentOrders = getOrders();
    currentOrders.push(order);
    _ordersCache = currentOrders;
    localStorage.setItem('habeef_orders', JSON.stringify(currentOrders));
    fetch(SERVER_BASE + '/api/orders_add.php', {
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
    var logs = getIngredientUsage();
    logs.push({
        id: Date.now().toString(),
        date: date,
        ingredients: Object.assign({}, ingredients)
    });
    localStorage.setItem('habeef_ingredients', JSON.stringify(logs));
}

// ===== STOCK UTILITIES =====
function getAllRemainingStock() {
    var stockIn = JSON.parse(localStorage.getItem('habeef_stock_in') || '{}');
    var usageLogs = JSON.parse(localStorage.getItem('habeef_ingredients') || '[]');

    var usage = {};
    usageLogs.forEach(function (log) {
        var logTime = new Date(log.date);
        var dKey = getDateKey(logTime);
        if (!usage[dKey]) usage[dKey] = {};
        for (var ingName in log.ingredients) {
            usage[dKey][ingName] = (usage[dKey][ingName] || 0) + log.ingredients[ingName];
        }
    });

    var totalIn = {};
    for (var d in stockIn) {
        for (var ing in stockIn[d]) {
            if (totalIn[ing] === undefined) totalIn[ing] = 0;
            var itemData = stockIn[d][ing];
            var q = 0;
            if (typeof itemData === 'number') {
                q = itemData;
            } else if (itemData && typeof itemData.qty === 'number') {
                q = itemData.qty;
            }
            totalIn[ing] += q;
        }
    }

    var totalUsed = {};
    for (var d2 in usage) {
        for (var ing2 in usage[d2]) {
            if (totalUsed[ing2] === undefined) totalUsed[ing2] = 0;
            totalUsed[ing2] += usage[d2][ing2];
        }
    }

    var remaining = {};
    var allKeys = Object.keys(totalIn).concat(Object.keys(totalUsed));
    var uniqueKeys = allKeys.filter(function (item, pos) {
        return allKeys.indexOf(item) == pos;
    });

    uniqueKeys.forEach(function (ing) {
        var rem = (totalIn[ing] || 0) - (totalUsed[ing] || 0);
        if (rem < 0) rem = 0;
        remaining[ing] = rem;
    });

    return remaining;
}
