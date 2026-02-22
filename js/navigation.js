// ===== NAVIGATION =====
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(function (p) {
    p.classList.remove('active');
  });
  var page = document.getElementById(pageId);
  if (page) {
    page.classList.add('active');
    page.style.animation = 'none';
    page.offsetHeight;
    page.style.animation = '';
    window.scrollTo(0, 0);
  }
}

// ===== ไปหน้าเมนู =====
function goToMenu() {
  updateCartBadge();
  showPage('page-menu');
}

// ===== ไปหน้าตะกร้า =====
function goToCart() {
  renderCart();
  showPage('page-cart');
}

// ===== ไปหน้าเลือกวัตถุดิบ =====
function goToCustomize(menuId) {
  currentMenuItem = MENU_ITEMS.find(function (m) { return m.id === menuId; });
  if (!currentMenuItem) return;
  renderCustomizeForm(currentMenuItem);
  showPage('page-customize');
}

// ===== แสดงเมนู =====
function renderMenu() {
  var container = document.getElementById('menu-list');
  container.innerHTML = MENU_ITEMS.map(function (item) {
    var imgHtml = item.image
      ? '<img src="' + item.image + '" alt="' + item.name + '" class="menu-food-img" onerror="this.style.display=\'none\';this.nextSibling.style.display=\'flex\'">' +
      '<div class="menu-img" style="display:none">' + item.emoji + '</div>'
      : '<div class="menu-img">' + item.emoji + '</div>';
    return '<div class="menu-card" onclick="goToCustomize(\'' + item.id + '\')">' +
      '<div class="menu-img-wrap">' + imgHtml + '</div>' +
      '<div class="menu-info">' +
      '<div class="menu-name">' + item.name + '</div>' +
      '<div class="menu-price-text">' + item.price + ' บาท</div>' +
      '</div>' +
      '<div class="menu-desc">' + item.desc + '</div>' +
      '</div>';
  }).join('');
}

// ===== แสดงฟอร์มเลือกวัตถุดิบ =====
function renderCustomizeForm(menu) {
  document.getElementById('customize-header-name').textContent = menu.name;
  document.getElementById('customize-header-price').textContent = menu.price + '฿';

  var form = document.getElementById('customize-form');
  var html = '';

  // === เลย์เอาต์ เส้น และ ผสมเส้น (เคียงข้างกัน) ===
  if (menu.hasNoodle) {
    html += '<div class="section-card" style="padding: 15px 10px;">';
    html += '<div style="display: flex; gap: 10px;">';

    // คอลัมน์ 1: เส้นหลัก
    html += '<div style="flex: 1;">';
    html += '<div style="background: #FFE082; padding: 4px 0; border-radius: 20px; text-align: center; font-size: 1.1rem; font-weight: 700; margin-bottom: 4px;">เส้น</div>';
    html += '<div style="text-align: center; font-size: 0.8rem; color: #888; margin-bottom: 10px;">เลือกอย่างน้อย 1 รายการ</div>';
    html += '<div class="section-body" style="padding-left: 10px;">';
    NOODLE_OPTIONS.forEach(function (opt, i) {
      html += '<label class="option-item" style="margin-bottom: 8px;">' +
        '<input type="radio" name="noodle" value="' + opt.id + '"' + (i === 0 ? ' checked' : '') + ' onchange="updateMixedNoodleState()">' +
        '<span class="option-label" style="font-size: 1rem;">' + opt.name + '</span></label>';
    });
    html += '</div></div>'; // จบคอลัมน์ 1

    // คอลัมน์ 2: ผสมเส้น
    html += '<div style="flex: 1;">';
    html += '<div style="background: #FFE082; padding: 4px 0; border-radius: 20px; text-align: center; font-size: 1.1rem; font-weight: 700; margin-bottom: 4px;">ผสมเส้น</div>';
    html += '<div style="text-align: center; font-size: 0.8rem; color: transparent; margin-bottom: 10px;">-</div>'; // placeholder ให้ความสูงเท่ากัน
    html += '<div class="section-body" style="padding-left: 10px;">';
    NOODLE_OPTIONS.forEach(function (opt) {
      html += '<label class="option-item" style="margin-bottom: 8px;">' +
        '<input type="radio" name="mixed-noodle" value="' + opt.id + '" onclick="toggleRadio(this)">' +
        '<span class="option-label" style="font-size: 1rem;">' + opt.name + '</span></label>';
    });
    html += '</div></div>'; // จบคอลัมน์ 2

    html += '</div></div>'; // จบ flex row & section-card
  }

  // === เนื้อสัตว์ (ไม่แสดงสำหรับต้มยำทะเล) ===
  if (menu.hasMeat) {
    html += '<div class="section-card">' +
      '<div class="section-header"><h3>เนื้อสัตว์</h3></div>' +
      '<div class="section-body">';
    MEAT_OPTIONS.forEach(function (opt, i) {
      html += '<label class="option-item">' +
        '<input type="radio" name="meat" value="' + opt.id + '"' + (i === 0 ? ' checked' : '') + '>' +
        '<span class="option-label">' + opt.name + '</span></label>';
    });
    html += '</div></div>';
  }

  // === ผัก ===
  html += '<div class="section-card">' +
    '<div class="section-header"><h3>ผัก</h3></div>' +
    '<div class="section-body">';
  VEGGIE_OPTIONS.forEach(function (opt, i) {
    html += '<label class="option-item">' +
      '<input type="radio" name="veggie" value="' + opt.id + '"' + (i === 0 ? ' checked' : '') + '>' +
      '<span class="option-label">' + opt.name + '</span></label>';
  });
  html += '</div></div>';

  // === สั่งเพิ่ม ===
  html += '<div class="section-card">' +
    '<div class="section-header"><h3>สั่งเพิ่ม</h3></div>' +
    '<div class="section-body">';
  EXTRA_OPTIONS.forEach(function (opt) {
    html += '<label class="option-item">' +
      '<input type="checkbox" name="extras" value="' + opt.id + '"' +
      (opt.isNone ? ' checked' : '') +
      ' onchange="handleExtraChange(this,' + (opt.isNone ? 'true' : 'false') + ')">' +
      '<span class="option-label">' + opt.name + '</span>' +
      (opt.price > 0 ? '<span class="option-price">+' + opt.price + '฿</span>' : '') +
      '</label>';
  });
  html += '</div></div>';

  form.innerHTML = html;

  // Initialize mixed noodle state
  if (menu.hasNoodle) {
    setTimeout(updateMixedNoodleState, 0); // delay slighty to ensure DOM is ready
  }
}

// ===== จัดการ Checkbox สั่งเพิ่ม =====
function handleExtraChange(checkbox, isNoneOption) {
  var allExtras = document.querySelectorAll('input[name="extras"]');
  var noneCheckbox = document.querySelector('input[name="extras"][value="extra-none"]');

  if (isNoneOption && checkbox.checked) {
    allExtras.forEach(function (cb) {
      if (cb !== noneCheckbox) cb.checked = false;
    });
  } else if (!isNoneOption && checkbox.checked) {
    if (noneCheckbox) noneCheckbox.checked = false;
  }
}

// ===== จัดการ Radio Buttons ให้กดซ้ำเพื่อยกเลิกได้ =====
function toggleRadio(radio) {
  if (radio.dataset.wasChecked === "true") {
    radio.checked = false;
    radio.dataset.wasChecked = "false";
  } else {
    // ล้างค่า wasChecked ของปุ่มอื่นในกลุ่มเดียวกัน
    var group = document.getElementsByName(radio.name);
    for (var i = 0; i < group.length; i++) {
      group[i].dataset.wasChecked = "false";
    }
    radio.dataset.wasChecked = "true";
  }
}

// ===== อัพเดตสถานะ ผสมเส้น (ห้ามซ้ำกับเส้นหลัก) =====
function updateMixedNoodleState() {
  var selectedNoodle = document.querySelector('input[name="noodle"]:checked');
  if (!selectedNoodle) return;

  var selectedValue = selectedNoodle.value;
  var mixedRadios = document.querySelectorAll('input[name="mixed-noodle"]');

  mixedRadios.forEach(function (radio) {
    var label = radio.closest('.option-item');
    if (radio.value === selectedValue) {
      // ปิดการใช้งานและทำสีเทา
      radio.disabled = true;
      if (radio.checked) {
        radio.checked = false;
        radio.dataset.wasChecked = "false";
      }
      if (label) label.style.opacity = '0.4';
    } else {
      // เปิดการใช้งานปกติ
      radio.disabled = false;
      if (label) label.style.opacity = '1';
    }
  });
}

// ===== อัพเดต Badge ตะกร้า =====
function updateCartBadge() {
  var totalItems = cart.reduce(function (sum, item) { return sum + item.qty; }, 0);
  var badge = document.getElementById('cart-count-badge');
  if (badge) {
    badge.textContent = totalItems;
    badge.style.display = totalItems > 0 ? 'inline-block' : 'none';
  }
}
