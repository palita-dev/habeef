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
            });
        } else {
            renderUserList();
        }
    } else {
        renderUserList();
    }
});



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
    var users = getUsers().filter(function (u) { return u.role === 'staff'; });
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
    var role = 'staff';
    var username = document.getElementById('f-username').value.trim();
    var password = document.getElementById('f-password').value.trim();

    var users = getUsers();
    var existingUser = users.find(function (u) { return u.username === editingUser; });

    if (!username) {
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

    var msg = editingUser ? 'ยืนยันการบันทึกการแก้ไขบัญชี "' + username + '"?' : 'ยืนยันการสร้างบัญชีใหม่ "' + username + '"?';
    if (password && editingUser) {
        msg = 'ยืนยันการแก้ไขข้อมูลและเปลี่ยนรหัสผ่านใหม่สำหรับบัญชี "' + username + '"?';
    }

    showConfirmDialog({
        title: editingUser ? 'ยืนยันการแก้ไข' : 'ยืนยันการสร้างบัญชี',
        message: msg,
        icon: '👤',
        confirmText: editingUser ? 'บันทึกข้อมูล' : 'สร้างบัญชี',
        confirmColor: '#FFC107',
        confirmTextColor: '#333',
        onConfirm: function () {
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
    });
}

function showConfirmDialog(options) {
    var modal = document.createElement('div');
    modal.className = 'alert-modal show';
    modal.style.zIndex = '10000'; // Ensure it's above everything
    modal.innerHTML = `
        <div class="alert-modal-content" style="padding:0; text-align:center; overflow:hidden; border-radius:16px;">
            <div style="padding:30px 20px 20px;">
                <div style="font-size:3rem; margin-bottom:15px;">` + (options.icon || '⚠️') + `</div>
                <h3 style="font-size:1.3rem; font-weight:700; color:#333; margin:0 0 10px 0;">` + (options.title || 'ยืนยันการทำรายการ') + `</h3>
                <p style="font-size:0.95rem; color:#666; margin:0;">` + (options.message || 'คุณต้องการดำเนินการต่อหรือไม่?') + `</p>
            </div>
            <div style="display:flex; border-top:1px solid #eee;">
                <button class="btn" id="dia-confirm" style="flex:1; padding:16px; background:` + (options.confirmColor || '#F44336') + `; color:` + (options.confirmTextColor || 'white') + `; border:none; border-right:1px solid #eee; border-radius:0 0 0 16px; font-family:'Prompt',sans-serif; font-size:1rem; font-weight:700; cursor:pointer;">` + (options.confirmText || 'ตกลง') + `</button>
                <button class="btn" id="dia-cancel" style="flex:1; padding:16px; background:#f5f5f5; color:#555; border:none; border-radius:0 0 16px 0; font-family:'Prompt',sans-serif; font-size:1rem; font-weight:600; cursor:pointer;">` + (options.cancelText || 'ยกเลิก') + `</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('dia-cancel').onclick = function () {
        document.body.removeChild(modal);
        if (typeof options.onCancel === 'function') options.onCancel();
    };

    document.getElementById('dia-confirm').onclick = function () {
        document.body.removeChild(modal);
        if (typeof options.onConfirm === 'function') options.onConfirm();
    };
}

// ===== DELETE USER =====
function confirmDeleteUser(username) {
    showConfirmDialog({
        title: 'ยืนยันการลบ',
        message: 'ต้องการลบบัญชี "' + username + '" หรือไม่?',
        icon: '⚠️',
        confirmText: 'ลบเลย',
        confirmColor: '#F44336',
        onConfirm: function () {
            deleteUser(username);
            showToast('ลบบัญชีเรียบร้อย ✓');
            renderUserList();
        }
    });
}

// ===== QR CODES =====
function generateStaffQR() {
    var baseUrl = window.location.href.split('admin.html')[0];
    if (!baseUrl.endsWith('/')) baseUrl += '/';
    var salt = window.SECRET_SALT || 'habeef_secret_2024';
    var encodedStaff = btoa(encodeURIComponent('staff_login|' + salt));
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
    var salt = window.SECRET_SALT || 'habeef_secret_2024';
    var encodedTable = btoa(encodeURIComponent(tableId + '|' + salt));
    var customerUrl = baseUrl + '?q=' + encodeURIComponent(encodedTable);

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


