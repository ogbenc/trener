<!DOCTYPE html>
<html lang="pl">
<head><meta charset="UTF-8"><title>Test</title></head>
<body>
<ul>
<?php for ($i = 1; $i <= 3; $i++) { ?>
  <li>Element <?= $i ?></li>
<?php } ?>
</ul>
<?php if (count([1, 2]) > 1): ?>
<p>Więcej niż jeden</p>
<?php else: ?>
<p>Jeden</p>
<?php endif; ?>
<?php
$x = 5;
?>
<p><?php echo $x * 2; ?></p>
<?php foreach (['a', 'b'] as $l): ?><span><?= $l ?></span><?php endforeach ?>

<footer>Autor: 12345</footer>
</body>
</html>
