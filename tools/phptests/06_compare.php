<?php
$tests = [[0, "a"], ["1", "01"], ["10", "1e1"], [100, "1e2"], [null, false], ["", null], ["0", false], ["abc", 0], [1.0, 1], ["1", 1], [[], false], ["a", "A"], [" 1", 1], ["1 ", 1], [null, 0], ["", 0]];
foreach ($tests as $t) { var_dump($t[0] == $t[1]); }
var_dump("1" === "1", null === null, [1, 2] == [1, 2], [1, 2] === [2 => 1]);
var_dump(2 < "10", "2" < "10", "abc" < "abd", "Z" < "a", 1 <=> 2, "b" <=> "a", [1, 2] <=> [1, 2]);
var_dump((int)"12abc", (int)"abc", (int)12.9, (int)"-3.7", (float)"3.5kg", (string)1.0, (string)0.5, (bool)"0", (bool)"0.0", (bool)[], (bool)[0], intval("0x1A"), intval("012"));
var_dump(is_numeric("12"), is_numeric("12.5"), is_numeric("1e5"), is_numeric("abc"), is_numeric(" 12"), is_numeric("12 "), is_numeric(""), is_numeric("0x1A"));
var_dump(empty(""), empty("0"), empty("a"), empty(0), empty([]), empty(null), isset($nie), empty($nie));
