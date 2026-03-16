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
    // Save active page for refresh persistence
    sessionStorage.setItem('habeef_active_page', pageId);
  }
}

// ===== Restore page after refresh =====
function restorePage() {
  var savedPage = sessionStorage.getItem('habeef_active_page');
  if (savedPage && savedPage !== 'page-landing' && savedPage !== 'page-menu') {
    if (savedPage === 'page-cart') {
      if (typeof renderCart === 'function') renderCart();
    }
    if (savedPage === 'page-receipt') {
      if (typeof checkActiveOrder === 'function') checkActiveOrder();
      return; // checkActiveOrder will call showPage itself
    }
    showPage(savedPage);
  }
}

// ===== ไปหน้าเมนู =====
function goToMenu() {
  if (typeof editingCartIndex !== 'undefined') editingCartIndex = -1;
  if (typeof resetCustomizeButtons === 'function') resetCustomizeButtons();
  updateCartBadge();
  if (typeof renderMenu === 'function') renderMenu();
  showPage('page-menu');
}

// ===== ไปหน้าตะกร้า =====
function goToCart() {
  renderCart();
  showPage('page-cart');
}

// ===== ไปหน้าเลือกวัตถุดิบ =====
function goToCustomize(menuId) {
  if (typeof resetCustomizeButtons === 'function') resetCustomizeButtons();
  currentMenuItem = MENU_ITEMS.find(function (m) { return m.id === menuId; });
  if (!currentMenuItem) return;
  renderCustomizeForm(currentMenuItem);
  showPage('page-customize');
}

// ===== แสดงเมนู =====
function renderMenu() {
  var container = document.getElementById('menu-list');
  var remaining = typeof getAllRemainingStock === 'function' ? getAllRemainingStock() : {};

  var disabledIngredients = window._disabledIngredientsCache || [];
  try {
    if (!disabledIngredients.length) disabledIngredients = getDisabledIngredients() || [];
  } catch (e) { }

  container.innerHTML = MENU_ITEMS.map(function (item) {
    var isOutOfStock = false;
    var nameSuffix = '';

    if (item.id === 'tom-yam-seafood') {
      var shrimpDisabled = disabledIngredients.indexOf('กุ้ง') !== -1;
      var squidDisabled = disabledIngredients.indexOf('หมึก') !== -1;
      if ((remaining['กุ้ง'] || 0) <= 0 || (remaining['หมึก'] || 0) <= 0 || shrimpDisabled || squidDisabled) {
        isOutOfStock = true;
        nameSuffix = ' <span style="color:#D32F2F; font-size:1.1em; font-weight:bold; margin-left:8px;">(หมด)</span>';
      }
    }

    var imgHtml = item.image
      ? '<img src="' + item.image + '" alt="' + item.name + '" class="menu-food-img" onerror="this.style.display=\'none\';this.nextSibling.style.display=\'flex\'">' +
      '<div class="menu-img" style="display:none">' + item.emoji + '</div>'
      : '<div class="menu-img">' + item.emoji + '</div>';

    var cardStyle = isOutOfStock ? ' opacity: 0.5; pointer-events: none; filter: grayscale(1); ' : ' cursor: pointer; ';

    var descHtml = item.desc.split('<br>').map(function (line) {
      if (line.indexOf('+') !== -1) {
        var parts = line.split('+');
        // Exception for Seafood to keep it compact
        if (item.id === 'tom-yam-seafood') {
           return '<div class="desc-line">' + line + '</div>';
        }
        return '<div class="desc-line"><span class="desc-main">' + parts[0].trim() + '</span><span class="desc-plus">+</span><span class="desc-extra">' + parts[1].trim() + '</span></div>';
      }
      return '<div class="desc-line">' + line + '</div>';
    }).join('');

    return '<div class="menu-card" style="' + cardStyle + '" onclick="goToCustomize(\'' + item.id + '\')">' +
      '<div class="menu-img-wrap">' + imgHtml + '</div>' +
      '<div class="menu-info">' +
      '<div class="menu-name">' + item.name + nameSuffix + '</div>' +
      '<div class="menu-price-text">' + item.price + ' บาท</div>' +
      '</div>' +
      '<div class="menu-desc">' + descHtml + '</div>' +
      '</div>';
  }).join('');
}

// ===== แสดงฟอร์มเลือกวัตถุดิบ =====
function renderCustomizeForm(menu) {
  document.getElementById('customize-header-name').textContent = menu.name;

  var imgEl = document.getElementById('customize-header-img');
  if (imgEl && menu.image) {
    imgEl.src = menu.image;
    imgEl.style.display = 'block';
  } else if (imgEl) {
    imgEl.style.display = 'none';
  }

  var form = document.getElementById('customize-form');
  var html = '';

  // Get disabled ingredients
  var disabledIngredients = window._disabledIngredientsCache || [];
  try {
    if (!disabledIngredients.length) disabledIngredients = getDisabledIngredients() || [];
  } catch (e) { }

  var activeNoodles = NOODLE_OPTIONS;
  var activeMeats = MEAT_OPTIONS;
  var activeExtras = EXTRA_OPTIONS;

  var remaining = typeof getAllRemainingStock === 'function' ? getAllRemainingStock() : {};

  // === เลย์เอาต์ เส้น และ ผสมเส้น (เคียงข้างกัน) ===
  if (menu.hasNoodle && activeNoodles.length > 0) {
    html += '<div class="section-card" style="padding: 15px 10px;">';
    html += '<div style="display: flex; gap: 10px;">';

    // คอลัมน์ 1: เส้นหลัก
    html += '<div style="flex: 1;">';
    html += '<div style="background: #FFE082; padding: 4px 0; border-radius: 20px; text-align: center; font-size: 1.1rem; font-weight: 700; margin-bottom: 4px;">เส้น</div>';
    html += '<div style="text-align: center; font-size: 0.8rem; color: #888; margin-bottom: 10px;">เลือกอย่างน้อย 1 รายการ</div>';
    html += '<div class="section-body" style="padding-left: 10px;">';
    activeNoodles.forEach(function (opt, i) {
      var reqQty = (typeof FORMULA !== 'undefined' && FORMULA[opt.ingredient]) ? FORMULA[opt.ingredient] : 0;
      var isToggledOff = opt.ingredient && disabledIngredients.indexOf(opt.ingredient) !== -1;
      var isOos = opt.ingredient && (remaining[opt.ingredient] || 0) < reqQty || isToggledOff;
      var opacity = isOos ? ' opacity: 0.5; pointer-events: none;' : '';
      var oosLabel = isOos ? ' <span style="color:#D32F2F; font-size:0.85rem; font-weight:bold;">(หมด)</span>' : '';
      html += '<label class="option-item" style="margin-bottom: 8px;' + opacity + '">' +
        '<input type="radio" name="noodle" value="' + opt.id + '" onchange="updateMixedNoodleState()"' + (isOos ? ' disabled' : '') + '>' +
        '<span class="option-label" style="font-size: 1rem;">' + opt.name + oosLabel + '</span></label>';
    });
    html += '</div></div>'; // จบคอลัมน์ 1

    // คอลัมน์ 2: ผสมเส้น
    html += '<div style="flex: 1;">';
    html += '<div style="background: #FFE082; padding: 4px 0; border-radius: 20px; text-align: center; font-size: 1.1rem; font-weight: 700; margin-bottom: 4px;">ผสมเส้น</div>';
    html += '<div style="text-align: center; font-size: 0.8rem; color: transparent; margin-bottom: 10px;">-</div>'; // placeholder ให้ความสูงเท่ากัน
    html += '<div class="section-body" style="padding-left: 10px;">';
    activeNoodles.forEach(function (opt) {
      var reqQty = (typeof FORMULA !== 'undefined' && FORMULA[opt.ingredient]) ? FORMULA[opt.ingredient] : 0;
      var isToggledOff = opt.ingredient && disabledIngredients.indexOf(opt.ingredient) !== -1;
      var isOos = opt.ingredient && (remaining[opt.ingredient] || 0) < reqQty || isToggledOff;
      var opacity = isOos ? ' opacity: 0.5; pointer-events: none;' : '';
      var oosLabel = isOos ? ' <span style="color:#D32F2F; font-size:0.85rem; font-weight:bold;">(หมด)</span>' : '';
      html += '<label class="option-item' + (isOos ? ' oos-item' : '') + '" style="margin-bottom: 8px;' + opacity + '">' +
        '<input type="radio" name="mixed-noodle" value="' + opt.id + '" onclick="toggleRadio(this)"' + (isOos ? ' disabled' : '') + '>' +
        '<span class="option-label" style="font-size: 1rem;">' + opt.name + oosLabel + '</span></label>';
    });
    html += '</div></div>'; // จบคอลัมน์ 2

    html += '</div></div>'; // จบ flex row & section-card
  }

  // === เนื้อสัตว์ (ไม่แสดงสำหรับต้มยำทะเล) ===
  if (menu.hasMeat && activeMeats.length > 0) {
    html += '<div class="section-card" style="margin-bottom: 12px;">' +
      '<div class="section-header" style="background: #FBC02D; padding: 10px 15px; color: #333; font-weight: bold; font-size: 1.1rem;">เนื้อสัตว์</div>' +
      '<div class="section-body" style="padding: 10px;">';
    activeMeats.forEach(function (opt, i) {
      var reqQty = (typeof FORMULA !== 'undefined' && FORMULA[opt.ingredient]) ? FORMULA[opt.ingredient] : 0;
      var isToggledOff = opt.ingredient && disabledIngredients.indexOf(opt.ingredient) !== -1;
      var isOos = opt.ingredient && (remaining[opt.ingredient] || 0) < reqQty || isToggledOff;
      var opacity = isOos ? ' opacity: 0.5; pointer-events: none;' : '';
      var oosLabel = isOos ? ' <span style="color:#D32F2F; font-size:0.85rem; font-weight:bold;">(หมด)</span>' : '';
      html += '<label class="option-item" style="' + opacity + '">' +
        '<input type="radio" name="meat" value="' + opt.id + '"' + (isOos ? ' disabled' : '') + '>' +
        '<span class="option-label">' + opt.name + oosLabel + '</span></label>';
    });
    html += '</div></div>';
  }

  // === ผัก ===
  html += '<div class="section-card" style="margin-bottom: 12px;">' +
    '<div class="section-header" style="background: #FBC02D; padding: 10px 15px; color: #333; font-weight: bold; font-size: 1.1rem;">ผัก</div>' +
    '<div class="section-body" style="padding: 10px;">';
  VEGGIE_OPTIONS.forEach(function (opt, i) {
    var isOos = false;
    if (opt.hasVeg) {
      // Check stock
      var pbQty = (typeof FORMULA !== 'undefined' && FORMULA['ผักบุ้ง']) ? FORMULA['ผักบุ้ง'] : 0;
      var tngQty = (typeof FORMULA !== 'undefined' && FORMULA['ถั่วงอก']) ? FORMULA['ถั่วงอก'] : 0;
      
      var isPbDisabled = disabledIngredients.indexOf('ผักบุ้ง') !== -1;
      var isTngDisabled = disabledIngredients.indexOf('ถั่วงอก') !== -1;

      if (
          ((remaining['ผักบุ้ง'] || 0) < pbQty) || ((remaining['ถั่วงอก'] || 0) < tngQty) ||
          isPbDisabled || isTngDisabled
      ) {
        isOos = true;
      }
    }
    var opacity = isOos ? ' opacity: 0.5; pointer-events: none;' : '';
    var oosLabel = isOos ? ' <span style="color:#D32F2F; font-size:0.85rem; font-weight:bold;">(หมด)</span>' : '';
    html += '<label class="option-item" style="' + opacity + '">' +
      '<input type="radio" name="veggie" value="' + opt.id + '"' + (isOos ? ' disabled' : '') + '>' +
      '<span class="option-label">' + opt.name + oosLabel + '</span></label>';
  });
  html += '</div></div>';

  // === สั่งเพิ่ม ===
  if (activeExtras.length > 1) { // > 1 because 'None' is always there
    html += '<div class="section-card" style="margin-bottom: 12px;">' +
      '<div class="section-header" style="background: #FBC02D; padding: 10px 15px; color: #333; font-weight: bold; font-size: 1.1rem;">สั่งเพิ่ม <span style="font-size: 0.8rem; font-weight: normal; margin-left: auto;">(เลือกได้หลายอย่าง)</span></div>' +
      '<div class="section-body" style="padding: 10px;">';
    activeExtras.forEach(function (opt) {
      var reqQty = (typeof FORMULA !== 'undefined' && FORMULA[opt.ingredient]) ? FORMULA[opt.ingredient] : 0;
      var isToggledOff = opt.ingredient && disabledIngredients.indexOf(opt.ingredient) !== -1;
      var isOos = opt.ingredient && (remaining[opt.ingredient] || 0) < reqQty || isToggledOff;
      var opacity = isOos ? ' opacity: 0.5; pointer-events: none;' : '';
      var oosLabel = isOos ? ' <span style="color:#D32F2F; font-size:0.85rem; font-weight:bold;">(หมด)</span>' : '';
      html += '<label class="option-item" style="' + opacity + '">' +
        '<input type="checkbox" name="extras" value="' + opt.id + '"' +
        ' onchange="handleExtraChange(this,' + (opt.isNone ? 'true' : 'false') + ')"' + (isOos ? ' disabled' : '') + '>' +
        '<span class="option-label">' + opt.name + oosLabel + '</span>' +
        (opt.price > 0 ? '<span class="option-price">+' + opt.price + '฿</span>' : '') +
        '</label>';
    });
    html += '</div></div>';
  }

  form.innerHTML = html;

  // Initialize mixed noodle state
  if (menu.hasNoodle) {
    setTimeout(updateMixedNoodleState, 0); // delay slighty to ensure DOM is ready
  }

  // Attach validation listeners and run initial check
  setTimeout(function () {
    var inputs = form.querySelectorAll('input[type="radio"], input[type="checkbox"]');
    inputs.forEach(function (el) {
      el.addEventListener('change', validateCustomizeForm);
    });
    validateCustomizeForm();
  }, 50);
}

// ===== ตรวจสอบความถูกต้องของแบบฟอร์ม (Validation) =====
function validateCustomizeForm() {
  if (!currentMenuItem) return;

  var isValid = true;

  // ตรวจสอบหมวดเส้น (เลืออย่างน้อย 1 เส้นหลัก)
  if (currentMenuItem.hasNoodle && document.querySelector('input[name="noodle"]')) {
    var noodleSel = document.querySelector('input[name="noodle"]:checked');
    if (!noodleSel) isValid = false;
  }

  // ตรวจสอบหมวดเนื้อสัตว์
  if (currentMenuItem.hasMeat && document.querySelector('input[name="meat"]')) {
    var meatSel = document.querySelector('input[name="meat"]:checked');
    if (!meatSel) isValid = false;
  }

  // ตรวจสอบหมวดผัก
  var vegSel = document.querySelector('input[name="veggie"]:checked');
  if (!vegSel) isValid = false;

  var btnAdd = document.querySelector('.btn-add');
  if (btnAdd) {
    if (isValid) {
      btnAdd.classList.remove('disabled');
    } else {
      btnAdd.classList.add('disabled');
    }
  }

  // UPDATE PRICE
  var tot = currentMenuItem.price;
  var extraChecks = document.querySelectorAll('input[name="extras"]:checked');
  extraChecks.forEach(function (cb) {
    var extra = EXTRA_OPTIONS.find(function (e) { return e.id === cb.value; });
    if (extra && !extra.isNone) {
      tot += extra.price;
    }
  });

  var priceLabel = document.getElementById('customize-total-price');
  if (priceLabel) {
    priceLabel.textContent = tot + ' ฿';
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
    // Check if permanently out-of-stock via CSS class
    var isOos = label && label.classList.contains('oos-item');

    if (isOos) {
      // Permanently disabled - keep grayed out no matter what
      radio.disabled = true;
      if (label) {
        label.style.opacity = '0.5';
        label.style.pointerEvents = 'none';
      }
    } else if (radio.value === selectedValue) {
      // ปิดการใช้งานและทำสีเทา (เพราะซ้ำกับเส้นหลัก)
      radio.disabled = true;
      if (radio.checked) {
        radio.checked = false;
        radio.dataset.wasChecked = 'false';
      }
      if (label) {
        label.style.opacity = '0.4';
        label.style.pointerEvents = 'none';
      }
    } else {
      // เปิดการใช้งานปกติ
      radio.disabled = false;
      if (label) {
        label.style.opacity = '1';
        label.style.pointerEvents = 'auto';
      }
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
