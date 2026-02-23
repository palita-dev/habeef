// ===== ข้อมูลเมนูอาหาร =====
const MENU_ITEMS = [
  {
    id: 'nam-khon',
    name: 'ก๋วยเตี๋ยวน้ำข้น',
    desc: '(เนื้อวัว / น่องไก่) +ลูกชิ้น',
    price: 50,
    emoji: '🍜',
    image: 'images/ก๋วยเตี๋ยวน้ำข้น.jpg',
    hasNoodle: true,
    hasMeat: true,
    isSeafood: false
  },
  {
    id: 'haeng',
    name: 'ก๋วยเตี๋ยวแห้ง',
    desc: '(เนื้อวัว / น่องไก่) +ลูกชิ้น',
    price: 50,
    emoji: '🥢',
    image: 'images/ก๋วยเตี๋ยวแห้ง.jpg',
    hasNoodle: true,
    hasMeat: true,
    isSeafood: false
  },
  {
    id: 'tom-yam',
    name: 'ก๋วยเตี๋ยวต้มยำ',
    desc: '(เนื้อวัว / น่องไก่)',
    price: 60,
    emoji: '🌶️',
    image: 'images/ก๋วยเตี๋ยวต้มยำ.jpg',
    hasNoodle: true,
    hasMeat: true,
    isSeafood: false
  },
  {
    id: 'tom-yam-seafood',
    name: 'ก๋วยเตี๋ยวต้มยำ ทะเล',
    desc: 'กุ้ง + หมึก',
    price: 95,
    emoji: '🦐',
    image: 'images/ก๋วยเตี๋ยวต้มยำทะเล.png',
    hasNoodle: true,
    hasMeat: false,
    isSeafood: true
  },
  {
    id: 'kao-lao',
    name: 'เกาเหลา',
    desc: '(เนื้อวัว / น่องไก่) +ลูกชิ้น',
    price: 50,
    emoji: '🥣',
    image: 'images/เกาเหลา.jpg',
    hasNoodle: false,
    hasMeat: true,
    isSeafood: false
  }
];

// ===== ตัวเลือกเส้น =====
const NOODLE_OPTIONS = [
  { id: 'sen-lek', name: 'เล็ก', ingredient: 'เส้นเล็ก' },
  { id: 'sen-yai', name: 'ใหญ่', ingredient: 'เส้นใหญ่' },
  { id: 'mee-khao', name: 'หมี่ขาว', ingredient: 'เส้นหมี่ขาว' },
  { id: 'mee-yok', name: 'หมี่หยก', ingredient: 'เส้นหมี่หยก' },
  { id: 'mee-lueng', name: 'หมี่เหลือง', ingredient: 'เส้นหมี่เหลือง' }
];

// ===== ตัวเลือกเนื้อสัตว์ =====
const MEAT_OPTIONS = [
  { id: 'neua-sod', name: 'เนื้อสด', ingredient: 'เนื้อวัว' },
  { id: 'neua-peuay', name: 'เนื้อเปื่อย', ingredient: 'เนื้อวัว' },
  { id: 'nong-kai', name: 'น่องไก่', ingredient: 'น่องไก่' }
];

// ===== ตัวเลือกผัก =====
const VEGGIE_OPTIONS = [
  { id: 'veg-yes', name: 'ใส่', hasVeg: true },
  { id: 'veg-no', name: 'ไม่ใส่', hasVeg: false }
];

// ===== ตัวเลือกสั่งเพิ่ม =====
const EXTRA_OPTIONS = [
  { id: 'extra-none', name: 'ไม่สั่งเพิ่ม', price: 0, ingredient: null, isNone: true },
  { id: 'extra-egg', name: 'ไข่', price: 10, ingredient: 'ไข่' },
  { id: 'extra-kiao', name: 'เกี๊ยว', price: 10, ingredient: null },
  { id: 'extra-lc', name: 'ลูกชิ้น', price: 10, ingredient: 'ลูกชิ้น' },
  { id: 'extra-nk', name: 'น่องไก่', price: 20, ingredient: 'น่องไก่' },
  { id: 'extra-ns', name: 'เนื้อสด', price: 20, ingredient: 'เนื้อวัว' },
  { id: 'extra-np', name: 'เนื้อเปื่อย', price: 20, ingredient: 'เนื้อวัว' }
];

// ===== วัตถุดิบ 13 รายการ =====
const ALL_INGREDIENTS = [
  'เส้นเล็ก', 'เส้นใหญ่', 'เส้นหมี่ขาว', 'เส้นหมี่หยก', 'เส้นหมี่เหลือง',
  'ผักบุ้ง', 'ถั่วงอก', 'ลูกชิ้น', 'เนื้อวัว', 'น่องไก่', 'ไข่', 'กุ้ง', 'หมึก'
];

// ===== STATE =====
let currentTable = null;
let guestId = null;
let currentMenuItem = null;
let cart = [];

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function () {
  guestId = generateGuestId();
  renderMenu();
});

// ===== UTILITY =====
function generateGuestId() {
  let storedGuest = localStorage.getItem('habeef_guest_id');
  if (storedGuest) {
    return storedGuest;
  }
  let newGuest = 'G' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
  localStorage.setItem('habeef_guest_id', newGuest);
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
  if (currentTable) {
    showToast('เลือกโต๊ะ ' + currentTable + ' แล้ว');
  }
}

function selectLandingTable(tableId, lockTable = false) {
  currentTable = tableId;

  // Update Dropdown in Menu Page
  var sel = document.getElementById('table-select');
  if (sel) {
    sel.value = tableId;
    if (lockTable) {
      sel.disabled = true;
      sel.style.opacity = '0.9';
      sel.style.background = '#e0e0e0';
    }
  }

  // Navigate to Menu
  document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });
  document.getElementById('page-menu').classList.add('active');

  // Only show toast if not auto-locked on intial load
  if (!lockTable) {
    showToast('ยินดีต้อนรับ โต๊ะ ' + tableId);
  }
}

// ===== AUTO SELECT TABLE FROM URL =====
window.addEventListener('DOMContentLoaded', function () {
  var urlParams = new URLSearchParams(window.location.search);
  var t = urlParams.get('table');
  if (t) {
    // Determine the correct table ID string mapping if needed
    var tableId = t;
    // Map URL param text to dropdown value. e.g. "?table=1" -> "1"
    if (t === 'takeaway' || t === 'กลับบ้าน') {
      tableId = 'กลับบ้าน';
    }
    // Small delay to ensure DOM is fully ready
    setTimeout(function () {
      selectLandingTable(tableId, true);
    }, 50);
  }
});

// ===== ALERT MODAL =====
function showAlert() {
  var modal = document.getElementById('alert-modal');
  if (modal) {
    modal.classList.add('show');
    goToMenu(); // Navigate back to menu
    // Highlight table selector
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
    // Reset table selector highlight
    var sel = document.getElementById('table-select');
    if (sel) {
      sel.style.borderColor = '';
      sel.style.boxShadow = '';
    }
  }
}
