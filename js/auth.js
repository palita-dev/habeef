// ===== AUTH SYSTEM =====
// Derive base from current page path so API calls work regardless of subdirectory depth
var SERVER_BASE = (function () {
    var parts = window.location.pathname.split('/');
    parts.pop(); // remove filename (e.g. admin.html)
    return window.location.origin + parts.join('/');
})();

// ===== DISABLED INGREDIENTS — stored in MySQL via ingredients.php =====
window._disabledIngredientsCache = null;

function getDisabledIngredients(callback) {
    if (window._disabledIngredientsCache !== null) {
        if (callback) callback(window._disabledIngredientsCache);
        return window._disabledIngredientsCache;
    }
    fetch(SERVER_BASE + '/api/ingredients.php?action=disabled_list')
        .then(function (r) { return r.json(); })
        .then(function (data) {
            window._disabledIngredientsCache = Array.isArray(data) ? data : [];
            if (callback) callback(window._disabledIngredientsCache);
        })
        .catch(function () {
            window._disabledIngredientsCache = [];
            if (callback) callback([]);
        });
    return window._disabledIngredientsCache || [];
}

function saveDisabledIngredients(disabled) {
    window._disabledIngredientsCache = disabled;
    fetch(SERVER_BASE + '/api/ingredients.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_disabled', disabled: disabled })
    }).catch(function () { });
}

function toggleIngredientDisabled(name, isDisabled) {
    var cache = window._disabledIngredientsCache || [];
    if (isDisabled) {
        if (cache.indexOf(name) === -1) cache.push(name);
    } else {
        cache = cache.filter(function (n) { return n !== name; });
    }
    window._disabledIngredientsCache = cache;
    fetch(SERVER_BASE + '/api/ingredients.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', name: name, is_disabled: isDisabled ? 1 : 0 })
    }).catch(function () { });
}

// Pre-load disabled ingredients on page start
getDisabledIngredients(null);

// Default admin account (fallback only)
var DEFAULT_ADMIN = { username: 'admin', password: '1234', role: 'admin', name: 'ผู้ดูแลระบบ' };

// ===== IN-MEMORY CACHE (synced from server, not from localStorage) =====
var _ordersCache = [];
var _usersCache = [];

// ===== SYNC FROM SERVER =====
function syncFromServer() {
    var p1 = fetch(SERVER_BASE + '/api/orders.php')
        .then(function (r) { return r.json(); })
        .then(function (serverData) {
            if (Array.isArray(serverData)) {
                _ordersCache = serverData;
            }
        }).catch(function () { });

    var p2 = fetch(SERVER_BASE + '/api/users.php')
        .then(function (r) { return r.json(); })
        .then(function (data) {
            if (Array.isArray(data) && data.length > 0) {
                _usersCache = data;
            }
        }).catch(function () { });

    var p3 = new Promise(function (resolve) {
        if (typeof _fetchStockIn === 'function') {
            _fetchStockIn(resolve);
        } else {
            resolve();
        }
    });

    var p4 = new Promise(function (resolve) {
        if (typeof _fetchStockOut === 'function') {
            _fetchStockOut(resolve);
        } else {
            resolve();
        }
    });

    return Promise.all([p1, p2, p3, p4]);
}

// ----- SHA-256 Hashing Function -----
function sha256(ascii) {
    function rightRotate(value, amount) {
        return (value >>> amount) | (value << (32 - amount));
    }

    var mathPow = Math.pow;
    var maxWord = mathPow(2, 32);
    var lengthProperty = 'length';
    var i, j;
    var result = '';

    var words = [];
    var asciiBitLength = ascii[lengthProperty] * 8;

    var hash = sha256.h = sha256.h || [];
    var k = sha256.k = sha256.k || [];
    var primeCounter = k[lengthProperty];

    var isComposite = {};
    for (var candidate = 2; primeCounter < 64; candidate++) {
        if (!isComposite[candidate]) {
            for (i = 0; i < 313; i += candidate) {
                isComposite[i] = candidate;
            }
            hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
            k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
        }
    }

    ascii += '\x80';
    while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
    for (i = 0; i < ascii[lengthProperty]; i++) {
        j = ascii.charCodeAt(i);
        if (j >> 8) return;
        words[i >> 2] |= j << ((3 - i % 4) * 8);
    }
    words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
    words[words[lengthProperty]] = (asciiBitLength);

    for (j = 0; j < words[lengthProperty];) {
        var w = words.slice(j, j += 16);
        var oldHash = hash;
        hash = hash.slice(0, 8);

        for (i = 0; i < 64; i++) {
            var i2 = i + j;
            var w15 = w[i - 15], w2 = w[i - 2];

            var a = hash[0], e = hash[4];
            var temp1 = hash[7]
                + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
                + ((e & hash[5]) ^ ((~e) & hash[6]))
                + k[i]
                + (w[i] = (i < 16) ? w[i] : (
                    w[i - 16]
                    + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
                    + w[i - 7]
                    + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
                ) | 0
                );
            var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
                + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

            hash = [(temp1 + temp2) | 0].concat(hash);
            hash[4] = (hash[4] + temp1) | 0;
        }

        for (i = 0; i < 8; i++) {
            hash[i] = (hash[i] + oldHash[i]) | 0;
        }
    }

    for (i = 0; i < 8; i++) {
        for (j = 3; j + 1; j--) {
            var b = (hash[i] >> (j * 8)) & 255;
            result += ((b < 16) ? 0 : '') + b.toString(16);
        }
    }
    return result;
}

// Auto-sync every 3 seconds
setInterval(syncFromServer, 3000);
syncFromServer();

// ===== USERS =====
function getUsers() {
    return _usersCache.length > 0 ? _usersCache : [DEFAULT_ADMIN];
}

function saveUsers(users) {
    _usersCache = users;
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
    var hashedInputPw = sha256(password);

    var user = users.find(function (u) {
        return u.username === username && (u.password === hashedInputPw || u.password === password);
    });

    if (user) {
        if (user.password === password && password.length < 60) {
            user.password = hashedInputPw;
            saveUsers(users);
        }
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
    var hashedPassword = sha256(password);
    users.push({ username: username, password: hashedPassword, role: role, name: name || username });
    saveUsers(users);
    return true;
}

function updateUser(oldUsername, newData) {
    var users = getUsers();
    var idx = users.findIndex(function (u) { return u.username === oldUsername; });
    if (idx === -1) return false;
    if (newData.password) {
        newData.password = sha256(newData.password);
    }
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

// ===== NOTIFICATIONS — now stored in MySQL =====
function getNotifications() {
    // Returns a cached copy; will be refreshed async
    return window._notificationsCache || [];
}

function _fetchNotifications(callback) {
    fetch(SERVER_BASE + '/api/notifications.php')
        .then(function (r) { return r.json(); })
        .then(function (data) {
            if (Array.isArray(data)) {
                window._notificationsCache = data;
                if (callback) callback(data);
            }
        }).catch(function () {
            window._notificationsCache = window._notificationsCache || [];
            if (callback) callback(window._notificationsCache);
        });
}

// Seed the cache immediately on load
_fetchNotifications(null);

function saveNotifications(notifs) {
    // Read-only from cache; individual add/delete go direct to API
    window._notificationsCache = notifs;
}

function addNotification(username) {
    var message = 'ขอเปลี่ยนรหัสผ่าน';
    fetch(SERVER_BASE + '/api/notifications.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', username: username, message: message })
    }).catch(function () { });
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

// ===== ORDERS — purely from MySQL =====
function getOrders() {
    return _ordersCache;
}

function saveOrders(orders) {
    _ordersCache = orders;
    fetch(SERVER_BASE + '/api/orders.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orders)
    }).catch(function () { });
}

function saveOrder(order) {
    _ordersCache.push(order);
    fetch(SERVER_BASE + '/api/orders_add.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
    }).catch(function () { });
}

// ===== STOCK IN — from MySQL =====
function getStockIn() {
    return window._stockInCache || {};
}

function _fetchStockIn(callback) {
    fetch(SERVER_BASE + '/api/stockin.php')
        .then(function (r) { return r.json(); })
        .then(function (data) {
            if (data && typeof data === 'object') {
                window._stockInCache = data;
                if (callback) callback(data);
            }
        }).catch(function () {
            if (callback) callback(window._stockInCache || {});
        });
}
_fetchStockIn(null);

function saveStockIn(data) {
    window._stockInCache = data;
    fetch(SERVER_BASE + '/api/stockin.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).catch(function () { });
}

// ===== STOCK OUT — from MySQL =====
function getStockOut() {
    return window._stockOutCache || [];
}

function _fetchStockOut(callback) {
    fetch(SERVER_BASE + '/api/stockout.php')
        .then(function (r) { return r.json(); })
        .then(function (data) {
            if (Array.isArray(data)) {
                window._stockOutCache = data;
                if (callback) callback(data);
            }
        }).catch(function () {
            if (callback) callback(window._stockOutCache || []);
        });
}
_fetchStockOut(null);

function saveStockOut(data) {
    window._stockOutCache = data;
    fetch(SERVER_BASE + '/api/stockout.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).catch(function () { });
}

// ===== INGREDIENT USAGE — still from orders in MySQL =====
function getIngredientUsage() {
    // Derive ingredient usage from cached orders
    var usage = [];
    _ordersCache.forEach(function (order) {
        if (order.items) {
            var ingMap = {};
            order.items.forEach(function (item) {
                if (item.ingredients && typeof item.ingredients === 'object') {
                    for (var ing in item.ingredients) {
                        ingMap[ing] = (ingMap[ing] || 0) + (item.ingredients[ing] * item.qty);
                    }
                }
            });
            if (Object.keys(ingMap).length > 0) {
                usage.push({
                    id: order.orderId,
                    date: order.createdAt || order.completedAt,
                    ingredients: ingMap
                });
            }
        }
    });
    return usage;
}

function saveIngredientUsage(ingredients, date) {
    // No-op: ingredient usage is now derived from orders in MySQL
}

// ===== STOCK UTILITIES =====
function getAllRemainingStock() {
    var stockIn = getStockIn();
    var usageLogs = getIngredientUsage();
    var stockOutLogs = getStockOut();

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

    var totalOut = {};
    stockOutLogs.forEach(function (log) {
        if (totalOut[log.item] === undefined) totalOut[log.item] = 0;
        totalOut[log.item] += log.qty;
    });

    var remaining = {};
    var allKeys = Object.keys(totalIn).concat(Object.keys(totalUsed)).concat(Object.keys(totalOut));
    var uniqueKeys = allKeys.filter(function (item, pos) {
        return allKeys.indexOf(item) == pos;
    });

    uniqueKeys.forEach(function (ing) {
        var rem = (totalIn[ing] || 0) - (totalUsed[ing] || 0) - (totalOut[ing] || 0);
        if (rem < 0) rem = 0;
        remaining[ing] = rem;
    });

    return remaining;
}
