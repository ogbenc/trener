<?php
$db = mysqli_connect('localhost', 'root', '', 'sklep');
$res = mysqli_query($db, "SELECT nazwa, cena, ilosc FROM produkty ORDER BY cena DESC");
?>
<section>
<?php while ($p = mysqli_fetch_assoc($res)): ?>
  <div class="produkt">
    <h3><?= $p['nazwa'] ?></h3>
    <?php if ($p['ilosc'] == 0): ?>
      <p class="brak">Brak w magazynie</p>
    <?php else: ?>
      <p>Cena: <?php echo $p['cena']; ?> zł</p>
    <?php endif; ?>
  </div>
<?php endwhile; ?>
</section>
<?php mysqli_close($db); ?>
