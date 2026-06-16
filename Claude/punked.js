/* ============ PUNKED — interacciones (réplica fiel) ============ */
(function(){
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STAGE_W = 1281, STAGE_H = 3996;

  /* ---------- stage scaling ---------- */
  const scaler = document.getElementById('scaler');
  const wrap = document.getElementById('stagewrap');
  const H_REF = 760; // tallest single piece (so it fits the viewport height)
  function fit(){
    const wScale = window.innerWidth / STAGE_W;
    const hScale = (window.innerHeight * 0.9) / H_REF;
    const s = Math.min(wScale, hScale, 1.0);
    const w = STAGE_W * s;
    scaler.style.transform = 'scale(' + s + ')';
    scaler.style.left = Math.max(0,(window.innerWidth - w)/2) + 'px';
    wrap.style.height = (STAGE_H * s) + 'px';
  }
  fit();
  addEventListener('resize', fit, {passive:true});
  addEventListener('load', fit);

  /* ---------- custom cursor ---------- */
  const cur = document.getElementById('cursor');
  const lbl = document.getElementById('cursorlbl');
  let cx=innerWidth/2, cy=innerHeight/2, tx=cx, ty=cy;
  addEventListener('mousemove', e=>{ tx=e.clientX; ty=e.clientY; }, {passive:true});
  (function loop(){
    cx += (tx-cx)*0.24; cy += (ty-cy)*0.24;
    cur.style.transform = 'translate('+cx+'px,'+cy+'px) translate(-50%,-50%)';
    lbl.style.transform = 'translate('+tx+'px,'+(ty+2)+'px) translate(-50%,-50%)';
    requestAnimationFrame(loop);
  })();
  const hot = 'a,.zoom,.vbtn,.reelbox,.nav .links a,#lb .x';
  document.addEventListener('mouseover', e=>{
    if(e.target.closest(hot)) cur.classList.add('big');
    const z = e.target.closest('.zoom');
    if(z){ lbl.textContent='Ampliar'; lbl.style.opacity='1'; } else { lbl.style.opacity='0'; }
  });
  document.addEventListener('mouseout', e=>{ if(e.target.closest(hot)) cur.classList.remove('big'); });

  /* ---------- reveals (tiles visible by default; .pre hides for entrance) ---------- */
  const tilesEls = document.querySelectorAll('#stage .el');
  const rvEls = document.querySelectorAll('.rv2');
  if(reduce){
    rvEls.forEach(r=>r.classList.add('in'));
  } else {
    tilesEls.forEach(t=>t.classList.add('pre'));
    const io1 = new IntersectionObserver((ents)=>{
      ents.forEach(en=>{ if(en.isIntersecting){ en.target.classList.remove('pre'); io1.unobserve(en.target); } });
    }, {threshold:0.02, rootMargin:'0px 0px -5% 0px'});
    tilesEls.forEach(t=>io1.observe(t));
    const io2 = new IntersectionObserver((ents)=>{
      ents.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('in'); io2.unobserve(en.target); } });
    }, {threshold:0.12, rootMargin:'0px 0px -8% 0px'});
    rvEls.forEach(r=>io2.observe(r));
    // safety net: guarantee everything ends visible
    setTimeout(()=>{ tilesEls.forEach(t=>t.classList.remove('pre')); rvEls.forEach(r=>r.classList.add('in')); }, 1600);
  }

  /* ---------- tweaks API (driven by React panel) ---------- */
  const tiles = [...document.querySelectorAll('#stage .el')];
  // deterministic, stable per-tile base angle in [-1,1]
  function seeded(i){ const x = Math.sin((i+1)*127.1)*43758.5453; return (x - Math.floor(x))*2 - 1; }
  tiles.forEach((el,i)=>{ el._baseAngle = seeded(i); });
  const reelTile = document.getElementById('reel');

  window.PUNKED = {
    applyLayout(mode){
      const factor = mode==='caos' ? 7 : mode==='collage' ? 2.6 : 0;
      tiles.forEach((el)=>{
        let a = el._baseAngle * factor;
        if(el===reelTile) a *= 0.35;            // keep the video readable
        el.style.setProperty('--rot', a.toFixed(2)+'deg');
      });
      document.body.dataset.layout = mode;
    },
    applyMood(mood){
      document.body.classList.remove('mood-papel','mood-xerox','mood-neon');
      document.body.classList.add('mood-'+mood);
      // bump grain baseline in xerox
      window.PUNKED._mood = mood;
      window.PUNKED.applyGrain(window.PUNKED._grain ?? 18);
    },
    applyGrain(v){
      window.PUNKED._grain = v;
      const g = document.getElementById('grain');
      if(!g) return;
      const base = (window.PUNKED._mood==='xerox') ? 0.22 : 0;
      g.style.opacity = Math.min(0.9, base + (v/100)*0.55).toFixed(3);
    }
  };

  /* ---------- lightbox ---------- */
  const lb = document.getElementById('lb');
  const lbImg = lb.querySelector('.stageimg');
  const lbCap = lb.querySelector('.cap2');
  function openLB(src,cap){
    lbImg.src = src; lbImg.alt = cap||'';
    lbCap.textContent = cap||'';
    lb.classList.add('show');
    document.body.style.overflow='hidden';
  }
  function closeLB(){
    lb.classList.remove('show');
    document.body.style.overflow='';
    setTimeout(()=>{ if(!lb.classList.contains('show')) lbImg.src=''; }, 400);
  }
  document.querySelectorAll('.zoom').forEach(z=>{
    z.addEventListener('click', e=>{
      e.preventDefault();
      const src = z.getAttribute('data-src');
      const cap = z.getAttribute('data-cap') || '';
      if(src) openLB(src, cap);
    });
  });
  lb.addEventListener('click', e=>{ if(!e.target.closest('.stageimg')) closeLB(); });
  addEventListener('keydown', e=>{ if(e.key==='Escape') closeLB(); });

  /* ---------- reel video ---------- */
  const vid = document.getElementById('reelEl');
  const box = document.getElementById('reel');
  const btnSound = document.getElementById('btnSound');
  const btnFull = document.getElementById('btnFull');
  if(vid){
    const vobs = new IntersectionObserver((ents)=>{
      ents.forEach(en=>{
        if(en.isIntersecting){ vid.play().catch(()=>{}); box.classList.add('playing'); }
        else { vid.pause(); }
      });
    }, {threshold:0.25});
    vobs.observe(box);

    box.addEventListener('click', e=>{
      if(e.target.closest('.vbtn')) return;
      if(vid.paused){ vid.play().catch(()=>{}); box.classList.add('playing'); }
      else { vid.pause(); box.classList.remove('playing'); }
    });
    btnSound.addEventListener('click', ()=>{
      vid.muted = !vid.muted;
      btnSound.textContent = vid.muted ? 'Sonido' : 'Silenciar';
      if(!vid.muted){ vid.play().catch(()=>{}); box.classList.add('playing'); }
    });
    btnFull.addEventListener('click', ()=>{
      if(document.fullscreenElement){ document.exitFullscreen(); }
      else if(box.requestFullscreen){ box.requestFullscreen(); }
      else if(vid.webkitEnterFullscreen){ vid.webkitEnterFullscreen(); }
    });
  }

  /* ---------- nav hide on scroll ---------- */
  const nav = document.querySelector('.nav');
  let lastY = 0;
  addEventListener('scroll', ()=>{
    const y = scrollY;
    if(y > lastY && y > 160){ nav.style.transform='translateY(-100%)'; }
    else { nav.style.transform='translateY(0)'; }
    nav.style.transition='transform .4s cubic-bezier(.16,.84,.34,1)';
    lastY = y;
  }, {passive:true});

})();
