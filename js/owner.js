// ===== OWNER DASHBOARD =====

var currentUser = null;

var ALL_INGREDIENTS = [];
var ING_EMOJIS = {};
var ING_UNITS = {};
var ING_DAILY_REC = {};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function () {
    currentUser = requireAuth(['owner']);
    if (!currentUser) return;
    document.getElementById('acc-name').textContent = currentUser.name || currentUser.username;

    // Fetch latest data and re-render
    Promise.all([
        syncFromServer(),
        fetch(SERVER_BASE + '/api/ingredients.php')
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (Array.isArray(data)) {
                    ALL_INGREDIENTS = data.map(function (ing) { return ing.ingredient_name; });
                    data.forEach(function (ing) {
                        ING_EMOJIS[ing.ingredient_name] = ing.icon_html || '📦';
                        ING_UNITS[ing.ingredient_name] = ing.unit;
                        ING_DAILY_REC[ing.ingredient_name] = parseFloat(ing.daily_recommended) || 0;
                    });
                }
            }),
        fetch(SERVER_BASE + '/api/ingredients.php?action=get_formula')
            .then(function (res) { return res.json(); })
            .then(function (data) { window.FORMULA = data || {}; })
    ]).then(function () {
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
        populateIngList();
        populateSoIngList();
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
    
    var remainingData = getRemaining();
    var currentRemaining = (remainingData && remainingData[name]) ? remainingData[name].remaining : 0;
    var recommended = calculateRecommended(name, currentRemaining);
    
    if (recommended.value > 0) {
        document.getElementById('si-unit-label').innerHTML = 'จำนวน (' + unit + ') <span style="color:#D32F2F; font-size:0.8rem; font-weight:bold;">(ควรซื้ออีก ' + recommended.text + ')</span>';
    } else {
        document.getElementById('si-unit-label').textContent = 'จำนวน (' + unit + ')';
    }
    document.getElementById('si-qty').focus();
}

function calculateRecommended(name, remaining) {
    // Formula-based amounts (200 bowls)
    // Removed hardcoded FORMULA_200, using dynamic window.FORMULA

    var targetStock = 0;
    if (ING_DAILY_REC[name] !== undefined && ING_DAILY_REC[name] > 0) {
        targetStock = ING_DAILY_REC[name];
    } else if (window.FORMULA && window.FORMULA[name] !== undefined) {
        targetStock = window.FORMULA[name] * 200;
    }

    var shouldBuy = 0;
    if (targetStock > 0) {
        shouldBuy = targetStock - remaining;
        if (shouldBuy < 0) shouldBuy = 0;
    }

    var text = '-';
    var unit = ING_UNITS[name];
    var displayUnit = unit === 'กิโลกรัม' ? 'กก.' : unit;

    if (shouldBuy > 0) {
        if (name === 'ไข่') {
            text = Math.ceil(shouldBuy) + ' แผง';
        } else {
            text = Math.ceil(shouldBuy) + ' ' + displayUnit;
        }
    } else if (targetStock > 0) {
        text = '0 ' + (name === 'ไข่' ? 'แผง' : displayUnit);
    }

    return {
        value: shouldBuy,
        text: text,
        target: targetStock
    };
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

    updateOwnerNotification();
}

function updateOwnerNotification() {
    var remainingData = getRemaining();
    var disabledIngredients = getDisabledIngredients();
    var lowStockItems = [];

    ALL_INGREDIENTS.forEach(function (name) {
        var d = remainingData[name];
        var isEnabled = disabledIngredients.indexOf(name) === -1;
        // Low stock condition: automatically empty or <= 1.5, AND enabled
        if (isEnabled && d.remaining <= 1.5) {
            lowStockItems.push({
                name: name,
                remaining: d.remaining,
                unit: d.unit,
                isEmpty: d.remaining <= 0
            });
        }
    });

    var badges = document.querySelectorAll('.noti-badge');
    var list = document.getElementById('owner-noti-list');

    badges.forEach(function (badge) {
        if (lowStockItems.length > 0) {
            badge.style.display = 'flex';
            badge.textContent = lowStockItems.length;
            badge.style.background = '#f44336';
            badge.style.border = '2px solid #c62828';
        } else {
            badge.style.display = 'none';
        }
    });

    if (list) {
        if (lowStockItems.length > 0) {
            // Sort by empty first, then ascending remaining
            lowStockItems.sort(function(a, b) {
                if (a.isEmpty && !b.isEmpty) return -1;
                if (!a.isEmpty && b.isEmpty) return 1;
                return a.remaining - b.remaining;
            });

            var html = '';
            lowStockItems.forEach(function (item) {
                var emoji = ING_EMOJIS[item.name] || '📦';
                var color = item.isEmpty ? '#f44336' : '#FF9800';
                var bgColor = item.isEmpty ? '#fff0f0' : '#fff8e1';
                var icon = item.isEmpty ? '🔴' : '⚠️';
                
                var remText = formatSecondaryUnit(item.name, item.remaining, false);
                if (!remText) remText = item.remaining + ' ' + item.unit;

                // จัดบรรทัดเดียวให้กระชับ
                if (remText.indexOf('<br>หรือ ') !== -1) {
                    remText = remText.replace('<br>หรือ ', ' (') + ')';
                }
                var statusText = item.isEmpty ? 'หมดสต็อก' : 'เหลือ ' + remText;

                html += '<div style="background:'+bgColor+'; border-left:4px solid '+color+'; padding:10px 12px; border-radius:6px; margin-bottom:8px; display:flex; align-items:center; gap:12px; cursor:pointer;" onclick="showTab(\'page-remaining\', document.querySelector(\'.bottom-nav .nav-item:nth-child(2)\')); toggleOwnerNotiPanel();">';
                html += '<div style="font-size:1.4rem; width:32px; height:32px; background:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 1px 2px rgba(0,0,0,0.1);">' + emoji + '</div>';
                html += '<div style="flex:1; display:flex; justify-content:space-between; align-items:center;">';
                html += '<div style="font-weight:700; font-size:0.95rem; color:#333;">' + item.name + '</div>';
                html += '<div style="font-size:0.85rem; color:'+color+'; font-weight:600;">' + icon + ' ' + statusText + '</div>';
                html += '</div>';
                html += '</div>';
            });
            list.innerHTML = html;
        } else {
            list.innerHTML = '<div style="text-align:center; color:#999; padding:20px 0; font-size:0.9rem;">วัตถุดิบเพียงพอ 🎉</div>';
        }
    }
}

function toggleOwnerNotiPanel() {
    var panel = document.getElementById('owner-noti-panel');
    if (!panel) return;

    if (panel.style.display === 'none' || !panel.style.display) {
        var activePage = document.querySelector('.page.active');
        if (document.getElementById('page-report-history') && document.getElementById('page-report-history').style.display === 'block') {
            activePage = document.getElementById('page-report-history');
        }
        var bellBtn = activePage ? activePage.querySelector('.noti-btn') : document.querySelector('.noti-btn');

        if (bellBtn) {
            var rect = bellBtn.getBoundingClientRect();
            var panelWidth = 320;
            var viewportWidth = window.innerWidth;

            var top = rect.bottom + 12;
            var left = rect.left + (rect.width / 2) - (panelWidth / 2);

            if (left + panelWidth > viewportWidth - 15) {
                left = viewportWidth - panelWidth - 15;
            }
            if (left < 15) left = 15;

            panel.style.top = top + 'px';
            panel.style.left = left + 'px';
        }

        panel.style.display = 'flex';
    } else {
        panel.style.display = 'none';
    }
}



// ===== REPORT =====
// ===== REPORT =====
// ===== REPORT =====
function renderReport() {
    var container = document.getElementById('report-table-main-container');
    if (!container) return;

    var html = '<table class="ing-table">';
    html += '<tr><th>รายการ</th><th>รับเข้า</th><th>ที่ใช้ไป</th><th>คงเหลือ</th><th>ควรซื้อเพิ่ม</th></tr>';

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

        var recommended = calculateRecommended(name, remaining);

        html += '<tr>';
        html += '<td>' + name + '</td>';
        html += '<td>' + inText + '</td>';
        html += '<td>' + usedText + '</td>';
        html += '<td class="' + statusClass + '">' + remText + '</td>';
        html += '<td style="font-weight:700; color:#333;">' + recommended.text + '</td>';
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

    window.allReportDates = uniqueDates;
    
    // Initialize custom calendar
    var now = new Date();
    window.reportCalendarYear = now.getFullYear();
    window.reportCalendarMonth = now.getMonth();
    window.selectedReportDate = null;
    
    var btn = document.getElementById('report-calendar-btn');
    if (btn) {
        btn.innerHTML = '<span>📅 เลือกวันที่</span>';
    }

    renderReportHistoryList();

    // Switch pages visually (leave bottom nav alone)
    document.getElementById('page-report').style.display = 'none';
    document.getElementById('page-report-history').style.display = 'block';
}

function renderReportHistoryList(filterDateStr) {
    var container = document.getElementById('report-list-container');
    if (!container) return;

    var datesToShow = window.allReportDates || [];
    
    if (filterDateStr) {
        // filterDateStr can be:
        // 1. CE format "YYYY-MM-DD" (from native calendar input if any)
        // 2. BE format "D-M-YYYY" (from our custom calendar)
        if (filterDateStr.indexOf('-') !== -1) {
            var parts = filterDateStr.split('-');
            if (parts.length === 3) {
                if (parts[0].length === 4) {
                    // CE format "YYYY-MM-DD"
                    // Set hours to 12 (noon) to avoid day shifting in getShiftDateStr!
                    var ceD = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0);
                    var targetStr = getShiftDateStr(ceD);
                    datesToShow = datesToShow.filter(function(d) { return d === targetStr; });
                } else {
                    // BE format "D-M-YYYY" e.g. "18-5-2569"
                    datesToShow = datesToShow.filter(function(d) { return d === filterDateStr; });
                }
            }
        }
    }

    if (datesToShow.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:20px; color:#888;">ไม่พบรายงานในวันที่เลือก</div>';
        return;
    }

    // 3. Render HTML list
    var html = '';
    datesToShow.forEach(function (dateStr) {
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
}

// ===== CUSTOM REPORT CALENDAR FUNCTIONS =====
function toggleReportCalendar(e) {
    if (e) e.stopPropagation();
    var popover = document.getElementById('report-calendar-popover');
    if (!popover) return;
    
    if (popover.style.display === 'none' || !popover.style.display) {
        popover.style.display = 'block';
        renderReportCalendar();
        
        // Close calendar when clicking outside
        var closeCal = function(event) {
            var btn = document.getElementById('report-calendar-btn');
            if (popover.contains(event.target) || (btn && btn.contains(event.target))) return;
            popover.style.display = 'none';
            document.removeEventListener('click', closeCal);
        };
        document.addEventListener('click', closeCal);
    } else {
        popover.style.display = 'none';
    }
}

function renderReportCalendar() {
    var popover = document.getElementById('report-calendar-popover');
    if (!popover) return;

    var year = window.reportCalendarYear;
    var month = window.reportCalendarMonth;

    var firstDay = new Date(year, month, 1).getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();

    var yearBE = year + 543;
    var monthNames = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

    var html = '';
    // Calendar Header
    html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; font-family:\'Prompt\',sans-serif;">';
    html += '<button onclick="changeReportCalendarMonth(-1, event)" style="background:none; border:1px solid #ccc; border-radius:50%; width:28px; height:28px; cursor:pointer; font-size:0.8rem; display:flex; align-items:center; justify-content:center;">◀</button>';
    html += '<span style="font-weight:600; font-size:0.9rem; color:#333;">' + monthNames[month] + ' ' + yearBE + '</span>';
    html += '<button onclick="changeReportCalendarMonth(1, event)" style="background:none; border:1px solid #ccc; border-radius:50%; width:28px; height:28px; cursor:pointer; font-size:0.8rem; display:flex; align-items:center; justify-content:center;">▶</button>';
    html += '</div>';

    // Weekday headers (Sun first)
    var dayHeaders = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
    html += '<div style="display:grid; grid-template-columns: repeat(7, 1fr); gap:4px; text-align:center; margin-bottom:6px; font-family:\'Prompt\',sans-serif;">';
    dayHeaders.forEach(function (h) {
        html += '<div style="font-size:0.7rem; font-weight:600; color:#888;">' + h + '</div>';
    });
    html += '</div>';

    // Days Grid
    html += '<div style="display:grid; grid-template-columns: repeat(7, 1fr); gap:4px; text-align:center; font-family:\'Prompt\',sans-serif;">';
    
    // Empty slots before 1st of month
    for (var i = 0; i < firstDay; i++) {
        html += '<div></div>';
    }

    // Days of the month
    for (var d = 1; d <= daysInMonth; d++) {
        var dateBEStr = d + '-' + (month + 1) + '-' + yearBE;
        var hasData = (window.allReportDates || []).indexOf(dateBEStr) !== -1;
        var isSelected = window.selectedReportDate === dateBEStr;

        var style = 'width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:auto; font-size:0.8rem; font-family:\'Prompt\',sans-serif; ';

        if (isSelected) {
            style += 'background:#C62828; color:#fff; font-weight:bold; cursor:pointer;';
        } else if (hasData) {
            style += 'background:#4CAF50; color:#fff; font-weight:bold; cursor:pointer; box-shadow:0 1px 3px rgba(76,175,80,0.3);';
        } else {
            style += 'color:#777; cursor:pointer; font-weight:500;';
        }

        var onclickHtml = 'onclick="selectReportDate(\'' + dateBEStr + '\', ' + hasData + ', event)"';

        html += '<div style="' + style + '" ' + onclickHtml + '>' + d + '</div>';
    }

    html += '</div>';
    popover.innerHTML = html;
}

function changeReportCalendarMonth(delta, e) {
    if (e) e.stopPropagation();
    window.reportCalendarMonth += delta;
    if (window.reportCalendarMonth < 0) {
        window.reportCalendarMonth = 11;
        window.reportCalendarYear--;
    } else if (window.reportCalendarMonth > 11) {
        window.reportCalendarMonth = 0;
        window.reportCalendarYear++;
    }
    renderReportCalendar();
}

function selectReportDate(dateBEStr, hasData, e) {
    if (e) e.stopPropagation();
    if (!hasData) {
        showToast('ไม่มีรายงานในวันนี้');
        return;
    }
    window.selectedReportDate = dateBEStr;
    
    // Update button text
    var btn = document.getElementById('report-calendar-btn');
    if (btn) {
        var displayDate = dateBEStr.replace(/-/g, '/');
        btn.innerHTML = '<span>📅 ' + displayDate + '</span>';
    }

    // Close popover
    var popover = document.getElementById('report-calendar-popover');
    if (popover) popover.style.display = 'none';

    // Render filtered list
    renderReportHistoryList(dateBEStr);
}

function clearReportFilter() {
    window.selectedReportDate = null;
    
    var now = new Date();
    window.reportCalendarYear = now.getFullYear();
    window.reportCalendarMonth = now.getMonth();

    var btn = document.getElementById('report-calendar-btn');
    if (btn) {
        btn.innerHTML = '<span>📅 เลือกวันที่</span>';
    }
    var popover = document.getElementById('report-calendar-popover');
    if (popover) {
        popover.style.display = 'none';
        renderReportCalendar();
    }
    
    renderReportHistoryList();
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

        var recommended = calculateRecommended(name, rem);

        html += '<tr>';
        html += '<td style="padding:6px; border:1px solid #000000; font-weight:normal; color:#000000;">' + name + '</td>';
        var inText = formatSecondaryUnit(name, inQty, true);
        if (name === 'กุ้ง' || name === 'น่องไก่') {
            inText = parseFloat(Number(inQty).toFixed(2)) + ' กก.';
        }
        html += '<td style="padding:6px; border:1px solid #000000; text-align:center; font-weight:normal; color:#000000;">' + inText + '</td>';
        html += '<td style="padding:6px; border:1px solid #000000; text-align:center; font-weight:normal; color:#000000;">' + usedText + '</td>';
        html += '<td style="padding:6px; border:1px solid #000000; text-align:center; background:' + bgColor + '; font-weight:' + fontWeight + '; color:' + textColor + ';">' + remText + '</td>';
        html += '<td style="padding:6px; border:1px solid #000000; text-align:center; font-weight:bold; color:#000000;">' + recommended.text + '</td>';
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

// ===== SALES SUMMARY REPORT EXTENSIONS =====

// --- State Variables ---
window.salesFilterType = 'day'; // 'day' | 'week' | 'month' | 'year'
window.salesSelectedDate = null; // Will initialize to today's shift date on first run
window.salesCalendarYear = null;
window.salesCalendarMonth = null;

// Initialize sales calendar dates
function initSalesDateState() {
    if (!window.salesSelectedDate) {
        var now = new Date();
        // Calculate the logical shift date for today
        var dStr = getShiftDateStr(now); // e.g. "18-5-2569"
        var p = dStr.split('-');
        // Convert Thai BE year to CE year
        var ceYear = parseInt(p[2]) - 543;
        var ceMonth = parseInt(p[1]) - 1;
        var ceDay = parseInt(p[0]);
        window.salesSelectedDate = new Date(ceYear, ceMonth, ceDay, 12, 0, 0);
    }
    if (window.salesCalendarYear === null) {
        window.salesCalendarYear = window.salesSelectedDate.getFullYear();
        window.salesCalendarMonth = window.salesSelectedDate.getMonth();
    }
}

// Switch between report sub-tabs
function switchReportTab(type) {
    var btnIng = document.getElementById('btn-report-ing');
    var btnSales = document.getElementById('btn-report-sales');
    var secIng = document.getElementById('report-ing-section');
    var secSales = document.getElementById('report-sales-section');

    if (type === 'ing') {
        btnIng.classList.add('active');
        btnSales.classList.remove('active');
        secIng.style.display = 'block';
        secSales.style.display = 'none';
    } else {
        btnIng.classList.remove('active');
        btnSales.classList.add('active');
        secIng.style.display = 'none';
        secSales.style.display = 'block';
        
        // Initialize state and render sales summary
        initSalesDateState();
        updateSalesCalendarBtnText();
        renderSalesSummary();
    }
}

// Change period filter type
function setSalesFilterType(type) {
    window.salesFilterType = type;
    document.querySelectorAll('.sales-filter-btn').forEach(function (btn) {
        btn.classList.remove('active');
    });
    
    var activeBtn = document.getElementById('btn-sales-filter-' + type);
    if (activeBtn) activeBtn.classList.add('active');
    
    // Close calendar popover
    var popover = document.getElementById('sales-calendar-popover');
    if (popover) popover.style.display = 'none';
    
    updateSalesCalendarBtnText();
    renderSalesSummary();
}

// Format Thai Date string for UI
function formatThaiDateDisplay(dateObj) {
    if (!dateObj) return '';
    var d = dateObj.getDate();
    var m = dateObj.getMonth();
    var yBE = dateObj.getFullYear() + 543;
    var monthNames = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    return d + ' ' + monthNames[m] + ' ' + yBE;
}

// Format Thai Month and Year display
function formatThaiMonthDisplay(dateObj) {
    if (!dateObj) return '';
    var m = dateObj.getMonth();
    var yBE = dateObj.getFullYear() + 543;
    var monthNames = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    return monthNames[m] + ' ' + yBE;
}

// Get the Monday of the week containing the selected date
function getStartOfWeek(d) {
    var date = new Date(d.getTime());
    var day = date.getDay();
    var diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday (0) to make Monday (1) start of week
    return new Date(date.setDate(diff));
}

// Get the Sunday of the week containing the selected date
function getEndOfWeek(d) {
    var start = getStartOfWeek(d);
    var end = new Date(start.getTime());
    end.setDate(start.getDate() + 6);
    return end;
}

// Update the text on the calendar selector button
function updateSalesCalendarBtnText() {
    initSalesDateState();
    var btnText = document.getElementById('sales-calendar-btn-text');
    if (!btnText) return;
    
    var d = window.salesSelectedDate;
    if (window.salesFilterType === 'day') {
        btnText.innerHTML = '📅 ' + formatThaiDateDisplay(d);
    } else if (window.salesFilterType === 'week') {
        var start = getStartOfWeek(d);
        var end = getEndOfWeek(d);
        
        var startStr = start.getDate() + '/' + (start.getMonth() + 1).toString().padStart(2, '0') + '/' + (start.getFullYear() + 543);
        var endStr = end.getDate() + '/' + (end.getMonth() + 1).toString().padStart(2, '0') + '/' + (end.getFullYear() + 543);
        
        btnText.innerHTML = '📅 ' + startStr + ' - ' + endStr;
    } else if (window.salesFilterType === 'month') {
        btnText.innerHTML = '📅 ' + formatThaiMonthDisplay(d);
    } else if (window.salesFilterType === 'year') {
        btnText.innerHTML = '📅 ปี พ.ศ. ' + (d.getFullYear() + 543);
    }
}

// Toggle display of the sales calendar popover
function toggleSalesCalendar(e) {
    if (e) e.stopPropagation();
    var popover = document.getElementById('sales-calendar-popover');
    if (!popover) return;
    
    if (popover.style.display === 'none' || !popover.style.display) {
        popover.style.display = 'block';
        renderSalesCalendar();
        
        // Add one-time outside click listener to close popover
        var closeListener = function() {
            popover.style.display = 'none';
            document.removeEventListener('click', closeListener);
        };
        setTimeout(function() {
            document.addEventListener('click', closeListener);
        }, 0);
    } else {
        popover.style.display = 'none';
    }
}

// Render calendar popover content dynamically based on current filter type
function renderSalesCalendar() {
    var popover = document.getElementById('sales-calendar-popover');
    if (!popover) return;
    
    initSalesDateState();
    var type = window.salesFilterType;
    var year = window.salesCalendarYear;
    var month = window.salesCalendarMonth;
    var yearBE = year + 543;
    
    var monthNames = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    var html = '';
    
    // RENDER HEADING & MONTH/YEAR SWAP CONTROLS FOR DAY/WEEK MODES
    if (type === 'day' || type === 'week') {
        var firstDay = new Date(year, month, 1).getDay();
        var daysInMonth = new Date(year, month + 1, 0).getDate();
        
        html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; font-family:\'Prompt\',sans-serif;">';
        html += '<button onclick="changeSalesCalendarMonth(-1, event)" style="background:none; border:1px solid #ccc; border-radius:50%; width:28px; height:28px; cursor:pointer; font-size:0.8rem; display:flex; align-items:center; justify-content:center;">◀</button>';
        html += '<span style="font-weight:600; font-size:0.9rem; color:#333;">' + monthNames[month] + ' ' + yearBE + '</span>';
        html += '<button onclick="changeSalesCalendarMonth(1, event)" style="background:none; border:1px solid #ccc; border-radius:50%; width:28px; height:28px; cursor:pointer; font-size:0.8rem; display:flex; align-items:center; justify-content:center;">▶</button>';
        html += '</div>';
        
        // Weekday headers
        var dayHeaders = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
        html += '<div style="display:grid; grid-template-columns: repeat(7, 1fr); gap:4px; text-align:center; margin-bottom:6px; font-family:\'Prompt\',sans-serif;">';
        dayHeaders.forEach(function (h) {
            html += '<div style="font-size:0.7rem; font-weight:600; color:#888;">' + h + '</div>';
        });
        html += '</div>';
        
        // Days Grid
        html += '<div style="display:grid; grid-template-columns: repeat(7, 1fr); gap:4px; text-align:center; font-family:\'Prompt\',sans-serif;">';
        
        // Empty slots before 1st day of month
        for (var i = 0; i < firstDay; i++) {
            html += '<div></div>';
        }
        
        // Render days
        for (var d = 1; d <= daysInMonth; d++) {
            var currentDayDate = new Date(year, month, d);
            var isSelected = false;
            var isWeekHover = false;
            var isWeekStart = false;
            var isWeekEnd = false;
            
            var dayClass = 'cal-day';
            var inlineStyles = '';
            
            if (type === 'day') {
                isSelected = (window.salesSelectedDate.getFullYear() === year &&
                              window.salesSelectedDate.getMonth() === month &&
                              window.salesSelectedDate.getDate() === d);
            } else if (type === 'week') {
                var startOfWeek = getStartOfWeek(window.salesSelectedDate);
                var endOfWeek = getEndOfWeek(window.salesSelectedDate);
                
                // Set start/end boundaries of week to 00:00:00 for perfect comparison
                startOfWeek.setHours(0,0,0,0);
                endOfWeek.setHours(23,59,59,999);
                currentDayDate.setHours(12,0,0,0); // mid-day for safe date arithmetic
                
                isSelected = (currentDayDate >= startOfWeek && currentDayDate <= endOfWeek);
                
                // Find if this cell represents monday (start) or sunday (end) of week
                var currentDayNum = currentDayDate.getDay();
                if (isSelected) {
                    dayClass += ' sales-week-active';
                    if (currentDayNum === 1) dayClass += ' sales-week-start';
                    if (currentDayNum === 0) dayClass += ' sales-week-end';
                }
            }
            
            var style = 'width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:auto; font-size:0.8rem; font-family:\'Prompt\',sans-serif; ';
            
            if (isSelected && type === 'day') {
                style += 'background:#C62828; color:#fff; font-weight:bold; cursor:pointer;';
            } else if (isSelected && type === 'week') {
                style = 'width:30px; height:30px; display:flex; align-items:center; justify-content:center; margin:auto; font-size:0.8rem; font-family:\'Prompt\',sans-serif; cursor:pointer;';
            } else {
                style += 'color:#333; cursor:pointer; font-weight:500;';
            }
            
            // Mouse event parameters for week hovering highlights
            var mouseOverHtml = '';
            var mouseOutHtml = '';
            if (type === 'week') {
                mouseOverHtml = 'onmouseover="highlightSalesCalendarWeek(' + d + ', true)"';
                mouseOutHtml = 'onmouseout="highlightSalesCalendarWeek(' + d + ', false)"';
            }
            
            var onclickHtml = 'onclick="selectSalesCalendarDate(' + d + ', event)"';
            
            html += '<div id="sales-cal-day-' + d + '" class="' + dayClass + '" style="' + style + '" ' + onclickHtml + ' ' + mouseOverHtml + ' ' + mouseOutHtml + ' data-day="' + d + '" data-wday="' + currentDayDate.getDay() + '">' + d + '</div>';
        }
        
        html += '</div>';
    } 
    // RENDER MONTH SELECTOR
    else if (type === 'month') {
        html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; font-family:\'Prompt\',sans-serif;">';
        html += '<button onclick="changeSalesCalendarYear(-1, event)" style="background:none; border:1px solid #ccc; border-radius:50%; width:28px; height:28px; cursor:pointer; font-size:0.8rem; display:flex; align-items:center; justify-content:center;">◀</button>';
        html += '<span style="font-weight:600; font-size:0.9rem; color:#333;">ปี พ.ศ. ' + yearBE + '</span>';
        html += '<button onclick="changeSalesCalendarYear(1, event)" style="background:none; border:1px solid #ccc; border-radius:50%; width:28px; height:28px; cursor:pointer; font-size:0.8rem; display:flex; align-items:center; justify-content:center;">▶</button>';
        html += '</div>';
        
        html += '<div class="sales-month-grid">';
        var shortMonthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        for (var mIdx = 0; mIdx < 12; mIdx++) {
            var isSelMonth = (window.salesSelectedDate.getFullYear() === year && window.salesSelectedDate.getMonth() === mIdx);
            var mClass = 'sales-month-btn' + (isSelMonth ? ' active' : '');
            html += '<div class="' + mClass + '" onclick="selectSalesCalendarMonth(' + mIdx + ', event)">' + shortMonthNames[mIdx] + '</div>';
        }
        html += '</div>';
    } 
    // RENDER YEAR SELECTOR
    else if (type === 'year') {
        html += '<div style="text-align:center; font-weight:600; font-size:0.9rem; margin-bottom:10px; color:#333; font-family:\'Prompt\',sans-serif;">เลือกปี พ.ศ.</div>';
        html += '<div class="sales-year-grid">';
        
        // Show range of 6 years (e.g. current year - 4 to current year + 1)
        var curYear = new Date().getFullYear();
        for (var yOffset = -4; yOffset <= 1; yOffset++) {
            var targetY = curYear + yOffset;
            var targetYBE = targetY + 543;
            var isSelYear = (window.salesSelectedDate.getFullYear() === targetY);
            var yClass = 'sales-year-btn' + (isSelYear ? ' active' : '');
            html += '<div class="' + yClass + '" onclick="selectSalesCalendarYear(' + targetY + ', event)">' + targetYBE + '</div>';
        }
        html += '</div>';
    }
    
    popover.innerHTML = html;
}

// Adjust year for month/year viewport
function changeSalesCalendarYear(delta, e) {
    if (e) e.stopPropagation();
    window.salesCalendarYear += delta;
    renderSalesCalendar();
}

// Adjust month for day/week calendar viewport
function changeSalesCalendarMonth(delta, e) {
    if (e) e.stopPropagation();
    window.salesCalendarMonth += delta;
    if (window.salesCalendarMonth < 0) {
        window.salesCalendarMonth = 11;
        window.salesCalendarYear--;
    } else if (window.salesCalendarMonth > 11) {
        window.salesCalendarMonth = 0;
        window.salesCalendarYear++;
    }
    renderSalesCalendar();
}

// Mouse hover effects for highlighting whole weeks in the calendar
function highlightSalesCalendarWeek(day, isEntering) {
    var cells = document.querySelectorAll('#sales-calendar-popover .cal-day');
    var targetCell = document.getElementById('sales-cal-day-' + day);
    if (!targetCell) return;
    
    var year = window.salesCalendarYear;
    var month = window.salesCalendarMonth;
    var targetDate = new Date(year, month, day);
    
    var startOfWeek = getStartOfWeek(targetDate);
    var endOfWeek = getEndOfWeek(targetDate);
    
    startOfWeek.setHours(0,0,0,0);
    endOfWeek.setHours(23,59,59,999);
    
    cells.forEach(function (cell) {
        var dNum = parseInt(cell.getAttribute('data-day'));
        if (isNaN(dNum)) return;
        
        var cellDate = new Date(year, month, dNum);
        cellDate.setHours(12,0,0,0);
        
        var isWithinWeek = (cellDate >= startOfWeek && cellDate <= endOfWeek);
        if (isWithinWeek) {
            var wday = parseInt(cell.getAttribute('data-wday'));
            if (isEntering) {
                cell.classList.add('sales-week-hover');
                if (wday === 1) cell.classList.add('sales-week-start');
                if (wday === 0) cell.classList.add('sales-week-end');
            } else {
                cell.classList.remove('sales-week-hover');
                // preserve active highlights borders
                if (!cell.classList.contains('sales-week-active')) {
                    cell.classList.remove('sales-week-start');
                    cell.classList.remove('sales-week-end');
                }
            }
        }
    });
}

// Select a day/week date
function selectSalesCalendarDate(day, e) {
    if (e) e.stopPropagation();
    window.salesSelectedDate = new Date(window.salesCalendarYear, window.salesCalendarMonth, day, 12, 0, 0);
    
    // Close calendar popover
    var popover = document.getElementById('sales-calendar-popover');
    if (popover) popover.style.display = 'none';
    
    updateSalesCalendarBtnText();
    renderSalesSummary();
}

// Select a month
function selectSalesCalendarMonth(mIdx, e) {
    if (e) e.stopPropagation();
    window.salesSelectedDate = new Date(window.salesCalendarYear, mIdx, 1, 12, 0, 0);
    
    // Close calendar popover
    var popover = document.getElementById('sales-calendar-popover');
    if (popover) popover.style.display = 'none';
    
    updateSalesCalendarBtnText();
    renderSalesSummary();
}

// Select a year
function selectSalesCalendarYear(year, e) {
    if (e) e.stopPropagation();
    window.salesSelectedDate = new Date(year, 0, 1, 12, 0, 0);
    
    // Close calendar popover
    var popover = document.getElementById('sales-calendar-popover');
    if (popover) popover.style.display = 'none';
    
    updateSalesCalendarBtnText();
    renderSalesSummary();
}

// --- Dynamic Sales Aggregation & Rendering ---

window.currentSalesList = []; // Stores aggregated details for export

function renderSalesSummary() {
    var container = document.getElementById('sales-summary-container');
    if (!container) return;
    
    initSalesDateState();
    var filterType = window.salesFilterType;
    var selectedDate = window.salesSelectedDate;
    
    var allOrders = getOrders();
    var aggregated = {}; // { menuName: { qty, totalPrice, menuId } }
    
    var totalAmount = 0;
    var totalQty = 0;
    
    // Helper to calculate exact date boundaries for matching
    var targetDateKey = getDateKey(selectedDate); // logical YYYY-MM-DD
    var targetYear = selectedDate.getFullYear();
    var targetMonth = selectedDate.getMonth(); // 0-11
    
    var startOfWeek = getStartOfWeek(selectedDate);
    var endOfWeek = getEndOfWeek(selectedDate);
    var startOfWeekKey = getDateKey(startOfWeek);
    var endOfWeekKey = getDateKey(endOfWeek);
    
    allOrders.forEach(function (order) {
        // 1. Only include completed sales statuses
        if (order.status !== 'paid' && order.status !== 'served' && order.status !== 'completed') return;
        
        // 2. Parse order logical business date
        var orderDate = new Date(order.createdAt || order.completedAt || order.timestamp);
        var orderDateKey = getDateKey(orderDate); // Shifted YYYY-MM-DD
        
        var isMatch = false;
        
        if (filterType === 'day') {
            isMatch = (orderDateKey === targetDateKey);
        } else if (filterType === 'week') {
            // Compare logical date key strings directly or Date values
            var oLogicalDate = new Date(orderDate.getTime());
            oLogicalDate.setHours(oLogicalDate.getHours() - 4); // business shift offset
            oLogicalDate.setHours(12,0,0,0);
            
            var sW = new Date(startOfWeek.getTime());
            sW.setHours(0,0,0,0);
            var eW = new Date(endOfWeek.getTime());
            eW.setHours(23,59,59,999);
            
            isMatch = (oLogicalDate >= sW && oLogicalDate <= eW);
        } else if (filterType === 'month') {
            var oLogicalDate = new Date(orderDate.getTime());
            oLogicalDate.setHours(oLogicalDate.getHours() - 4);
            isMatch = (oLogicalDate.getFullYear() === targetYear && oLogicalDate.getMonth() === targetMonth);
        } else if (filterType === 'year') {
            var oLogicalDate = new Date(orderDate.getTime());
            oLogicalDate.setHours(oLogicalDate.getHours() - 4);
            isMatch = (oLogicalDate.getFullYear() === targetYear);
        }
        
        if (!isMatch) return;
        
        // 3. Aggregate sales details
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(function (item) {
                var name = item.name || 'ไม่ทราบเมนู';
                var qty = item.qty || item.quantity || 0;
                var price = item.totalPrice || item.price * qty || 0;
                var menuId = item.menuId || '';
                
                if (!aggregated[name]) {
                    aggregated[name] = { qty: 0, totalPrice: 0, menuId: menuId };
                }
                
                aggregated[name].qty += qty;
                aggregated[name].totalPrice += price;
                totalQty += qty;
                totalAmount += price;
            });
        }
    });
    
    // Convert to sorted array descending by quantity sold
    var salesList = [];
    for (var name in aggregated) {
        salesList.push({
            name: name,
            qty: aggregated[name].qty,
            totalPrice: aggregated[name].totalPrice,
            menuId: aggregated[name].menuId
        });
    }
    
    salesList.sort(function (a, b) { return b.qty - a.qty; });
    window.currentSalesList = salesList; // Store locally for exporting CSV
    
    // Update Overview Grand Totals
    var totalAmountEl = document.getElementById('sales-total-amount');
    var totalQtyEl = document.getElementById('sales-total-qty');
    
    if (totalAmountEl) totalAmountEl.textContent = '฿' + totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (totalQtyEl) totalQtyEl.textContent = totalQty.toLocaleString('th-TH') + ' ชาม';
    
    // RENDER MENU CARDS IN CONTAINER
    if (salesList.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px; color:#aaa; font-size:0.9rem; font-family:\'Prompt\',sans-serif; background:#fff; border-radius:12px; border:1px solid #eee;">ไม่มีประวัติการขายในช่วงเวลานี้ 🍜</div>';
        return;
    }
    
    // Find highest sales quantity to represent 100% of progress bar
    var maxQty = salesList.length > 0 ? salesList[0].qty : 1;
    if (maxQty <= 0) maxQty = 1;
    
    var html = '';
    salesList.forEach(function (item) {
        var percentage = Math.round((item.qty / maxQty) * 100);
        
        // Use image thumbnail from MENU_IMAGES, fall back to default image
        var imgSource = MENU_IMAGES[item.menuId] || 'images/ก๋วยเตี๋ยวน้ำข้น.jpg';
        var imgTag = '<img src="' + imgSource + '" alt="" onerror="this.src=\'images/ก๋วยเตี๋ยวน้ำข้น.jpg\'" style="width:28px;height:28px;object-fit:cover;border-radius:4px;margin-right:8px;vertical-align:middle;flex-shrink:0;">';
        
        html += '<div class="sales-item-card">';
        html += '<div class="sales-item-main">';
        html += '<div class="sales-item-name">' + imgTag + item.name + '</div>';
        html += '<div class="sales-item-stats">';
        html += '<div class="sales-item-qty">' + item.qty.toLocaleString('th-TH') + ' ชาม</div>';
        html += '<div class="sales-item-price">฿' + item.totalPrice.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</div>';
        html += '</div>';
        html += '</div>';
        html += '<div class="sales-progress-bar-bg">';
        html += '<div class="sales-progress-bar" style="width:' + percentage + '%"></div>';
        html += '</div>';
        html += '</div>';
    });
    
    container.innerHTML = html;
}

// --- Download Sales Report to Excel (MS Excel XLS format) ---
function exportSalesExcel() {
    if (!window.currentSalesList || window.currentSalesList.length === 0) {
        showToast('ไม่มีข้อมูลการขายที่จะดาวน์โหลด');
        return;
    }
    
    initSalesDateState();
    var filterType = window.salesFilterType;
    var d = window.salesSelectedDate;
    
    var periodLabel = '';
    var dateLabel = '';
    
    if (filterType === 'day') {
        periodLabel = 'รายวัน';
        dateLabel = d.getDate() + '-' + (d.getMonth() + 1) + '-' + (d.getFullYear() + 543);
    } else if (filterType === 'week') {
        periodLabel = 'รายสัปดาห์';
        var start = getStartOfWeek(d);
        var end = getEndOfWeek(d);
        dateLabel = start.getDate() + '-' + (start.getMonth() + 1) + '-' + (start.getFullYear() + 543) + ' ถึง ' + end.getDate() + '-' + (end.getMonth() + 1) + '-' + (end.getFullYear() + 543);
    } else if (filterType === 'month') {
        periodLabel = 'รายเดือน';
        dateLabel = String(d.getMonth() + 1) + '-' + String(d.getFullYear() + 543);
    } else if (filterType === 'year') {
        periodLabel = 'รายปี';
        dateLabel = String(d.getFullYear() + 543);
    }
    
    var printTime = new Date().toLocaleString('th-TH');
    
    // Construct beautiful HTML Spreadsheet content (MS Excel compatible)
    var excelTemplate = 
        '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">' +
        '<head>' +
        '<meta charset="utf-8">' +
        '<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>สรุปยอดขาย</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->' +
        '<style>' +
        '  body { font-family: "Cordia New", "Prompt", Tahoma, sans-serif; }' +
        '  table { border-collapse: collapse; }' +
        '  th, td { border: 1px solid #ccc; padding: 6px 10px; font-size: 14px; }' +
        '  .title { font-size: 18px; font-weight: bold; text-align: left; border: none; }' +
        '  .meta { font-size: 12px; color: #555; text-align: left; border: none; }' +
        '  .header { font-weight: bold; background-color: #e0e0e0; text-align: center; }' +
        '  .total { font-weight: bold; background-color: #ffeb3b; }' +
        '  .number { text-align: right; }' +
        '</style>' +
        '</head>' +
        '<body>' +
        '<table>' +
        '  <tr><td colspan="3" class="title">สรุปยอดขายตามเมนู (' + periodLabel + ')</td></tr>' +
        '  <tr><td colspan="3" class="meta">ช่วงเวลา: ' + dateLabel + '</td></tr>' +
        '  <tr><td colspan="3" class="meta">พิมพ์เมื่อ: ' + printTime + '</td></tr>' +
        '  <tr><td colspan="3" class="meta"></td></tr>' +
        '  <tr class="header">' +
        '    <td>ชื่อเมนู</td>' +
        '    <td>จำนวนที่ขายได้ (ชาม)</td>' +
        '    <td>ยอดขายรวม (บาท)</td>' +
        '  </tr>';
        
    var grandTotalQty = 0;
    var grandTotalPrice = 0;
    
    window.currentSalesList.forEach(function (item) {
        excelTemplate += '  <tr>' +
                         '    <td>' + item.name + '</td>' +
                         '    <td class="number">' + item.qty + '</td>' +
                         '    <td class="number">' + item.totalPrice.toFixed(2) + '</td>' +
                         '  </tr>';
        grandTotalQty += item.qty;
        grandTotalPrice += item.totalPrice;
    });
    
    excelTemplate += '  <tr class="total">' +
                     '    <td>ยอดขายรวมทั้งหมด</td>' +
                     '    <td class="number">' + grandTotalQty + '</td>' +
                     '    <td class="number">' + grandTotalPrice.toFixed(2) + '</td>' +
                     '  </tr>' +
                     '</table>' +
                     '</body>' +
                     '</html>';
    
    // Trigger download as .xls (forces opening in Microsoft Excel)
    var blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    
    var filename = 'สรุปยอดขาย_' + periodLabel + '_' + dateLabel + '.xls';
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('ดาวน์โหลดรายงาน Excel สำเร็จ');
}
