const http = require('http');
http.get('http://localhost/system/webapp/api/orders.php', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            console.log('Total orders:', parsed.length);
            if (parsed.length > 0) {
                console.log('Sample order:', JSON.stringify(parsed[parsed.length - 1], null, 2));
            }
        } catch (e) {
            console.error('Error parsing JSON:', e.message);
            console.log('Raw output:', data);
        }
    });
}).on("error", (err) => {
    console.log("Error: " + err.message);
});
