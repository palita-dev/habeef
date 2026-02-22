// ===== ADMIN DASHBOARD =====

var currentUser = null;
var editingUser = null;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function () {
    currentUser = requireAuth(['admin']);
    if (!currentUser) return;
    document.getElementById('acc-name').textContent = currentUser.name || currentUser.username;
    renderUserList();
    generateStaffQR();
    generateTableQR();
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
    document.getElementById('f-password').value = user.password;
    document.getElementById('f-username').readOnly = true;
    showTab('page-user-form');
}

// ===== SUBMIT FORM =====
function submitUserForm() {
    var role = document.getElementById('f-role').value;
    var username = document.getElementById('f-username').value.trim();
    var password = document.getElementById('f-password').value.trim();
    if (!role || !username || !password) {
        showToast('กรุณากรอกข้อมูลให้ครบ');
        return;
    }
    var roleName = role === 'staff' ? 'พนักงาน' : 'เจ้าของร้าน';

    if (editingUser) {
        // Edit mode
        updateUser(editingUser, { role: role, password: password, name: username });
        showToast('แก้ไขบัญชีเรียบร้อย ✓');
    } else {
        // Create mode
        if (!addUser(username, password, role, username)) {
            showToast('ชื่อผู้ใช้นี้มีอยู่แล้ว');
            return;
        }
        showToast('สร้างบัญชีเรียบร้อย ✓');
    }
    showTab('page-users');
}

// ===== DELETE USER =====
function confirmDeleteUser(username) {
    if (confirm('ต้องการลบบัญชี "' + username + '" หรือไม่?')) {
        deleteUser(username);
        showToast('ลบบัญชีเรียบร้อย ✓');
        renderUserList();
    }
}

// ===== QR CODES =====
function generateStaffQR() {
    var baseUrl = window.location.href.split('admin.html')[0];
    if (!baseUrl.endsWith('/')) baseUrl += '/';
    var staffUrl = baseUrl + 'login.html';
    var qrApiBase = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=';

    document.getElementById('qr-staff').src = qrApiBase + encodeURIComponent(staffUrl);
    document.getElementById('qr-staff-url').textContent = staffUrl;
}

function generateTableQR() {
    var tableSelect = document.getElementById('qr-table-select');
    if (!tableSelect) return;
    var tableId = tableSelect.value;

    // Construct local explicit URL linking to index.html with param
    var baseUrl = window.location.href.split('admin.html')[0];
    if (!baseUrl.endsWith('/')) baseUrl += '/';
    var customerUrl = baseUrl + 'index.html?table=' + encodeURIComponent(tableId);

    // Use Chart API or QR API
    var qrApiBase = 'https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=';

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
