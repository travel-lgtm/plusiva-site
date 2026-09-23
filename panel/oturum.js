/* Plusiva panel oturumu — Supabase Auth (e-posta/şifre, Google, doğrulama, şifre sıfırlama) */
(function(){
  var SB_URL='https://wlfabfpjvqfyvhsvldll.supabase.co', SB_KEY='sb_publishable_eUv7jsfqkFFbn7k7l-KfAw_WhLiK3PB';
  var PANEL_KOK = location.origin + location.pathname.replace(/panel\/.*$/, 'panel/');
  var PV = window.PV = { token:null, ben:null, sb:null, hazir:null };
  var resolveHazir; PV.hazir = new Promise(function(r){ resolveHazir = r; });

  var css = '#pvAuth{position:fixed;inset:0;background:#f6f6f3;z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding:12vh 16px;font-family:Manrope,system-ui,sans-serif;color:#1a1f1d}'
   +'#pvAuth .kutu{width:100%;max-width:400px;background:#fff;border:1px solid #e3e6e2;border-radius:14px;padding:26px}'
   +'#pvAuth h1{margin:0 0 4px;font-size:20px;color:#0f5c5a}#pvAuth .m{font-size:13px;color:#6f7975;margin-bottom:14px}'
   +'#pvAuth input{width:100%;padding:11px;border:1px solid #e3e6e2;border-radius:8px;font-family:inherit;font-size:14px;margin:6px 0;box-sizing:border-box}'
   +'#pvAuth button{width:100%;border:1px solid #e3e6e2;background:#fff;padding:11px;border-radius:9px;font-family:inherit;font-size:14px;font-weight:700;cursor:pointer;margin-top:8px}'
   +'#pvAuth button.acc{background:#0f5c5a;color:#fff;border-color:#0f5c5a}#pvAuth button.g{display:flex;align-items:center;justify-content:center;gap:8px}'
   +'#pvAuth .l{font-size:13px;color:#0f5c5a;cursor:pointer;text-decoration:underline;margin-top:10px;display:inline-block}#pvAuth .l+.l{margin-left:14px}'
   +'#pvAuth .err{background:#fbeaea;color:#8a2a2a;border-radius:8px;padding:9px 11px;font-size:13px;margin-top:10px;display:none}'
   +'#pvAuth .ok{background:#e8f5ec;color:#1b5e3a;border-radius:8px;padding:9px 11px;font-size:13px;margin-top:10px;display:none}'
   +'#pvAuth .kucuk{font-size:12px;color:#6f7975;margin-top:12px}'
   +'#pvBen{position:fixed;right:14px;top:10px;z-index:9000;font:12px Manrope,system-ui,sans-serif;background:#fff;border:1px solid #e3e6e2;border-radius:999px;padding:5px 10px;color:#6f7975}#pvBen b{color:#1a1f1d}#pvBen a{color:#0f5c5a;cursor:pointer;margin-left:8px;font-weight:700}';
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  function el(id){ return document.getElementById(id); }
  function goster(hangi){ ['giris','kayit','unut','yeni','onay'].forEach(function(k){ var e=el('pv_'+k); if(e) e.style.display = (k===hangi?'block':'none'); }); }
  function hata(m){ var e=el('pvErr'); e.textContent=m||''; e.style.display=m?'block':'none'; var o=el('pvOk'); o.style.display='none'; }
  function tamam(m){ var e=el('pvOk'); e.textContent=m||''; e.style.display=m?'block':'none'; var o=el('pvErr'); o.style.display='none'; }
  function guclu(p){ return p.length>=10 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /[0-9]/.test(p); }

  function overlay(){
    if(el('pvAuth')) return;
    var d=document.createElement('div'); d.id='pvAuth';
    d.innerHTML = '<div class="kutu">'
     +'<div id="pv_giris"><h1>Plusiva Sistem</h1><div class="m">Yönetim paneline giriş</div>'
       +'<input id="pvE" type="email" placeholder="e-posta" autocomplete="username"><input id="pvP" type="password" placeholder="şifre" autocomplete="current-password">'
       +'<button class="acc" id="pvGirisBtn">Giriş yap</button>'
       +'<button class="g" id="pvGoogle"><svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.5 13.3l7.9 6.1C12.3 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z"/><path fill="#FBBC05" d="M10.4 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.1.8-4.6l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.5 10.7l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.7-4.1-13.6-9.9l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>Google ile giriş</button>'
       +'<span class="l" id="pvKayitL">Hesap oluştur</span><span class="l" id="pvUnutL">Şifremi unuttum</span>'
     +'</div>'
     +'<div id="pv_kayit" style="display:none"><h1>Hesap oluştur</h1><div class="m">Kayıt sonrası e-postanıza doğrulama bağlantısı gelir. Yeni hesaplar yönetici onayından sonra açılır.</div>'
       +'<input id="pvKA" placeholder="ad soyad"><input id="pvKE" type="email" placeholder="e-posta"><input id="pvKP" type="password" placeholder="şifre (en az 10 karakter, büyük-küçük harf ve rakam)" autocomplete="new-password">'
       +'<button class="acc" id="pvKayitBtn">Kayıt ol</button><span class="l" id="pvGeri1">Girişe dön</span></div>'
     +'<div id="pv_unut" style="display:none"><h1>Şifre sıfırla</h1><div class="m">E-postanıza sıfırlama bağlantısı göndereceğiz.</div>'
       +'<input id="pvUE" type="email" placeholder="e-posta"><button class="acc" id="pvUnutBtn">Bağlantı gönder</button><span class="l" id="pvGeri2">Girişe dön</span></div>'
     +'<div id="pv_yeni" style="display:none"><h1>Yeni şifre</h1><div class="m">Yeni şifrenizi belirleyin.</div>'
       +'<input id="pvYP" type="password" placeholder="yeni şifre" autocomplete="new-password"><input id="pvYP2" type="password" placeholder="yeni şifre (tekrar)"><button class="acc" id="pvYeniBtn">Kaydet</button></div>'
     +'<div id="pv_onay" style="display:none"><h1>Onay bekleniyor</h1><div class="m">Hesabınız oluşturuldu; bir yönetici rolünüzü tanımlayınca panel açılır.</div><button id="pvCikis2">Çıkış</button></div>'
     +'<div class="err" id="pvErr"></div><div class="ok" id="pvOk"></div>'
     +'<div class="kucuk">İletişim: Cevahir Kılıç · Plusiva</div>'
     +'</div>';
    document.body.appendChild(d);
    el('pvKayitL').onclick=function(){hata('');goster('kayit')}; el('pvUnutL').onclick=function(){hata('');goster('unut')};
    el('pvGeri1').onclick=function(){hata('');goster('giris')}; el('pvGeri2').onclick=function(){hata('');goster('giris')};
    el('pvGirisBtn').onclick=giris; el('pvP').onkeydown=function(e){if(e.key==='Enter')giris()};
    el('pvGoogle').onclick=function(){ PV.sb.auth.signInWithOAuth({provider:'google', options:{redirectTo: location.href.split('#')[0]}}).then(function(r){ if(r.error) hata(r.error.message); }); };
    el('pvKayitBtn').onclick=kayit; el('pvUnutBtn').onclick=unut; el('pvYeniBtn').onclick=yeniSifre; el('pvCikis2').onclick=function(){PV.cikis()};
  }
  function kapat(){ var e=el('pvAuth'); if(e) e.remove(); }

  async function giris(){
    hata('');
    var r = await PV.sb.auth.signInWithPassword({email:el('pvE').value.trim(), password:el('pvP').value});
    if(r.error){ hata(r.error.message==='Invalid login credentials'?'E-posta ya da şifre hatalı.':(r.error.message==='Email not confirmed'?'E-postanız henüz doğrulanmadı; gelen kutunuzu kontrol edin.':r.error.message)); return; }
    location.reload();
  }
  async function kayit(){
    hata('');
    var p=el('pvKP').value; if(!guclu(p)){ hata('Şifre en az 10 karakter olmalı; büyük harf, küçük harf ve rakam içermeli.'); return; }
    var r = await PV.sb.auth.signUp({email:el('pvKE').value.trim(), password:p, options:{data:{full_name:el('pvKA').value.trim()}, emailRedirectTo: PANEL_KOK}});
    if(r.error){ hata(r.error.message); return; }
    tamam('Kayıt alındı. E-postanıza gelen doğrulama bağlantısına tıklayın, sonra giriş yapın.');
  }
  async function unut(){
    hata('');
    var r = await PV.sb.auth.resetPasswordForEmail(el('pvUE').value.trim(), {redirectTo: PANEL_KOK});
    if(r.error){ hata(r.error.message); return; }
    tamam('Sıfırlama bağlantısı gönderildi; e-postanızı kontrol edin.');
  }
  async function yeniSifre(){
    hata('');
    var p=el('pvYP').value; if(p!==el('pvYP2').value){ hata('Şifreler aynı değil.'); return; }
    if(!guclu(p)){ hata('Şifre en az 10 karakter olmalı; büyük harf, küçük harf ve rakam içermeli.'); return; }
    var r = await PV.sb.auth.updateUser({password:p});
    if(r.error){ hata(r.error.message); return; }
    tamam('Şifre güncellendi.'); setTimeout(function(){ location.href = PANEL_KOK; }, 900);
  }
  PV.cikis = async function(){ try{ await PV.sb.auth.signOut(); }catch(e){} localStorage.removeItem('pv_anahtar'); location.href = PANEL_KOK; };

  function benRozet(){
    if(!PV.ben || !PV.ben.eposta) return;
    var d=document.createElement('div'); d.id='pvBen';
    d.innerHTML = '<b>'+(PV.ben.ad||PV.ben.eposta)+'</b> · '+PV.ben.rol+'<a id="pvCikisA">çıkış</a>';
    document.body.appendChild(d); el('pvCikisA').onclick=PV.cikis;
  }

  async function basla(){
    PV.sb = window.supabase.createClient(SB_URL, SB_KEY);
    var kurtarma = /type=recovery/.test(location.hash) || /type=recovery/.test(location.search);
    var s = await PV.sb.auth.getSession();
    var session = s.data && s.data.session;
    if(kurtarma){ overlay(); goster('yeni'); return; }
    if(session){
      PV.token = session.access_token;
      try{ var b = await fetch(SB_URL+'/rest/v1/rpc/panel_ben',{method:'POST',headers:{'Content-Type':'application/json','apikey':SB_KEY,'Authorization':'Bearer '+PV.token},body:'{}'}).then(function(x){return x.json()}); PV.ben=b||{}; }catch(e){ PV.ben={}; }
      if(!PV.ben || !PV.ben.aktif){ overlay(); goster('onay'); return; }
      fetch(SB_URL+'/rest/v1/rpc/panel_giris_damgala',{method:'POST',headers:{'Content-Type':'application/json','apikey':SB_KEY,'Authorization':'Bearer '+PV.token},body:'{}'}).catch(function(){});
      kapat(); benRozet(); resolveHazir(); return;
    }
    if(localStorage.getItem('pv_anahtar') || new URLSearchParams(location.search).get('anahtar')){ resolveHazir(); return; }
    overlay(); goster('giris');
    PV.sb.auth.onAuthStateChange(function(ev, ses){ if(ses && ses.access_token){ location.reload(); } });
  }
  if(window.supabase){ basla(); } else { var sc=document.createElement('script'); sc.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js'; sc.onload=basla; sc.onerror=function(){ resolveHazir(); }; document.head.appendChild(sc); }
})();
