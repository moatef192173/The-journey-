/* PE Coach Pro — F3 Pro Max */
(function(global){
  "use strict";

  // مفاتيح التخزين
  const LS_DAYS='pe_days';
  const LS_SUPP='pe_supp_catalog';
  const LS_NOTES='pe_notes';
  const LS_PIN='pe_pin_hash';
  const LS_THEME='pe_theme';
  const LS_ACCENT='pe_accent';
  const LS_HAB_CUSTOM='pe_hab_custom';

  const $ = (sel,root=document)=>root.querySelector(sel);
  const $$ = (sel,root=document)=>Array.from(root.querySelectorAll(sel));
  const readLS=(k,def=null)=>{ try{const v=localStorage.getItem(k);return v?JSON.parse(v):def;}catch(_){return def;} };
  const writeLS=(k,v)=>{ try{localStorage.setItem(k,JSON.stringify(v));}catch(_){ } };
  const todayISO=()=>new Date().toISOString().slice(0,10);
  const clamp=(n,min,max)=>Math.max(min, Math.min(max, isNaN(n)?min:n));
  const escapeHTML=s=>s.replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));

  // كتالوجات
  const DEF_SUPP = ["أوميغا-3","زنك","مغنيسيوم","أشواجاندا","Re-Prost Plus","Multivitamins","Maca","L-Arginine"];
  const DEF_HAB_BASE = [
    {id:'kegel',   label:'كيجل'},
    {id:'breath',  label:'تنفّس 3-5 د'},
    {id:'pelvic',  label:'إرخاء الحوض'},
    {id:'walk',    label:'مشي'},
    {id:'sport',   label:'رياضة'}
  ];
  const DEF_FAITH = [
    {id:'pray_jamaah', label:'صلاة الجماعة'},
    {id:'quran',       label:'قراءة القرآن'},
    {id:'azkar',       label:'أذكار'},
    {id:'dua',         label:'دعاء'}
  ];
  const DEF_SOCIAL = [
    {id:'friend',   label:'تواصل مع صديق'},
    {id:'calm',     label:'هدوء أثناء التحدث'},
    {id:'no_exag',  label:'عدم مبالغة'},
    {id:'exposure', label:'تعرّض تدريجي للقلق'}
  ];

  // اقتباسات تحفيزية
  const QUOTES=[
    "خطوة اليوم تصنع فرق بكرة.",
    "الاستمرارية أقوى من الحماس المؤقت.",
    "كل تقدم—even لو بسيط—هو انتصار.",
    "اهدأ… وخذ نفس عميق. أنت على الطريق الصحيح."
  ];

  // نموذج اليوم
  function blankDay(dateISO){
    return {
      date: dateISO||todayISO(),
      steps:0, med:"بدون", tada:false,
      anx:0, sleep:0, ctrl:0, lat:0,
      rel:false, pelv:false,
      rel_note:"", note:"",
      supp:[], habits:{},              // غير دوائي
      faith:{},                        // ديني
      cog:{ pages:0, learn:0, summary:false }, // معرفي
      social:{},                       // اجتماعي
      money:{ spend:0, note:"" }       // مالي
    };
  }

  // أيام
  function loadDays(){ return readLS(LS_DAYS,[]); }
  function saveDays(a){ writeLS(LS_DAYS,a); }
  function upsertDay(d){
    const arr=loadDays();
    const i=arr.findIndex(x=>x.date===d.date);
    if(i>=0) arr[i]=d; else arr.push(d);
    arr.sort((a,b)=>a.date<b.date?1:-1);
    saveDays(arr);
  }

  // مكملات
  function loadSupp(){ return readLS(LS_SUPP, DEF_SUPP.slice()); }
  function saveSupp(list){ writeLS(LS_SUPP,list); }

  // عادات مخصصة
  function loadCustomHab(){ return readLS(LS_HAB_CUSTOM, []); }
  function saveCustomHab(list){ writeLS(LS_HAB_CUSTOM,list); }

  // ملاحظات
  function loadNotes(){ return readLS(LS_NOTES, []); }
  function saveNotes(n){ writeLS(LS_NOTES, n); }

  // ثيم
  function applyTheme(){
    const theme = readLS(LS_THEME,'dark');
    document.documentElement.setAttribute('data-theme', theme);
    const acc = readLS(LS_ACCENT, null);
    if(acc){
      document.documentElement.style.setProperty('--acc', acc);
    }
  }

  // ===== واجهة =====
  const PE = {
    init(version){
      applyTheme();
      rotateQuote();
      setInterval(rotateQuote, 12000);

      // تبويب
      $$('.tab').forEach(b=>{
        b.addEventListener('click',()=>{
          $$('.tab').forEach(x=>x.classList.remove('active'));
          b.classList.add('active');
          const t=b.dataset.tab;
          $$('main section').forEach(s=>s.classList.add('hidden'));
          $('#'+t).classList.remove('hidden');
          if(t==='log') renderLog();
          if(t==='stats') renderStats();
          if(t==='notes') renderNotes();
        });
      });

      // ثيم
      $('#themeBtn').onclick=()=>{
        const cur=readLS(LS_THEME,'dark');
        const next = cur==='dark'?'light':'dark';
        writeLS(LS_THEME,next); applyTheme();
      };
      $('#themeColorBtn').onclick=()=>{
        const inp=document.createElement('input'); inp.type='color';
        inp.onchange=()=>{ writeLS(LS_ACCENT, inp.value); applyTheme(); };
        inp.click();
      };

      // اليوم
      $('#d_date').value=todayISO();
      renderSuppCatalog();
      renderHabits('#habToday');
      renderChecklist('#faithBox', DEF_FAITH);
      renderChecklist('#socialBox', DEF_SOCIAL);

      $('#suppAddBtn').onclick=()=>{
        const n=$('#suppNewName').value.trim(); if(!n) return;
        const cat=loadSupp(); if(!cat.includes(n)){ cat.push(n); saveSupp(cat); renderSuppCatalog(); $('#suppNewName').value=''; updateProgress();}
      };
      $('#habAddBtn').onclick=()=>{
        const n=$('#habNewName').value.trim(); if(!n) return;
        const list=loadCustomHab(); if(!list.includes(n)){ list.push(n); saveCustomHab(list); renderHabits('#habToday'); $('#habNewName').value=''; updateProgress();}
      };

      $('#saveDay').onclick=()=>{ saveToday(); updateProgress(); };
      $('#clearDay').onclick=()=>{ fillDay(blankDay($('#d_date').value)); updateProgress(); };

      // سجل
      $('#logRange').onchange=renderLog;
      $('#csvBtn').onclick=exportCSV;
      $('#delAll').onclick=()=>{ if(confirm('حذف كل السجل؟')){ saveDays([]); renderLog(); alert('تم الحذف.'); updateProgress(); } };

      // ملاحظات
      $('#noteAdd').onclick=()=>{
        const t=$('#noteText').value.trim(); if(!t) return;
        const tags=$('#noteTags').value.trim();
        const arr=loadNotes(); arr.unshift({ts:Date.now(), text:t, tags});
        saveNotes(arr); $('#noteText').value=''; $('#noteTags').value=''; renderNotes();
      };
      $('#noteExport').onclick=()=>{
        const blob=new Blob([JSON.stringify(loadNotes(),null,2)],{type:'application/json'});
        const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='notes.json'; a.click();
      };
      $('#noteImport').onclick=()=>{
        const inp=document.createElement('input'); inp.type='file'; inp.accept='application/json';
        inp.onchange=async ()=>{
          const f=inp.files[0]; if(!f) return;
          try{ const txt=await f.text(); const arr=JSON.parse(txt); if(Array.isArray(arr)){ saveNotes(arr); renderNotes(); alert('تم الاستيراد'); } }
          catch{ alert('ملف غير صالح'); }
        };
        inp.click();
      };

      // نسخ احتياطي
      $('#backupBtn').onclick=()=>{
        const payload={ days:loadDays(), supp:loadSupp(), notes:loadNotes(),
                        habCustom:loadCustomHab(),
                        v:localStorage.getItem('pe_version')||version };
        const blob=new Blob([JSON.stringify(payload)],{type:'application/json'});
        const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='backup_pe.json'; a.click();
      };

      // تحديث قوي من الهيدر
      $('#updateBtn').onclick=()=>$('#refreshBtn')?.click();

      // PIN
      setupPIN();

      // ملء يوم محفوظ إن وجد
      const ex = loadDays().find(x=>x.date===$('#d_date').value);
      fillDay(ex || blankDay());
      updateProgress();

      // استماع لأي تغيّر يحسب التقدم
      document.addEventListener('change', (e)=>{
        if(e.target && ['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)){
          updateProgress();
        }
      }, true);

      // قفل تلقائي بعد خمول
      setupAutoLock();
    }
  };

  // اقتباس متغيّر
  function rotateQuote(){
    const i=Math.floor((Date.now()/12000))%QUOTES.length;
    const q=QUOTES[i];
    const el=$('#motivate'); if(el) el.textContent=q;
  }

  // عناصر اليوم
  function allHabits(){
    const custom = loadCustomHab().map(name=>({id:'c_'+name.replace(/\s+/g,'_'), label:name}));
    return [...DEF_HAB_BASE, ...custom];
  }
  function renderSuppCatalog(){
    const cat=loadSupp(), box=$('#suppToday'); box.innerHTML=''; box.classList.add('grid');
    cat.forEach(name=>{
      const id='supp_'+name.replace(/\s+/g,'_');
      const div=document.createElement('div'); div.className='row';
      div.innerHTML=`<input type="checkbox" id="${id}"><label for="${id}" style="margin:0 6px">${name}</label>`;
      box.appendChild(div);
    });
  }
  function renderHabits(sel){
    const wrap=$(sel); wrap.innerHTML='';
    allHabits().forEach(h=>{
      const id=`hab_${h.id}`;
      const div=document.createElement('div'); div.className='row';
      div.innerHTML=`<input type="checkbox" id="${id}"><label for="${id}" style="margin:0 6px">${h.label}</label>`;
      wrap.appendChild(div);
    });
  }
  function renderChecklist(sel, items){
    const wrap=$(sel); wrap.innerHTML='';
    items.forEach(it=>{
      const id=`chk_${it.id}`;
      const div=document.createElement('div'); div.className='row';
      div.innerHTML=`<input type="checkbox" id="${id}"><label for="${id}" style="margin:0 6px">${it.label}</label>`;
      wrap.appendChild(div);
    });
  }

  function gatherDay(){
    const d = blankDay($('#d_date').value);
    d.steps=+$('#d_steps').value||0;
    d.med=$('#d_med').value;
    d.tada=$('#d_tada').checked;
    d.anx=clamp(+$('#d_anx').value,0,10);
    d.sleep=clamp(+$('#d_sleep').value,0,10);
    d.ctrl=clamp(+$('#d_ctrl').value,0,10);
    d.lat=Math.max(0,+$('#d_lat').value||0);
    d.rel=$('#d_rel').checked; d.pelv=$('#d_pelv').checked;
    d.rel_note=$('#d_rel_note').value.trim(); d.note=$('#d_note').value.trim();

    d.supp=$$('#suppToday input[type="checkbox"]').filter(c=>c.checked).map(c=>c.nextElementSibling.textContent);
    d.habits={};   // غير دوائي + مخصص
    allHabits().forEach(h=>{ d.habits[h.id] = $('#hab_'+h.id)?.checked||false; });

    d.faith={};    // ديني
    for(const f of DEF_FAITH){ d.faith[f.id] = $('#chk_'+f.id)?.checked||false; }

    d.cog.pages=+$('#c_pages').value||0;
    d.cog.learn=+$('#c_learn').value||0;
    d.cog.summary=$('#c_summary').checked||false;

    d.social={};
    for(const s of DEF_SOCIAL){ d.social[s.id] = $('#chk_'+s.id)?.checked||false; }

    d.money.spend = +$('#m_spend').value||0;
    d.money.note  = $('#m_note').value.trim();

    return d;
  }

  function fillDay(d){
    $('#d_date').value=d.date;
    $('#d_steps').value=d.steps; $('#d_med').value=d.med; $('#d_tada').checked=d.tada;
    $('#d_anx').value=d.anx; $('#d_sleep').value=d.sleep; $('#d_ctrl').value=d.ctrl; $('#d_lat').value=d.lat;
    $('#d_rel').checked=d.rel; $('#d_pelv').checked=d.pelv;
    $('#d_rel_note').value=d.rel_note; $('#d_note').value=d.note;

    renderSuppCatalog();
    const pick=new Set(d.supp||[]);
    $$('#suppToday input[type="checkbox"]').forEach(c=>{ const nm=c.nextElementSibling.textContent; c.checked=pick.has(nm); });

    renderHabits('#habToday');
    allHabits().forEach(h=>{ const el=$('#hab_'+h.id); if(el) el.checked=!!d.habits[h.id]; });

    renderChecklist('#faithBox', DEF_FAITH);
    for(const f of DEF_FAITH){ const el=$('#chk_'+f.id); if(el) el.checked=!!d.faith[f.id]; }

    $('#c_pages').value=d.cog?.pages||0;
    $('#c_learn').value=d.cog?.learn||0;
    $('#c_summary').checked=!!(d.cog?.summary);

    renderChecklist('#socialBox', DEF_SOCIAL);
    for(const s of DEF_SOCIAL){ const el=$('#chk_'+s.id); if(el) el.checked=!!d.social[s.id]; }

    $('#m_spend').value=d.money?.spend||0;
    $('#m_note').value=d.money?.note||"";
  }

  function saveToday(){
    const d=gatherDay();
    upsertDay(d);
    alert('تم حفظ اليوم ✅');
    renderLog(); renderStats();
  }

  // ===== التقدم اليومي =====
  function updateProgress(){
    const d=gatherDay();
    let total=0, done=0;

    // عناصر محسوبة
    const fields=[d.steps>0, d.anx>0, d.sleep>0, d.ctrl>0, d.lat>0, !!d.rel, !!d.pelv, d.med!=='بدون', !!d.tada, d.supp.length>0];
    total += fields.length; done += fields.filter(Boolean).length;

    const habVals=Object.values(d.habits||{}); total += habVals.length; done += habVals.filter(Boolean).length;
    const faithVals=Object.values(d.faith||{}); total += faithVals.length; done += faithVals.filter(Boolean).length;
    const socVals=Object.values(d.social||{}); total += socVals.length; done += socVals.filter(Boolean).length;

    // معرفي
    total += 3;
    done += (d.cog.pages>0) + (d.cog.learn>0) + (d.cog.summary?1:0);

    // مالي
    total += 1; done += (d.money.spend>0?1:0);

    const pct = total? Math.round( (done/total)*100 ): 0;
    const bar = $('#dayProgress'); if(bar){ bar.style.width = pct+'%'; }
  }

  // ===== السجل =====
  function renderLog(){
    let arr=loadDays();
    const range=$('#logRange').value;
    if(range!=='all'){
      const n=+range;
      const min=new Date(Date.now()-n*86400000).toISOString().slice(0,10);
      arr=arr.filter(d=>d.date>=min);
    }
    const t=$('#logTable'); t.innerHTML='';
    const head=['التاريخ','قلق','نوم','تحكم','مدة(د)','علاقة','تادالافيل','دواء','مكملات','غير دوائي','ديني','معرفي','اجتماعي','مصاريف','ملاحظة'];
    t.insertAdjacentHTML('beforeend','<tr>'+head.map(h=>`<th>${h}</th>`).join('')+'</tr>');
    arr.forEach(d=>{
      const nonDrug = Object.entries(d.habits||{}).filter(([_,v])=>v).map(([k])=>labelById(allHabits(),k)).join(' / ');
      const faith   = Object.entries(d.faith||{}).filter(([_,v])=>v).map(([k])=>labelById(DEF_FAITH,k)).join(' / ');
      const social  = Object.entries(d.social||{}).filter(([_,v])=>v).map(([k])=>labelById(DEF_SOCIAL,k)).join(' / ');
      const cog     = `ق:${d.cog?.pages||0}ص/ت:${d.cog?.learn||0}ق` + (d.cog?.summary?' +ملخص':'');
      const row=[
        d.date, d.anx, d.sleep, d.ctrl, d.lat,
        d.rel?'✓':'', d.tada?'✓':'', d.med,
        (d.supp||[]).join(' / '),
        nonDrug||'-', faith||'-', cog, (d.money?.spend||0), (d.note||'')
      ];
      t.insertAdjacentHTML('beforeend','<tr>'+row.map(x=>`<td>${escapeHTML(String(x))}</td>`).join('')+'</tr>');
    });
  }
  function labelById(list,id){ return (list.find(x=>x.id===id)?.label)||id; }

  function exportCSV(){
    const arr=loadDays();
    const cols=['date','anx','sleep','ctrl','lat','rel','tada','med','supp','habits','faith','c_pages','c_learn','c_summary','social','m_spend','m_note','note','rel_note','steps','pelv'];
    const header=cols.join(',');
    const lines=arr.map(d=>{
      const o={
        date:d.date, anx:d.anx, sleep:d.sleep, ctrl:d.ctrl, lat:d.lat,
        rel:d.rel, tada:d.tada, med:d.med,
        supp:(d.supp||[]).join('|'),
        habits:Object.entries(d.habits||{}).filter(([_,v])=>v).map(([k])=>k).join('|'),
        faith:Object.entries(d.faith||{}).filter(([_,v])=>v).map(([k])=>k).join('|'),
        c_pages:d.cog?.pages||0, c_learn:d.cog?.learn||0, c_summary:!!(d.cog?.summary),
        social:Object.entries(d.social||{}).filter(([_,v])=>v).map(([k])=>k).join('|'),
        m_spend:d.money?.spend||0, m_note:d.money?.note||'',
        note:d.note||'', rel_note:d.rel_note||'', steps:d.steps||0, pelv:d.pelv||false
      };
      return cols.map(k=>JSON.stringify(o[k]??'')).join(',');
    });
    const csv=[header].concat(lines).join('\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='pe_log.csv'; a.click();
  }

  // ===== إحصائيات =====
  function avg(nums){ if(!nums.length) return 0; return +(nums.reduce((a,b)=>a+b,0)/nums.length).toFixed(2); }
  function bestStreak(arr, ok){ let best=0,cur=0; for(const d of arr){ if(ok(d)){cur++; if(cur>best) best=cur;} else cur=0; } return best; }

  function renderStats(){
    const all=loadDays();
    const last30=all.slice(0,30);
    const k=$('#kpis'); k.innerHTML='';
    const aA=avg(last30.map(d=>+d.anx||0));
    const aS=avg(last30.map(d=>+d.sleep||0));
    const aC=avg(last30.map(d=>+d.ctrl||0));
    const relDays=last30.filter(d=>d.rel).length;
    const spend7=avg(all.slice(0,7).map(d=>+d.money?.spend||0));
    const spend30=avg(last30.map(d=>+d.money?.spend||0));

    const suppStreak = bestStreak(last30.slice().reverse(), d=>(d.supp||[]).length>0);
    const habitStreak= bestStreak(last30.slice().reverse(), d=>Object.values(d.habits||{}).some(Boolean));
    const faithStreak= bestStreak(last30.slice().reverse(), d=>Object.values(d.faith||{}).some(Boolean));
    const socialStreak=bestStreak(last30.slice().reverse(), d=>Object.values(d.social||{}).some(Boolean));

    const items=[
      [`متوسط القلق (30ي)`, aA],
      [`النوم (30ي)`, aS],
      [`التحكم (30ي)`, aC],
      [`أيام العلاقة (30ي)`, relDays],
      [`متوسط إنفاق 7ي`, spend7+' ج'],
      [`متوسط إنفاق 30ي`, spend30+' ج'],
      [`سلسلة مكملات`, suppStreak],
      [`سلسلة غير دوائي`, habitStreak],
      [`سلسلة ديني`, faithStreak],
      [`سلسلة اجتماعي`, socialStreak],
    ];
    items.forEach(([t,v])=>{ const span=document.createElement('span'); span.className='kpi'; span.textContent=`${t}: ${v}`; k.appendChild(span); });

    // ترند القلق بسيط
    const cvs=$('#trend'); const ctx=cvs.getContext('2d'); ctx.clearRect(0,0,cvs.width,cvs.height);
    const arr=all.slice(0,30).reverse(); if(!arr.length) return;
    const w=cvs.width,h=cvs.height,L=arr.length;
    const xs=arr.map((_,i)=>(w/(L-1))*i), ys=arr.map(d=> h - ((d.anx||0)/10)*h );
    ctx.lineWidth=2; ctx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--acc').trim()||'#22d3ee';
    ctx.beginPath();
    xs.forEach((x,i)=>{ const y=ys[i]; if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.stroke();
  }

  // ===== ملاحظات =====
  function renderNotes(){
    const box=$('#noteList'); box.innerHTML='';
    const arr=loadNotes();
    if(!arr.length){ box.innerHTML='<div class="small">لا توجد ملاحظات بعد.</div>'; return; }
    arr.forEach((n,i)=>{
      const div=document.createElement('div'); div.className='card';
      const date=new Date(n.ts).toLocaleString();
      div.innerHTML=`<div class="row" style="justify-content:space-between">
        <div><b>${escapeHTML(n.text)}</b><div class="small">${escapeHTML(n.tags||'')}</div></div>
        <div class="small">${date}</div></div>`;
      const del=document.createElement('button'); del.className='btn bad'; del.textContent='حذف';
      del.onclick=()=>{ const all=loadNotes(); all.splice(i,1); saveNotes(all); renderNotes(); };
      div.appendChild(del); box.appendChild(div);
    });
  }

  // ===== PIN =====
  async function sha256(text){
    const enc=new TextEncoder().encode(text);
    const buf=await crypto.subtle.digest('SHA-256',enc);
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }
  function setupPIN(){
    const modal=$('#pinModal'), msg=$('#pinMsg');
    const show=()=>modal.classList.remove('hidden');
    const hide=()=>{ modal.classList.add('hidden'); msg.textContent=''; $('#pinOpen').value=''; $('#pinNew').value=''; };

    $('#pinBtn').onclick=show; $('#pinClose').onclick=hide;

    $('#pinSave').onclick=async ()=>{
      const np=$('#pinNew').value.trim(); if(!np){ msg.textContent='أدخل رقمًا جديدًا (حتى 8 أرقام)'; return; }
      const h=await sha256(np); writeLS(LS_PIN,h); msg.textContent='تم الحفظ ✅'; setTimeout(hide,500);
    };
    $('#pinEnter').onclick=async ()=>{
      const saved = readLS(LS_PIN,null);
      if(!saved){ msg.textContent='لا يوجد PIN محفوظ — يمكنك تعيين واحد جديد.'; return; }
      const cur=$('#pinOpen').value.trim(); const ok = (await sha256(cur))===saved;
      if(ok){ hide(); } else { msg.textContent='الرمز الحالي غير صحيح'; }
    };
    if(readLS(LS_PIN,null)){ show(); }
    global.addEventListener('visibilitychange',()=>{ if(document.hidden && readLS(LS_PIN,null)) show(); });
  }

  function setupAutoLock(){
    let timer=null;
    const reset=()=>{
      if(timer) clearTimeout(timer);
      // قفل بعد 90 ثانية خمول (لو PIN مُفعّل)
      timer=setTimeout(()=>{
        if(readLS(LS_PIN,null)){ const m=$('#pinModal'); if(m) m.classList.remove('hidden'); }
      }, 90000);
    };
    ['click','keydown','touchstart','scroll'].forEach(ev=>document.addEventListener(ev, reset, {passive:true}));
    reset();
  }

  // كشف عام
  global.PE = { init: PE.init };

})(window);
