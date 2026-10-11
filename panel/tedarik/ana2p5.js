/* ANA2 P5–P7 panel eki: Uyarılar kutusu, teklif düğmesi, AR-GE › Aday önerileri.
   panel/tedarik/index.html içindeki küresel işlevleri (rpc, esc, $, S, F, L, islem, kartCiz, kartYukle, turCiz, tarafCiz, hataMetni) kullanır.
   RPC: tedarik_ana2_islem (SECURITY DEFINER, panel_yetkili). Gerçek mail gönderimi yok: teklif görevi onay kuyruğuna düşer. */
(function(){
  if(typeof window.kartCiz!=='function')return;
  function ek(ad,veri){return rpc('tedarik_ana2_islem',{p_islem:ad,p_veri:veri||{}});}
  var ETIKET={uyari:'uyarı',bilgi:'bilgi',eleme:'eleme',satis_kilidi:'satış kilidi'};
  var eskiKartCiz=window.kartCiz;
  window.kartCiz=function(){eskiKartCiz();ekCiz();};

  function kutu(id,baslik){
    var d=document.createElement('div');d.className='card';d.id=id;
    d.innerHTML='<h2>'+esc(baslik)+'</h2><div class="empty">Yükleniyor…</div>';
    return d;
  }
  function ekCiz(){
    var main=$('kart');if(!main||!F||F.hata)return;
    var ilk=main.children[0]||null, sonraki=ilk?ilk.nextSibling:null;
    if(F.taraf){
      var u=kutu('p5Uyari','Uyarılar');main.insertBefore(u,sonraki);
      uyariYukle(u,F.taraf.id);
      if(F.yazabilir&&F.tur&&F.tur.teklif_sablon_kodu){var t=kutu('p5Teklif','Teklif isteği');main.insertBefore(t,u.nextSibling);teklifCiz(t);}
      else if(F.yazabilir&&F.tur){var t2=kutu('p5Teklif','Teklif isteği');t2.innerHTML='<h2>Teklif isteği</h2><div class="kut">Bu tür teklif kapsamı dışında (şablon yok): teklif isteği açılmaz.</div>';main.insertBefore(t2,u.nextSibling);}
    }
    if(S.ana==='arge'){var a=kutu('p5Aday','Aday önerileri');main.appendChild(a);adayYukle(a);}
  }

  async function uyariYukle(el,tarafId){
    var j=await ek('uyarilar',{taraf_id:tarafId});
    if(!document.body.contains(el))return;
    if(!j||j.hata){el.innerHTML='<h2>Uyarılar</h2><div class="kut bad">'+esc(hataMetni(j))+'</div>';return;}
    var l=j.uyarilar||[];
    el.innerHTML='<h2>Uyarılar · '+l.length+'</h2>'+(l.length?l.map(function(w){
      return '<div class="alan"><div class="bas"><b>'+esc(w.kod)+'</b><span class="roz '+esc(w.etki)+'">etki: '+esc(ETIKET[w.etki]||w.etki)+'</span><span class="roz '+esc(w.kaynak)+'">kaynak: '+esc(w.kaynak)+'</span><span class="roz '+esc(w.yon)+'">yön: '+esc(w.yon==='lehine'?'Plusiva lehine':w.yon)+'</span>'
        +(w.son_tarih?'<span class="roz">'+esc(w.son_tarih)+'</span>':'')+'</div><div class="acik">'+esc(w.mesaj)+'</div></div>';
    }).join(''):'<div class="empty">Bu tedarikçi için uyarı yok.</div>')
    +'<div class="small mut">Uyarılar engellemez, yalnız bildirir (ALT-03, ALT-04, belge bitişi, kendi filo).</div>';
  }

  function teklifCiz(el){
    el.innerHTML='<h2>Teklif isteği</h2>'
      +'<div class="kut">Görev onay kuyruğuna düşer, gerçek gönderim yalnız onayınızla olur. Şablonda boş alan kalırsa görev açılmaz.</div>'
      +'<div class="frm">'
      +'<input id="p5Donem" placeholder="Dönem (ör. Nisan–Mayıs 2027)" maxlength="80">'
      +'<input id="p5Sehir" placeholder="Şehir" maxlength="80">'
      +'<input id="p5Istenen" placeholder="İstenen (ör. 49 kişilik otobüs, tam gün)" maxlength="200">'
      +'<input id="p5Hacim" placeholder="Hacim (ör. 6 grup × 40 kişi)" maxlength="120">'
      +'<textarea id="p5Hizmet" placeholder="Hizmet açıklaması" maxlength="1000"></textarea>'
      +'<input id="p5Para" placeholder="Para birimi (ör. EUR)" maxlength="3">'
      +'<input id="p5Yanit" placeholder="Yanıt son tarihi (GG.AA.YYYY)" maxlength="20">'
      +'<input id="p5Iptal" placeholder="İptal son günü (ör. 30 gün önce)" maxlength="80">'
      +'<textarea id="p5Ek" placeholder="Ek sorular" maxlength="1000"></textarea>'
      +'<select id="p5Dil"><option value="">Dil: tedarikçinin dili</option><option value="tr">Türkçe</option><option value="en">İngilizce</option><option value="es">İspanyolca</option></select>'
      +'<button class="btn acc" id="p5TeklifBtn">Teklif isteği hazırla (onaya düşer)</button>'
      +'<div class="small" id="p5TeklifSonuc"></div></div>';
    $('p5TeklifBtn').onclick=async function(){
      if(!confirm('Teklif isteği görevi onay kuyruğuna eklensin mi? Gönderim yalnız onayınızla olur.'))return;
      var v={donem:$('p5Donem').value.trim(),sehir:$('p5Sehir').value.trim(),istenen:$('p5Istenen').value.trim(),hacim:$('p5Hacim').value.trim(),hizmet_aciklama:$('p5Hizmet').value.trim(),
        para_birimi:$('p5Para').value.trim().toUpperCase(),yanit_son_tarih:$('p5Yanit').value.trim(),iptal_son_gun:$('p5Iptal').value.trim(),ek_sorular:$('p5Ek').value.trim()};
      if($('p5Dil').value)v.dil=$('p5Dil').value;
      var out=$('p5TeklifSonuc');this.disabled=true;out.style.color='';out.textContent='Hazırlanıyor…';
      var j=await ek('teklif_gorevi',{taraf_id:F.taraf.id,tur:S.tur,veri:v});
      this.disabled=false;
      if(!j||j.hata){out.style.color='var(--bad)';out.textContent='Görev açılmadı: '+hataMetni(j)+(j&&j.eksik?' · boş alan: '+j.eksik:'');return;}
      out.style.color='var(--ok)';out.textContent='Görev onay kuyruğunda ('+(j.konu||'')+'). Panel › İletişim › Onay kuyruğundan inceleyin.';
    };
  }

  async function adayYukle(el){
    var j=await ek('aday_oneri',{});
    if(!document.body.contains(el))return;
    if(!j||j.hata){el.innerHTML='<h2>Aday önerileri</h2><div class="kut bad">'+esc(hataMetni(j))+'</div>';return;}
    var l=j.oneriler||[];
    el.innerHTML='<h2>Aday önerileri · '+l.length+'</h2><div class="small mut" style="margin-bottom:8px">Doğrulanmış veri adayları. Dönüştürme tek tek ve onayınızla yapılır, aynı ad ve şehirde taraf varsa açılmaz. Otel adayı yalnız işletme kaydı olarak açılır.</div>'
      +(l.length?l.map(function(o){
        var benzer=(o.benzer_adaylar||[]).map(function(b){return '#'+b.aday_id+(b.taraf_id?' (bağlı)':'');}).join(', ');
        var hedef=(o.benzer_adaylar||[]).filter(function(b){return b.taraf_id;})[0];
        return '<div class="alan"><div class="bas"><b>'+esc(o.ad)+'</b><span class="kod">#'+esc(o.aday_id)+' · '+esc(o.tip)+' → '+esc(o.onerilen_tur)+'</span>'+(o.veri_sinifi==='test'?'<span class="roz dg">test</span>':'')+'</div>'
          +'<div class="acik">'+esc([o.sehir,o.ulke].filter(Boolean).join(', '))+(o.resmi_site&&/^https?:\/\//i.test(o.resmi_site)?' · <a href="'+esc(o.resmi_site)+'" target="_blank" rel="noopener noreferrer">resmî site</a>':(o.resmi_site?' · '+esc(o.resmi_site):''))+' · A sınıfı olgu: '+esc(o.a_sinifi_olgu)+'</div>'
          +'<div class="acik">'+esc(o.not)+'</div>'
          +(benzer?'<div class="oneri">Olası mükerrer adaylar: '+esc(benzer)+'</div>':'')
          +(o.ayni_ad_sehir_taraf?'<div class="oneri">Aynı ad ve şehirde taraf var: yeni taraf açılmaz, bağlayabilirsiniz.</div>':'')
          +(j.yazabilir?'<div class="giris"><div class="ana"><input id="p5Ad'+o.aday_id+'" value="'+esc(o.ad)+'" maxlength="200"></div>'
            +'<button class="btn acc" data-donustur="'+esc(o.aday_id)+'"'+(o.ayni_ad_sehir_taraf?' disabled':'')+'>Taraf aç</button>'
            +((o.ayni_ad_sehir_taraf||hedef)?'<button class="btn" data-bagla="'+esc(o.aday_id)+'" data-taraf="'+esc(o.ayni_ad_sehir_taraf||hedef.taraf_id)+'">Var olan tarafa bağla</button>':'')
            +'</div>':'')
          +'<div class="sonuc" id="p5S'+esc(o.aday_id)+'"></div></div>';
      }).join(''):'<div class="empty">Dönüştürülecek doğrulanmış aday yok.</div>');
    Array.prototype.forEach.call(el.querySelectorAll('button[data-donustur]'),function(b){b.onclick=function(){donustur(b.getAttribute('data-donustur'),null,b);};});
    Array.prototype.forEach.call(el.querySelectorAll('button[data-bagla]'),function(b){b.onclick=function(){donustur(b.getAttribute('data-bagla'),b.getAttribute('data-taraf'),b);};});
  }
  async function donustur(adayId,tarafId,btn){
    var out=$('p5S'+adayId), v={aday_id:Number(adayId)};
    if(tarafId)v.taraf_id=tarafId;else{var a=$('p5Ad'+adayId);if(a&&a.value.trim())v.ad=a.value.trim();}
    if(!confirm(tarafId?'Bu aday var olan tarafa bağlansın mı?':'Bu adaydan yeni taraf (aday durumunda) açılsın mı?'))return;
    btn.disabled=true;out.className='sonuc';out.textContent='İşleniyor…';
    var j=await ek('aday_donustur',v);
    btn.disabled=false;
    if(!j||j.hata){out.className='sonuc bad';out.textContent='Yapılmadı: '+hataMetni(j);return;}
    out.className='sonuc ok';out.textContent=j.islem==='baglandi'?'Bağlandı.':'Taraf açıldı ve '+j.tur+' türüne bağlandı.';
    L=await islem('liste',{});turCiz();tarafCiz();
  }
})();
