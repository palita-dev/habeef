const fs = require('fs');

function testLogic() {
    let data = {
        "24/02/2569": {
            "เส้นใหญ่": {
                qty: 20,
                unit: "ถุง",
                entries: [
                    { qty: 20, unit: "ถุง", time: "2026-02-24T05:22:42.508Z" }
                ]
            }
        }
    };

    var allEntries = [];

    Object.keys(data).forEach(function (dKey) {
        var dayData = data[dKey];
        Object.keys(dayData).forEach(function (itemName) {
            var itemData = dayData[itemName];

            if (typeof itemData === 'number' || !itemData || !itemData.entries) {
                var oldTime = new Date(dKey);
                if (isNaN(oldTime.getTime())) oldTime = new Date();
                oldTime.setHours(8, 0, 0, 0);

                var qtyVal = 0;
                var unitVal = 'หน่วย';

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
            }

            itemData.entries.forEach(function (entry, index) {
                allEntries.push({
                    dateKey: dKey,
                    name: itemName,
                    qty: entry.qty,
                    unit: entry.unit,
                    time: entry.time,
                    index: index
                });
            });
        });
    });

    console.log("allEntries length:", allEntries.length);
}

testLogic();
