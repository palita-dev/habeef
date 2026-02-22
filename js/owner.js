// ===== OWNER DASHBOARD =====

var currentUser = null;

var ALL_INGREDIENTS = [
    'เส้นเล็ก', 'เส้นใหญ่', 'เส้นหมี่ขาว', 'เส้นหมี่หยก', 'เส้นหมี่เหลือง',
    'ผักบุ้ง', 'ถั่วงอก', 'ลูกชิ้น', 'เนื้อวัว', 'น่องไก่', 'ไข่', 'กุ้ง', 'หมึก'
];

var ING_EMOJIS = {
    'เส้นเล็ก': '🍜', 'เส้นใหญ่': '🍝', 'เส้นหมี่ขาว': '🍚', 'เส้นหมี่หยก': '🥬', 'เส้นหมี่เหลือง': '🟡',
    'ผักบุ้ง': '🥗', 'ถั่วงอก': '🌱', 'ลูกชิ้น': '🟤', 'เนื้อวัว': '🥩', 'น่องไก่': '🍗',
    'ไข่': '🥚', 'กุ้ง': '🦐', 'หมึก': '🦑'
};

var ING_UNITS = {
    'เส้นเล็ก': 'ถุง', 'เส้นใหญ่': 'ถุง', 'เส้นหมี่ขาว': 'ถุง', 'เส้นหมี่หยก': 'ถุง', 'เส้นหมี่เหลือง': 'ถุง',
    'ผักบุ้ง': 'กก.', 'ถั่วงอก': 'กก.', 'ลูกชิ้น': 'ถุง', 'เนื้อวัว': 'กก.', 'น่องไก่': 'กก.',
    'ไข่': 'แผง', 'กุ้ง': 'กก.', 'หมึก': 'กก.'
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function () {
    currentUser = requireAuth(['owner']);
    if (!currentUser) return;
    document.getElementById('acc-name').textContent = currentUser.name || currentUser.username;

    // Populate dropdown
    var sel = document.getElementById('si-item');
    ALL_INGREDIENTS.forEach(function (ing) {
        var opt = document.createElement('option');
        opt.value = ing; opt.textContent = ing;
        sel.appendChild(opt);
    });

    var today = new Date();
    var dayStr = today.getDate() + '/' + (today.getMonth() + 1) + '/' + (today.getFullYear() + 543);
    document.getElementById('report-date').textContent = 'วันที่ ' + dayStr;

    renderStockInToday();
    renderRemaining();
    renderReport();
    populateIngList();
});

// ===== TAB NAVIGATION =====
function showTab(pageId, btn) {
    document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });
    document.getElementById(pageId).classList.add('active');
    if (btn) {
        document.querySelectorAll('.nav-item').forEach(function (n) { n.classList.remove('active'); });
        btn.classList.add('active');
    }
    if (pageId === 'page-remaining') renderRemaining();
    if (pageId === 'page-report') renderReport();
    if (pageId === 'page-stockin') renderStockInToday();
}

// ===== STOCK IN =====
function handleItemChange() {
    var item = document.getElementById('si-item').value;
    var unitInput = document.getElementById('si-unit');
    var unitLabel = document.getElementById('si-unit-label');

    if (item && ING_UNITS[item]) {
        var unit = ING_UNITS[item];
        var displayUnit = unit;
        if (unit === 'กก.') displayUnit = 'กิโลกรัม';
        if (unit === 'ถุง') displayUnit = 'ถุง';
        if (unit === 'แผง') displayUnit = 'แผง';

        unitInput.value = unit;
        unitLabel.textContent = displayUnit;
    } else {
        unitInput.value = '';
        unitLabel.textContent = 'จำนวน';
    }
}

function clearStockInForm() {
    var itemEl = document.getElementById('si-item');
    var qtyEl = document.getElementById('si-qty');
    var unitEl = document.getElementById('si-unit');
    var labelEl = document.getElementById('si-unit-label');
    if (itemEl) itemEl.value = '';
    if (qtyEl) qtyEl.value = '';
    if (unitEl) unitEl.value = '';
    if (labelEl) labelEl.textContent = '\u0e08\u0e33\u0e19\u0e27\u0e19';
    // Reset custom dropdown display
    var disp = document.getElementById('si-item-display');
    if (disp) {
        disp.innerHTML = '\u0e40\u0e25\u0e37\u0e2d\u0e01\u0e27\u0e31\u0e15\u0e16\u0e38\u0e14\u0e34\u0e1a<span style="position:absolute;right:12px;top:50%;transform:translateY(-50%);pointer-events:none;font-size:0.85rem;color:#777;">&#9660;</span>';
        disp.style.color = '#999';
    }
    var list = document.getElementById('si-item-list');
    if (list) list.style.display = 'none';
}

function populateIngList() {
    var list = document.getElementById('si-item-list');
    if (!list) return;
    list.innerHTML = ALL_INGREDIENTS.map(function (name) {
        return '<div onclick="selectIngredient(\'' + name + '\')" ' +
            'style="padding:12px 16px; font-size:1rem; cursor:pointer; border-bottom:1px solid #f0f0f0; color:#333;" ' +
            'onmouseover="this.style.background=\'#FFF8E1\'" onmouseout="this.style.background=\'#fff\'">' +
            (ING_EMOJIS[name] || '\ud83d\udce6') + ' ' + name +
            '</div>';
    }).join('');
}

function toggleIngDropdown() {
    var list = document.getElementById('si-item-list');
    if (!list) return;
    list.style.display = (list.style.display === 'none') ? 'block' : 'none';
}

function selectIngredient(name) {
    document.getElementById('si-item').value = name;
    var disp = document.getElementById('si-item-display');
    if (disp) {
        disp.childNodes[0].textContent = (ING_EMOJIS[name] || '\ud83d\udce6') + ' ' + name;
        disp.style.color = '#333';
    }
    document.getElementById('si-item-list').style.display = 'none';
    // Update unit label
    var unit = ING_UNITS[name] || '\u0e2b\u0e19\u0e48\u0e27\u0e22';
    document.getElementById('si-unit').value = unit;
    document.getElementById('si-unit-label').textContent = '\u0e08\u0e33\u0e19\u0e27\u0e19 (' + unit + ')';
    document.getElementById('si-qty').focus();
}

function showStockInForm() {
    clearStockInForm();
    document.getElementById('stockin-form-container').style.display = 'flex';
    // Auto-open the ingredient list immediately
    var list = document.getElementById('si-item-list');
    if (list) list.style.display = 'block';
}

function hideStockInForm() {
    clearStockInForm();
    document.getElementById('stockin-form-container').style.display = 'none';
}

function getStockIn() {
    return JSON.parse(localStorage.getItem('habeef_stock_in') || '{}');
}
function saveStockIn(data) {
    localStorage.setItem('habeef_stock_in', JSON.stringify(data));
}

function addStockIn() {
    var item = document.getElementById('si-item').value;
    var qty = parseInt(document.getElementById('si-qty').value);
    var unit = document.getElementById('si-unit').value.trim();

    if (!item || !qty || qty <= 0) {
        showToast('กรุณากรอกข้อมูลให้ครบและถูกต้อง');
        return;
    }
    if (!unit) unit = ING_UNITS[item] || 'หน่วย';

    var dateKey = getDateKey(new Date());
    var data = getStockIn();
    if (!data[dateKey]) data[dateKey] = {};
    if (!data[dateKey][item]) data[dateKey][item] = { qty: 0, unit: unit, entries: [] };

    // เพิ่มใหม่
    data[dateKey][item].qty += qty;
    data[dateKey][item].unit = unit;
    data[dateKey][item].entries.push({ qty: qty, unit: unit, time: new Date().toISOString() });
    showToast('บันทึก ' + item + ' ' + qty + ' ' + unit + ' เรียบร้อย ✓');

    saveStockIn(data);
    hideStockInForm();
    renderStockInToday();
}

function renderStockInToday() {
    var dateKey = getDateKey(new Date());
    var data = getStockIn();
    var today = data[dateKey] || {};
    var container = document.getElementById('stockin-list-container');

    // สร้างลิสต์ของลอคทั้งหมดของวันนี้
    var allEntries = [];
    var needsSave = false;

    Object.keys(today).forEach(function (itemName) {
        var itemData = today[itemName];

        // Backward compatibility for old data that doesn't have 'entries' or is just a primitive
        if (typeof itemData === 'number' || !itemData || !itemData.entries) {
            // Use 8:00 AM of today as a fallback time for old data to put them at the bottom
            var oldTime = new Date();
            oldTime.setHours(8, 0, 0, 0);

            var qtyVal = 0;
            var unitVal = ING_UNITS[itemName] || 'หน่วย';

            if (typeof itemData === 'number') {
                qtyVal = itemData;
            } else if (itemData && typeof itemData.qty === 'number') {
                qtyVal = itemData.qty;
                if (itemData.unit) unitVal = itemData.unit;
            }

            // Create a brand new object to replace the old primitive/incomplete data
            today[itemName] = {
                qty: qtyVal,
                unit: unitVal,
                entries: [{
                    qty: qtyVal,
                    unit: unitVal,
                    time: oldTime.toISOString()
                }]
            };
            itemData = today[itemName];
            needsSave = true;
        }

        itemData.entries.forEach(function (entry, index) {
            allEntries.push({
                name: itemName,
                qty: entry.qty,
                unit: entry.unit,
                time: entry.time,
                index: index // keep original index within item's array
            });
        });
    });

    if (needsSave) {
        saveStockIn(data); // save the migrated structure back
    }

    if (allEntries.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:20px;color:#999;font-size:0.82rem;">ยังไม่มีรายการบันทึกวันนี้</div>';
        return;
    }

    // เรียงจากใหม่ไปเก่า
    allEntries.sort(function (a, b) {
        return new Date(b.time) - new Date(a.time);
    });

    var html = '';

    // 1. ส่วนล่าสุด (Latest) - อันดับแรกสุดในอาเรย์
    var latest = allEntries[0];
    var latestTimeStr = new Date(latest.time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    var dateStrShow = new Date().toLocaleDateString('th-TH');

    html += '<div style="display:flex; justify-content:space-between; margin-bottom:8px;">';
    html += '<span style="color:#D32F2F; font-weight:600; font-size:1rem;">ล่าสุด</span>';
    html += '<span style="color:#888; font-size:0.9rem;">' + dateStrShow + '</span>';
    html += '</div>';

    html += '<div class="user-card" style="box-shadow: 0 2px 8px rgba(0,0,0,0.08); border: 1px solid #eee; border-radius: 12px; padding: 12px; margin-bottom: 4px;">';
    html += '<div class="user-info" style="display:flex; align-items:center; gap:12px;">';
    html += '<div style="font-size: 2rem; background: #f5f5f5; border-radius: 8px; width: 60px; height: 60px; display:flex; align-items:center; justify-content:center;">' + ING_EMOJIS[latest.name] + '</div>';
    html += '<div style="flex:1;">';
    html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 4px;">';
    html += '<span style="font-weight:700; font-size:1.05rem;">' + latest.name + '</span>';
    html += '<span style="font-size:0.8rem; color:#888;">เวลา ' + latestTimeStr + ' น.</span>';
    html += '</div>';
    html += '<div style="color:#555; font-size:0.95rem;">' + latest.qty + ' ' + latest.unit + '</div>';
    html += '</div>';

    // ปุ่มแก้ไข (เฉพาะอันล่าสุด)
    html += '<button onclick="editStockIn(\'' + latest.name + '\', ' + latest.index + ')" style="background: #FFD54F; width: 36px; height: 36px; border-radius: 50%; border: none; display: flex; align-items: center; justify-content: center; font-size: 1rem; cursor: pointer; margin-left:10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">✏️</button>';
    html += '</div>';
    html += '</div>';

    html += '<div style="text-align:right; color:#D32F2F; font-size:0.75rem; margin-bottom: 24px;">*แก้ไขได้เฉพาะรายการล่าสุด*</div>';

    // 2. ส่วนประวัติ (History) - อันที่เหลือ
    if (allEntries.length > 1) {
        html += '<h3 style="font-size:0.95rem; margin-bottom:10px; color:#555; font-weight:500;">ประวัติการบันทึก</h3>';
        html += '<div style="background:#ECECEC; border-radius: 12px; padding: 16px 12px;">';
        html += '<div style="text-align:center; color:#777; font-size:0.9rem; margin-bottom: 12px;">' + dateStrShow + '</div>';

        for (var i = 1; i < allEntries.length; i++) {
            var entry = allEntries[i];
            var timeStr = new Date(entry.time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

            html += '<div class="user-card" style="box-shadow: 0 1px 4px rgba(0,0,0,0.05); border: none; border-radius: 10px; padding: 10px; margin-bottom: 10px; background: #fff;">';
            html += '<div class="user-info" style="display:flex; align-items:center; gap:12px;">';
            html += '<div style="font-size: 1.8rem; background: #f9f9f9; border-radius: 8px; width: 50px; height: 50px; display:flex; align-items:center; justify-content:center;">' + ING_EMOJIS[entry.name] + '</div>';
            html += '<div style="flex:1;">';
            html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 4px;">';
            html += '<span style="font-weight:700; font-size:1rem;">' + entry.name + '</span>';
            html += '<span style="font-size:0.75rem; color:#888;">เวลา ' + timeStr + ' น.</span>';
            html += '</div>';
            html += '<div style="color:#555; font-size:0.9rem;">' + entry.qty + ' ' + entry.unit + '</div>';
            html += '</div></div></div>';
        }
        html += '</div>';
    }

    container.innerHTML = html;
}

function editStockIn(itemName, entryIndex) {
    var dateKey = getDateKey(new Date());
    var data = getStockIn();
    var dayData = data[dateKey];
    if (!dayData || !dayData[itemName]) {
        showToast('\u0e44\u0e21\u0e48\u0e1e\u0e1a\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23');
        return;
    }
    var itemData = dayData[itemName];
    if (!itemData.entries || !itemData.entries[entryIndex]) {
        showToast('\u0e44\u0e21\u0e48\u0e1e\u0e1a\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23\u0e17\u0e35\u0e48\u0e15\u0e49\u0e2d\u0e07\u0e01\u0e32\u0e23\u0e41\u0e01\u0e49\u0e44\u0e02');
        showToast('\u0e44\u0e21\u0e48\u0e1e\u0e1a\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23\u0e17\u0e35\u0e48\u0e15\u0e49\u0e2d\u0e07\u0e01\u0e32\u0e23\u0e41\u0e00\u0e49\u0e44\u0e02');
        return;
    }
    var entry = itemData.entries[entryIndex];

    document.getElementById('edit-si-item').value = itemName;
    document.getElementById('edit-si-original-item').value = itemName;
    document.getElementById('edit-si-unit').value = entry.unit || ING_UNITS[itemName] || '\u0e2b\u0e19\u0e48\u0e27\u0e22';
    document.getElementById('edit-si-index').value = entryIndex.toString();

    // UI fields matching - custom dropdown
    var disp = document.getElementById('edit-si-item-display');
    if (disp) {
        disp.innerHTML = (ING_EMOJIS[itemName] || '\ud83d\udce6') + ' ' + itemName +
            '<span style="position:absolute;right:12px;top:50%;transform:translateY(-50%);pointer-events:none;font-size:0.85rem;color:#777;">&#9660;</span>';
        disp.style.color = '#333';
    }
    document.getElementById('edit-si-unit-label').textContent = '\u0e08\u0e33\u0e19\u0e27\u0e19 (' + (entry.unit || ING_UNITS[itemName] || '\u0e2b\u0e19\u0e48\u0e27\u0e22') + ')';
    document.getElementById('edit-si-qty').value = entry.qty;

    // Populate the edit dropdown list
    populateEditIngList();

    var popup = document.getElementById('edit-stockin-popup');
    if (popup) popup.style.display = 'flex';
}

function populateEditIngList() {
    var list = document.getElementById('edit-si-item-list');
    if (!list) return;
    list.innerHTML = ALL_INGREDIENTS.map(function (name) {
        return '<div onclick="selectEditIngredient(\'' + name + '\')" ' +
            'style="padding:12px 16px; font-size:1rem; cursor:pointer; border-bottom:1px solid #f0f0f0; color:#333;" ' +
            'onmouseover="this.style.background=\'#FFF8E1\'" onmouseout="this.style.background=\'#fff\'">' +
            (ING_EMOJIS[name] || '\ud83d\udce6') + ' ' + name +
            '</div>';
    }).join('');
}

function toggleEditIngDropdown() {
    var list = document.getElementById('edit-si-item-list');
    if (!list) return;
    list.style.display = (list.style.display === 'none') ? 'block' : 'none';
}

function selectEditIngredient(name) {
    document.getElementById('edit-si-item').value = name;
    var unit = ING_UNITS[name] || '\u0e2b\u0e19\u0e48\u0e27\u0e22';
    document.getElementById('edit-si-unit').value = unit;
    document.getElementById('edit-si-unit-label').textContent = '\u0e08\u0e33\u0e19\u0e27\u0e19 (' + unit + ')';

    var disp = document.getElementById('edit-si-item-display');
    if (disp) {
        disp.innerHTML = (ING_EMOJIS[name] || '\ud83d\udce6') + ' ' + name +
            '<span style="position:absolute;right:12px;top:50%;transform:translateY(-50%);pointer-events:none;font-size:0.85rem;color:#777;">&#9660;</span>';
        disp.style.color = '#333';
    }
    document.getElementById('edit-si-item-list').style.display = 'none';

    document.getElementById('edit-si-qty').focus();
}

function closeEditStockInModal() {
    document.getElementById('edit-stockin-popup').style.display = 'none';
    var list = document.getElementById('edit-si-item-list');
    if (list) list.style.display = 'none';
}

function saveEditStockIn() {
    var newItemName = document.getElementById('edit-si-item').value;
    var origItemName = document.getElementById('edit-si-original-item').value || newItemName;
    var entryIndex = parseInt(document.getElementById('edit-si-index').value);
    var newQty = parseInt(document.getElementById('edit-si-qty').value);
    var unit = document.getElementById('edit-si-unit').value || ING_UNITS[newItemName] || 'หน่วย';

    if (!newItemName) { showToast('กรุณาเลือกวัตถุดิบ'); return; }
    if (!newQty || newQty <= 0) { showToast('จำนวนต้องมากกว่า 0'); return; }

    var dateKey = getDateKey(new Date());
    var data = getStockIn();
    if (!data[dateKey] || !data[dateKey][origItemName] || !data[dateKey][origItemName].entries) {
        showToast('ไม่พบรายการที่ต้องการแก้ไข'); return;
    }

    var origEntry = data[dateKey][origItemName].entries[entryIndex];
    if (!origEntry) { showToast('ไม่พบรายการ'); return; }
    var oldQty = origEntry.qty;

    if (newItemName === origItemName) {
        // Same ingredient — just update qty
        data[dateKey][origItemName].qty = data[dateKey][origItemName].qty - oldQty + newQty;
        data[dateKey][origItemName].entries[entryIndex].qty = newQty;
        data[dateKey][origItemName].entries[entryIndex].unit = unit;
    } else {
        // Ingredient changed — remove old entry, add to new ingredient
        data[dateKey][origItemName].qty -= oldQty;
        data[dateKey][origItemName].entries.splice(entryIndex, 1);
        if (data[dateKey][origItemName].qty <= 0 && data[dateKey][origItemName].entries.length === 0) {
            delete data[dateKey][origItemName];
        }
        if (!data[dateKey][newItemName]) {
            data[dateKey][newItemName] = { qty: 0, unit: unit, entries: [] };
        }
        data[dateKey][newItemName].qty += newQty;
        data[dateKey][newItemName].unit = unit;
        data[dateKey][newItemName].entries.push({ qty: newQty, unit: unit, time: origEntry.time });
    }

    saveStockIn(data);
    showToast('บันทึกการแก้ไขเรียบร้อย ✓');
    closeEditStockInModal();
    renderStockInToday();
}

// ===== REMAINING =====
function getRemaining() {
    var dateKey = getDateKey(new Date());
    var stockIn = getStockIn();
    var usage = JSON.parse(localStorage.getItem('habeef_ingredient_usage') || '{}');
    var todayIn = stockIn[dateKey] || {};
    var todayUsed = usage[dateKey] || {};

    // Calculate total stock in (all dates) and total used (all dates)
    var totalIn = {};
    var totalUsed = {};
    ALL_INGREDIENTS.forEach(function (ing) {
        totalIn[ing] = 0;
        totalUsed[ing] = 0;
    });

    for (var d in stockIn) {
        for (var ing in stockIn[d]) {
            if (totalIn[ing] !== undefined) {
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
    }
    for (var d2 in usage) {
        for (var ing2 in usage[d2]) {
            if (totalUsed[ing2] !== undefined) totalUsed[ing2] += usage[d2][ing2];
        }
    }

    var result = {};
    ALL_INGREDIENTS.forEach(function (ing) {
        var remaining = (totalIn[ing] || 0) - (totalUsed[ing] || 0);
        if (remaining < 0 || isNaN(remaining)) remaining = 0;

        var unit = ING_UNITS[ing];
        if (todayIn[ing]) {
            if (typeof todayIn[ing] === 'object' && todayIn[ing].unit) {
                unit = todayIn[ing].unit;
            }
        }

        result[ing] = {
            stockIn: totalIn[ing] || 0,
            used: totalUsed[ing] || 0,
            remaining: remaining,
            unit: unit
        };
    });
    return result;
}

function renderRemaining() {
    var remaining = getRemaining();
    var keys = ALL_INGREDIENTS;

    var container = document.getElementById('remaining-grid');
    container.innerHTML = keys.map(function (name) {
        var d = remaining[name];
        var warning = d.remaining <= 1 ? '<div class="ing-warning">⚠️</div>' : '';
        return '<div class="ing-card">' +
            warning +
            '<div class="ing-card-img">' + (ING_EMOJIS[name] || '📦') + '</div>' +
            '<div class="ing-card-name">' + name + '</div>' +
            '<div class="ing-card-qty">' + d.remaining + ' ' + d.unit + '</div>' +
            '</div>';
    }).join('');
}



// ===== REPORT =====
// ===== REPORT =====
function renderReport() {
    var container = document.getElementById('report-table-container');
    var html = '<table class="ing-table">';
    html += '<tr><th>รายการ</th><th>รับเข้า</th><th>ที่ใช้ไป</th><th>คงเหลือ</th><th>สถานะ</th></tr>';

    var remainingData = getRemaining();

    ALL_INGREDIENTS.forEach(function (name) {
        var data = remainingData[name];
        var inQty = data.stockIn;
        var usedQty = data.used;
        var unit = data.unit;
        var remaining = data.remaining;

        var statusClass = 'status-ok';
        var statusIcon = '';
        if (remaining <= 0 && inQty > 0) {
            statusClass = 'status-out';
            statusIcon = '<span class="status-icon">🔴</span> วัตถุดิบหมด';
        } else if (remaining <= 1 && inQty > 0) {
            statusClass = 'status-low';
            statusIcon = '<span class="status-icon">🟡</span> วัตถุดิบใกล้หมด';
        }

        html += '<tr>';
        html += '<td>' + name + '</td>';
        html += '<td>' + inQty + ' ' + unit + '</td>';
        html += '<td>' + usedQty + ' ' + unit + '</td>';
        html += '<td>' + remaining + ' ' + unit + '</td>';
        html += '<td class="' + statusClass + '">' + statusIcon + '</td>';
        html += '</tr>';
    });

    html += '</table>';
    container.innerHTML = html;
}
