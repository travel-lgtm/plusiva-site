/* Plusiva Travel — ortak vitrin betiği. Kaynak: site_dosyalari 'ortak/site.js' — Yapıcı üretir.
   1) WhatsApp bağlantıları (data-wa) 2) canlı fiyat/koltuk (site_canli) 3) görsel hata bildirimi (foto-api)
   4) liste sayfasında süzgeç + sıralama (#liste varsa) */
(function () {
  'use strict';
  var SB = 'https://wlfabfpjvqfyvhsvldll.supabase.co';
  var KEY = 'sb_publishable_eUv7jsfqkFFbn7k7l-KfAw_WhLiK3PB';
  var POOL_API = SB + '/functions/v1/foto-api';
  var WA = (document.body.getAttribute('data-wa-no') || '905334356824').replace(/\D/g, '');

  function para(n, p) {
    if (n == null || isNaN(n)) return '';
    return Number(n).toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + ' ' + ({ EUR: '€', USD: '$', TRY: 'TL', GBP: '£', SAR: 'SAR' }[p] || p || '');
  }

  // 1) WhatsApp
  function waBagla(kok) {
    [].forEach.call((kok || document).querySelectorAll('[data-wa]'), function (a) {
      a.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(a.getAttribute('data-wa'));
      a.target = '_blank'; a.rel = 'noopener';
    });
  }
  waBagla();

  // 3) Görsel hata → panelin "Eksikler" listesine
  var bildirildi = {};
  window.pvGorselHata = function (img) {
    var kutu = img.parentNode;
    img.remove();
    if (kutu && !kutu.querySelector('.yok')) {
      var d = document.createElement('span'); d.className = 'yok'; d.textContent = img.alt || 'Plusiva Travel'; kutu.appendChild(d);
    }
    var key = img.getAttribute('data-yer'); if (!key || bildirildi[key]) return; bildirildi[key] = 1;
    try {
      var veri = JSON.stringify({ key: key, baslik: img.alt || '', domain: location.hostname, url: location.href });
      if (navigator.sendBeacon) navigator.sendBeacon(POOL_API + '?action=eksik_bildir', new Blob([veri], { type: 'text/plain' }));
    } catch (e) { /* sessiz */ }
  };

  // 2) Canlı fiyat ve koltuk
  function koltukYaz(el, kalan) {
    if (kalan == null) return;
    el.classList.remove('az', 'dolu');
    if (kalan <= 0) { el.textContent = 'Dolu · bekleme listesi'; el.classList.add('dolu'); }
    else if (kalan <= 10) { el.textContent = 'Son ' + kalan + ' koltuk'; el.classList.add('az'); }
    else el.textContent = 'Yer var';
  }
  var kartlar = document.querySelectorAll('.kart[data-kod]');
  if (kartlar.length && window.fetch) {
    fetch(SB + '/rest/v1/rpc/site_canli', {
      method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' }, body: '{}'
    }).then(function (r) { return r.ok ? r.json() : null; }).then(function (V) {
      if (!V) return;
      [].forEach.call(kartlar, function (k) {
        var v = V[k.getAttribute('data-kod')]; if (!v) return;
        var f = k.querySelector('[data-canli=fiyat]'); if (f && v.fiyat != null) { f.textContent = para(v.fiyat, v.para); k.setAttribute('data-fiyat', v.fiyat); }
        var b = k.querySelector('[data-canli=basamak]');
        if (b) b.textContent = v.basamak ? (v.basamak + (v.sonraki ? ' · sonra ' + para(v.sonraki, v.para) : '')) : '';
        var s = k.querySelector('[data-canli=kalan]'); if (s) { koltukYaz(s, v.kalan); k.setAttribute('data-kalan', v.kalan); }
      });
      if (window.pvListeUygula) window.pvListeUygula();
    }).catch(function () { /* statik değerler kalır */ });
  }

  // 4) Liste: süzgeç + sıralama
  var liste = document.getElementById('liste');
  if (!liste) return;
  var form = document.getElementById('suzgec');
  var sayac = document.getElementById('sayac');
  var bos = document.getElementById('bos');
  var sirala = document.getElementById('sirala');
  var trk = function (s) { return String(s || '').toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i'); };
  var hepsi = [].slice.call(liste.querySelectorAll('.kart'));

  function secili(ad) { return [].map.call(form.querySelectorAll('input[name=' + ad + ']:checked'), function (i) { return i.value; }); }

  function urlOku() {
    var p = new URLSearchParams(location.search);
    if (p.get('q')) form.q.value = p.get('q');
    if (p.get('ay') && form.ay) form.ay.value = p.get('ay');
    ['ulke', 'kalkis'].forEach(function (ad) {
      (p.get(ad) || '').split(',').filter(Boolean).forEach(function (v) {
        var i = form.querySelector('input[name=' + ad + '][value="' + v.replace(/"/g, '') + '"]'); if (i) i.checked = true;
      });
    });
    if (p.get('yer') === '1' && form.yer) form.yer.checked = true;
    if (p.get('sira') && sirala) sirala.value = p.get('sira');
  }

  function urlYaz() {
    var p = new URLSearchParams();
    if (form.q.value.trim()) p.set('q', form.q.value.trim());
    if (form.ay && form.ay.value) p.set('ay', form.ay.value);
    var u = secili('ulke'); if (u.length) p.set('ulke', u.join(','));
    var k = secili('kalkis'); if (k.length) p.set('kalkis', k.join(','));
    if (form.yer && form.yer.checked) p.set('yer', '1');
    if (sirala && sirala.value !== 'tarih') p.set('sira', sirala.value);
    var s = p.toString();
    history.replaceState(null, '', location.pathname + (s ? '?' + s : ''));
  }

  window.pvListeUygula = function () {
    var q = trk(form.q.value).trim().split(/\s+/).filter(Boolean);
    var ay = form.ay ? form.ay.value : '';
    var ul = secili('ulke'), kl = secili('kalkis');
    var yer = form.yer && form.yer.checked;
    var n = 0;
    hepsi.forEach(function (k) {
      var ara = trk(k.getAttribute('data-ara'));
      var ok = q.every(function (w) { return ara.indexOf(w) > -1; });
      if (ok && ay) ok = k.getAttribute('data-ay') === ay;
      if (ok && ul.length) ok = ul.some(function (u) { return (' ' + k.getAttribute('data-ulke') + ' ').indexOf(' ' + u + ' ') > -1; });
      if (ok && kl.length) ok = kl.indexOf(k.getAttribute('data-kalkis')) > -1;
      if (ok && yer) ok = Number(k.getAttribute('data-kalan')) > 0;
      k.hidden = !ok; if (ok) n++;
    });
    var s = sirala ? sirala.value : 'tarih';
    var anahtar = { tarih: function (k) { return k.getAttribute('data-tarih'); }, fiyat: function (k) { return Number(k.getAttribute('data-fiyat')) || 1e9; }, sure: function (k) { return Number(k.getAttribute('data-gun')) || 0; } }[s];
    hepsi.slice().sort(function (a, b) { var x = anahtar(a), y = anahtar(b); return x < y ? -1 : x > y ? 1 : 0; }).forEach(function (k) { liste.appendChild(k); });
    sayac.textContent = n + ' tur bulundu';
    bos.hidden = n > 0;
    urlYaz();
  };

  urlOku();
  form.addEventListener('input', window.pvListeUygula);
  form.addEventListener('change', window.pvListeUygula);
  form.addEventListener('submit', function (e) { e.preventDefault(); window.pvListeUygula(); });
  if (sirala) sirala.addEventListener('change', window.pvListeUygula);
  var t = document.getElementById('temizle');
  if (t) t.addEventListener('click', function () { form.reset(); window.pvListeUygula(); });
  window.pvListeUygula();
})();
