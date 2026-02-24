// ===== ORDER & RECEIPT =====

var receiptInterval = null;

function executePlaceOrder() {
    if (cart.length === 0) {
        showToast('ตะกร้าว่างเปล่า');
        return;
    }

    if (!currentTable) {
        showAlert();
        return;
    }

    closeConfirmOrder();

    var now = new Date();
    var totalPrice = cart.reduce(function (sum, item) { return sum + (item.totalPrice * item.qty); }, 0);

    var orderIngredients = {};
    cart.forEach(function (item) {
        for (var ing in item.ingredients) {
            orderIngredients[ing] = (orderIngredients[ing] || 0) + (item.ingredients[ing] * item.qty);
        }
    });

    var assignedTable = currentTable;
    if (assignedTable === 'กลับบ้าน') {
        var orders = getOrders();
        // Generate new queue based on today's orders
        var today = now.toISOString().split('T')[0];
        var num = 1;
        orders.forEach(function (o) {
            var oDate = o.createdAt ? o.createdAt.split('T')[0] : today;
            if (oDate === today && o.table.startsWith('กลับบ้านคิว ')) {
                var match = o.table.match(/คิว\s*(\d+)/);
                if (match) {
                    var qn = parseInt(match[1]);
                    if (qn >= num) num = qn + 1;
                }
            }
        });
        assignedTable = 'กลับบ้านคิว ' + num;
        localStorage.setItem('habeef_takeaway_queue', assignedTable);
    }

    var orderId = 'ORD-' + Date.now().toString(36).toUpperCase();
    var order = {
        orderId: orderId,
        guestId: guestId,
        table: assignedTable,
        items: JSON.parse(JSON.stringify(cart)),
        totalPrice: totalPrice,
        ingredients: orderIngredients,
        createdAt: now.toISOString(),
        status: 'pending'
    };

    saveOrder(order);
    saveIngredientUsage(orderIngredients, now);

    // Save active order ID for customer
    localStorage.setItem('habeef_active_order', orderId);

    renderReceipt(order);
    cart = [];
    localStorage.removeItem('habeef_cart');
    updateCartBadge();
    showPage('page-receipt');
    startReceiptPolling();
}

function checkActiveOrder(isPolling) {
    if (!currentTable) {
        if (!isPolling) showToast('กรุณาเลือกโต๊ะก่อนครับ');
        return;
    }

    var orders = getOrders();
    var checkTable = currentTable;

    if (checkTable === 'กลับบ้าน') {
        var savedQueue = localStorage.getItem('habeef_takeaway_queue');
        if (savedQueue) {
            var isActive = orders.some(function (o) {
                return o.table === savedQueue && (o.status === 'pending' || o.status === 'served');
            });
            if (isActive) {
                checkTable = savedQueue;
            } else {
                localStorage.removeItem('habeef_takeaway_queue');
            }
        }
    }

    // Filter for THIS table and ACTIVE status
    var tableOrders = [];
    var displayTableName = checkTable;

    if (currentTable === 'กลับบ้าน') {
        tableOrders = orders.filter(function (o) {
            return o.guestId === guestId && (o.status === 'pending' || o.status === 'served');
        });
        if (tableOrders.length > 0) {
            // Collect unique queues
            var queues = [];
            tableOrders.forEach(function (o) {
                if (!queues.includes(o.table)) queues.push(o.table);
            });
            var formattedQueues = queues.map(function (q, idx) {
                if (idx === 0) return q;
                return q.replace('กลับบ้าน', '').trim();
            });
            displayTableName = formattedQueues.join(', ');
        }
    } else {
        tableOrders = orders.filter(function (o) {
            return o.table === checkTable && (o.status === 'pending' || o.status === 'served');
        });
    }

    if (tableOrders.length > 0) {
        // Aggregate
        var aggregatedItems = [];
        var total = 0;
        tableOrders.forEach(function (o) {
            aggregatedItems = aggregatedItems.concat(o.items);
            total += o.totalPrice;
        });

        var displayOrder = {
            orderId: 'MULTIPLE',
            table: displayTableName,
            items: aggregatedItems,
            totalPrice: total,
            totalOrders: tableOrders,
            createdAt: tableOrders[0].createdAt, // Use first order time
            guestId: 'All Guests'
        };

        renderReceipt(displayOrder);
        if (!isPolling) showPage('page-receipt');
        startReceiptPolling();
    } else {
        // No active orders for this table
        if (!isPolling) {
            showToast('ไม่พบรายการอาหารที่ค้างอยู่');
        } else {
            // If polling and no orders found, maybe they paid?
            // Stop polling but don't force kick unless on receipt page
            var receiptPage = document.getElementById('page-receipt');
            if (receiptPage.classList.contains('active')) {
                showToast('ชำระเงินเรียบร้อยแล้ว ขอบคุณครับ');
                goToMenu();
                stopReceiptPolling();
            }
        }
    }
}

function startReceiptPolling() {
    if (receiptInterval) clearInterval(receiptInterval);
    receiptInterval = setInterval(function () {
        var receiptPage = document.getElementById('page-receipt');
        if (receiptPage.classList.contains('active')) {
            checkActiveOrder(true);
        } else {
            stopReceiptPolling();
        }
    }, 5000);
}

function stopReceiptPolling() {
    if (receiptInterval) {
        clearInterval(receiptInterval);
        receiptInterval = null;
    }
}
function renderReceipt(order) {
    document.getElementById('receipt-table').textContent = 'โต๊ะ ' + (order.table || '-');
    var d = new Date(order.createdAt);
    var dateStr = d.getDate() + '/' + (d.getMonth() + 1) + '/' + (d.getFullYear() + 543);
    var timeStr = d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
    document.getElementById('receipt-date').textContent = 'วันที่ ' + dateStr + ' เวลา ' + timeStr;
    document.getElementById('receipt-guest').textContent = 'Guest ID: ' + (order.guestId || '-');

    var itemsContainer = document.getElementById('receipt-items');
    var menuEmojis = {
        'nam-khon': '🍜', 'haeng': '🥢', 'tom-yam': '🌶️',
        'tom-yam-seafood': '🦐', 'kao-lao': '🥣'
    };

    itemsContainer.innerHTML = order.items.map(function (item, idx) {
        var imgHtml = '<div class="receipt-col-img" style="background:#fce4ec;display:flex;align-items:center;justify-content:center;font-size:1.5rem;">' + (menuEmojis[item.menuId] || '🍜') + '</div>';

        return '<div class="receipt-row">' +
            '<div style="width:30px;font-weight:700;color:#888;">' + (idx + 1) + '</div>' +
            imgHtml +
            '<div class="receipt-col-info">' +
            '<div class="receipt-item-name">' + item.name + '</div>' +
            '<div class="receipt-item-detail">' + item.details.join(', ') + '</div>' +
            '</div>' +
            '<div class="receipt-col-price">' + item.totalPrice + ' ฿</div>' +
            '<div class="receipt-col-qty">' + item.qty + '</div>' +
            '</div>';
    }).join('');

    document.getElementById('receipt-total-price').textContent = order.totalPrice + ' บาท';
}

function newOrder() {
    goToMenu();
}


