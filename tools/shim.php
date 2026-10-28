<?php
// Podkładka mysqli → PDO SQLite dla testów porównawczych (prawdziwe PHP vs MiniPHP)
$__env = json_decode(getenv('MINI_ENV') ?: '{}', true);
$_GET = $__env['get'] ?? []; $_POST = $__env['post'] ?? [];
$_REQUEST = array_merge($_GET, $_POST);
$_SERVER['REQUEST_METHOD'] = $_POST ? 'POST' : 'GET';
const MYSQLI_ASSOC = 1; const MYSQLI_NUM = 2; const MYSQLI_BOTH = 3;
class mysqli_sql_exception extends Exception {}
class mysqli_result { public $rows; public $cols; public $pos = 0; public $num_rows; }
class mysqli { public $pdo; public $closed = false; public $affected = 0; }
function __strv($v) { if ($v === null) return null; if (is_float($v) && floor($v) == $v && abs($v) < 1e15) return (string)(int)$v; return (string)$v; }
function mysqli_connect($h = 'localhost', $u = 'root', $p = '', $db = '') {
  if ($h !== 'localhost' && $h !== '127.0.0.1') throw new mysqli_sql_exception("php_network_getaddresses: getaddrinfo for $h failed: Nieznany host. (serwer to localhost)");
  if ($u !== 'root' || $p !== '') throw new mysqli_sql_exception("Access denied for user '$u'@'localhost' (using password: " . ($p ? 'YES' : 'NO') . ")" . ($u === 'root' ? ' (na egzaminie: root bez hasła → "")' : ''));
  if ($db !== '' && $db !== getenv('MINI_DBNAME')) throw new mysqli_sql_exception("Unknown database '$db'");
  $c = new mysqli(); $c->pdo = new PDO('sqlite::memory:'); $c->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  $c->pdo->exec(file_get_contents(getenv('MINI_DB')));
  return $c;
}
function mysqli_query($c, $sql) {
  if ($c->closed) throw new Error('mysqli object is already closed (połączenie zamknięte za wcześnie – mysqli_close daj na końcu)');
  try { $st = $c->pdo->query($sql); } catch (PDOException $e) { throw new mysqli_sql_exception('SQLERR'); }
  if ($st->columnCount() > 0) { $r = new mysqli_result(); $r->cols = []; for ($i = 0; $i < $st->columnCount(); $i++) { $r->cols[] = $st->getColumnMeta($i)['name']; } $r->rows = $st->fetchAll(PDO::FETCH_NUM); $r->num_rows = count($r->rows); return $r; }
  $c->affected = $st->rowCount(); return true;
}
$__dec = json_decode(getenv('MINI_DEC') ?: '{}', true);
function __fetch($r, $mode) { global $__dec; if ($r->pos >= count($r->rows)) return null; $row = $r->rows[$r->pos++]; $a = []; foreach ($r->cols as $i => $n) { $k = strtolower($n); $v = (isset($__dec[$k]) && is_numeric($row[$i])) ? number_format((float)$row[$i], $__dec[$k], '.', '') : __strv($row[$i]); if ($mode & 2) $a[$i] = $v; if ($mode & 1) $a[$n] = $v; } return $a; }
function mysqli_fetch_array($r, $m = 3) { return __fetch($r, $m); }
function mysqli_fetch_assoc($r) { return __fetch($r, 1); }
function mysqli_fetch_row($r) { return __fetch($r, 2); }
function mysqli_fetch_all($r, $m = 2) { $o = []; while (($x = __fetch($r, $m)) !== null) $o[] = $x; return $o; }
function mysqli_fetch_object($r) { $x = __fetch($r, 1); return $x === null ? null : (object)$x; }
function mysqli_num_rows($r) { return count($r->rows); }
function mysqli_num_fields($r) { return count($r->cols); }
function mysqli_affected_rows($c) { return $c->affected; }
function mysqli_close($c) { $c->closed = true; return true; }
function mysqli_set_charset($c, $s) { return true; }
function mysqli_select_db($c, $d) { return true; }
function mysqli_real_escape_string($c, $s) { return addslashes($s); }
