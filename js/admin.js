// ===== ADMIN DASHBOARD =====

var currentUser = null;
var editingUser = null;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function () {
    currentUser = requireAuth(['admin']);
    if (!currentUser) return;
    document.getElementById('acc-name').textContent = currentUser.name || currentUser.username;
    generateStaffQR();
    generateTableQR();

    // Wait for server data to load before rendering
    if (typeof syncFromServer === 'function') {
        var syncPromise = syncFromServer();
        if (syncPromise && syncPromise.then) {
            syncPromise.then(function () {
                renderUserList();
                loadAdminEmail();
            });
        } else {
            renderUserList();
            setTimeout(loadAdminEmail, 500);
        }
    } else {
        renderUserList();
        setTimeout(loadAdminEmail, 500);
    }

    // Load admin email from MySQL (via users cache, synced from server)
    function loadAdminEmail() {
        var users = getUsers();
        var adminUser = users.find(function (u) { return u.role === 'admin'; });
        var savedGmail = adminUser && adminUser.email ? adminUser.email : '';
        var gmailInput = document.getElementById('admin-gmail');
        if (gmailInput) gmailInput.value = savedGmail;

        updateAdminEmailUI();

        if (!savedGmail) {
            document.getElementById('force-email-modal').style.display = 'flex';
            var confirmGroup = document.getElementById('gmail-confirm-group');
            if (confirmGroup) confirmGroup.style.display = 'none';
        } else {
            var confirmGroup = document.getElementById('gmail-confirm-group');
            if (confirmGroup) confirmGroup.style.display = 'block';
        }
    }
});

function saveForceAdminGmail() {
    var email = document.getElementById('force-admin-gmail').value.trim();
    var errEl = document.getElementById('force-email-error');
    errEl.style.display = 'none';

    if (!email) {
        errEl.textContent = 'กรุณากรอก Gmail เพื่อความปลอดภัย';
        errEl.style.display = 'block';
        return;
    }

    // Save to server database (MySQL)
    var users = getUsers();
    var adminUser = users.find(function (u) { return u.role === 'admin'; });
    if (adminUser) {
        adminUser.email = email;
        saveUsers(users);
    }

    // Update main account page input as well
    var gmailInput = document.getElementById('admin-gmail');
    if (gmailInput) gmailInput.value = email;
    updateAdminEmailUI();

    // Show confirm group for future edits
    var confirmGroup = document.getElementById('gmail-confirm-group');
    if (confirmGroup) confirmGroup.style.display = 'block';

    document.getElementById('force-email-modal').style.display = 'none';
    showToast('บันทึก Email สำเร็จ ✓');
}

// ===== GMAIL SETTINGS =====
function updateAdminEmailUI() {
    var users = getUsers();
    var adminUser = users.find(function (u) { return u.role === 'admin'; });
    var savedGmail = adminUser && adminUser.email ? adminUser.email : '';
    var displayEl = document.getElementById('current-admin-gmail-display');
    if (displayEl) {
        displayEl.textContent = savedGmail ? savedGmail : 'ยังไม่ได้ตั้งค่า';
    }
}

function toggleGmailEdit(show) {
    var displayMode = document.getElementById('gmail-display-mode');
    var editMode = document.getElementById('gmail-edit-mode');
    var errEl = document.getElementById('gmail-error');
    var pwInput = document.getElementById('gmail-confirm-pw');
    
    if (errEl) errEl.style.display = 'none';
    if (pwInput) pwInput.value = '';

    if (show) {
        if (displayMode) displayMode.style.display = 'none';
        if (editMode) editMode.style.display = 'block';
        
        // Load latest email into input
        var users = getUsers();
        var adminUser = users.find(function (u) { return u.role === 'admin'; });
        var savedGmail = adminUser && adminUser.email ? adminUser.email : '';
        var gmailInput = document.getElementById('admin-gmail');
        if (gmailInput) gmailInput.value = savedGmail;
    } else {
        if (displayMode) displayMode.style.display = 'flex';
        if (editMode) editMode.style.display = 'none';
        updateAdminEmailUI();
    }
}

function saveAdminGmail() {
    var errEl = document.getElementById('gmail-error');
    errEl.style.display = 'none';

    var email = document.getElementById('admin-gmail').value.trim();
    var pw = document.getElementById('gmail-confirm-pw').value.trim();
    // Retrieve current email from MySQL users cache
    var users = getUsers();
    var adminUser = users.find(function (u) { return u.role === 'admin'; });
    var currentSavedEmail = adminUser && adminUser.email ? adminUser.email : '';

    if (!email) {
        errEl.textContent = 'กรุณากรอก Gmail';
        errEl.style.display = 'block';
        return;
    }

    if (currentSavedEmail) {
        if (!pw) {
            errEl.textContent = 'กรุณาป้อนรหัสผ่านแอดมินเพื่อยืนยัน';
            errEl.style.display = 'block';
            return;
        }

        var admin = adminUser;
        var hashedPw = (typeof sha256 === 'function') ? sha256(pw) : pw;

        if (!admin || (admin.password !== hashedPw && admin.password !== pw)) {
            errEl.textContent = 'รหัสผ่านไม่ถูกต้อง';
            errEl.style.display = 'block';
            return;
        }
    }

    // Save to server database (MySQL)
    if (adminUser) {
        adminUser.email = email;
        saveUsers(users);
    }

    document.getElementById('gmail-confirm-pw').value = '';

    var confirmGroup = document.getElementById('gmail-confirm-group');
    if (confirmGroup) confirmGroup.style.display = 'block';

    updateAdminEmailUI();
    showToast('บันทึก Gmail เรียบร้อยแล้ว ✓');
    toggleGmailEdit(false);
}

// ===== TAB NAVIGATION =====
function showTab(pageId, btn) {
    document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });
    document.getElementById(pageId).classList.add('active');
    if (btn) {
        document.querySelectorAll('.nav-item').forEach(function (n) { n.classList.remove('active'); });
        btn.classList.add('active');
    }
    if (pageId === 'page-users') renderUserList();
}

// ===== USER LIST =====
function renderUserList() {
    var users = getUsers().filter(function (u) { return u.role !== 'admin'; });
    var container = document.getElementById('users-list-container');
    if (users.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">ยังไม่มีบัญชีผู้ใช้</div>';
        return;
    }
    var roleNames = { staff: 'พนักงาน', owner: 'เจ้าของร้าน' };
    container.innerHTML = users.map(function (u) {
        return '<div class="user-card">' +
            '<div class="user-info">' +
            '<div class="user-name">' + (u.name || u.username) + '</div>' +
            '<div class="user-role">' + (roleNames[u.role] || u.role) + ' | @' + u.username + '</div>' +
            '</div>' +
            '<div class="user-actions">' +
            '<button class="btn btn-sm btn-yellow" onclick="showEditUser(\'' + u.username + '\')">✏️</button>' +
            '<button class="btn btn-sm btn-red" onclick="confirmDeleteUser(\'' + u.username + '\')">🗑️</button>' +
            '</div>' +
            '</div>';
    }).join('');
}

// ===== CREATE USER =====
function showCreateUser() {
    editingUser = null;
    document.getElementById('form-title').textContent = 'สร้างบัญชี';
    document.getElementById('form-subtitle').textContent = 'สร้างบัญชีผู้ใช้ใหม่';
    document.getElementById('form-submit-btn').textContent = 'สร้างบัญชี';
    document.getElementById('f-role').value = '';
    document.getElementById('f-username').value = '';
    document.getElementById('f-password').value = '';
    document.getElementById('f-username').readOnly = false;
    showTab('page-user-form');
}

// ===== EDIT USER =====
function showEditUser(username) {
    var users = getUsers();
    var user = users.find(function (u) { return u.username === username; });
    if (!user) return;
    editingUser = username;
    document.getElementById('form-title').textContent = 'แก้ไขข้อมูล';
    document.getElementById('form-subtitle').textContent = 'แก้ไขบัญชีผู้ใช้';
    document.getElementById('form-submit-btn').textContent = 'บันทึกการแก้ไข';
    document.getElementById('f-role').value = user.role;
    document.getElementById('f-username').value = user.username;
    document.getElementById('f-password').value = ''; // Don't show hashed password
    document.getElementById('pw-hint').style.display = 'block'; // Show hint
    document.getElementById('f-username').readOnly = true;
    showTab('page-user-form');
}

// ===== SUBMIT FORM =====
function submitUserForm() {
    var role = document.getElementById('f-role').value;
    var username = document.getElementById('f-username').value.trim();
    var password = document.getElementById('f-password').value.trim();

    var users = getUsers();
    var existingUser = users.find(function (u) { return u.username === editingUser; });

    if (!role || !username) {
        showToast('กรุณากรอกข้อมูลให้ครบ');
        return;
    }

    if (!editingUser && !password) {
        showToast('กรุณากรอกรหัสผ่านสำหรับบัญชีใหม่');
        return;
    }

    var finalPassword = password;
    if (editingUser && !password && existingUser) {
        finalPassword = existingUser.password; // Keep old password
    } else if (password) {
        // Hash the new password before saving, using the existing sha256 function from auth
        if (typeof sha256 === 'function') {
            finalPassword = sha256(password);
        } else {
            // Fallback if sha256 isn't globally available here (it should be loaded in app.js/auth.js)
            console.error('sha256 function is not available!');
            finalPassword = password;
        }
    }

    // Duplicate username check (for new accounts)
    if (!editingUser) {
        var duplicateCheck = users.find(function (u) { return u.username === username; });
        if (duplicateCheck) {
            showToast('❌ ชื่อบัญชี "' + username + '" มีอยู่แล้วในระบบ กรุณาใช้ชื่ออื่น');
            document.getElementById('f-username').style.borderColor = '#F44336';
            return;
        }
    }
    // Reset border color if valid
    document.getElementById('f-username').style.borderColor = '';

    if (editingUser) {
        // Edit mode
        updateUser(editingUser, { role: role, password: finalPassword, name: username });
        showToast('แก้ไขบัญชีเรียบร้อย ✓');
    } else {
        // Create mode
        if (!addUser(username, finalPassword, role, username)) {
            showToast('❌ ชื่อบัญชีนี้มีอยู่แล้ว');
            return;
        }
        showToast('สร้างบัญชีเรียบร้อย ✓');
    }

    // Refresh UI immediately
    renderUserList();
    setTimeout(syncFromServer, 100); // trigger sync
    showTab('page-users');
}

// ===== DELETE USER =====
function confirmDeleteUser(username) {
    // Create custom confirmation modal for deleting user
    var modal = document.createElement('div');
    modal.className = 'alert-modal show';
    modal.innerHTML = `
        <div class="alert-modal-content" style="padding:24px 20px 0; text-align:center; overflow:hidden;">
            <div style="font-size:2.5rem; margin-bottom:15px;">⚠️</div>
            <h3 style="font-size:1.2rem; font-weight:700; color:#333; margin-bottom:10px;">ยืนยันการลบ</h3>
            <p style="font-size:0.95rem; color:#666; margin-bottom:20px;">ต้องการลบบัญชี "` + username + `" หรือไม่?</p>
            <div style="display:flex; margin:0 -20px; border-top:1px solid #eee;">
                <button id="btn-cancel-del-usr" style="flex:1; padding:14px; background:#f5f5f5; color:#555; border:none; border-right:1px solid #eee; border-radius:0 0 0 20px; font-family:'Prompt',sans-serif; font-size:0.95rem; font-weight:600; cursor:pointer;">ยกเลิก</button>
                <button id="btn-confirm-del-usr" style="flex:1; padding:14px; background:#F44336; color:white; border:none; border-radius:0 0 20px 0; font-family:'Prompt',sans-serif; font-size:0.95rem; font-weight:700; cursor:pointer;">ลบเลย</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('btn-cancel-del-usr').onclick = function () {
        document.body.removeChild(modal);
    };

    document.getElementById('btn-confirm-del-usr').onclick = function () {
        document.body.removeChild(modal);
        deleteUser(username);
        showToast('ลบบัญชีเรียบร้อย ✓');
        renderUserList();
    };
}

// ===== QR CODES =====
function generateStaffQR() {
    var baseUrl = window.location.href.split('admin.html')[0];
    if (!baseUrl.endsWith('/')) baseUrl += '/';
    var SECRET_SALT = 'habeef_secret_2024';
    var encodedStaff = btoa(encodeURIComponent('staff_login|' + SECRET_SALT));
    var staffUrl = baseUrl + 'login.html?s=' + encodeURIComponent(encodedStaff);
    var qrApiBase = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=';

    var qrImg = document.getElementById('qr-staff');
    var qrLink = document.getElementById('qr-staff-url');

    qrImg.src = qrApiBase + encodeURIComponent(staffUrl);
    qrLink.textContent = staffUrl;
    qrLink.href = staffUrl;
}

function generateTableQR() {
    var tableSelect = document.getElementById('qr-table-select');
    if (!tableSelect) return;
    var tableId = tableSelect.value;

    // Construct local explicit URL linking to index.html with param
    var baseUrl = window.location.href.split('admin.html')[0];
    if (!baseUrl.endsWith('/')) baseUrl += '/';
    // Encode tableId for security
    var SECRET_SALT = 'habeef_secret_2024';
    var encodedTable = btoa(encodeURIComponent(tableId + '|' + SECRET_SALT));
    var customerUrl = baseUrl + 'index.html?q=' + encodeURIComponent(encodedTable);

    // Use Chart API or QR API
    var qrApiBase = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=';

    var qrImg = document.getElementById('qr-customer');
    var qrLink = document.getElementById('qr-customer-url');

    qrImg.src = qrApiBase + encodeURIComponent(customerUrl);
    qrLink.textContent = customerUrl;
    qrLink.href = customerUrl;
}

function printTableQR() {
    var tableSelect = document.getElementById('qr-table-select');
    var tableName = tableSelect.options[tableSelect.selectedIndex].text;
    var qrSrc = document.getElementById('qr-customer').src;

    var printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>พิมพ์ QR Code - ${tableName}</title>
            <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@400;700&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Prompt', sans-serif; text-align: center; margin: 40px; }
                .qr-container { border: 2px dashed #333; padding: 40px 20px; max-width: 400px; margin: 0 auto; border-radius: 16px; }
                h1 { margin-bottom: 20px; font-size: 2.5rem; color: #C62828; }
                h2 { margin-top: 20px; font-size: 2rem; }
                img { width: 300px; height: 300px; margin: 0 auto; display: block; }
                p { margin-top: 10px; font-size: 1.2rem; color: #555; }
            </style>
        </head>
        <body>
            <div class="qr-container">
                <h1>ร้านก๋วยเตี๋ยวฮาบีฟ</h1>
                <img src="${qrSrc}" alt="QR Code">
                <h2>${tableName}</h2>
                <p>สแกนสั่งอาหารได้เลย!</p>
            </div>
            <script>
                setTimeout(() => { window.print(); window.close(); }, 500);
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

function printStaffQR() {
    var qrSrc = document.getElementById('qr-staff').src;

    var printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>พิมพ์ QR Code - พนักงาน</title>
            <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@400;700&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Prompt', sans-serif; text-align: center; margin: 40px; }
                .qr-container { border: 2px dashed #333; padding: 40px 20px; max-width: 400px; margin: 0 auto; border-radius: 16px; }
                h1 { margin-bottom: 20px; font-size: 2.5rem; color: #C62828; }
                h2 { margin-top: 20px; font-size: 2rem; color: #1976D2; }
                img { width: 300px; height: 300px; margin: 0 auto; display: block; }
                p { margin-top: 10px; font-size: 1.2rem; color: #555; }
            </style>
        </head>
        <body>
            <div class="qr-container">
                <h1>ร้านก๋วยเตี๋ยวฮาบีฟ</h1>
                <img src="${qrSrc}" alt="QR พนักงาน">
                <h2>สำหรับพนักงานเข้าระบบ</h2>
                <p>สแกนเพื่อเข้าใช้งานระบบหลังบ้าน</p>
            </div>
            <script>
                setTimeout(() => { window.print(); window.close(); }, 500);
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// ===== NOTIFICATIONS SYSTEM =====
var _changePwUsername = '';

function renderNotifications() {
    var container = document.getElementById('notif-list-container');
    if (!container) return;
    var notifs = getNotifications();

    if (notifs.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#aaa; padding:40px 20px;">✅ ไม่มีการแจ้งเตือน</p>';
        return;
    }

    // Sort newest first
    notifs.sort(function (a, b) { return b.id - a.id; });

    var users = typeof getUsers === 'function' ? getUsers() : [];
    var roleNames = { staff: 'พนักงาน', owner: 'เจ้าของร้าน', admin: 'ผู้ดูแลระบบ' };

    var html = '';
    notifs.forEach(function (n) {
        var d = new Date(n.createdAt);
        var timeStr = d.getDate() + '/' + (d.getMonth() + 1) + '/' + (d.getFullYear() + 543) + ' ' +
            d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0') + ' น.';

        var u = users.find(function(user) { return user.username === n.username; });
        var displayRole = u ? (roleNames[u.role] || u.role) : '';
        var accountInfo = n.username + (displayRole ? ' (' + displayRole + ')' : '');

        html += '<div style="background:#fff; border-radius:12px; padding:14px; margin-bottom:10px; box-shadow:0 1px 5px rgba(0,0,0,0.05);">' +
            '<div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">' +
            '<div style="font-size:1.8rem;">🔑</div>' +
            '<div style="flex:1; text-align:center;">' +
            '<div style="font-weight:600; font-size:0.9rem; color:#333;">บัญชี: ' + accountInfo + '</div>' +
            '<div style="font-size:0.8rem; color:#666; margin-top:2px;">' + n.message + '</div>' +
            '<div style="font-size:0.75rem; color:#aaa; margin-top:2px;">' + timeStr + '</div>' +
            '</div>' +
            '</div>' +
            '<div style="display:flex; gap:8px;">' +
            '<button onclick="openChangePwModal(\'' + n.username + '\',' + n.id + ')" style="flex:1; padding:8px; background:#FFC107; color:#333; border:none; border-radius:8px; font-family:Prompt,sans-serif; font-weight:600; font-size:0.8rem; cursor:pointer;">เปลี่ยนรหัสผ่าน</button>' +
            '<button onclick="deleteNotification(' + n.id + ')" style="padding:8px 14px; background:#f5f5f5; color:#888; border:none; border-radius:8px; font-family:Prompt,sans-serif; font-size:0.8rem; cursor:pointer;">ลบ</button>' +
            '</div>' +
            '</div>';
    });

    container.innerHTML = html;
}

function updateNotifBadge() {
    var notifs = getNotifications();
    var count = notifs.length;
    var badges = document.querySelectorAll('.notif-badge');
    badges.forEach(function (b) {
        if (count > 0) {
            b.style.display = 'flex';
            b.textContent = count > 99 ? '99+' : count;
        } else {
            b.style.display = 'none';
        }
    });
}

function openChangePwModal(username, notifId) {
    _changePwUsername = username;
    _changePwNotifId = notifId;
    document.getElementById('change-pw-user').textContent = 'บัญชี: ' + username;
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
    document.getElementById('change-pw-error').style.display = 'none';
    document.getElementById('change-pw-modal').style.display = 'flex';
}

var _changePwNotifId = 0;

function closeChangePwModal() {
    document.getElementById('change-pw-modal').style.display = 'none';
}

function confirmChangePassword() {
    var newPw = document.getElementById('new-password').value.trim();
    var confirmPw = document.getElementById('confirm-password').value.trim();
    var errEl = document.getElementById('change-pw-error');
    errEl.style.display = 'none';

    if (!newPw) {
        errEl.textContent = 'กรุณากรอกรหัสผ่านใหม่';
        errEl.style.display = 'block';
        return;
    }
    if (newPw !== confirmPw) {
        errEl.textContent = 'รหัสผ่านไม่ตรงกัน';
        errEl.style.display = 'block';
        return;
    }

    // Update user password
    var success = updateUser(_changePwUsername, { password: newPw });
    if (!success) {
        errEl.textContent = 'ไม่พบบัญชีผู้ใช้นี้';
        errEl.style.display = 'block';
        return;
    }

    // Remove notification
    deleteNotification(_changePwNotifId);
    closeChangePwModal();
    showToast('เปลี่ยนรหัสผ่านเรียบร้อย ✓');
}

function deleteNotification(id) {
    if (!id) return;

    // Create custom confirmation modal for deleting notification
    var modal = document.createElement('div');
    modal.className = 'alert-modal show';
    modal.innerHTML = `
        <div class="alert-modal-content" style="padding:24px 20px 0; text-align:center; overflow:hidden;">
            <div style="font-size:2.5rem; margin-bottom:15px;">🗑️</div>
            <h3 style="font-size:1.2rem; font-weight:700; color:#333; margin-bottom:10px;">ยืนยันการลบ</h3>
            <p style="font-size:0.95rem; color:#666; margin-bottom:20px;">ต้องการลบการแจ้งเตือนนี้หรือไม่?</p>
            <div style="display:flex; margin:0 -20px; border-top:1px solid #eee;">
                <button id="btn-cancel-del" style="flex:1; padding:14px; background:#f5f5f5; color:#555; border:none; border-right:1px solid #eee; border-radius:0 0 0 20px; font-family:'Prompt',sans-serif; font-size:0.95rem; font-weight:600; cursor:pointer;">ยกเลิก</button>
                <button id="btn-confirm-del" style="flex:1; padding:14px; background:#F44336; color:white; border:none; border-radius:0 0 20px 0; font-family:'Prompt',sans-serif; font-size:0.95rem; font-weight:700; cursor:pointer;">ลบเลย</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('btn-cancel-del').onclick = function () {
        document.body.removeChild(modal);
    };

    document.getElementById('btn-confirm-del').onclick = function () {
        document.body.removeChild(modal);
        // User confirmed
        fetch(window.location.origin + '/api/notifications.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', id: id })
        }).then(function () {
            _fetchNotifications(function () {
                renderNotifications();
                updateNotifBadge();
                showToast('ลบการแจ้งเตือนแล้ว ✓');
            });
        }).catch(function () { });
    };
}

// Auto-update badge and render on page load — now polls MySQL
function _refreshNotificationsAndBadge() {
    _fetchNotifications(function () {
        updateNotifBadge();
        if (document.getElementById('notif-dropdown') &&
            document.getElementById('notif-dropdown').style.display === 'block') {
            renderNotifications();
        }
    });
}
updateNotifBadge();
renderNotifications();
setInterval(_refreshNotificationsAndBadge, 3000);

// Toggle notification dropdown panel
function toggleNotifPanel() {
    var panel = document.getElementById('notif-dropdown');
    if (panel.style.display === 'none' || !panel.style.display) {
        renderNotifications();
        panel.style.display = 'block';
    } else {
        panel.style.display = 'none';
    }
}

// Close dropdown when switching tabs
var _origShowTab = window.showTab;
if (typeof _origShowTab === 'function') {
    window.showTab = function (id, btn) {
        _origShowTab(id, btn);
        var panel = document.getElementById('notif-dropdown');
        if (panel) panel.style.display = 'none';
        updateNotifBadge();
    };
}
