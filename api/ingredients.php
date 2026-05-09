<?php
require_once 'db.php';

// Ensure the ingredients table has required columns
$conn->query("ALTER TABLE `ingredients` ADD COLUMN IF NOT EXISTS `is_disabled` tinyint(1) DEFAULT 0");
$conn->query("ALTER TABLE `ingredients` ADD COLUMN IF NOT EXISTS `usage_per_order` decimal(10,4) NOT NULL DEFAULT 0.0000");
$conn->query("ALTER TABLE `ingredients` ADD COLUMN IF NOT EXISTS `pieces_per_order` int(11) NOT NULL DEFAULT 1");

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = isset($_GET['action']) ? $_GET['action'] : 'disabled_list';

    if ($action === 'disabled_list') {
        // Return list of disabled ingredient names
        $result = $conn->query("SELECT ingredient_name FROM ingredients WHERE is_disabled = 1");
        $disabled = [];
        if ($result && $result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $disabled[] = $row['ingredient_name'];
            }
        }
        echo json_encode($disabled);
    } elseif ($action === 'get_formula') {
        $result = $conn->query("SELECT ingredient_name, usage_per_order FROM ingredients");
        $formula = [];
        if ($result && $result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $formula[$row['ingredient_name']] = (float)$row['usage_per_order'];
            }
        }
        echo json_encode($formula);
    } elseif ($action === 'get_formula_detail') {
        $result = $conn->query("SELECT ingredient_name, usage_per_order, pieces_per_order FROM ingredients");
        $formula = [];
        if ($result && $result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $formula[$row['ingredient_name']] = [
                    'usage' => (float)$row['usage_per_order'],
                    'pieces' => (int)$row['pieces_per_order']
                ];
            }
        }
        echo json_encode($formula);
    } else {
        // Return all ingredients
        $result = $conn->query("SELECT ingredient_name, unit, is_disabled, usage_per_order, icon_html FROM ingredients ORDER BY ingredient_name");
        $list = [];
        if ($result && $result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $list[] = $row;
            }
        }
        echo json_encode($list);
    }

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    $action = isset($data['action']) ? $data['action'] : '';

    if ($action === 'set_disabled') {
        // data['disabled'] = array of ingredient names to disable
        $disabled = isset($data['disabled']) && is_array($data['disabled']) ? $data['disabled'] : [];

        // Reset all to enabled first
        $conn->query("UPDATE ingredients SET is_disabled = 0");

        if (!empty($disabled)) {
            $stmt = $conn->prepare("UPDATE ingredients SET is_disabled = 1 WHERE ingredient_name = ?");
            if ($stmt) {
                foreach ($disabled as $name) {
                    $stmt->bind_param("s", $name);
                    $stmt->execute();
                }
                $stmt->close();
            }
        }
        echo json_encode(["success" => true]);
    } elseif ($action === 'toggle') {
        $name = isset($data['name']) ? $conn->real_escape_string($data['name']) : '';
        $is_disabled = isset($data['is_disabled']) ? (int)$data['is_disabled'] : 0;
        if (!empty($name)) {
            $conn->query("UPDATE ingredients SET is_disabled = $is_disabled WHERE ingredient_name = '$name'");
        }
        echo json_encode(["success" => true]);
    } elseif ($action === 'update_formula') {
        $formula = isset($data['formula']) && is_array($data['formula']) ? $data['formula'] : [];
        $pieces = isset($data['pieces']) && is_array($data['pieces']) ? $data['pieces'] : [];
        if (!empty($formula)) {
            $stmt = $conn->prepare("UPDATE ingredients SET usage_per_order = ?, pieces_per_order = ? WHERE ingredient_name = ?");
            if ($stmt) {
                foreach ($formula as $name => $usage) {
                    $p = isset($pieces[$name]) ? (int)$pieces[$name] : 1;
                    $stmt->bind_param("dis", $usage, $p, $name);
                    $stmt->execute();
                }
                $stmt->close();
            }
        }
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "error" => "Unknown action"]);
    }
}

$conn->close();
?>
