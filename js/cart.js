// ===== CART SYSTEM (Table Layout) =====

const FORMULA = {
    'เส้นเล็ก': 55 / 1000,
    'เส้นใหญ่': 25 / 500,
    'เส้นหมี่ขาว': 25 / 500,
    'เส้นหมี่หยก': 1 / 4,
    'เส้นหมี่เหลือง': 1 / 4,
    'ผักบุ้ง': 15 / 1000,
    'ถั่วงอก': 35 / 1000,
    'ลูกชิ้น': 2 / 90,
    'เนื้อวัว': 60 / 1000,
    'น่องไก่': 80 / 1000,
    'กุ้ง': 80 / 1000,
    'หมึก': 45 / 1000,
    'ไข่': 1 / 30
};

var editingCartIndex = -1;

// function editCartItem(index) { removed - now in app.js

function addToCart() {
    if (!currentMenuItem) return;

    var btnAdd = document.querySelector('.btn-add');
    if (btnAdd && btnAdd.classList.contains('disabled')) {
        showToast('กรุณาเลือกวัตถุดิบให้ครบถ้วน');
        return;
    }

    var menu = currentMenuItem;
    var totalPrice = menu.price;
    var details = [];
    var ingredients = {};

    function addIng(name) {
        if (FORMULA[name] !== undefined) {
            ingredients[name] = (ingredients[name] || 0) + FORMULA[name];
        }
    }

    // === เส้น ===
    if (menu.hasNoodle) {
        var noodleSel = document.querySelector('input[name="noodle"]:checked');
        if (noodleSel) {
            var noodle = NOODLE_OPTIONS.find(function (n) { return n.id === noodleSel.value; });
            if (noodle) {
                details.push(noodle.ingredient);
                addIng(noodle.ingredient);
            }
        }

        // === ผสมเส้น ===
        var mixNoodleSel = document.querySelector('input[name="mixed-noodle"]:checked');
        if (mixNoodleSel) {
            var mn = NOODLE_OPTIONS.find(function (n) { return n.id === mixNoodleSel.value; });
            if (mn) {
                details.push('ผสม' + mn.ingredient);
                addIng(mn.ingredient);
            }
        }
    }

    // === เนื้อสัตว์ (ไม่แสดงสำหรับต้มยำทะเล) ===
    if (menu.hasMeat) {
        var meatSel = document.querySelector('input[name="meat"]:checked');
        if (meatSel) {
            var meat = MEAT_OPTIONS.find(function (m) { return m.id === meatSel.value; });
            if (meat) {
                details.push(meat.name);
                addIng(meat.ingredient);
            }
        }
    }

    // === ต้มยำทะเล: กุ้ง + หมึก (ไม่แสดงในรายละเอียด) ===
    if (menu.isSeafood) {
        addIng('กุ้ง');
        addIng('หมึก');
    }

    // === เมนูปกติ: ลูกชิ้น (มีในน้ำข้น, แห้ง, เกาเหลา) ===
    if (menu.id === 'nam-khon' || menu.id === 'haeng' || menu.id === 'kao-lao') {
        addIng('ลูกชิ้น');
    }

    // === ผัก (แสดงเฉพาะตอนไม่ใส่ผัก) ===
    var vegSel = document.querySelector('input[name="veggie"]:checked');
    if (vegSel) {
        var veg = VEGGIE_OPTIONS.find(function (v) { return v.id === vegSel.value; });
        if (veg) {
            if (!veg.hasVeg) {
                details.push('ไม่ใส่ผัก');
            } else {
                addIng('ผักบุ้ง');
                addIng('ถั่วงอก');
            }
        }
    }

    // === สั่งเพิ่ม (ไม่มีคำว่า เพิ่ม:) ===
    var extraChecks = document.querySelectorAll('input[name="extras"]:checked');
    var extraNames = [];
    extraChecks.forEach(function (cb) {
        var extra = EXTRA_OPTIONS.find(function (e) { return e.id === cb.value; });
        if (extra && !extra.isNone) {
            totalPrice += extra.price;
            extraNames.push(extra.name + ' +' + extra.price + '฿');
            if (extra.ingredient) {
                addIng(extra.ingredient);
            }
        }
    });
    extraNames.forEach(function (eName) {
        details.push(eName);
    });

    // === เพิ่มลงตะกร้า / อัพเดต ===
    var existingIndex = cart.findIndex(function (c, idx) {
        if (editingCartIndex === idx) return false;
        if (c.menuId !== menu.id) return false;
        if (c.details.length !== details.length) return false;
        var sameDetails = true;
        for (var i = 0; i < details.length; i++) {
            if (c.details.indexOf(details[i]) === -1) {
                sameDetails = false; break;
            }
        }
        return sameDetails;
    });

    if (editingCartIndex > -1) {
        // Edit existing item
        var editItem = cart[editingCartIndex];
        var itemIdx = editingCartIndex; // Store for toast and highlight
        if (editItem && editItem.cartId) {
            // Update on server using cart_id
            serverCartAction('update_item', { cart_id: editItem.cartId, item: { totalPrice: totalPrice, details: details, ingredients: ingredients } });
        } else {
            // Fallback: full sync
            cart[editingCartIndex].totalPrice = totalPrice;
            cart[editingCartIndex].details = details;
            cart[editingCartIndex].ingredients = ingredients;
            saveCart();
        }

        // Setup highlight and toast before clearing index
        highlightCartIndex = itemIdx;
        setTimeout(function () {
            highlightCartIndex = -1;
            renderCart();
        }, 3000);

        showToast('แก้ไขรายการที่ ' + (itemIdx + 1) + ' ' + menu.name + ' แล้ว');
        editingCartIndex = -1;
        if (typeof resetCustomizeButtons === 'function') resetCustomizeButtons();
        window.scrollTo(0, 0);
        showPage('page-cart');
        return;
    } else {
        if (existingIndex > -1) {
            var remaining = typeof getAllRemainingStock === 'function' ? getAllRemainingStock() : {};
            var currentCartUsage = {};
            cart.forEach(function (c) {
                for (var ing in c.ingredients) {
                    currentCartUsage[ing] = (currentCartUsage[ing] || 0) + (c.ingredients[ing] * c.qty);
                }
            });

            var canAdd = true;
            var exceededIngredient = '';
            for (var ing in cart[existingIndex].ingredients) {
                var neededMore = cart[existingIndex].ingredients[ing];
                var used = currentCartUsage[ing] || 0;
                var stock = remaining[ing] || 0;
                if ((used + neededMore) > (stock + 1e-9)) {
                    canAdd = false;
                    exceededIngredient = ing;
                    break;
                }
            }

            if (!canAdd) {
                var msg = exceededIngredient ? exceededIngredient + ' เหลือน้อย' : 'วัตถุดิบเหลือน้อย';
                showToast(msg);
                return;
            }

            // Increment qty on server
            var eItem = cart[existingIndex];
            if (eItem.cartId) {
                serverCartAction('update_qty', { cart_id: eItem.cartId, qty: eItem.qty + 1 });
            } else {
                cart[existingIndex].qty += 1;
                saveCart();
            }
        } else {
            var remaining = typeof getAllRemainingStock === 'function' ? getAllRemainingStock() : {};
            var currentCartUsage = {};
            cart.forEach(function (c) {
                for (var ing in c.ingredients) {
                    currentCartUsage[ing] = (currentCartUsage[ing] || 0) + (c.ingredients[ing] * c.qty);
                }
            });

            var canAdd = true;
            var exceededIngredient = '';
            for (var ing in ingredients) {
                var neededMore = ingredients[ing];
                var used = currentCartUsage[ing] || 0;
                var stock = remaining[ing] || 0;
                if ((used + neededMore) > (stock + 1e-9)) {
                    canAdd = false;
                    exceededIngredient = ing;
                    break;
                }
            }

            if (!canAdd) {
                var msg = exceededIngredient ? exceededIngredient + ' เหลือน้อย' : 'วัตถุดิบเหลือน้อย';
                showToast(msg);
                return;
            }

            // Add new item to server
            var newItem = {
                menuId: menu.id,
                name: menu.name,
                basePrice: menu.price,
                totalPrice: totalPrice,
                details: details,
                ingredients: ingredients,
                qty: 1
            };
            serverCartAction('add_item', { table_id: currentTable, item: newItem });
        }
    }

    if (typeof resetCustomizeButtons === 'function') resetCustomizeButtons();
    showToast('บันทึก ' + menu.name + ' สำเร็จ ✓');
    window.scrollTo(0, 0);
    goToMenu();
}

// ===== แสดงตะกร้า (Table Style) =====
function renderCart() {
    var tbody = document.getElementById('cart-items-body');
    if (!tbody) return; // Safety check

    // Update Info Header
    var tableInfo = document.getElementById('cart-table-info');
    var dateInfo = document.getElementById('cart-date-info');
    var timeInfo = document.getElementById('cart-time-info');

    if (tableInfo) {
        var tLabel = currentTable ? (currentTable.startsWith('กลับบ้าน') ? currentTable : 'โต๊ะ ' + currentTable) : 'โต๊ะ -';
        tableInfo.textContent = tLabel;
        tableInfo.style.cssText = 'display:inline-block; padding:6px 20px; font-size:1.1rem; font-weight:700; color:#fff; background:#C62828; border-radius:30px;';
    }

    var now = new Date();
    if (dateInfo) dateInfo.textContent = 'วันที่ ' + now.toLocaleDateString('th-TH');
    if (timeInfo) timeInfo.textContent = 'เวลา ' + now.toLocaleTimeString('th-TH');

    var orderBtn = document.getElementById('btn-place-order');
    var addMoreBtn = document.getElementById('btn-add-more');

    // Empty State Handling
    if (cart.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:30px; color:#999; font-weight:500;">ยังไม่มีรายการสินค้า</td></tr>';
        if (orderBtn) orderBtn.style.display = 'none';
        if (addMoreBtn) {
            addMoreBtn.style.display = 'block';
            addMoreBtn.textContent = 'เลือกเมนู';
        }
        updateCartTotal();
        return;
    }

    if (orderBtn) {
        orderBtn.style.display = 'block';
        orderBtn.textContent = 'สั่งรายการ';
        orderBtn.onclick = placeOrder;
    }
    if (addMoreBtn) {
        addMoreBtn.style.display = 'block';
        addMoreBtn.textContent = 'เลือกเมนูเพิ่ม';
    }

    // Render Rows
    tbody.innerHTML = cart.map(function (item, index) {
        var detailsHtml = '';
        if (item.details.length > 0) {
            detailsHtml = '<div class="cart-row-details">' + item.details.join('<br>') + '</div>';
        }

        // Image Logic
        var imgEmoji = '🍜';
        var imgHtml = '';
        var menuItem = MENU_ITEMS.find(function (m) { return m.id === item.menuId; });
        if (menuItem) {
            imgEmoji = menuItem.emoji;
            if (menuItem.image) {
                imgHtml = '<img src="' + menuItem.image + '" class="item-img" onerror="this.style.display=\'none\'; this.nextSibling.style.display=\'flex\';">';
                imgHtml += '<div class="item-img" style="background:#FFF3E0; display:none; align-items:center; justify-content:center; font-size:1.5rem;">' + imgEmoji + '</div>';
            } else {
                imgHtml = '<div class="item-img" style="background:#FFF3E0; display:flex; align-items:center; justify-content:center; font-size:1.5rem;">' + imgEmoji + '</div>';
            }
        } else {
            imgHtml = '<div class="item-img" style="background:#FFF3E0; display:flex; align-items:center; justify-content:center; font-size:1.5rem;">' + imgEmoji + '</div>';
        }
        var qtyLabel = item.qty > 1 ? '<span style="color:#D32F2F; font-weight:800; font-size:1.1rem; margin-left:8px;">x' + item.qty + '</span>' : '';

        var rowClass = 'cart-table-row';
        if (index === highlightCartIndex) {
            rowClass += ' highlight-item';
        }

        return '<tr class="' + rowClass + '" style="' + (index === highlightCartIndex ? 'animation: highlightRow 3s ease-out;' : '') + '">' +
            '<td class="td-item" style="padding-top:16px; padding-bottom:16px;">' +
            '<div class="item-wrapper">' +
            '<span class="item-index">' + (index + 1) + '</span>' +
            '<div style="display:flex; flex-direction:column; align-items:center; cursor:pointer; margin-right:12px;" onclick="editCartItem(' + index + ')">' +
            imgHtml +
            '<span class="item-edit-tag">แก้ไข</span>' +
            '</div>' +
            '<div class="item-text" onclick="editCartItem(' + index + ')" style="cursor:pointer;">' +
            '<div class="item-name">' + item.name + qtyLabel + '</div>' +
            '<div class="cart-row-details">' +
            detailsHtml +
            '</div>' +
            '</div>' +
            '</div>' +
            '</td>' +
            '<td class="td-price" style="text-align:right; vertical-align:top; border-bottom:1px dashed #eee; padding:10px 15px 10px 0;">' +
            '<div style="display:flex; flex-direction:column; justify-content:space-between; height:100%; min-height:80px;">' +
            '<div style="text-align:right; margin-bottom:10px;">' +
            '<button onclick="removeFromCart(' + index + ')" style="background:transparent; border:none; font-size:1.8rem; color:#C62828; cursor:pointer; line-height:1; padding:0; font-weight:bold;">&times;</button>' +
            '</div>' +
            '<div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">' +
            '<div class="price-val" style="font-size:1.25rem; font-weight:700; color:#333; white-space:nowrap;">' + (item.totalPrice * item.qty) + ' ฿</div>' +
            '<div class="qty-control-pill" style="margin:0; transform:scale(1.1); transform-origin:right center;">' +
            '<button onclick="changeQty(' + index + ', -1, event)">−</button>' +
            '<span>' + item.qty + '</span>' +
            '<button onclick="changeQty(' + index + ', 1, event)">+</button>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</td>' +
            '</tr>';
    }).join('');

    updateCartTotal();
}

function showInlineError(el, msg) {
    var existing = el.parentNode.querySelector('.inline-error-tooltip');
    if (existing) existing.remove();

    var tooltip = document.createElement('div');
    tooltip.className = 'inline-error-tooltip';
    tooltip.textContent = msg;
    tooltip.style.cssText = 'position: absolute; right: calc(100% + 14px); top: 50%; transform: translateY(-50%); background: #222; color: #fff; padding: 8px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 500; white-space: nowrap; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.2); pointer-events: none; animation: popIn 0.2s ease-out;';

    var arrow = document.createElement('div');
    arrow.style.cssText = 'position: absolute; top: 50%; left: 100%; transform: translateY(-50%); width: 0; height: 0; border-top: 6px solid transparent; border-bottom: 6px solid transparent; border-left: 6px solid #222;';
    tooltip.appendChild(arrow);

    if (getComputedStyle(el.parentNode).position === 'static') {
        el.parentNode.style.position = 'relative';
    }

    el.parentNode.appendChild(tooltip);

    setTimeout(function () {
        if (tooltip.parentNode) {
            tooltip.style.opacity = '0';
            tooltip.style.transition = 'opacity 0.3s';
            setTimeout(function () {
                if (tooltip.parentNode) tooltip.remove();
            }, 300);
        }
    }, 2000);
}

// ===== เปลี่ยนจำนวน =====
function changeQty(index, delta, event) {
    if (index < 0 || index >= cart.length) return;

    if (delta > 0) {
        var item = cart[index];
        var remaining = typeof getAllRemainingStock === 'function' ? getAllRemainingStock() : {};

        var currentCartUsage = {};
        cart.forEach(function (c) {
            for (var ing in c.ingredients) {
                currentCartUsage[ing] = (currentCartUsage[ing] || 0) + (c.ingredients[ing] * c.qty);
            }
        });

        var canAdd = true;
        var exceededIngredient = '';

        for (var ing in item.ingredients) {
            var neededMore = item.ingredients[ing];
            var used = currentCartUsage[ing] || 0;
            var stock = remaining[ing] || 0;

            if ((used + neededMore) > (stock + 1e-9)) {
                canAdd = false;
                exceededIngredient = ing;
                break;
            }
        }

        if (!canAdd) {
            var msg = exceededIngredient ? exceededIngredient + ' เหลือน้อย' : 'วัตถุดิบไม่พอ';
            if (event && event.target) {
                showInlineError(event.target, msg);
            } else if (typeof showToast === 'function') {
                showToast(msg);
            } else {
                console.log(msg);
            }
            return;
        }
    }

    var newQty = cart[index].qty + delta;
    if (newQty <= 0) newQty = 1;

    // Update on server using cart_id
    if (cart[index].cartId) {
        serverCartAction('update_qty', { cart_id: cart[index].cartId, qty: newQty });
    } else {
        cart[index].qty = newQty;
        saveCart();
        updateCartBadge();
        renderCart();
    }
}

// ===== ลบรายการ (Trigger Modal) =====
let itemToDeleteIndex = -1;

function removeFromCart(index) {
    if (index < 0 || index >= cart.length) return;
    itemToDeleteIndex = index;
    document.getElementById('confirm-delete-modal').classList.add('show');
}

function closeConfirmDelete() {
    document.getElementById('confirm-delete-modal').classList.remove('show');
    itemToDeleteIndex = -1;
}

function executeDeleteItem() {
    if (itemToDeleteIndex === -1) return;
    var item = cart[itemToDeleteIndex];
    var name = item.name;

    if (item.cartId) {
        serverCartAction('remove_item', { cart_id: item.cartId });
    } else {
        cart.splice(itemToDeleteIndex, 1);
        saveCart();
        updateCartBadge();
        renderCart();
    }
    closeConfirmDelete();
    showToast('ลบ ' + name + ' แล้ว');
}

// ===== อัพเดตยอดรวมและปุ่มสั่ง =====
function updateCartTotal() {
    var total = cart.reduce(function (sum, item) { return sum + (item.totalPrice * item.qty); }, 0);
    var totalQty = cart.reduce(function (sum, item) { return sum + item.qty; }, 0);

    var totalLabel = document.getElementById('cart-total');
    if (totalLabel) totalLabel.textContent = total + ' บาท';

    var orderBtn = document.getElementById('btn-place-order');
    if (orderBtn) {
        if (totalQty > 0) {
            orderBtn.textContent = 'สั่ง ' + totalQty + ' รายการ';
        } else {
            orderBtn.textContent = 'สั่งรายการ';
        }
    }
}

// ===== Confirm Order Modal Logic =====
function placeOrder() {
    if (cart.length === 0) {
        showToast('กรุณาเลือกรายการอาหารก่อนสั่ง');
        return;
    }

    if (!currentTable) {
        document.getElementById('alert-modal').classList.add('show');
        return;
    }

    // Populate modal data
    var tableText = currentTable === 'กลับบ้าน' ? 'กลับบ้าน' : ('โต๊ะ ' + currentTable);
    document.getElementById('confirm-order-table').textContent = tableText;

    var detailsHtml = cart.map(function (item, index) {
        var menuItem = MENU_ITEMS.find(function (m) { return m.id === item.menuId; });
        var imgHtml = '';
        if (menuItem) {
            if (menuItem.image) {
                imgHtml = '<img src="' + menuItem.image + '" style="width: 64px; height: 64px; border-radius: 10px; object-fit: cover; margin-right: 12px; flex-shrink: 0;" onerror="this.style.display=\'none\'; this.nextSibling.style.display=\'flex\';">';
                imgHtml += '<div style="width: 64px; height: 64px; border-radius: 10px; background: #FFF3E0; display: none; align-items: center; justify-content: center; font-size: 1.6rem; margin-right: 12px; flex-shrink: 0; border: 1px solid #FFE0B2;">' + menuItem.emoji + '</div>';
            } else {
                imgHtml = '<div style="width: 64px; height: 64px; border-radius: 10px; background: #FFF3E0; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; margin-right: 12px; flex-shrink: 0; border: 1px solid #FFE0B2;">' + menuItem.emoji + '</div>';
            }
        }

        // Title line: name x qty (no base price)
        var qtyLabel = item.qty > 1 ? '<span style="color:#D32F2F; font-weight:800; font-size:1.1rem; margin-left:8px;">x' + item.qty + '</span>' : '';
        var textHtml = '<div style="flex: 1; text-align: left;">';
        textHtml += '<div style="font-weight: 600; font-size: 0.95rem; color: #222; display:flex; align-items:center;">' + item.name + qtyLabel + '</div>';

        // Details on separate lines
        if (item.details.length > 0) {
            item.details.forEach(function (det) {
                textHtml += '<div style="color: #888; font-size: 0.8rem; margin-top: 2px;">' + det + '</div>';
            });
        }
        textHtml += '</div>';

        // Price right-aligned
        var priceHtml = '<div style="font-weight: 700; font-size: 1rem; color: #222; white-space: nowrap; flex-shrink: 0; margin-left: 8px;">' + (item.totalPrice * item.qty) + ' ฿</div>';

        var isLast = index === cart.length - 1;
        var style = 'display: flex; align-items: flex-start;';
        if (!isLast) {
            style += ' padding-bottom: 12px; margin-bottom: 12px; border-bottom: 1px solid #e0e0e0;';
        }
        return '<div style="' + style + '">' + imgHtml + textHtml + priceHtml + '</div>';
    }).join('');

    document.getElementById('confirm-order-details').innerHTML = detailsHtml;

    document.getElementById('confirm-order-modal').classList.add('show');
}

function closeConfirmOrder() {
    document.getElementById('confirm-order-modal').classList.remove('show');
}

function saveCart() {
    if (!currentTable) return;
    fetch(SERVER_BASE + '/api/cart.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync', table_id: currentTable, cart: cart })
    })
        .then(function () { loadCartForTable(); })
        .catch(function () { });
}

// Send a specific cart action to server, then re-fetch cart
function serverCartAction(action, data) {
    if (!currentTable) return;
    var payload = Object.assign({ action: action }, data);
    if (!payload.table_id) payload.table_id = currentTable;

    fetch(SERVER_BASE + '/api/cart.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(function (r) { return r.json(); })
        .then(function (res) {
            // Re-fetch the full cart from server to stay in sync
            loadCartForTable();
        })
        .catch(function () { });
}
