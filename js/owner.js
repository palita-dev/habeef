// ===== OWNER DASHBOARD =====

var currentUser = null;

var ALL_INGREDIENTS = [
    'เส้นเล็ก', 'เส้นใหญ่', 'เส้นหมี่ขาว', 'เส้นหมี่หยก', 'เส้นหมี่เหลือง',
    'ผักบุ้ง', 'ถั่วงอก', 'ลูกชิ้น', 'เนื้อวัว', 'น่องไก่', 'ไข่', 'กุ้ง', 'หมึก'
];

var ING_EMOJIS = {
    'เส้นเล็ก': '<img src="images/เส้นเล็กตรานำโชค.jpg.png" class="ing-icon">',
    'เส้นใหญ่': '<img src="images/เส้นใหญ่ตราเสือ.jpg" class="ing-icon">',
    'เส้นหมี่ขาว': '<img src="images/เส้นหมี่ขาวตราเสือ.jpg" class="ing-icon">',
    'เส้นหมี่หยก': '<img src="images/หมี่หยก.jpg" class="ing-icon">',
    'เส้นหมี่เหลือง': '<img src="images/หมี่เหลือง.jpg" class="ing-icon">',
    'ผักบุ้ง': '<img src="images/ผักบุ้ง.jpg" class="ing-icon">',
    'ถั่วงอก': '<img src="images/ถั่วงอกแต่งสี.jpg" class="ing-icon">',
    'ลูกชิ้น': '<img src="images/ลูกชิ้น.jpg" class="ing-icon">',
    'เนื้อวัว': '<img src="images/เนื้อวัว.png" class="ing-icon">',
    'น่องไก่': '<img src="images/น่องไก่.png" class="ing-icon">',
    'ไข่': '<img src="images/ไข่แผง.jpg" class="ing-icon">',
    'กุ้ง': '<img src="images/กุ้ง.jpg" class="ing-icon">',
    'หมึก': '<img src="images/หมึก.jpg" class="ing-icon">'
};

var ING_UNITS = {
    'เส้นเล็ก': 'ถุง', 'เส้นใหญ่': 'ถุง', 'เส้นหมี่ขาว': 'ถุง', 'เส้นหมี่หยก': 'ถุง', 'เส้นหมี่เหลือง': 'ถุง',
    'ผักบุ้ง': 'กิโลกรัม', 'ถั่วงอก': 'กิโลกรัม', 'ลูกชิ้น': 'ถุง', 'เนื้อวัว': 'กิโลกรัม', 'น่องไก่': 'กิโลกรัม',
    'ไข่': 'แผง', 'กุ้ง': 'กิโลกรัม', 'หมึก': 'กิโลกรัม'
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function () {
    currentUser = requireAuth(['owner']);
    if (!currentUser) return;
    document.getElementById('acc-name').textContent = currentUser.name || currentUser.username;

    // Migrate old units 'กก.' to 'กิโลกรัม'
    var data = getStockIn();
    var migrated = false;
    for (var dateKey in data) {
        for (var itemName in data[dateKey]) {
            if (data[dateKey][itemName].unit === 'กก.') {
                data[dateKey][itemName].unit = 'กิโลกรัม';
                migrated = true;
            }
            if (data[dateKey][itemName].entries) {
                data[dateKey][itemName].entries.forEach(function (entry) {
                    if (entry.unit === 'กก.') {
                        entry.unit = 'กิโลกรัม';
                        migrated = true;
                    }
                });
            }
        }
    }
    if (migrated) saveStockIn(data);

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
        unitInput.value = unit;
        unitLabel.textContent = unit;
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
        disp.childNodes[0].innerHTML = (ING_EMOJIS[name] || '\ud83d\udce6') + ' ' + name;
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
    var loadedStr = localStorage.getItem('habeef_stock_in') || '{}';
    if (loadedStr.trim() === '[]') loadedStr = '{}';
    var data = null;
    try {
        data = JSON.parse(loadedStr);
    } catch (e) {
        data = {};
    }
    if (Array.isArray(data)) data = {};

    // check if it's the old flat structure (e.g. {"เส้นใหญ่": 5}) without date keys
    var hasDateKeys = false;
    var keys = Object.keys(data);
    for (var i = 0; i < keys.length; i++) {
        if (keys[i].includes('/')) {
            hasDateKeys = true;
            break;
        }
    }

    if (!hasDateKeys && keys.length > 0) {
        var today = getDateKey(new Date());
        var migrated = {};
        migrated[today] = data;
        localStorage.setItem('habeef_stock_in', JSON.stringify(migrated));
        return migrated;
    }

    return data;
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

function adjustQty(inputId, delta) {
    var el = document.getElementById(inputId);
    var current = parseInt(el.value, 10);
    if (isNaN(current)) current = 0;
    var newVal = current + delta;
    if (newVal < 1) newVal = 1; // Minimum quantity is 1
    el.value = newVal;
}

window.historyFilterMode = 'today'; // 'today' or 'past'

function setHistoryFilter(mode) {
    window.historyFilterMode = mode;
    document.getElementById('btn-history-today').classList.toggle('active', mode === 'today');
    document.getElementById('btn-history-past').classList.toggle('active', mode === 'past');
    _renderStockInList('full-stockin-history-container', true);
}

function renderStockInToday() {
    _renderStockInList('stockin-list-container', false);
}

function openStockInHistoryPage() {
    setHistoryFilter('today'); // default to today when opening
    // showTab will automatically hide other pages and un-highlight nav if btn is omitted
    showTab('page-stockin-history');
}

function _renderStockInList(containerId, isFull) {
    var data = getStockIn();
    var container = document.getElementById(containerId);

    // สร้างลิสต์ของลอคทั้งหมด
    var allEntries = [];
    var needsSave = false;

    Object.keys(data).forEach(function (dKey) {
        var dayData = data[dKey];
        Object.keys(dayData).forEach(function (itemName) {
            var itemData = dayData[itemName];

            // Backward compatibility
            if (typeof itemData === 'number' || !itemData || !itemData.entries) {
                var oldTime = new Date(dKey);
                if (isNaN(oldTime.getTime())) oldTime = new Date();
                oldTime.setHours(8, 0, 0, 0);

                var qtyVal = 0;
                var unitVal = ING_UNITS[itemName] || 'หน่วย';

                if (typeof itemData === 'number') {
                    qtyVal = itemData;
                } else if (itemData && typeof itemData.qty === 'number') {
                    qtyVal = itemData.qty;
                    if (itemData.unit) unitVal = itemData.unit;
                }

                dayData[itemName] = {
                    qty: qtyVal,
                    unit: unitVal,
                    entries: [{
                        qty: qtyVal,
                        unit: unitVal,
                        time: oldTime.toISOString()
                    }]
                };
                itemData = dayData[itemName];
                needsSave = true;
            }

            itemData.entries.forEach(function (entry, index) {
                allEntries.push({
                    dateKey: dKey,
                    name: itemName,
                    qty: entry.qty,
                    unit: entry.unit,
                    time: entry.time,
                    index: index // keep original index within item's array
                });
            });
        });
    });

    if (needsSave) {
        saveStockIn(data); // save the migrated structure back
    }

    if (allEntries.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;font-size:0.9rem;">ยังไม่มีรายการบันทึก</div>';
        return;
    }

    // เรียงจากใหม่ไปเก่า
    allEntries.sort(function (a, b) {
        return new Date(b.time) - new Date(a.time);
    });

    var html = '';
    var displayEntries = allEntries;

    // Default to 'today' date string for comparisons
    var todayDateStr = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'numeric', day: 'numeric' });

    if (isFull) {
        // Apply filter for the full history page
        displayEntries = allEntries.filter(function (entry, index) {
            if (index === 0) return true; // Keep the latest for correct indexing, but we'll skip it in the loop anyway
            var entryDateStr = new Date(entry.time).toLocaleDateString('th-TH', { year: 'numeric', month: 'numeric', day: 'numeric' });
            if (window.historyFilterMode === 'today') {
                return entryDateStr === todayDateStr;
            } else {
                return entryDateStr !== todayDateStr;
            }
        });

        // If the latest item (index 0 of allEntries) was kept but we are in 'past' mode, 
        // we might not want to show anything if nothing else exists. The loop startIndex = 1 handles skipping the actual latest item.
    }

    // If not full history, show "Latest" at the top
    if (!isFull) {
        var latest = allEntries[0];
        var latestTime = new Date(latest.time);
        var latestTimeStr = latestTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        var latestDateStr = latestTime.toLocaleDateString('th-TH', { year: 'numeric', month: 'numeric', day: 'numeric' });

        html += '<div style="display:flex; justify-content:space-between; margin-bottom:8px;">';
        html += '<span style="color:#D32F2F; font-weight:600; font-size:1rem;">ล่าสุด</span>';
        html += '<span style="color:#888; font-size:0.9rem;">' + latestDateStr + '</span>';
        html += '</div>';

        html += '<div class="user-card" style="box-shadow: 0 2px 8px rgba(0,0,0,0.08); border: 1px solid #eee; border-radius: 12px; padding: 12px; margin-bottom: 4px;">';
        html += '<div class="user-info" style="display:flex; align-items:center; gap:12px;">';
        html += '<div class="ing-history-img" style="font-size: 2rem; background: #f5f5f5; width: 60px; height: 60px; display:flex; align-items:center; justify-content:center;">' + (ING_EMOJIS[latest.name] || '📦') + '</div>';
        html += '<div style="flex:1;">';
        html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 4px;">';
        html += '<span style="font-weight:700; font-size:1.05rem;">' + latest.name + '</span>';
        html += '<span style="font-size:0.8rem; color:#888;">เวลา ' + latestTimeStr + ' น.</span>';
        html += '</div>';
        html += '<div style="color:#555; font-size:0.95rem;">' + latest.qty + ' ' + latest.unit + '</div>';
        html += '</div>';

        // ปุ่มแก้ไข (เฉพาะอันล่าสุดในหน้าแรกหลัก)
        html += '<button onclick="editStockIn(\'' + latest.name + '\', ' + latest.index + ', \'' + latest.dateKey + '\')" style="background: #FFD54F; width: 36px; height: 36px; border-radius: 50%; border: none; display: flex; align-items: center; justify-content: center; font-size: 1rem; cursor: pointer; margin-left:10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">✏️</button>';
        html += '</div>';
        html += '</div>';

        html += '<div style="text-align:right; color:#D32F2F; font-size:0.75rem; margin-bottom: 24px;">*แก้ไขได้เฉพาะรายการล่าสุด*</div>';
    }

    // 2. ส่วนประวัติ (History)
    var startIndex = 1; // Always exclude the 0th item (of allEntries, which corresponds to the very latest overall) from history list

    // We loop over displayEntries but need to carefully skip the item that is functionally the 'latest' overall.
    // If we're filtering, displayEntries[0] might be the latest, or it might be something else if 'past'. 
    // Actually, it's safer to just skip the item if it === allEntries[0].

    var historyItemsCount = 0;

    if (displayEntries.length > 0) {
        if (!isFull) {
            html += '<h3 style="font-size:0.95rem; margin-bottom:10px; color:#555; font-weight:500;">ประวัติการบันทึก</h3>';
            html += '<div style="background:#ECECEC; border-radius: 12px; padding: 16px 12px; margin-bottom:20px;">';
        } else {
            html += '<div style="border-radius: 12px; padding: 16px 12px; margin-bottom:20px;">';
        }

        var maxDisplay = isFull ? displayEntries.length : 4; // 1 latest + 3 older = 4 items used
        var lastDateStr = '';

        for (var i = 0; i < Math.min(displayEntries.length, maxDisplay); i++) {
            var entry = displayEntries[i];

            // Skip the absolute latest item globally (which is shown in the top box on main page)
            if (!isFull && entry === allEntries[0]) {
                maxDisplay++; // compensate so we still show 3 older items
                continue;
            }

            historyItemsCount++;

            var entryTime = new Date(entry.time);
            var timeStr = entryTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
            var dateStr = entryTime.toLocaleDateString('th-TH', { year: 'numeric', month: 'numeric', day: 'numeric' });

            if (dateStr !== lastDateStr) {
                html += '<div style="text-align:center; color:#777; font-size:0.9rem; margin-bottom: 12px; margin-top: ' + (historyItemsCount === 1 ? '0' : '16px') + ';">' + dateStr + '</div>';
                lastDateStr = dateStr;
            }

            html += '<div class="user-card" style="box-shadow: 0 1px 4px rgba(0,0,0,0.05); border: none; border-radius: 10px; padding: 10px; margin-bottom: 10px; background: #fff;">';
            html += '<div class="user-info" style="display:flex; align-items:center; gap:12px;">';
            html += '<div class="ing-history-img" style="font-size: 1.8rem; background: #f9f9f9; width: 50px; height: 50px; display:flex; align-items:center; justify-content:center;">' + (ING_EMOJIS[entry.name] || '📦') + '</div>';
            html += '<div style="flex:1;">';
            html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 4px;">';
            html += '<span style="font-weight:700; font-size:1rem;">' + entry.name + '</span>';
            html += '<span style="font-size:0.75rem; color:#888;">เวลา ' + timeStr + ' น.</span>';
            html += '</div>';
            html += '<div style="color:#555; font-size:0.9rem;">' + entry.qty + ' ' + entry.unit + '</div>';
            html += '</div></div></div>';
        }

        if (historyItemsCount === 0 && !isFull && allEntries.length === 1) {
            html += '<div style="text-align:center;padding:20px;color:#999;font-size:0.85rem;">ยังไม่มีประวัติก่อนหน้า</div>';
        } else if (historyItemsCount === 0 && isFull) {
            html += '<div style="text-align:center;padding:40px;color:#999;font-size:0.9rem;">ไม่มีรายการประวัติในหมวดหมู่นี้</div>';
        }

        // Add View More button
        if (!isFull && allEntries.length > 1) {
            html += '<button onclick="openStockInHistoryPage()" style="width:100%; padding:10px; border-radius:20px; border:none; background:#DFDFDF; color:#333; font-size:0.95rem; font-family:\'Prompt\', sans-serif; cursor:pointer; margin-top:8px;">ดูเพิ่มเติม</button>';
        }

        if (historyItemsCount > 0 || isFull || (!isFull && allEntries.length > 0)) {
            html += '</div>';
        }
    }

    if (container) container.innerHTML = html;
}

function editStockIn(itemName, entryIndex, dKey) {
    var dateKey = dKey || getDateKey(new Date());
    var data = getStockIn();
    var dayData = data[dateKey];
    if (!dayData || !dayData[itemName]) {
        showToast('\u0e44\u0e21\u0e48\u0e1e\u0e1a\u0e02\u0e49\u0e2d\u0e21\u0e39\u0e25\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23');
        return;
    }
    var itemData = dayData[itemName];
    if (!itemData.entries || !itemData.entries[entryIndex]) {
        showToast('\u0e44\u0e21\u0e48\u0e1e\u0e1a\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23\u0e17\u0e35\u0e48\u0e15\u0e49\u0e2d\u0e07\u0e01\u0e32\u0e23\u0e41\u0e01\u0e49\u0e44\u0e02');
        return;
    }
    var entry = itemData.entries[entryIndex];

    document.getElementById('edit-si-item').value = itemName;
    document.getElementById('edit-si-original-item').value = itemName;
    document.getElementById('edit-si-datekey').value = dateKey;
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

    var dateKey = document.getElementById('edit-si-datekey').value || getDateKey(new Date());
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

window.remainingSortMode = 'asc'; // 'asc' (น้อยไปมาก), 'desc' (มากไปน้อย)

function toggleRemainingSort() {
    if (window.remainingSortMode === 'asc') {
        window.remainingSortMode = 'desc';
    } else {
        window.remainingSortMode = 'asc';
    }
    renderRemaining();
}

function getSecondaryUnitHTML(name, qty) {
    if (typeof qty !== 'number' || isNaN(qty) || qty <= 0) {
        if (name === 'ไข่') return '<br><span style="font-size:0.85em; color:#666;">(0 ฟอง)</span>';
        if (name === 'เส้นหมี่หยก' || name === 'เส้นหมี่เหลือง') return '<br><span style="font-size:0.85em; color:#666;">(0 กรัม / 0 ก้อน)</span>';
        if (name === 'ลูกชิ้น' || name === 'น่องไก่') return '<br><span style="font-size:0.85em; color:#666;">(0 กรัม / 0 ชิ้น)</span>';
        return '<br><span style="font-size:0.85em; color:#666;">(0 กรัม)</span>';
    }

    var weightInKg = null;
    var secondUnitText = null;

    switch (name) {
        case 'เส้นเล็ก': weightInKg = qty * 1.0; break;
        case 'เส้นใหญ่': weightInKg = qty * 0.5; break;
        case 'เส้นหมี่ขาว': weightInKg = qty * 0.5; break;
        case 'เส้นหมี่หยก': weightInKg = qty * 0.248; secondUnitText = Math.ceil(qty * 4) + ' ก้อน'; break;
        case 'เส้นหมี่เหลือง': weightInKg = qty * 0.248; secondUnitText = Math.ceil(qty * 4) + ' ก้อน'; break;
        case 'ลูกชิ้น': weightInKg = qty * 1.0; secondUnitText = Math.ceil(qty * 90) + ' ชิ้น'; break;
        case 'น่องไก่': weightInKg = qty * 1.0; secondUnitText = Math.floor(qty / 0.08) + ' ชิ้น'; break;
        case 'ไข่': return '<br><span style="font-size:0.85em; color:#666;">(' + Math.ceil(qty * 30) + ' ฟอง)</span>';
        case 'ผักบุ้ง':
        case 'ถั่วงอก':
        case 'เนื้อวัว':
        case 'กุ้ง':
        case 'หมึก':
            weightInKg = qty * 1.0; break;
    }

    var parts = [];
    if (weightInKg !== null) {
        var kilos = Math.floor(weightInKg);
        var grams = Math.round((weightInKg - kilos) * 1000);
        if (grams >= 1000) { kilos += Math.floor(grams / 1000); grams = grams % 1000; }

        var wParts = [];
        if (kilos > 0) wParts.push(kilos + ' กก.');
        if (grams > 0) wParts.push(grams + ' กรัม');
        if (wParts.length === 0) wParts.push('0 กรัม');
        parts.push(wParts.join(' '));
    }

    if (secondUnitText) {
        parts.push(secondUnitText);
    }

    if (parts.length > 0) {
        return '<br><span style="font-size:0.85em; color:#666;">(' + parts.join(' / ') + ')</span>';
    }
    return '';
}

function renderRemaining() {
    var remaining = getRemaining();
    var keys = ALL_INGREDIENTS.slice(); // copy to mutate

    // Sorting logic
    if (window.remainingSortMode === 'asc') {
        keys.sort(function (a, b) {
            return remaining[a].remaining - remaining[b].remaining;
        });
    } else if (window.remainingSortMode === 'desc') {
        keys.sort(function (a, b) {
            return remaining[b].remaining - remaining[a].remaining;
        });
    }

    // Update button UI
    var sortIcon = document.getElementById('sort-remaining-icon');
    var sortText = document.getElementById('sort-remaining-text');
    if (sortIcon && sortText) {
        if (window.remainingSortMode === 'asc') {
            sortIcon.innerText = '▼';
            sortText.innerText = 'น้อยไปมาก';
        } else {
            sortIcon.innerText = '▲';
            sortText.innerText = 'มากไปน้อย';
        }
    }

    var container = document.getElementById('remaining-grid');
    if (!container) return;

    container.innerHTML = keys.map(function (name) {
        var d = remaining[name];
        var warning = d.remaining <= 1 ? '<div class="ing-warning">⚠️</div>' : '';
        return '<div class="ing-card">' +
            warning +
            '<div class="ing-card-img">' + (ING_EMOJIS[name] || '📦') + '</div>' +
            '<div class="ing-card-name">' + name + '</div>' +
            '<div class="ing-card-qty">' +
            parseFloat(Number(d.remaining).toFixed(3)) + ' ' + d.unit +
            getSecondaryUnitHTML(name, d.remaining) +
            '</div>' +
            '</div>';
    }).join('');
}



// ===== REPORT =====
// ===== REPORT =====
// ===== REPORT =====
function renderReport() {
    var container = document.getElementById('report-table-main-container');
    if (!container) return;

    var html = '<table class="ing-table">';
    html += '<tr><th>รายการ</th><th>รับเข้า</th><th>ที่ใช้ไป</th><th>คงเหลือ</th><th>สถานะ</th></tr>';

    var remainingData = getRemaining();

    ALL_INGREDIENTS.forEach(function (name) {
        var data = remainingData[name];
        var inQty = data.stockIn;
        var usedQty = data.used;
        var unit = data.unit;
        var remaining = data.remaining;

        // Display unit specifically formatted for report
        var displayUnit = unit === 'กิโลกรัม' ? 'กก.' : unit;

        var statusClass = 'status-ok';
        var statusIcon = '';
        if (remaining <= 0 && inQty > 0) {
            statusClass = 'status-out';
            statusIcon = '<span class="status-icon">🔴</span> หมด';
        } else if (remaining <= 1 && inQty > 0) {
            statusClass = 'status-low';
            statusIcon = '<span class="status-icon">🟡</span> ใกล้หมด';
        }

        html += '<tr>';
        html += '<td>' + name + '</td>';
        html += '<td>' + parseFloat(Number(inQty).toFixed(3)) + ' ' + displayUnit + '</td>';
        html += '<td>' + parseFloat(Number(usedQty).toFixed(3)) + ' ' + displayUnit + '</td>';
        html += '<td>' + parseFloat(Number(remaining).toFixed(3)) + ' ' + displayUnit + '</td>';
        html += '<td class="' + statusClass + '">' + statusIcon + '</td>';
        html += '</tr>';
    });

    html += '</table>';
    container.innerHTML = html;
}

// Helper: Get logical "shift date" string (00:00 - 03:59 belongs to previous day)
function getShiftDateStr(dateObj) {
    var d = new Date(dateObj.getTime());
    if (d.getHours() < 4) {
        d.setDate(d.getDate() - 1);
    }
    return d.toLocaleDateString('th-TH').replace(/\//g, '-');
}

// ===== REPORT HISTORY Modal to Page Transition =====
function openReportHistoryModal() {
    var container = document.getElementById('report-list-container');
    if (!container) return;

    // 1. Gather all unique dates from stock-in and orders
    var stockIn = getStockIn();
    var orders = getOrders();
    var dateMap = {};

    // Add today unconditionally so there's always at least one report available to print
    var todayStr = getShiftDateStr(new Date());
    dateMap[todayStr] = true;

    // Add dates from stock-in history
    for (var key in stockIn) {
        if (stockIn[key].history) {
            stockIn[key].history.forEach(function (entry) {
                var dStr = getShiftDateStr(new Date(entry.time));
                dateMap[dStr] = true;
            });
        }
    }

    // Add dates from orders
    orders.forEach(function (o) {
        if (o.completedAt) {
            var dStr = getShiftDateStr(new Date(o.completedAt));
            dateMap[dStr] = true;
        } else if (o.timestamp) {
            var dStr = getShiftDateStr(new Date(o.timestamp));
            dateMap[dStr] = true;
        }
    });

    var uniqueDates = Object.keys(dateMap);

    // 2. Sort dates descending
    uniqueDates.sort(function (a, b) {
        var pa = a.split('-'); // [dd, mm, yyyy]
        var pb = b.split('-');
        var da = new Date(pa[2] - 543, pa[1] - 1, pa[0]); // generic JS date to compare
        var db = new Date(pb[2] - 543, pb[1] - 1, pb[0]);
        return db - da;
    });

    // 3. Render HTML list
    var html = '';
    uniqueDates.forEach(function (dateStr) {
        var displayDate = dateStr.replace(/-/g, '/');

        html += '<div style="display:flex; justify-content:space-between; align-items:center; padding:15px; border:1px solid #ddd; border-radius:8px; margin-bottom:10px; background:#fafafa;">';
        html += '<div>';
        html += '<div style="font-size:0.95rem; font-weight:600; color:#333;">รายงานสรุปข้อมูลวัตถุดิบ</div>';
        html += '<div style="font-size:0.85rem; color:#888;">' + displayDate + '</div>';
        html += '</div>';
        html += '<button onclick="downloadReportForDate(\'' + dateStr + '\')" style="background:#2196F3; color:#fff; border:none; padding:8px 16px; border-radius:6px; font-size:0.9rem; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px; box-shadow:0 2px 4px rgba(33,150,243,0.3);">';
        html += 'ดาวน์โหลด <span style="font-size:1.1rem">📥</span>';
        html += '</button>';
        html += '</div>';
    });

    container.innerHTML = html;

    // Switch pages visually (leave bottom nav alone)
    document.getElementById('page-report').style.display = 'none';
    document.getElementById('page-report-history').style.display = 'block';
}

function hideReportHistory() {
    document.getElementById('page-report-history').style.display = 'none';
    document.getElementById('page-report').style.display = 'block';
}

// ===== ONDEMAND PDF REPORT =====
function downloadReportForDate(dateStr) {
    var printArea = document.getElementById('page-report-print');
    if (!printArea) return;

    var displayDate = dateStr.replace(/-/g, '/');
    var dateElement = document.getElementById('report-date-print');
    var printTimeElement = document.getElementById('report-print-time');

    // Add print time
    var now = new Date();
    var printTime = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    var printDateStr = now.toLocaleDateString('th-TH');

    // Make the header just show the display date to match the image
    if (dateElement) {
        dateElement.textContent = 'วันที่ ' + displayDate;
    }
    if (printTimeElement) {
        printTimeElement.textContent = 'พิมพ์เมื่อ: ' + printDateStr + ' ' + printTime + ' น.';
    }

    // --- Build Table Data ---
    var stockIn = getStockIn();
    var allOrders = getOrders();
    var usedOnDate = {};

    // Calculate usage on specific date based on shift logic
    allOrders.forEach(function (o) {
        var oDate = o.completedAt ? new Date(o.completedAt) : (o.timestamp ? new Date(o.timestamp) : null);
        if (oDate) {
            var oDateStr = getShiftDateStr(oDate);
            if (oDateStr === dateStr && o.status !== 'cancelled') {
                o.cart.forEach(function (item) {
                    var def = getMenuItem(item.id);
                    if (def && def.req) {
                        for (var ing in def.req) {
                            usedOnDate[ing] = (usedOnDate[ing] || 0) + (def.req[ing] * item.qty);
                        }
                    }
                    if (item.extras) {
                        item.extras.forEach(function (exName) {
                            var exDef = getExtraItem(exName);
                            if (exDef && exDef.req) {
                                for (var exIng in exDef.req) {
                                    usedOnDate[exIng] = (usedOnDate[exIng] || 0) + (exDef.req[exIng] * item.qty);
                                }
                            }
                        });
                    }
                });
            }
        }
    });

    // Reconstruct remaining data struct but inject date-specific used amounts
    var currentRemaining = getRemaining();
    var reportData = {};
    ALL_INGREDIENTS.forEach(function (ing) {
        var base = currentRemaining[ing];
        reportData[ing] = {
            stockIn: base.stockIn,  // Total historical stock in
            used: usedOnDate[ing] || 0, // Used ON THIS DATE
            remaining: base.remaining, // Current remaining
            unit: base.unit
        };
    });

    // --- Render Table ---
    var container = document.getElementById('report-table-container');
    var html = '<table class="ing-table" style="width:100%; border-collapse:collapse; margin-top:15px; color:#000000;">';
    html += '<tr><th style="padding:10px; border:1px solid #000000; background:none; font-weight:bold; color:#000000;">รายการ</th>';
    html += '<th style="padding:10px; border:1px solid #000000; background:none; font-weight:bold; color:#000000;">รับเข้า(รวม)</th>';
    html += '<th style="padding:10px; border:1px solid #000000; background:none; font-weight:bold; color:#000000;">ที่ใช้ไป(' + displayDate + ')</th>';
    html += '<th style="padding:10px; border:1px solid #000000; background:none; font-weight:bold; color:#000000;">คงเหลือ(ปัจจุบัน)</th>';
    html += '<th style="padding:10px; border:1px solid #000000; background:none; font-weight:bold; color:#000000;">สถานะ</th></tr>';

    ALL_INGREDIENTS.forEach(function (name) {
        var data = reportData[name];
        var inQty = data.stockIn;
        var usedQty = data.used;
        var unit = data.unit;
        var rem = data.remaining;

        // Display unit specifically formatted for report
        var displayUnit = unit === 'กิโลกรัม' ? 'กก.' : unit;

        var statusOk = rem > 1 || inQty === 0;

        html += '<tr>';
        html += '<td style="padding:10px; border:1px solid #000000; font-weight:normal; color:#000000;">' + name + '</td>';
        html += '<td style="padding:10px; border:1px solid #000000; text-align:center; font-weight:normal; color:#000000;">' + parseFloat(Number(inQty).toFixed(3)) + ' ' + displayUnit + '</td>';
        html += '<td style="padding:10px; border:1px solid #000000; text-align:center; font-weight:normal; color:#000000;">' + parseFloat(Number(usedQty).toFixed(3)) + ' ' + displayUnit + '</td>';
        html += '<td style="padding:10px; border:1px solid #000000; text-align:center; font-weight:normal; color:#000000;">' + parseFloat(Number(rem).toFixed(3)) + ' ' + displayUnit + '</td>';
        html += '<td style="padding:10px; border:1px solid #000000; text-align:center; color:#000000; font-weight:normal;">';
        if (!statusOk && inQty > 0) {
            html += '<span style="color:#FF3333; font-weight:bold;">ใกล้หมด</span>';
        }
        html += '</td>';
        html += '</tr>';
    });
    html += '</table>';
    container.innerHTML = html;

    // --- Generate PDF ---
    showToast('กำลังเตรียมไฟล์ PDF ' + displayDate + '...');

    // Apply PDF specific styling (black text, no backgrounds)
    printArea.classList.add('pdf-export');
    printArea.style.color = '#000000';

    // Make wrapper temporarily block to render correctly
    var wrapper = document.getElementById('pdf-template-wrapper');
    wrapper.style.display = 'block';

    var filename = 'รายงานสรุปผลวัตถุดิบ_' + dateStr + '.pdf';
    var opt = {
        margin: [10, 10, 10, 10],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(printArea).save().then(function () {
        wrapper.style.display = 'none';
        printArea.classList.remove('pdf-export');
        printArea.style.color = '';
        showToast('ดาวน์โหลด PDF สำเร็จแล้ว');
    }).catch(function (err) {
        console.error('PDF Generation Error:', err);
        wrapper.style.display = 'none';
        printArea.classList.remove('pdf-export');
        printArea.style.color = '';
        showToast('เกิดข้อผิดพลาดในการสร้าง PDF');
    });
}
