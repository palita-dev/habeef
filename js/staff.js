// ===== STAFF DASHBOARD =====

var currentUser = null;
var calendarYear, calendarMonth, selectedDate;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function () {
    currentUser = requireAuth(['staff']);
    if (!currentUser) return;
    document.getElementById('acc-name').textContent = currentUser.name || currentUser.username;
    document.getElementById('acc-role').textContent = 'พนักงาน';
    var now = new Date();
    calendarYear = now.getFullYear();
    calendarMonth = now.getMonth();
    selectedDate = null;
    renderTableGrid();
    // Auto refresh every 10s
    setInterval(function () {
        var active = document.querySelector('.page.active');
        if (active && active.id === 'page-orders') renderTableGrid();
        if (active && active.id === 'page-payment') refreshPayment();
    }, 10000);
});

// ===== TAB NAVIGATION =====
function showTab(pageId, btn) {
    document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });
    document.getElementById(pageId).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(function (n) { n.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    if (pageId === 'page-orders') renderCurrentView();
    if (pageId === 'page-payment') refreshPayment();
    if (pageId === 'page-history') { renderCalendar(); renderHistoryOrders(); }
}

// ===== VIEW MODE TOGGLE =====
var currentViewMode = 'grid';

function setViewMode(mode) {
    currentViewMode = mode;
    document.getElementById('btn-grid-mode').classList.toggle('active', mode === 'grid');
    document.getElementById('btn-list-mode').classList.toggle('active', mode === 'list');
    document.getElementById('table-grid').style.display = mode === 'grid' ? 'grid' : 'none';
    document.getElementById('order-list-view').style.display = mode === 'list' ? 'block' : 'none';
    if (mode === 'grid') renderTableGrid();
    if (mode === 'list') renderOrderList();
}

function renderCurrentView() {
    if (currentViewMode === 'grid') renderTableGrid();
    else renderOrderList();
}

// ===== ORDER LIST VIEW =====
function renderOrderList() {
    var container = document.getElementById('order-list-view');
    if (!container) return;
    var orders = getOrders().filter(function (o) { return o.status === 'pending'; });

    if (orders.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">ไม่มีออเดอร์ที่รอดำเนินการ 🎉</div>';
        return;
    }

    var html = '';
    orders.forEach(function (order) {
        var d = new Date(order.createdAt);
        var dateStr = d.getDate() + '/' + (d.getMonth() + 1) + '/' + (d.getFullYear() + 543);
        var timeStr = d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0') + ' น.';
        var tableLabel = order.table === 'กลับบ้าน' ? '🛍️ ' + order.table : 'โต๊ะ ' + order.table;
        var isServed = order.status === 'served';

        html += '<div class="ol-group">';
        html += '<div class="ol-header">';
        html += '<span class="ol-table-badge">' + tableLabel + '</span>';
        html += '<div class="ol-meta">วันที่ ' + dateStr + '<br>เวลา ' + timeStr + '</div>';
        html += '</div>';

        order.items.forEach(function (item, idx) {
            var emoji = MENU_EMOJIS[item.menuId] || '🍜';
            var itemId = order.orderId + '-' + idx;
            html += '<div class="ol-item" id="olitem-' + itemId + '">';
            html += '<div class="ol-num">' + String(idx + 1).padStart(2, '0') + '</div>';
            html += '<div class="ol-img">' + emoji + '</div>';
            html += '<div class="ol-info">';
            html += '<div class="ol-name">' + item.name + '</div>';
            html += '<div class="ol-detail">' + item.details.join('<br>') + '</div>';
            html += '</div>';
            html += '<label class="ol-check">';
            html += '<input type="checkbox" class="list-check-' + order.orderId + '" onchange="validateListServeBtn(\'' + order.orderId + '\', this)">';
            html += '<span>ทำแล้ว</span>';
            html += '</label>';
            html += '</div>';
        });

        html += '<div class="ol-actions">';
        html += '<button class="btn-serve" id="btn-serve-' + order.orderId + '" onclick="serveOrder(\'' + order.orderId + '\')" style="opacity:0.5; filter:grayscale(1);" disabled>เสิร์ฟ ✓</button>';
        html += '</div>';
        html += '</div>';
    });
    container.innerHTML = html;
}

function validateListServeBtn(orderId, checkbox) {
    if (checkbox) {
        var row = checkbox.closest('.ol-item');
        if (row) row.style.opacity = checkbox.checked ? '0.5' : '1';
    }

    var btn = document.getElementById('btn-serve-' + orderId);
    if (!btn) return;

    var checkboxes = document.querySelectorAll('.list-check-' + orderId);
    if (checkboxes.length === 0) return;

    var allChecked = true;
    for (var i = 0; i < checkboxes.length; i++) {
        if (!checkboxes[i].checked) {
            allChecked = false;
            break;
        }
    }

    btn.disabled = !allChecked;
    if (allChecked) {
        btn.style.opacity = '1';
        btn.style.filter = 'grayscale(0)';
    } else {
        btn.style.opacity = '0.5';
        btn.style.filter = 'grayscale(1)';
    }
}

function serveOrder(orderId) {
    var orders = getOrders();
    var idx = orders.findIndex(function (o) { return o.orderId === orderId; });
    if (idx !== -1) {
        orders[idx].status = 'served';
        saveOrders(orders);
        showToast('เสิร์ฟออเดอร์แล้ว ✓');
        // Refresh whichever view is active
        renderOrderList();
        // If modal is open, refresh its content too
        if (currentDetailTable) openTableDetail(currentDetailTable);
    }
}

// ===== TABLE GRID DASHBOARD =====
function renderTableGrid() {
    // Only pending orders keep the table "busy" on the dashboard
    var orders = getOrders().filter(function (o) { return o.status === 'pending'; });
    var container = document.getElementById('table-grid');
    if (!container) return;

    var tables = [];
    for (var i = 1; i <= 10; i++) tables.push(String(i));

    var takeawayTables = new Set();
    orders.forEach(function (o) {
        if (o.table && o.table.startsWith('กลับบ้าน')) {
            takeawayTables.add(o.table);
        }
    });

    if (takeawayTables.size > 0) {
        var taArr = Array.from(takeawayTables).sort(function (a, b) {
            var numA = parseInt((a.match(/\d+/) || [0])[0]);
            var numB = parseInt((b.match(/\d+/) || [0])[0]);
            return numA - numB;
        });
        taArr.forEach(function (t) { tables.push(t); });
    } else {
        tables.push('กลับบ้าน');
    }

    var html = '';
    tables.forEach(function (t) {
        var tableOrders = orders.filter(function (o) { return o.table === t; });
        var total = tableOrders.reduce(function (sum, o) { return sum + o.totalPrice; }, 0);
        var isBusy = tableOrders.length > 0;
        var isSpecial = t.startsWith('กลับบ้าน');
        var statusClass = isBusy ? 'busy' : 'free';
        var icon = isSpecial ? '🛍️' : '🪑';
        var label = isSpecial ? t : 'โต๊ะ ' + t;
        var tableNum = isSpecial ? '' : '<div class="tc-num">' + t + '</div>';

        html += '<div class="table-card ' + statusClass + '" onclick="openTableDetail(\'' + t + '\')">';
        html += '<div class="tc-icon">' + icon + '</div>';
        html += tableNum;
        html += '<div class="tc-label">' + label + '</div>';
        if (isBusy) {
            html += '<div class="tc-status busy-badge">🔴 ' + tableOrders.length + ' ออเดอร์</div>';
            html += '<div class="tc-total">' + total.toLocaleString() + ' ฿</div>';
        } else {
            html += '<div class="tc-status free-badge">🟢 ว่าง</div>';
        }
        html += '</div>';
    });
    container.innerHTML = html;
}

// ===== TABLE DETAIL & COMMANDS =====
var currentDetailTable = null;

function openTableDetail(tableId) {
    currentDetailTable = tableId;
    var modal = document.getElementById('table-modal');
    var title = document.getElementById('modal-title');
    var body = document.getElementById('modal-body');
    var btnServeAll = document.getElementById('btn-serve-all');

    var tableLabel = tableId.startsWith('กลับบ้าน') ? '🛒️ ' + tableId : 'โต๊ะ ' + tableId;
    title.textContent = tableLabel;
    modal.classList.add('show');

    var orders = getOrders().filter(function (o) {
        return o.table === tableId && o.status === 'pending';
    });

    if (orders.length === 0) {
        body.innerHTML = '<div style="text-align:center;color:#888;padding:30px;">ไม่มีรายการที่ค้างอยู่</div>';
        btnServeAll.style.display = 'none';
        return;
    }

    var hasPending = orders.some(function (o) { return o.status === 'pending'; });
    btnServeAll.style.display = hasPending ? 'block' : 'none';
    btnServeAll.onclick = function () { serveAllOrders(); };

    var html = '';
    var itemCounter = 1;
    orders.forEach(function (order, orderIdx) {
        var d = new Date(order.createdAt);
        var dateStr = d.getDate() + '/' + (d.getMonth() + 1) + '/' + (d.getFullYear() + 543);
        var timeStr = d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0') + ' น.';
        var isServed = order.status === 'served';

        if (orders.length > 1) {
            html += '<div style="font-size:0.72rem;color:#aaa;padding:6px 0 4px;">ออเดอร์ ' + (orderIdx + 1) + ' · ' + dateStr + ' เวลา ' + timeStr + (isServed ? ' ✅' : '') + '</div>';
        }

        order.items.forEach(function (item) {
            var emoji = MENU_EMOJIS[item.menuId] || '🍜';
            for (var q = 0; q < item.qty; q++) {
                html += '<div class="ol-item" style="border-radius:12px;border:1px solid #eee;margin-bottom:8px;">';
                html += '<div class="ol-num">' + String(itemCounter).padStart(2, '0') + '</div>';
                html += '<div class="ol-img">' + emoji + '</div>';
                html += '<div class="ol-info">';
                html += '<div class="ol-name">' + item.name + '</div>';
                html += '<div class="ol-detail">' + item.details.join('<br>') + '</div>';
                html += '</div>';
                html += '<label class="ol-check">';
                html += '<input type="checkbox" class="modal-item-checkbox"' + (isServed ? ' checked disabled' : '') + ' onchange="validateServeBtn()">';
                html += '<span>ทำแล้ว</span>';
                html += '</label>';
                html += '</div>';
                itemCounter++;
            }
        });
    });
    body.innerHTML = html;

    // Initial validation check
    validateServeBtn();
}

function validateServeBtn() {
    var btnServeAll = document.getElementById('btn-serve-all');
    if (!btnServeAll) return;

    var checkboxes = document.querySelectorAll('.modal-item-checkbox:not(:disabled)');
    if (checkboxes.length === 0) {
        btnServeAll.disabled = false; // All served or empty
        return;
    }

    var allChecked = true;
    for (var i = 0; i < checkboxes.length; i++) {
        if (!checkboxes[i].checked) {
            allChecked = false;
            break;
        }
    }

    btnServeAll.disabled = !allChecked;
    if (allChecked) {
        btnServeAll.style.opacity = '1';
        btnServeAll.style.filter = 'grayscale(0)';
    } else {
        btnServeAll.style.opacity = '0.5';
        btnServeAll.style.filter = 'grayscale(1)';
    }
}

function closeModal() {
    document.getElementById('table-modal').classList.remove('show');
    currentDetailTable = null;
}

function serveAllOrders() {
    var btn = document.getElementById('btn-serve-all');
    if (btn && btn.disabled) return;

    if (!currentDetailTable) return;
    var orders = getOrders();
    var count = 0;
    orders.forEach(function (o) {
        if (o.table === currentDetailTable && o.status === 'pending') {
            o.status = 'served';
            count++;
        }
    });
    if (count > 0) {
        saveOrders(orders);
        showToast('เสิร์ฟ ' + count + ' ออเดอร์แล้ว ✓');

        // Ensure UI refreshes to move orders to payment page
        renderCurrentView();

        // Auto-close modal since items are cleared if all served
        closeModal();
    }
}

function processPayment(tableId) {
    if (!confirm('ยืนยันรับชำระเงิน โต๊ะ ' + tableId + '?')) return;

    var orders = getOrders();
    var now = new Date().toISOString();
    var count = 0;

    var isGuestPaid = tableId.startsWith('GUEST_');
    var targetGuestId = isGuestPaid ? tableId.substring(6) : null;

    orders.forEach(function (o) {
        var match = false;
        if (isGuestPaid) {
            match = o.guestId === targetGuestId && o.table && o.table.startsWith('กลับบ้าน');
        } else {
            match = o.table === tableId;
        }

        if (match && (o.status === 'pending' || o.status === 'served')) {
            o.status = 'paid';
            o.paidAt = now;
            count++;
        }
    });

    saveOrders(orders);
    showToast('ชำระเงินเรียบร้อย (' + count + ' บิล)');
    closeModal();
    renderTableGrid();
}

function handleCmd(e) {
    if (e.key === 'Enter') execCmd();
}

function execCmd() {
    var input = document.getElementById('cmd-input');
    var cmd = input.value.trim();
    if (!cmd) return;

    var parts = cmd.split(' ');
    var action = parts[0].toLowerCase();
    var arg = parts[1];

    // Shorthand: plain number → open bill for that table
    // 0 = กลับบ้าน, 1-10 = table number
    if (/^\d+$/.test(cmd)) {
        var num = parseInt(cmd);
        var tableId = num === 0 ? 'กลับบ้าน' : String(num);
        openTableDetail(tableId);
        input.value = '';
        return;
    }

    if (action === '/bill' && arg) {
        var tId = arg === '0' ? 'กลับบ้าน' : arg;
        openTableDetail(tId);
        input.value = '';
    } else if (action === '/pay' && arg) {
        var pId = arg === '0' ? 'กลับบ้าน' : arg;
        processPayment(pId);
        input.value = '';
    } else {
        showToast('พิมพ์เลข 0-10 หรือ /bill 1 หรือ /pay 1');
    }
}

// Auto refresh
setInterval(function () {
    var active = document.querySelector('.page.active');
    if (active && active.id === 'page-orders') renderTableGrid();
    // Payment tab might need updates too, but less critical for this view
}, 5000);

// ===== PAYMENT TAB =====
function refreshPayment() {
    var allOrders = getOrders().filter(function (o) { return o.status === 'served'; });
    var container = document.getElementById('payment-container');

    if (allOrders.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">ไม่มีออเดอร์รอชำระ</div>';
        return;
    }

    // Group by table or guestId for takeaways
    var groupMap = {};
    allOrders.forEach(function (o) {
        var groupKey = o.table;
        if (o.table && o.table.startsWith('กลับบ้าน') && o.guestId) {
            groupKey = 'GUEST_' + o.guestId;
        } else if (!groupKey) {
            groupKey = '-';
        }
        if (!groupMap[groupKey]) groupMap[groupKey] = [];
        groupMap[groupKey].push(o);
    });

    var html = '';
    Object.keys(groupMap).forEach(function (groupKey) {
        var orders = groupMap[groupKey];
        var firstOrder = orders[0];

        var d = new Date(firstOrder.createdAt);
        var dateStr = d.getDate() + '/' + (d.getMonth() + 1) + '/' + (d.getFullYear() + 543);
        var timeStr = d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0') + ':' + d.getSeconds().toString().padStart(2, '0');

        var displayTableName = firstOrder.table;
        var tIds = [];
        if (groupKey.startsWith('GUEST_')) {
            orders.forEach(function (o) {
                if (!tIds.includes(o.table)) tIds.push(o.table);
            });
            var formattedTIds = tIds.map(function (t, idx) {
                if (idx === 0) return t;
                return t.replace('กลับบ้าน', '').trim();
            });
            displayTableName = formattedTIds.join(', ');
        }

        var tableLabel = displayTableName.startsWith('กลับบ้าน') ? '🛍️ ' + displayTableName : 'โต๊ะ ' + displayTableName;
        var grandTotal = orders.reduce(function (s, o) { return s + o.totalPrice; }, 0);

        html += '<div class="receipt-card">';

        // Section bar: yellow with back circle icon on right
        html += '<div class="receipt-card-header">';
        html += '<span class="receipt-header-title">ใบเสร็จรายการที่สั่งซื้อ</span>';
        html += '<div class="receipt-back-circle">⊙</div>';
        html += '</div>';

        // Info row: date/time on left, table badge on right
        html += '<div class="receipt-meta">';
        html += '<div class="receipt-date-block">';
        html += '<div>วันที่ ' + dateStr + '</div>';
        html += '<div>เวลา ' + timeStr + '</div>';
        html += '</div>';
        html += '<span class="receipt-table-badge">' + tableLabel + '</span>';
        html += '</div>';

        // Column headers
        html += '<div class="receipt-col-header">';
        html += '<span class="rch-item">รายการ</span>';
        html += '<span class="rch-price">ราคา</span>';
        html += '<span class="rch-qty">จำนวน</span>';
        html += '</div>';

        // Item cards
        var lineNum = 1;
        orders.forEach(function (order) {
            order.items.forEach(function (item) {
                var emoji = MENU_EMOJIS[item.menuId] || '🍜';
                html += '<div class="rit-card">';
                html += '<div class="rit-card-body">';
                html += '<div class="rit-num">' + lineNum + '</div>';
                html += '<div class="rit-img">' + emoji + '</div>';
                html += '<div class="rit-info">';
                html += '<div class="rit-name">' + item.name + '</div>';
                item.details.forEach(function (det) {
                    html += '<div class="rit-detail">' + det + '</div>';
                });
                html += '</div>';
                html += '<div class="rit-price">' + item.totalPrice + ' ฿</div>';
                html += '<div class="rit-qty">' + item.qty + '</div>';
                html += '</div>'; // body
                html += '<div class="rit-subtotal"><span>รวม</span><span>' + item.totalPrice + ' ฿</span></div>';
                html += '</div>'; // card
                lineNum++;
            });
        });

        // Grand Total bar
        html += '<div class="receipt-grand-total"><span>รวมทั้งหมด</span><span>' + grandTotal.toLocaleString() + ' บาท</span></div>';

        // Pay button
        html += '<button class="receipt-pay-btn" onclick="payTable(\'' + groupKey + '\', \'' + displayTableName + '\')">รับชำระเงิน</button>';
        html += '</div>'; // receipt-card
    });

    container.innerHTML = html;
}

function payOrder(orderId) {
    var orders = getOrders();
    var idx = orders.findIndex(function (o) { return o.orderId === orderId; });
    if (idx !== -1) {
        orders[idx].status = 'paid';
        orders[idx].paidAt = new Date().toISOString();
        saveOrders(orders);
        showToast('รับชำระเงินเรียบร้อย ✓');
        refreshPayment();
    }
}

function payTable(tableId, displayTableName) {
    if (!confirm('ยืนยันรับชำระเงิน ' + (displayTableName || tableId) + '?')) return;
    var orders = getOrders();
    var now = new Date().toISOString();
    var count = 0;

    var isGuestPaid = tableId.startsWith('GUEST_');
    var targetGuestId = isGuestPaid ? tableId.substring(6) : null;

    orders.forEach(function (o) {
        var match = false;
        if (isGuestPaid) {
            match = o.guestId === targetGuestId && o.table && o.table.startsWith('กลับบ้าน');
        } else {
            match = o.table === tableId;
        }

        if (match && o.status === 'served') {
            o.status = 'paid';
            o.paidAt = now;
            count++;
        }
    });
    saveOrders(orders);
    showToast('ชำระเงินเรียบร้อย ' + count + ' บิล ✓');
    refreshPayment();
    renderCurrentView();
}

// ===== HISTORY TAB =====
function renderCalendar() {
    var container = document.getElementById('calendar-container');
    var firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    var daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    var today = new Date();
    var orders = getOrders().filter(function (o) { return o.status === 'paid'; });
    // Find dates with data
    var datesWithData = {};
    orders.forEach(function (o) {
        var dk = o.paidAt ? o.paidAt.split('T')[0] : o.createdAt.split('T')[0];
        datesWithData[dk] = true;
    });

    var yearBE = calendarYear + 543;
    var html = '<div class="calendar-card">';
    html += '<div class="calendar-header">';
    html += '<button onclick="changeMonth(-1)">◀</button>';
    html += '<span>' + THAI_MONTHS[calendarMonth] + ' ' + yearBE + '</span>';
    html += '<button onclick="changeMonth(1)">▶</button>';
    html += '</div>';
    html += '<div class="calendar-grid">';
    var dayNames = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'];
    dayNames.forEach(function (d) { html += '<div class="cal-day-header">' + d + '</div>'; });
    // Adjust firstDay (JS: 0=Sun, we want Mon=0)
    var startDay = (firstDay === 0) ? 6 : firstDay - 1;
    for (var i = 0; i < startDay; i++) html += '<div class="cal-day empty"></div>';
    for (var d = 1; d <= daysInMonth; d++) {
        var dateStr = calendarYear + '-' + String(calendarMonth + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
        var cls = 'cal-day';
        if (selectedDate === dateStr) cls += ' selected';
        else if (datesWithData[dateStr]) cls += ' has-data';
        else if (d === today.getDate() && calendarMonth === today.getMonth() && calendarYear === today.getFullYear()) cls += ' today';
        html += '<div class="' + cls + '" onclick="selectDate(\'' + dateStr + '\')">' + d + '</div>';
    }
    html += '</div></div>';
    container.innerHTML = html;
}

function changeMonth(delta) {
    calendarMonth += delta;
    if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
    if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
    // Limit to 3 months back
    var now = new Date();
    var minDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    var current = new Date(calendarYear, calendarMonth, 1);
    if (current < minDate) { calendarYear = minDate.getFullYear(); calendarMonth = minDate.getMonth(); }
    var maxDate = new Date(now.getFullYear(), now.getMonth(), 1);
    if (current > maxDate) { calendarYear = maxDate.getFullYear(); calendarMonth = maxDate.getMonth(); }
    selectedDate = null;
    renderCalendar();
    renderHistoryOrders();
}

function selectDate(dateStr) {
    selectedDate = dateStr;
    var parts = dateStr.split('-');
    var d = parseInt(parts[2]);
    var m = parseInt(parts[1]) - 1;
    var y = parseInt(parts[0]);
    document.getElementById('history-date-label').textContent = d + ' ' + THAI_MONTHS[m] + ' ' + (y + 543);
    renderCalendar();
    renderHistoryOrders();
}

function renderHistoryOrders() {
    var container = document.getElementById('history-container');
    var orders = getOrders().filter(function (o) { return o.status === 'paid'; });
    if (selectedDate) {
        orders = orders.filter(function (o) {
            var dk = o.paidAt ? o.paidAt.split('T')[0] : o.createdAt.split('T')[0];
            return dk === selectedDate;
        });
    } else {
        container.innerHTML = '';
        return;
    }

    // Sort newest to oldest
    orders.sort(function (a, b) {
        var dateA = new Date(a.paidAt || a.createdAt);
        var dateB = new Date(b.paidAt || b.createdAt);
        return dateB - dateA;
    });

    if (orders.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:30px;color:#999;">ไม่มีออเดอร์ในวันนี้</div>';
        return;
    }

    var html = '';
    orders.forEach(function (order) {
        html += '<div class="order-group">';
        html += '<div class="order-group-header">';
        html += '<span class="table-badge">โต๊ะ ' + (order.table || '-') + '</span>';
        html += '<div class="order-time">' + formatDateThai(order.createdAt) + '</div>';
        html += '</div>';
        order.items.forEach(function (item, idx) {
            var emoji = MENU_EMOJIS[item.menuId] || '🍜';
            for (var q = 0; q < item.qty; q++) {
                html += '<div class="order-item">';
                html += '<div class="order-num">' + String(idx + 1 + q).padStart(2, '0') + '</div>';
                html += '<div class="order-emoji">' + emoji + '</div>';
                html += '<div class="order-info">';
                html += '<div class="order-name">' + item.name + '</div>';
                html += '<div class="order-detail">' + item.details.join('<br>') + '</div>';
                html += '</div>';
                html += '<div class="order-price">' + item.totalPrice + ' ฿</div>';
                html += '</div>';
            }
        });
        html += '<div class="order-actions" style="justify-content:space-between;border-top:1px dashed #ddd;padding-top:12px;">';
        html += '<span style="font-weight:700;">รวมทั้งหมด ' + order.totalPrice + ' ฿</span>';
        html += '</div></div>';
    });
    container.innerHTML = html;
}
// (Helpers: getOrders, saveOrders, THAI_MONTHS, MENU_EMOJIS, formatDateThai are provided by auth.js)
