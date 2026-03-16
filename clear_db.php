<?php
// ===== DATABASE QUICK RESET SCRIPT =====
// อัปโหลดไฟล์นี้ไปไว้ที่โฟลเดอร์เดียวกันกับ api/ (โฟลเดอร์หลัก)
// แล้วเปิด URL: https://ชื่อโดเมนของคุณ.com/clear_db.php

$apiUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]" . dirname($_SERVER['REQUEST_URI']) . '/api/reset_data.php';
?>
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ล้างข้อมูลระบบ</title>
    <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Prompt', sans-serif; text-align: center; margin: 0; padding: 40px 20px; background: #f5f0eb; color: #333; }
        .container { background: #fff; padding: 40px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
        h1 { color: #d32f2f; margin-top: 0; }
        p { color: #666; line-height: 1.6; }
        .alert { background: #ffebee; border: 1px solid #ffcdd2; padding: 15px; border-radius: 8px; margin: 20px 0; color: #c62828; text-align: left;}
        .btn { background: #f44336; color: #fff; border: none; padding: 14px 24px; font-size: 1.1rem; font-family: 'Prompt', sans-serif; font-weight: 600; border-radius: 12px; cursor: pointer; transition: 0.2s; width: 100%; box-sizing: border-box; display:flex; justify-content:center; align-items:center; gap:10px; }
        .btn:hover { background: #d32f2f; }
        .btn:disabled { background: #ccc; cursor: not-allowed; }
        .success-box { display: none; margin-top: 20px; background: #e8f5e9; border: 1px solid #c8e6c9; color: #2e7d32; padding: 20px; border-radius: 12px; }
        .spinner { display: none; width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: #fff; animation: spin 1s ease-in-out infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</head>
<body>

    <div class="container">
        <h1 style="font-size:3rem; margin-bottom:10px;">🗑️</h1>
        <h1>ล้างข้อมูลฐานข้อมูล</h1>
        <p>หน้านี้จะทำการเรียก API เพื่อเคลียร์ข้อมูล ออเดอร์ (orders), ประวัติการสั่งซื้อ, ตะกร้าสินค้า และสต๊อกวัตถุดิบทั้งหมดบนเซิร์ฟเวอร์ ออกไป</p>
        
        <div class="alert">
            <strong>⚠️ คำเตือน:</strong> ข้อมูลที่ถูกลบจะไม่สามารถกู้คืนได้ (รายชื่อพนักงาน ข้อมูลเมนู และจำนวนโต๊ะ จะยังคงอยู่)
        </div>

        <button id="resetBtn" class="btn" onclick="confirmReset()">
             ยืนยันการล้างข้อมูล <div class="spinner" id="btnSpinner"></div>
        </button>

        <div id="successMessage" class="success-box">
            <h3 style="margin-top:0;">✅ ล้างข้อมูลเรียบร้อยแล้ว!</h3>
            <p style="margin-bottom:0;">คุณสามารถปิดหน้านี้ และกลับไปใช้งานระบบหน้าร้านได้ตามปกติครับ</p>
            <p style="margin-top:10px;font-size:0.8rem;color:#888;">(แนะนำให้ลบไฟล์ clear_db.php ออกจากโฮสต์หลังจากใช้งานเสร็จ เพื่อความปลอดภัย)</p>
        </div>
    </div>

    <script>
        function confirmReset() {
            if(!confirm("คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลทั้งหมดบนโฮสต์จริง?\nการกระทำนี้ไม่สามารถย้อนกลับได้!")) {
                return;
            }

            const btn = document.getElementById('resetBtn');
            const spinner = document.getElementById('btnSpinner');
            btn.disabled = true;
            spinner.style.display = 'block';

            fetch('<?php echo $apiUrl; ?>', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'reset_all' })
            })
            .then(res => res.json())
            .then(data => {
                if(data.success) {
                    btn.style.display = 'none';
                    document.getElementById('successMessage').style.display = 'block';
                } else {
                    alert("เกิดข้อผิดพลาด: " + data.message);
                    btn.disabled = false;
                    spinner.style.display = 'none';
                }
            })
            .catch(err => {
                console.error(err);
                alert("เกิดข้อผิดพลาดในการเชื่อมต่อ 서버");
                btn.disabled = false;
                spinner.style.display = 'none';
            });
        }
    </script>
</body>
</html>
