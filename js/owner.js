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

    var today = new Date();
    var dayStr = today.getDate() + '/' + (today.getMonth() + 1) + '/' + (today.getFullYear() + 543);
    document.getElementById('report-date').textContent = 'วันที่ ' + dayStr;

    populateIngList();
    populateSoIngList();

    // Render empty state initially
    renderStockInToday();
    renderRemaining();
    renderReport();

    // Fetch latest data and re-render
    syncFromServer().then(function () {
        var data = getStockIn();
        for (var dateKey in data) {
            if (!data[dateKey] || typeof data[dateKey] !== 'object') continue;
            for (var itemName in data[dateKey]) {
                if (data[dateKey][itemName].unit === 'กก.') {
                    data[dateKey][itemName].unit = 'กิโลกรัม';
                }
                if (data[dateKey][itemName].entries) {
                    data[dateKey][itemName].entries.forEach(function (entry) {
                        if (entry.unit === 'กก.') entry.unit = 'กิโลกรัม';
                    });
                }
            }
        }
        renderStockInToday();
        renderRemaining();
        renderReport();
    });
});

// ===== TAB NAVIGATION =====
function showTab(pageId, btn) {
    document.querySelectorAll('.page').forEach(function (p) {
        p.classList.remove('active');
        if (p.id !== 'page-report-print') p.style.display = '';
    });
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
    var dispText = document.getElementById('si-item-text');
    if (dispText) dispText.innerHTML = '\u0e40\u0e25\u0e37\u0e2d\u0e01\u0e27\u0e31\u0e15\u0e16\u0e38\u0e14\u0e34\u0e1a';
    var disp = document.getElementById('si-item-display');
    if (disp) disp.style.color = '#999';
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

function toggleIngDropdown(e) {
    if (e) e.stopPropagation();
    var list = document.getElementById('si-item-list');
    if (!list) return;

    if (list.style.display === 'none') {
        list.style.display = 'block';
        // Add one-time listener to close when clicking outside
        document.addEventListener('click', function closeSI(event) {
            var disp = document.getElementById('si-item-display');
            if (list.contains(event.target) || (disp && disp.contains(event.target))) return;
            list.style.display = 'none';
            document.removeEventListener('click', closeSI);
        });
    } else {
        list.style.display = 'none';
    }
}

function selectIngredient(name) {
    document.getElementById('si-item').value = name;
    var dispText = document.getElementById('si-item-text');
    if (dispText) dispText.innerHTML = (ING_EMOJIS[name] || '\ud83d\udce6') + ' ' + name;
    var disp = document.getElementById('si-item-display');
    if (disp) disp.style.color = '#333';
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

// ===== STOCK OUT (MANUAL DEDUCTION) =====
function clearStockOutForm() {
    var itemEl = document.getElementById('so-item');
    var qtyEl = document.getElementById('so-qty');
    var unitEl = document.getElementById('so-unit');
    var labelEl = document.getElementById('so-unit-label');
    if (itemEl) itemEl.value = '';
    if (qtyEl) qtyEl.value = '';
    if (unitEl) unitEl.value = '';
    if (labelEl) labelEl.textContent = 'จำนวน';

    var dispText = document.getElementById('so-item-text');
    if (dispText) dispText.innerHTML = 'เลือกวัตถุดิบ';
    var disp = document.getElementById('so-item-display');
    if (disp) disp.style.color = '#999';
    var list = document.getElementById('so-item-list');
    if (list) list.style.display = 'none';
}

function populateSoIngList() {
    var list = document.getElementById('so-item-list');
    if (!list) return;
    list.innerHTML = ALL_INGREDIENTS.map(function (name) {
        return '<div onclick="selectSoIngredient(\'' + name + '\')" ' +
            'style="padding:12px 16px; font-size:1rem; cursor:pointer; border-bottom:1px solid #f0f0f0; color:#333;" ' +
            'onmouseover="this.style.background=\'#FFF8E1\'" onmouseout="this.style.background=\'#fff\'">' +
            (ING_EMOJIS[name] || '📦') + ' ' + name +
            '</div>';
    }).join('');
}

function toggleSoDropdown(e) {
    if (e) e.stopPropagation();
    var list = document.getElementById('so-item-list');
    if (!list) return;

    if (list.style.display === 'none') {
        list.style.display = 'block';
        // Add one-time listener to close when clicking outside
        document.addEventListener('click', function closeSO(event) {
            var disp = document.getElementById('so-item-display');
            if (list.contains(event.target) || (disp && disp.contains(event.target))) return;
            list.style.display = 'none';
            document.removeEventListener('click', closeSO);
        });
    } else {
        list.style.display = 'none';
    }
}

function selectSoIngredient(name) {
    document.getElementById('so-item').value = name;
    var dispText = document.getElementById('so-item-text');
    if (dispText) dispText.innerHTML = (ING_EMOJIS[name] || '📦') + ' ' + name;
    var disp = document.getElementById('so-item-display');
    if (disp) disp.style.color = '#333';
    document.getElementById('so-item-list').style.display = 'none';

    var unit = ING_UNITS[name] || 'หน่วย';
    document.getElementById('so-unit').value = unit;
    document.getElementById('so-unit-label').textContent = 'จำนวน (' + unit + ')';
    document.getElementById('so-qty').focus();
}

function showStockOutForm() {
    clearStockOutForm();
    var container = document.getElementById('stockout-form-container');
    if (container) container.style.display = 'flex';
    var list = document.getElementById('so-item-list');
    if (list) list.style.display = 'block';
}

function hideStockOutForm() {
    clearStockOutForm();
    var container = document.getElementById('stockout-form-container');
    if (container) container.style.display = 'none';
}

function addStockOut() {
    var item = document.getElementById('so-item').value;
    var qty = parseInt(document.getElementById('so-qty').value);
    var unit = document.getElementById('so-unit').value.trim();

    if (!item || !qty || qty <= 0) {
        showToast('กรุณากรอกข้อมูลให้ครบและถูกต้อง');
        return;
    }
    if (!unit) unit = ING_UNITS[item] || 'หน่วย';

    var entry = {
        item: item,
        qty: qty,
        unit: unit,
        date: new Date().toISOString()
    };

    addStockOutToServer(entry, function (res) {
        if (res.success) {
            _fetchStockOut(function () {
                autoSyncIngredientToggles();
                hideStockOutForm();
                renderRemaining();
                showToast('บันทึกเอา ' + item + ' ออก ' + qty + ' ' + unit + ' เรียบร้อย ✓');
            });
        } else {
            showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
    });
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

    var entry = {
        name: item,
        qty: qty,
        unit: unit,
        time: new Date().toISOString()
    };

    addStockInToServer(entry, function (res) {
        if (res.success) {
            _fetchStockIn(function () {
                autoSyncIngredientToggles();
                hideStockInForm();
                renderStockInToday();
                showToast('บันทึก ' + item + ' ' + qty + ' ' + unit + ' เรียบร้อย ✓');
            });
        } else {
            showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
    });
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

    // No automatic save here to prevent data loss on partial loads

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

    // Default to 'today' date key for comparisons
    var todayKey = getDateKey(new Date());

    if (isFull) {
        // Apply filter for the full history page
        displayEntries = allEntries.filter(function (entry) {
            var entryKey = getDateKey(new Date(entry.time));
            if (window.historyFilterMode === 'today') {
                return entryKey === todayKey;
            } else {
                return entryKey !== todayKey;
            }
        });
    }

    // If not full history, show "Latest" at the top
    if (!isFull) {
        var latest = allEntries[0];
        var latestTime = new Date(latest.time);
        var latestTimeStr = latestTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        var shiftLatest = new Date(latestTime.getTime());
        shiftLatest.setHours(shiftLatest.getHours() - 4);
        var latestDateStr = shiftLatest.toLocaleDateString('th-TH', { year: 'numeric', month: 'numeric', day: 'numeric' });

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
            html += '<div style="background:#E0D9D3; border-radius: 12px; padding: 16px 12px; margin-bottom:20px;">';
        } else {
            html += '<div style="background:#E0D9D3; border-radius: 12px; padding: 16px 12px; margin-bottom:20px;">';
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
            var shiftEntry = new Date(entryTime.getTime());
            shiftEntry.setHours(shiftEntry.getHours() - 4);
            var dateStr = shiftEntry.toLocaleDateString('th-TH', { year: 'numeric', month: 'numeric', day: 'numeric' });

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
            var quantityStr = String(entry.qty + ' ' + (entry.unit || ''));
            quantityStr = quantityStr.split('<br>')[0].split(' หรือ ')[0];
            html += '<div style="color:#555; font-size:0.9rem;">' + quantityStr + '</div>';
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

        html += '</div>'; // close the background:#E0D9D3 container
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
    var dispText = document.getElementById('edit-si-item-text');
    if (dispText) dispText.innerHTML = (ING_EMOJIS[itemName] || '\ud83d\udce6') + ' ' + itemName;
    var disp = document.getElementById('edit-si-item-display');
    if (disp) disp.style.color = '#333';
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

    var dispText = document.getElementById('edit-si-item-text');
    if (dispText) dispText.innerHTML = (ING_EMOJIS[name] || '\ud83d\udce6') + ' ' + name;
    var disp = document.getElementById('edit-si-item-display');
    if (disp) disp.style.color = '#333';
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
    var entryIndex = parseInt(document.getElementById('edit-si-index').value);
    var newQty = parseInt(document.getElementById('edit-si-qty').value);
    var unit = document.getElementById('edit-si-unit').value || ING_UNITS[newItemName] || 'หน่วย';

    if (!newItemName) { showToast('กรุณาเลือกวัตถุดิบ'); return; }
    if (!newQty || newQty <= 0) { showToast('จำนวนต้องมากกว่า 0'); return; }

    var dateKey = document.getElementById('edit-si-datekey').value;
    var origItemName = document.getElementById('edit-si-original-item').value;

    // We need the ACTUAL stock_in_id from the database. 
    // _renderStockInList populated the entries with IDs from the database.
    var data = getStockIn();
    var entry = data[dateKey][origItemName].entries[entryIndex];
    var stockInId = entry.id; // Corrected from .id which comes from api/stockin.php GET

    if (!stockInId) {
        showToast('ไม่สามารถแก้ไขรายการได้ (ไม่พบ ID)');
        return;
    }

    var editEntry = {
        name: newItemName,
        qty: newQty,
        unit: unit
    };

    editStockInOnServer(stockInId, editEntry, function (res) {
        if (res.success) {
            _fetchStockIn(function () {
                autoSyncIngredientToggles();
                showToast('บันทึกการแก้ไขเรียบร้อย ✓');
                closeEditStockInModal();
                renderStockInToday();
            });
        } else {
            showToast('เกิดข้อผิดพลาดในการบันทึกการแก้ไข');
        }
    });
}

// ===== REMAINING =====
function getRemaining() {
    var dateKey = getDateKey(new Date());
    var stockIn = getStockIn();
    var usageLogs = (typeof getIngredientUsage === 'function') ? getIngredientUsage() : [];

    // Convert array of logs to date key map
    var usage = {};
    usageLogs.forEach(function (log) {
        // We already filtered by "served/completed" in getIngredientUsage() in auth.js
        // but let's double check if getIngredientUsage returns the right subset.
        var logTime = new Date(log.date);
        var dKey = getDateKey(logTime);
        if (!usage[dKey]) usage[dKey] = {};
        for (var ingName in log.ingredients) {
            usage[dKey][ingName] = (usage[dKey][ingName] || 0) + log.ingredients[ingName];
        }
    });

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

    var stockOutLogs = getStockOut();
    var totalOut = {};
    stockOutLogs.forEach(function (log) {
        if (totalOut[log.item] === undefined) totalOut[log.item] = 0;
        totalOut[log.item] += log.qty;
    });

    var result = {};
    ALL_INGREDIENTS.forEach(function (ing) {
        var remaining = (totalIn[ing] || 0) - (totalUsed[ing] || 0) - (totalOut[ing] || 0);
        if (remaining < 0) remaining = 0;

        var unit = ING_UNITS[ing];
        if (todayIn[ing]) {
            if (typeof todayIn[ing] === 'object' && todayIn[ing].unit) {
                unit = todayIn[ing].unit;
            }
        }

        result[ing] = {
            stockIn: totalIn[ing] || 0,
            used: (totalUsed[ing] || 0) + (totalOut[ing] || 0),
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

// Placeholder for now, I need to check ING_UNITS first before writing the exact math
function formatSecondaryUnit(name, qty, returnRawText) {
    if (typeof qty !== 'number' || isNaN(qty) || qty <= 0) {
        if (name === 'ไข่') return '0 แผง 0 ฟอง';
        if (name === 'เส้นหมี่หยก' || name === 'เส้นหมี่เหลือง') return '0 ถุง 0 ก้อน';
        if (name === 'ลูกชิ้น') return '0 ถุง 0 ชิ้น';
        if (name === 'เส้นเล็ก' || name === 'เส้นใหญ่' || name === 'เส้นหมี่ขาว') return '0 ถุง 0 กรัม';
        var splitTextZero = '<br>หรือ ';
        if (name === 'น่องไก่') return '0 กก.' + splitTextZero + '~0 ชิ้น';
        if (name === 'กุ้ง') return '0 กก.' + splitTextZero + '~0 ตัว';
        if (name === 'เนื้อวัว' || name === 'ผักบุ้ง' || name === 'ถั่วงอก' || name === 'หมึก') return '0 กก.';
        return '0 ' + (ING_UNITS[name] || 'หน่วย');
    }

    var parts = [];

    switch (name) {
        case 'ไข่':
            // 1 แผง = 30 ฟอง
            var trays = Math.floor(qty);
            var eggs = Math.round((qty - trays) * 30);
            if (eggs >= 30) { trays += 1; eggs = 0; }
            if (trays > 0) parts.push(trays + ' แผง');
            if (eggs > 0) parts.push(eggs + ' ฟอง');
            break;

        case 'เส้นเล็ก':
        case 'เส้นใหญ่':
        case 'เส้นหมี่ขาว':
            // 1 ถุง เส้นเล็ก = 1 กก (1000 กรัม)
            // 1 ถุง เส้นใหญ่ = 500 กรัม
            // 1 ถุง เส้นหมี่ขาว = 500 กรัม
            var gramPerBag = (name === 'เส้นเล็ก') ? 1000 : 500;
            var bags = Math.floor(qty);
            var grams = Math.round((qty - bags) * gramPerBag);
            if (grams >= gramPerBag) { bags += Math.floor(grams / gramPerBag); grams = grams % gramPerBag; }
            if (bags > 0) parts.push(bags + ' ถุง');
            if (grams > 0) parts.push(grams + ' กรัม');
            break;

        case 'เส้นหมี่หยก':
        case 'เส้นหมี่เหลือง':
            // 1 ถุง = 4 ก้อน
            var bagsN = Math.floor(qty);
            var blocks = Math.round((qty - bagsN) * 4);
            if (blocks >= 4) { bagsN += Math.floor(blocks / 4); blocks = blocks % 4; }
            if (bagsN > 0) parts.push(bagsN + ' ถุง');
            if (blocks > 0) parts.push(blocks + ' ก้อน');
            break;

        case 'ลูกชิ้น':
            // 1 ถุง (1 กก.) = 90 ชิ้น (ตามตารางที่ได้มาจากภาพเก่า)
            var bagsM = Math.floor(qty);
            var pieces = Math.round((qty - bagsM) * 90);
            if (pieces >= 90) { bagsM += Math.floor(pieces / 90); pieces = pieces % 90; }
            if (bagsM > 0) parts.push(bagsM + ' ถุง');
            if (pieces > 0) parts.push('~' + pieces + ' ชิ้น');
            break;

        case 'น่องไก่':
        case 'เนื้อวัว':
        case 'กุ้ง':
        case 'หมึก':
        case 'ผักบุ้ง':
        case 'ถั่วงอก':
            // กิโลกรัม -> กิโลกรัม กับ กรัม หรือ ตัว/ชิ้น
            if (name === 'กุ้ง') {
                var pieces = Math.round(qty * 75 / 3);
                var separator = '<br>หรือ ';
                if (qty < 1) {
                    var grams = Math.round(qty * 1000);
                    return grams + ' กรัม' + separator + '~' + pieces + ' ตัว';
                }
                return parseFloat(Number(qty).toFixed(2)) + ' กก.' + separator + '~' + pieces + ' ตัว';
            } else if (name === 'น่องไก่') {
                var pieces = Math.round(qty * 162 / 13);
                var separator = '<br>หรือ ';
                if (qty < 1) {
                    var grams = Math.round(qty * 1000);
                    return grams + ' กรัม' + separator + '~' + pieces + ' ชิ้น';
                }
                return parseFloat(Number(qty).toFixed(2)) + ' กก.' + separator + '~' + pieces + ' ชิ้น';
            } else {
                if (qty < 1) {
                    var grams = Math.round(qty * 1000);
                    return grams + ' กรัม';
                }
                return parseFloat(Number(qty).toFixed(2)) + ' กก.';
            }
            break;

        default:
            if (ING_UNITS[name] === 'กิโลกรัม' && qty < 1 && qty > 0) {
                return Math.round(qty * 1000) + ' กรัม';
            }
            return parseFloat(Number(qty).toFixed(2)) + ' ' + (ING_UNITS[name] || 'หน่วย');
    }

    if (parts.length === 0) {
        if (name === 'ไข่') return '0 แผง';
        if (name.includes('เส้น') || name === 'ลูกชิ้น') return '0 ถุง';
        return '0 กก.';
    }

    return parts.join(' ');
}

// ===== AUTO-SYNC INGREDIENT TOGGLES =====
// Automatically enable/disable ingredients based on stock vs formula
// DEPRECATED: No longer automatically syncing to database. Let user control manually.
function autoSyncIngredientToggles() {
    return;
}

function renderRemaining() {
    // autoSyncIngredientToggles(); // DEPRECATED: Don't change DB automatically
    var remaining = getRemaining();
    var keys = ALL_INGREDIENTS.slice(); // copy to mutate

    // Sorting logic — disabled items treated as 0, truly empty items are even lower
    var disabledForSort = getDisabledIngredients();

    function getEffectiveRemaining(name) {
        var rem = remaining[name].remaining;
        var isDisabled = disabledForSort.indexOf(name) !== -1;
        // Yellow (manually disabled but has stock): treat as 0 (slightly above red)
        if (isDisabled && rem > 0) return 0.001;
        // Red (truly empty) or normal: use actual value
        return rem;
    }

    if (window.remainingSortMode === 'asc') {
        keys.sort(function (a, b) {
            return getEffectiveRemaining(a) - getEffectiveRemaining(b);
        });
    } else if (window.remainingSortMode === 'desc') {
        keys.sort(function (a, b) {
            return getEffectiveRemaining(b) - getEffectiveRemaining(a);
        });
    }

    // Use global getDisabledIngredients() from auth.js (MySQL-backed)

    // Helper: show custom confirm modal
    window.showIngredientConfirm = function (name, message, confirmLabel, confirmColor, onConfirm) {
        // Remove old modal if exists
        var old = document.getElementById('ing-confirm-modal');
        if (old) old.remove();

        var modal = document.createElement('div');
        modal.id = 'ing-confirm-modal';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.45); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px; box-sizing:border-box;';
        modal.innerHTML = '<div style="background:#fff; border-radius:16px; width:100%; max-width:300px; padding:24px; box-shadow:0 8px 32px rgba(0,0,0,0.2); text-align:center;">' +
            '<div style="font-size:2rem; margin-bottom:10px;">⚠️</div>' +
            '<div style="font-family:\'Prompt\',sans-serif; font-size:0.95rem; color:#555; margin-bottom:20px;">' + message + '</div>' +
            '<div style="display:flex; gap:12px;">' +
            '<button id="ing-confirm-cancel" style="flex:1; padding:12px; border-radius:12px; border:none; background:#e0e0e0; color:#333; font-family:\'Prompt\',sans-serif; font-size:1rem; font-weight:600; cursor:pointer;">ยกเลิก</button>' +
            '<button id="ing-confirm-ok" style="flex:1; padding:12px; border-radius:12px; border:none; background:' + confirmColor + '; color:#fff; font-family:\'Prompt\',sans-serif; font-size:1rem; font-weight:600; cursor:pointer;">' + confirmLabel + '</button>' +
            '</div>' +
            '</div>';
        document.body.appendChild(modal);

        document.getElementById('ing-confirm-cancel').onclick = function () { modal.remove(); };
        document.getElementById('ing-confirm-ok').onclick = function () { modal.remove(); onConfirm(); };
        modal.onclick = function (e) { if (e.target === modal) modal.remove(); };
    };

    // Global scope toggle function to be accessible by HTML onchange handler
    window.toggleIngredient = function (name) {
        var disabled = getDisabledIngredients();
        var idx = disabled.indexOf(name);

        if (idx === -1) {
            // Currently available → confirm disabling
            window.showIngredientConfirm(
                name,
                '\u0e04\u0e38\u0e13\u0e15\u0e49\u0e2d\u0e07\u0e01\u0e32\u0e23\u0e40\u0e1b\u0e25\u0e35\u0e48\u0e22\u0e19\u0e2a\u0e16\u0e32\u0e19\u0e30 <b style="color:#D32F2F;">' + name + '</b> \u0e40\u0e1b\u0e47\u0e19 <b style="color:#D32F2F;">\u0e2b\u0e21\u0e14</b> \u0e43\u0e0a\u0e48\u0e2b\u0e23\u0e37\u0e2d\u0e44\u0e21\u0e48?',
                '\u0e22\u0e37\u0e19\u0e22\u0e31\u0e19\u0e1b\u0e34\u0e14',
                '#D32F2F',
                function () {
                    disabled.push(name);
                    saveDisabledIngredients(disabled);
                    renderRemaining();
                }
            );
        } else {
            // Currently disabled → confirm re-enabling
            window.showIngredientConfirm(
                name,
                '\u0e04\u0e38\u0e13\u0e15\u0e49\u0e2d\u0e07\u0e01\u0e32\u0e23\u0e40\u0e1b\u0e34\u0e14\u0e01\u0e32\u0e23\u0e02\u0e32\u0e22 <b style="color:#1976D2;">' + name + '</b> \u0e2d\u0e35\u0e01\u0e04\u0e23\u0e31\u0e49\u0e07\u0e43\u0e0a\u0e48\u0e2b\u0e23\u0e37\u0e2d\u0e44\u0e21\u0e48?',
                '\u0e22\u0e37\u0e19\u0e22\u0e31\u0e19\u0e40\u0e1b\u0e34\u0e14',
                '#1976D2',
                function () {
                    disabled.splice(idx, 1);
                    saveDisabledIngredients(disabled);
                    renderRemaining();
                }
            );
        }
    }

    // Update button UI
    var sortBtn = document.getElementById('btn-sort-remaining');
    var sortIcon = document.getElementById('sort-remaining-icon');
    if (sortBtn && sortIcon) {
        if (window.remainingSortMode === 'asc') {
            sortIcon.innerText = '↑';
            sortBtn.style.background = '#ffffff'; // White for ASC
            sortBtn.style.color = '#000000';
            sortBtn.style.borderColor = '#cccccc';
        } else {
            sortIcon.innerText = '↓';
            sortBtn.style.background = '#eeeeee'; // Light Gray for DESC to show difference
            sortBtn.style.color = '#333333';
            sortBtn.style.borderColor = '#aaaaaa';
        }
        sortIcon.style.fontWeight = '900'; // Make it thicker
        sortIcon.style.color = '#000000';
    }

    var container = document.getElementById('remaining-grid');
    if (!container) return;

    var disabledIngredients = getDisabledIngredients();

    container.innerHTML = keys.map(function (name) {
        var d = remaining[name];
        var isEnabled = disabledIngredients.indexOf(name) === -1;

        // Only show warning ⚠️ if stock is low, NOT empty, AND NOT manually disabled
        var warning = (d.remaining <= 1 && d.remaining > 0 && isEnabled) ? '<div class="ing-warning">⚠️</div>' : '';

        var outOfStockBadge = '';
        var toggleHtml = '';
        var cardExtraStyle = '';

        if (d.remaining <= 0) {
            // CASE 1: AUTO OUT OF STOCK (STOCK = 0)
            cardExtraStyle = 'border: 2px solid #f44336;';
            outOfStockBadge = '<div style="position:absolute; top:6px; right:6px; background:rgba(255,255,255,0.5); color:#f44336; font-family:\'Prompt\', sans-serif; font-size:0.72rem; font-weight:bold; padding:2px 7px; border-radius:4px; border:1.5px solid #f44336; line-height:1.4; z-index:2;">หมด</div>';
            toggleHtml = '<div style="margin-top: 10px; display: flex; justify-content: center; width:100%;">' +
                '<div style="width:100%; display:flex; position:relative; background:#f0f0f0; border-radius:20px; padding:3px; box-sizing:border-box;">' +
                '<div style="flex:1; color:#999; text-align:center; padding:6px 0; font-family:\'Prompt\', sans-serif; font-size:0.9rem; z-index:1;">มี</div>' +
                '<div style="flex:1; color:#999; text-align:center; padding:6px 0; font-family:\'Prompt\', sans-serif; font-size:0.9rem; z-index:1;">หมด</div>' +
                '<div style="position:absolute; right:3px; top:3px; bottom:3px; width:calc(50% - 3px); background:#f44336; color:#fff; display:flex; align-items:center; justify-content:center; font-family:\'Prompt\', sans-serif; font-size:0.9rem; font-weight:bold; border-radius:18px; box-shadow:0 2px 4px rgba(244,67,54,0.3); z-index:2;">หมด</div>' +
                '</div></div>';
        } else if (!isEnabled) {
            // CASE 2: MANUAL OUT OF STOCK (STOCK > 0 BUT DISABLED)
            cardExtraStyle = 'border: 2px solid #FF9800;';
            outOfStockBadge = ''; // Manual disable: no corner badge (yellow badge removed)
            toggleHtml = '<div style="margin-top: 10px; display: flex; justify-content: center; width:100%; cursor:pointer;" onclick="toggleIngredient(\'' + name + '\')">' +
                '<div style="width:100%; display:flex; position:relative; background:#f5f5f5; border-radius:20px; padding:3px; box-sizing:border-box;">' +
                '<div style="flex:1; color:#999; text-align:center; padding:6px 0; font-family:\'Prompt\', sans-serif; font-size:0.9rem; z-index:1;">มี</div>' +
                '<div style="flex:1; color:#999; text-align:center; padding:6px 0; font-family:\'Prompt\', sans-serif; font-size:0.9rem; z-index:1;">หมด</div>' +
                '<div style="position:absolute; right:3px; top:3px; bottom:3px; width:calc(50% - 3px); background:#FF9800; color:#fff; display:flex; align-items:center; justify-content:center; font-family:\'Prompt\', sans-serif; font-size:0.9rem; font-weight:bold; border-radius:18px; box-shadow:0 2px 4px rgba(255,152,0,0.3); z-index:2;">หมด</div>' +
                '</div></div>';
        } else {
            // CASE 3: ACTIVE STOCK
            toggleHtml = '<div style="margin-top: 10px; display: flex; justify-content: center; width:100%; cursor:pointer;" onclick="toggleIngredient(\'' + name + '\')">' +
                '<div style="width:100%; display:flex; position:relative; background:#f5f5f5; border-radius:20px; padding:3px; box-sizing:border-box;">' +
                '<div style="flex:1; color:#999; text-align:center; padding:6px 0; font-family:\'Prompt\', sans-serif; font-size:0.9rem; z-index:1;">มี</div>' +
                '<div style="flex:1; color:#999; text-align:center; padding:6px 0; font-family:\'Prompt\', sans-serif; font-size:0.9rem; z-index:1;">หมด</div>' +
                '<div style="position:absolute; left:3px; top:3px; bottom:3px; width:calc(50% - 3px); background:#4BA1FB; color:#fff; display:flex; align-items:center; justify-content:center; font-family:\'Prompt\', sans-serif; font-size:0.9rem; font-weight:bold; border-radius:18px; box-shadow:0 2px 4px rgba(75,161,251,0.3); z-index:2;">มี</div>' +
                '</div></div>';
        }

        return '<div class="ing-card" style="' + cardExtraStyle + ' position:relative; display: flex; flex-direction: column; justify-content: space-between; height: 100%;">' +
            outOfStockBadge +
            '<div>' +
            warning +
            '<div class="ing-card-img">' + (ING_EMOJIS[name] || '📦') + '</div>' +
            '<div class="ing-card-name">' + name + '</div>' +
            '<div class="ing-card-qty">' +
            formatSecondaryUnit(name, d.remaining, false) +
            '</div>' +
            '</div>' +
            toggleHtml +
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
    html += '<tr><th>รายการ</th><th>รับเข้า</th><th>ที่ใช้ไป</th><th>คงเหลือ</th></tr>';

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
        var statusIcon = '<span class="status-icon">🟢</span> ปกติ';

        if (remaining <= 0) {
            statusClass = 'status-out';
            statusIcon = '<span class="status-icon">🔴</span> หมด';
        } else if (remaining <= 1.5) { // Simple threshold for "low"
            statusClass = 'status-low';
            statusIcon = '<span class="status-icon">🟡</span> ใกล้หมด';
        }

        var usedText = formatSecondaryUnit(name, usedQty, true);
        var remText = formatSecondaryUnit(name, remaining, true);
        var inText = formatSecondaryUnit(name, inQty, true);
        if (name === 'กุ้ง' || name === 'น่องไก่') {
            inText = parseFloat(Number(inQty).toFixed(3)) + ' กก.';
        }

        html += '<tr>';
        html += '<td>' + name + '</td>';
        html += '<td>' + inText + '</td>';
        html += '<td>' + usedText + '</td>';
        html += '<td class="' + statusClass + '">' + remText + '</td>';
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

    // Add dates from stock-in history (convert CE date keys to getShiftDateStr format)
    for (var key in stockIn) {
        if (typeof stockIn[key] === 'object') {
            // key is in CE format like "2026-02-25", convert to Date then use getShiftDateStr
            var parts = key.split('-');
            if (parts.length === 3) {
                var ceDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0);
                var converted = getShiftDateStr(ceDate);
                dateMap[converted] = true;
            }
        }
    }

    // Add dates from ingredient usage (habeef_ingredients)
    var usageLogs = (typeof getIngredientUsage === 'function') ? getIngredientUsage() : [];
    usageLogs.forEach(function (log) {
        if (log.date) {
            var dStr = getShiftDateStr(new Date(log.date));
            dateMap[dStr] = true;
        }
    });

    // Add dates from orders
    orders.forEach(function (o) {
        var dStr;
        if (o.completedAt) {
            dStr = getShiftDateStr(new Date(o.completedAt));
            dateMap[dStr] = true;
        } else if (o.timestamp) {
            dStr = getShiftDateStr(new Date(o.timestamp));
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

    // Helper: parse Thai BE date string (d-m-yyyy) to JS Date for comparison
    function parseBEDate(beStr) {
        var p = beStr.split('-');
        return new Date(parseInt(p[2]) - 543, parseInt(p[1]) - 1, parseInt(p[0]));
    }
    var targetDate = parseBEDate(dateStr);

    // Calculate usage on specific date and total historical usage up to that date
    var usageLogs = (typeof getIngredientUsage === 'function') ? getIngredientUsage() : [];
    var totalUsedUpToDate = {};
    usageLogs.forEach(function (log) {
        if (log.date) {
            var logDateStr = getShiftDateStr(new Date(log.date));
            var logDate = parseBEDate(logDateStr);
            if (logDate <= targetDate) {
                for (var ingName in log.ingredients) {
                    totalUsedUpToDate[ingName] = (totalUsedUpToDate[ingName] || 0) + log.ingredients[ingName];
                    if (logDateStr === dateStr) {
                        usedOnDate[ingName] = (usedOnDate[ingName] || 0) + log.ingredients[ingName];
                    }
                }
            }
        }
    });

    // Calculate total historical stock in up to that date
    var totalInUpToDate = {};
    for (var d in stockIn) {
        // Convert CE stockIn key (e.g. "2026-02-25") to Date for comparison
        var dParts = d.split('-');
        if (dParts.length === 3) {
            var ceD = new Date(parseInt(dParts[0]), parseInt(dParts[1]) - 1, parseInt(dParts[2]));
            if (ceD <= targetDate) {
                for (var ing in stockIn[d]) {
                    if (ing === 'history') continue;
                    if (totalInUpToDate[ing] === undefined) totalInUpToDate[ing] = 0;
                    var itemData = stockIn[d][ing];
                    var q = 0;
                    if (typeof itemData === 'number') q = itemData;
                    else if (itemData && typeof itemData.qty === 'number') q = itemData.qty;
                    totalInUpToDate[ing] += q;
                }
            }
        }
    }

    // Calculate total historical stock out up to that date
    var stockOutLogs = getStockOut();
    var totalOutUpToDate = {};
    stockOutLogs.forEach(function (log) {
        if (log.date) {
            var logDateStr = getShiftDateStr(new Date(log.date));
            var logDate = parseBEDate(logDateStr);
            if (logDate <= targetDate) {
                if (totalOutUpToDate[log.item] === undefined) totalOutUpToDate[log.item] = 0;
                totalOutUpToDate[log.item] += log.qty;
            }
        }
    });

    var reportData = {};
    ALL_INGREDIENTS.forEach(function (ing) {
        var inQty = totalInUpToDate[ing] || 0;
        var usedTotal = totalUsedUpToDate[ing] || 0;
        var outTotal = totalOutUpToDate[ing] || 0;
        var rem = inQty - usedTotal - outTotal;
        if (rem < 0) rem = 0; // clamp negative to 0 like current logic

        reportData[ing] = {
            stockIn: inQty,
            used: usedTotal + outTotal, // Used total includes manual stock-out
            out: outTotal,
            remaining: rem, // Historical remaining at the end of this date
            unit: ING_UNITS[ing]
        };
    });

    // --- Render Table ---
    var container = document.getElementById('report-table-container');
    var html = '<table class="ing-table" style="width:100%; border-collapse:collapse; margin-top:5px; color:#000000;">';
    html += '<tr><th style="padding:6px; border:1px solid #000000; background:none; font-weight:bold; color:#000000;">รายการ</th>';
    html += '<th style="padding:6px; border:1px solid #000000; background:none; font-weight:bold; color:#000000;">รับเข้า</th>';
    html += '<th style="padding:6px; border:1px solid #000000; background:none; font-weight:bold; color:#000000;">ที่ใช้ไป</th>';
    html += '<th style="padding:6px; border:1px solid #000000; background:none; font-weight:bold; color:#000000;">คงเหลือ</th>';
    html += '<th style="padding:6px; border:1px solid #000000; background:none; font-weight:bold; color:#000000;">ควรซื้อเพิ่ม</th></tr>';

    ALL_INGREDIENTS.forEach(function (name) {
        var data = reportData[name];
        var inQty = data.stockIn;
        var usedQty = data.used;
        var unit = data.unit;
        var rem = data.remaining;

        // Display unit specifically formatted for report
        var displayUnit = unit === 'กิโลกรัม' ? 'กก.' : unit;

        var usedText = formatSecondaryUnit(name, usedQty, true);
        if (!usedText) usedText = parseFloat(Number(usedQty).toFixed(2)) + ' ' + displayUnit;

        var remText = formatSecondaryUnit(name, rem, true);
        if (!remText) remText = parseFloat(Number(rem).toFixed(2)) + ' ' + displayUnit;

        var bgColor = 'transparent';
        var textColor = '#000000';
        var fontWeight = 'normal';

        if (rem <= 0) {
            bgColor = '#FFEBEE'; // Red bg
            textColor = '#C62828';
            fontWeight = 'bold';
        } else if (rem <= 1.5) {
            bgColor = '#FFF3E0'; // Yellow bg
            textColor = '#E65100';
            fontWeight = 'bold';
        }

        var shouldBuy = 0;

        // Fixed daily purchase amounts (user-specified)
        var FIXED_DAILY = {
            'เนื้อวัว': 18,    // 18 กก.
            'น่องไก่': 15,    // 15 กก.
            'ผักบุ้ง': 10,    // 5-10 กก. (upper end)
            'ถั่วงอก': 10,    // 5-10 กก. (upper end)
            'กุ้ง': 3,        // 3 กก.
            'หมึก': 1,        // 1 กก.
            'ไข่': 3          // 3 แผง
        };

        // Formula-based amounts for noodles, ลูกชิ้น (200 bowls)
        var FORMULA_200 = {
            'เส้นเล็ก': (55 / 1000) * 200,
            'เส้นใหญ่': (25 / 500) * 200,
            'เส้นหมี่ขาว': (25 / 500) * 200,
            'เส้นหมี่หยก': (2 / 4) * 200,
            'เส้นหมี่เหลือง': (2 / 4) * 200,
            'ลูกชิ้น': (2 / 90) * 200
        };

        var targetStock = 0;
        if (FIXED_DAILY[name] !== undefined) {
            targetStock = FIXED_DAILY[name];
        } else if (FORMULA_200[name] !== undefined) {
            targetStock = FORMULA_200[name];
        }

        if (targetStock > 0) {
            shouldBuy = targetStock - rem;
            if (shouldBuy < 0) shouldBuy = 0;
        }

        var shouldBuyText = '-';
        if (shouldBuy > 0) {
            // For ไข่, use แผง (whole number since unit is แผง)
            if (name === 'ไข่') {
                shouldBuyText = Math.ceil(shouldBuy) + ' แผง';
            } else {
                shouldBuyText = Math.ceil(shouldBuy) + ' ' + displayUnit;
            }
        } else if (targetStock > 0) {
            // Has a target but stock is already enough
            shouldBuyText = '0 ' + (name === 'ไข่' ? 'แผง' : displayUnit);
        }

        html += '<tr>';
        html += '<td style="padding:6px; border:1px solid #000000; font-weight:normal; color:#000000;">' + name + '</td>';
        var inText = formatSecondaryUnit(name, inQty, true);
        if (name === 'กุ้ง' || name === 'น่องไก่') {
            inText = parseFloat(Number(inQty).toFixed(2)) + ' กก.';
        }
        html += '<td style="padding:6px; border:1px solid #000000; text-align:center; font-weight:normal; color:#000000;">' + inText + '</td>';
        html += '<td style="padding:6px; border:1px solid #000000; text-align:center; font-weight:normal; color:#000000;">' + usedText + '</td>';
        html += '<td style="padding:6px; border:1px solid #000000; text-align:center; background:' + bgColor + '; font-weight:' + fontWeight + '; color:' + textColor + ';">' + remText + '</td>';
        html += '<td style="padding:6px; border:1px solid #000000; text-align:center; font-weight:bold; color:#000000;">' + shouldBuyText + '</td>';
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
