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
                details.push('เส้น: ' + noodle.name);
                addIng(noodle.ingredient);
            }
        }

        // === ผสมเส้น ===
        var mixNoodleSel = document.querySelector('input[name="mixed-noodle"]:checked');
        if (mixNoodleSel) {
            var mn = NOODLE_OPTIONS.find(function (n) { return n.id === mixNoodleSel.value; });
            if (mn) {
                details.push('ผสมเส้น: ' + mn.name);
                addIng(mn.ingredient);
            }
        }
    }

    // === เนื้อสัตว์ ===
    if (menu.hasMeat) {
        var meatSel = document.querySelector('input[name="meat"]:checked');
        if (meatSel) {
            var meat = MEAT_OPTIONS.find(function (m) { return m.id === meatSel.value; });
            if (meat) {
                details.push('เนื้อ: ' + meat.name);
                addIng(meat.ingredient);
            }
        }
    }

    // === ต้มยำทะเล: กุ้ง + หมึก ===
    if (menu.isSeafood) {
        details.push('เนื้อ: กุ้ง+หมึก');
        addIng('กุ้ง');
        addIng('หมึก');
    }

    // === เมนูปกติ: ลูกชิ้น (มีในน้ำข้น, แห้ง, เกาเหลา) ===
    if (menu.id === 'nam-khon' || menu.id === 'haeng' || menu.id === 'kao-lao') {
        addIng('ลูกชิ้น');
    }

    // === ผัก ===
    var vegSel = document.querySelector('input[name="veggie"]:checked');
    if (vegSel) {
        var veg = VEGGIE_OPTIONS.find(function (v) { return v.id === vegSel.value; });
        if (veg) {
            details.push('ผัก: ' + veg.name);
            if (veg.hasVeg) {
                addIng('ผักบุ้ง');
                addIng('ถั่วงอก');
            }
        }
    }

    // === สั่งเพิ่ม ===
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
    if (extraNames.length > 0) {
        details.push('เพิ่ม: ' + extraNames.join(', '));
    }

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
        var tableVal = document.getElementById('table-select') ? document.getElementById('table-select').value : null;
        tableInfo.textContent = 'โต๊ะ ' + (tableVal || '-');
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
        var menuItem = MENU_ITEMS.find(function (m) { return m.id === item.menuId; });
        if (menuItem) imgEmoji = menuItem.emoji;

        // Note: Using emoji as placeholder since we don't have real URL image assets in this env
        var imgHtml = '<div class="item-img" style="background:#FFF3E0; display:flex; align-items:center; justify-content:center; font-size:1.5rem;">' + imgEmoji + '</div>';

        return `
        <tr class="cart-table-row">
            <td class="td-item">
                <div class="item-wrapper">
                    <span class="item-index">${index + 1}</span>
                    ${imgHtml}
                    <div class="item-text">
                        <div class="item-name">${item.name}</div>
                        ${detailsHtml}
                    </div>
                </div>
            </td>
            <td class="td-price">
                <div class="price-val">${item.totalPrice} ฿</div>
            </td>
            <td class="td-qty">
                 <div class="qty-control-pill">
                    <button onclick="changeQty(${index}, -1)">−</button>
                    <span>${item.qty}</span>
                    <button onclick="changeQty(${index}, 1)">+</button>
                 </div>
                 <button class="btn-trash-red" onclick="removeFromCart(${index})">🗑️</button>
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
    updateCartBadge();
    renderCart(); // Re-render table
    closeConfirmDelete();
    showToast('ลบ ' + name + ' แล้ว');
}

// ===== อัพเดตยอดรวม =====
function updateCartTotal() {
    var total = cart.reduce(function (sum, item) { return sum + (item.totalPrice * item.qty); }, 0);
    var totalLabel = document.getElementById('cart-total');
    if (totalLabel) totalLabel.textContent = total + ' บาท';
}

// ===== Confirm Order Modal Logic =====
function placeOrder() {
    if (cart.length === 0) {
        showToast('กรุณาเลือกรายการอาหารก่อนสั่ง');
        return;
    }

    var val = document.getElementById('table-select');
    if (!val || !val.value) {
        document.getElementById('alert-modal').classList.add('show');
        return;
    }

    // Populate modal data
    var tableText = val.value === 'กลับบ้าน' ? 'กลับบ้าน' : ('โต๊ะ ' + val.value);
    document.getElementById('confirm-order-table').textContent = tableText;

    var detailsHtml = cart.map(function (item) {
        var dStr = item.qty + ' x ' + item.name + ' (' + item.totalPrice + ' ฿)';
        if (item.details.length > 0) {
            dStr += '<br><span style="color:#888;font-size:0.8rem;">' + item.details.join(', ') + '</span>';
        }
        return '<div style="margin-bottom:8px;">' + dStr + '</div>';
    }).join('');

    var total = cart.reduce(function (sum, item) { return sum + (item.totalPrice * item.qty); }, 0);
    detailsHtml += '<div style="margin-top:10px; font-weight:700; border-top:1px solid #ddd; padding-top:8px;">รวม: ' + total + ' บาท</div>';

    document.getElementById('confirm-order-details').innerHTML = detailsHtml;

    document.getElementById('confirm-order-modal').classList.add('show');
}

function closeConfirmOrder() {
    document.getElementById('confirm-order-modal').classList.remove('show');
}
