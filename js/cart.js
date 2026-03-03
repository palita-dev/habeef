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

    // === เพิ่มลงตะกร้า ===
    var cartItem = {
        id: Date.now().toString(),
        menuId: menu.id,
        name: menu.name,
        basePrice: menu.price,
        totalPrice: totalPrice,
        details: details,
        ingredients: ingredients,
        qty: 1
    };

    cart.push(cartItem);
    saveCart();
    updateCartBadge();
    showToast('เพิ่ม ' + menu.name + ' ลงตะกร้าแล้ว ✓');
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

    // Empty State Handling
    if (cart.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:30px; color:#999; font-weight:500;">ยังไม่มีรายการสินค้า</td></tr>';
        if (orderBtn) {
            orderBtn.textContent = 'เลือกรายการอาหาร';
            orderBtn.onclick = goToMenu;
        }
        updateCartTotal();
        return;
    }

    if (orderBtn) {
        orderBtn.textContent = 'สั่งรายการ';
        orderBtn.onclick = placeOrder;
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

        return `
        <tr class="cart-table-row">
            <td class="td-item" style="padding-top: 16px; padding-bottom: 16px;">
                <div class="item-wrapper">
                    <span class="item-index">${index + 1}</span>
                    ${imgHtml}
                    <div class="item-text">
                        <div class="item-name">${item.name}</div>
                        <div class="cart-row-details">
                            ${detailsHtml}
                        </div>
                    </div>
                </div>
            </td>
            <td class="td-price" style="text-align: right; vertical-align: top; padding: 10px 15px 10px 0;">
                <div style="display: flex; flex-direction: column; justify-content: space-between; height: 100%; min-height: 80px;">
                    <div style="text-align: right; margin-bottom: 10px;">
                        <button onclick="removeFromCart(${index})" style="background: transparent; border: none; font-size: 1.8rem; color: #C62828; cursor: pointer; line-height: 1; padding: 0; font-weight: bold;">&times;</button>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
                        <div class="price-val" style="font-size: 1.25rem; font-weight: 700; color: #333; white-space: nowrap;">${item.totalPrice} ฿</div>
                        <div class="qty-control-pill" style="margin: 0; transform: scale(1.1); transform-origin: right center;">
                            <button onclick="changeQty(${index}, -1)">−</button>
                            <span>${item.qty}</span>
                            <button onclick="changeQty(${index}, 1)">+</button>
                        </div>
                    </div>
                </div>
            </td>
        </tr>
        `;
    }).join('');

    updateCartTotal();
}

// ===== เปลี่ยนจำนวน =====
function changeQty(index, delta) {
    if (index < 0 || index >= cart.length) return;
    cart[index].qty += delta;
    if (cart[index].qty <= 0) {
        cart[index].qty = 1;
    }
    saveCart();
    updateCartBadge();
    renderCart(); // Re-render table
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
    var name = cart[itemToDeleteIndex].name;
    cart.splice(itemToDeleteIndex, 1);
    saveCart();
    updateCartBadge();
    renderCart(); // Re-render table
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

        // Title line: qty x name (no price)
        var textHtml = '<div style="flex: 1; text-align: left;">';
        textHtml += '<div style="font-weight: 600; font-size: 0.95rem; color: #222;">' + item.qty + ' x ' + item.name + '</div>';

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
    localStorage.setItem(getCartKey(), JSON.stringify(cart));
}
