// ===== ข้อมูลที่ดึงจากฐานข้อมูล =====
var MENU_ITEMS = [];
var NOODLE_OPTIONS = [];
var MEAT_OPTIONS = [];
var VEGGIE_OPTIONS = [];
var EXTRA_OPTIONS = [];
var ALL_INGREDIENTS = [];

// ===== STATE =====
window.FORMULA = {}; // Fetched from DB
var currentTable = null;
var guestId = null;
var currentMenuItem = null;
var cart = [];
var highlightCartIndex = -1; // To track which item to highlight

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function () {
  guestId = generateGuestId();

  // Restore table from localStorage if not set from URL (UI preference only)
  var savedTable = localStorage.getItem('habeef_current_table');
  if (savedTable && !currentTable) {
    currentTable = savedTable;
    var disp = document.getElementById('table-display');
    if (disp) disp.textContent = currentTable.startsWith('กลับบ้าน') ? currentTable : 'โต๊ะ ' + currentTable;
  }

  loadCartForTable();

  // Wait for initial sync and data from server before first render
  Promise.all([
    syncFromServer().catch(function (e) { console.error("syncFromServer failed", e); }),
    fetch(SERVER_BASE + '/api/ingredients.php?action=get_formula')
      .then(function (res) { return res.json(); })
      .then(function (data) { window.FORMULA = data || {}; })
      .catch(function (e) { console.error("get_formula failed", e); }),
    fetch(SERVER_BASE + '/api/menus.php')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        MENU_ITEMS = (data || []).map(function (item) {
          var img = item.image_url || (typeof MENU_IMAGES !== 'undefined' ? MENU_IMAGES[item.id] : '');
          if (!img) {
            if (item.id === 'nam-khon') img = 'images/ก๋วยเตี๋ยวน้ำข้น.jpg';
            else if (item.id === 'haeng') img = 'images/ก๋วยเตี๋ยวแห้ง.jpg';
            else if (item.id === 'tom-yam') img = 'images/ก๋วยเตี๋ยวต้มยำ.jpg';
            else if (item.id === 'tom-yam-seafood') img = 'images/ก๋วยเตี๋ยวต้มยำทะเล.png';
            else if (item.id === 'kao-lao') img = 'images/เกาเหลา.jpg';
            else img = 'images/ก๋วยเตี๋ยวน้ำข้น.jpg';
          }
          item.image = img;
          return item;
        });
      })
      .catch(function (e) { console.error("menus failed", e); }),
    fetch(SERVER_BASE + '/api/options.php')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data) {
          NOODLE_OPTIONS = data.noodle || [];
          MEAT_OPTIONS = data.meat || [];
          VEGGIE_OPTIONS = data.veggie || [];
          EXTRA_OPTIONS = data.extra || [];
        }
      })
      .catch(function (e) { console.error("options failed", e); }),
    fetch(SERVER_BASE + '/api/ingredients.php')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (Array.isArray(data)) {
          ALL_INGREDIENTS = data.map(function (ing) { return ing.ingredient_name; });
        }
      })
      .catch(function (e) { console.error("ingredients failed", e); })
  ]).then(function () {
    renderMenu();
  }).catch(function (e) {
    console.error("Promise.all init chain rejected, rendering anyway", e);
    renderMenu();
  });

  // Auto-refresh menu periodically if on the menu page
  setInterval(function () {
    var menuPage = document.getElementById('page-menu');
    if (menuPage && menuPage.classList.contains('active')) {
      renderMenu();
    }
  }, 10000);

  // Auto-refresh cart periodically if on the cart page
  setInterval(function () {
    var cartPage = document.getElementById('page-cart');
    if (cartPage && cartPage.classList.contains('active')) {
      loadCartForTable();
    }
  }, 10000);
});

// ===== UTILITY =====
function loadCartForTable() {
  if (!currentTable) {
    cart = [];
    updateCartBadge();
    return;
  }
  // Fetch cart from server (single source of truth)
  fetch(SERVER_BASE + '/api/cart.php?table_id=' + encodeURIComponent(currentTable))
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (Array.isArray(data)) {
        cart = data;
      } else {
        cart = [];
      }
      updateCartBadge();
      if (typeof renderCart === 'function') renderCart();
    })
    .catch(function () {
      // Server unreachable — keep current cart, don't clear
    });
}

function generateGuestId() {
  let storedGuest = sessionStorage.getItem('habeef_guest_id');
  if (storedGuest) {
    return storedGuest;
  }
  let newGuest = 'G' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
  sessionStorage.setItem('habeef_guest_id', newGuest);
  return newGuest;
}

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

function formatDate(date) {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear() + 543;
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  return day + '/' + month + '/' + year + ' ' + hours + ':' + mins;
}

// ===== TABLE CHANGE =====
function onTableChange() {
  const sel = document.getElementById('table-select');
  currentTable = sel.value || null;
  loadCartForTable();
  var disp = document.getElementById('table-display');
  if (disp && currentTable) disp.textContent = currentTable.startsWith('กลับบ้าน') ? currentTable : 'โต๊ะ ' + currentTable;
  if (currentTable) {
    showToast('เลือกโต๊ะ ' + currentTable + ' แล้ว');
  }
}

function selectLandingTable(tableId, lockTable = false) {
  currentTable = tableId;

  // Persist table to localStorage
  localStorage.setItem('habeef_current_table', tableId);

  // Load cart specific to this table
  loadCartForTable();

  // Update static display block
  var disp = document.getElementById('table-display');
  if (disp) {
    disp.textContent = tableId.startsWith('กลับบ้าน') ? tableId : 'โต๊ะ ' + tableId;
  }

  // Sync hidden select for JS compatibility
  var sel = document.getElementById('table-select');
  if (sel) {
    sel.value = tableId;
  }

  // Navigate to Menu
  document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });
  document.getElementById('page-menu').classList.add('active');

  // Only show toast if not auto-locked on initial load
  if (!lockTable) {
    showToast('ยินดีต้อนรับ โต๊ะ ' + tableId);
  }
}

// ===== UTILITY FOR ENCODING/DECODING TABLE ID =====
const SECRET_SALT = 'habeef_secret_2024';

function encodeTableId(tableId) {
  try {
    return btoa(encodeURIComponent(tableId + '|' + SECRET_SALT));
  } catch (e) {
    return null;
  }
}

function decodeTableId(encodedStr) {
  try {
    var decoded = decodeURIComponent(atob(encodedStr));
    var parts = decoded.split('|');
    if (parts.length === 2 && (parts[1] === SECRET_SALT || parts[1] === 'hybeef_secret_2024')) {
      return parts[0];
    }
  } catch (e) {
    return null;
  }
  return null;
}

// ===== AUTO SELECT TABLE FROM URL =====
window.addEventListener('DOMContentLoaded', function () {
  var urlParams = new URLSearchParams(window.location.search);
  var q = urlParams.get('q');

  // Fallback to localStorage if URL has no q param (e.g. page refresh)
  if (!q) {
    q = localStorage.getItem('habeef_q_param');
  }

  if (q) {
    // Save q param to localStorage for future refreshes
    localStorage.setItem('habeef_q_param', q);

    var decodedTableId = decodeTableId(q);
    if (decodedTableId) {
      var tableId = decodedTableId;
      if (decodedTableId === 'takeaway' || decodedTableId === 'กลับบ้าน') {
        tableId = 'กลับบ้าน';
      }
      setTimeout(function () {
        selectLandingTable(tableId, true);
        // After selecting table, restore user's last active page
        if (typeof restorePage === 'function') {
          setTimeout(restorePage, 100);
        }
      }, 50);
    } else {
      console.error("Invalid QR Code");
      if (urlParams.get('q')) showToast("QR Code ไม่ถูกต้อง หรือล้าสมัย");
      localStorage.removeItem('habeef_q_param');
    }
  }
});

// ===== ALERT MODAL =====
function showAlert() {
  var modal = document.getElementById('alert-modal');
  if (modal) {
    modal.classList.add('show');
    goToMenu();
    setTimeout(function () {
      var sel = document.getElementById('table-select');
      if (sel) {
        sel.style.borderColor = '#C62828';
        sel.style.boxShadow = '0 0 0 3px rgba(198, 40, 40, 0.2)';
        sel.focus();
      }
    }, 300);
  }
}

function closeAlert() {
  var modal = document.getElementById('alert-modal');
  if (modal) {
    modal.classList.remove('show');
    var sel = document.getElementById('table-select');
    if (sel) {
      sel.style.borderColor = '';
      sel.style.boxShadow = '';
    }
  }
}

// ===== EDIT CART ITEM =====
function editCartItem(index) {
  var item = cart[index];
  if (!item) return;

  editingCartIndex = index;
  currentMenuItem = MENU_ITEMS.find(function (m) { return m.id === item.menuId; });
  if (!currentMenuItem) return;

  renderCustomizeForm(currentMenuItem);

  setTimeout(function () {
    var form = document.getElementById('customize-form');
    if (!form) return;

    var noodles = form.querySelectorAll('input[name="noodle"]');
    var mixedNoodles = form.querySelectorAll('input[name="mixed-noodle"]');

    if (item.details) {
      // Veggie logic - check once instead of inside forEach to avoid overwriting
      var isNoVeg = item.details.indexOf('ไม่ใส่ผัก') !== -1;
      var r3 = form.querySelector('input[name="veggie"][value="' + (isNoVeg ? 'veg-no' : 'veg-yes') + '"]');
      if (r3) r3.checked = true;

      item.details.forEach(function (d) {
        // Noodle logic
        NOODLE_OPTIONS.forEach(function (o) {
          // Check for single noodle or main noodle when mixed
          if (d === o.ingredient || d === 'ผสม' + o.ingredient + '+') {
            var r = Array.from(noodles).find(function (i) { return i.value === o.id; });
            if (r) r.checked = true;
          }

          // Check for mixed noodle (second noodle)
          if (d === 'ผสม' + o.ingredient) {
            var rM = Array.from(mixedNoodles).find(function (i) { return i.value === o.id; });
            if (rM) rM.checked = true;
          }
        });

        // Meat logic
        var mt = MEAT_OPTIONS.find(function (o) { return o.name === d; });
        if (mt) {
          var r2 = form.querySelector('input[name="meat"][value="' + mt.id + '"]');
          if (r2) r2.checked = true;
        }

        // Extras logic
        EXTRA_OPTIONS.forEach(function (ex) {
          if (d.indexOf(ex.name) > -1 && !ex.isNone) {
            var cb = form.querySelector('input[name="extras"][value="' + ex.id + '"]');
            if (cb) cb.checked = true;
          }
        });
      });

      // Handle the case where no extras were selected (select "ไม่สั่งเพิ่ม")
      var hasExtras = item.details.some(function (d) {
        return EXTRA_OPTIONS.some(function (ex) { return !ex.isNone && d.indexOf(ex.name) > -1; });
      });
      if (!hasExtras) {
        var noneCb = form.querySelector('input[name="extras"][value="extra-none"]');
        if (noneCb) noneCb.checked = true;
      }
    }

    if (typeof updateMixedNoodleState === 'function') updateMixedNoodleState();

    // Customize header/popup for Edit Mode
    var pageCust = document.getElementById('page-customize');
    if (pageCust) {
      pageCust.classList.add('modal-mode');
      pageCust.classList.add('active');
    }

    // Show "Edit Item" Title in Hero
    var editTitle = document.getElementById('edit-mode-title');
    if (editTitle) editTitle.style.display = 'block';

    // Customize buttons for Edit Mode (Yellow style)
    var btnAdd = document.getElementById('btn-add-cust');
    if (btnAdd) {
      btnAdd.textContent = 'บันทึกการแก้ไข';
      btnAdd.classList.add('btn-yellow-edit');
      // Direct style fallback for cache issues
      btnAdd.style.background = '#FFC107';
      btnAdd.style.color = '#333';
      btnAdd.style.boxShadow = 'none';
      btnAdd.style.borderRadius = '25px';
    }

    var btnCancel = document.getElementById('btn-cancel-cust');
    if (btnCancel) {
      btnCancel.textContent = 'ยกเลิก';
      btnCancel.classList.add('btn-gray-edit');
      // Direct style fallback for cache issues
      btnCancel.style.background = '#E0E0E0';
      btnCancel.style.color = '#666';
      btnCancel.style.boxShadow = 'none';
      btnCancel.style.borderRadius = '25px';

      btnCancel.onclick = function () {
        if (pageCust) {
          pageCust.classList.remove('active', 'modal-mode');
        }
        resetCustomizeButtons();
      };
    }

    if (typeof validateCustomizeForm === 'function') validateCustomizeForm();
  }, 100);
}

function resetCustomizeButtons() {
  var pageCust = document.getElementById('page-customize');
  if (pageCust) pageCust.classList.remove('modal-mode');

  var editTitle = document.getElementById('edit-mode-title');
  if (editTitle) editTitle.style.display = 'none';

  var btnAdd = document.getElementById('btn-add-cust');
  if (btnAdd) {
    btnAdd.textContent = 'เพิ่มลงตะกร้า';
    btnAdd.classList.remove('btn-yellow-edit');
    btnAdd.style.background = '';
    btnAdd.style.color = '';
    btnAdd.style.boxShadow = '';
    btnAdd.style.borderRadius = '';
  }
  var btnCancel = document.getElementById('btn-cancel-cust');
  if (btnCancel) {
    btnCancel.textContent = 'ยกเลิก';
    btnCancel.classList.remove('btn-yellow-edit', 'btn-gray-edit');
    btnCancel.style.background = '';
    btnCancel.style.color = '';
    btnCancel.style.boxShadow = '';
    btnCancel.style.borderRadius = '';
    btnCancel.onclick = function () { goToMenu(); };
  }
}
