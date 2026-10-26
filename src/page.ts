// The downloader page, served by the Worker with the Turnstile site key
// injected. Clean, ink-palette, no framework. The browser downloads bytes
// same-origin from this Worker (/dl), so there is no CORS and a real Save-As.

export function renderPage(siteKey: string): string {
  return `<!doctype html>
<html lang="en" data-theme="auto">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Instagram Downloader</title>
<meta name="description" content="Download public Instagram videos, reels, photos, carousels and stories by link." />
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
<style>
:root{--bg:#fbfbfa;--ink:#1a1a1a;--muted:#6b6b6b;--line:#e6e6e3;--card:#fff;--accent:#1a1a1a;--pp:#4f46e5;--pp2:#4338ca}
@media (prefers-color-scheme:dark){:root{--bg:#121212;--ink:#f2f2f0;--muted:#9a9a9a;--line:#2a2a2a;--card:#1b1b1b;--accent:#f2f2f0;--pp:#6366f1;--pp2:#818cf8}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 ui-sans-serif,-apple-system,"Mona Sans",Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased;min-height:100dvh;display:flex;flex-direction:column}
main{max-width:640px;width:100%;margin:auto;padding:40px 16px 56px;text-align:center}
h1{font-size:1.9rem;font-weight:650;letter-spacing:-.02em;margin:0 0 8px}
.sub{color:var(--muted);margin:0 0 28px}
form{display:flex;flex-direction:column;gap:14px}
.bar{display:flex;align-items:stretch;border:1px solid var(--line);border-radius:12px;background:var(--card);transition:border-color .15s}
.bar:focus-within{border-color:var(--pp)}
.bar input{flex:1;min-width:0;border:0;background:transparent;color:var(--ink);padding:15px 8px 15px 16px;font-size:1rem;text-align:left;border-radius:12px}
.bar input:focus{outline:none}
.bar button{flex:none;margin:6px;width:50px;display:flex;align-items:center;justify-content:center;border:0;border-radius:9px;background:var(--accent);color:var(--bg);cursor:pointer;transition:opacity .15s}
.bar button:hover{opacity:.86}
.bar button:disabled{opacity:.5;cursor:default}
.bar button svg{width:21px;height:21px}
.note{color:var(--muted);font-size:.85rem;margin-top:14px}
.cf-turnstile{display:flex;justify-content:center}
.cf-turnstile:empty{display:none}
.msg{margin-top:20px;padding:14px 16px;border:1px solid var(--line);border-radius:10px;background:var(--card)}
.zip{display:inline-flex;align-items:center;gap:9px;margin:24px auto 0;padding:12px 20px;border-radius:10px;background:var(--pp);color:#fff;text-decoration:none;font-weight:600;transition:background .15s}
.zip:hover{background:var(--pp2)}
.zip svg{width:18px;height:18px}
.grid{margin-top:18px;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
.single{max-width:440px;margin:24px auto 0}
.tile{position:relative;aspect-ratio:1;border-radius:14px;overflow:hidden;background:var(--line);border:1px solid var(--line);cursor:zoom-in}
.single .tile{aspect-ratio:auto}
.tile img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .3s ease}
.single .tile img{height:auto}
.tile:hover img{transform:scale(1.045)}
.tile:focus-visible{outline:2px solid var(--pp);outline-offset:2px}
.tile .ph{width:100%;height:100%;min-height:150px;background:var(--line)}
.tile .dl{position:absolute;top:9px;right:9px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;border-radius:9px;background:var(--pp);color:#fff;text-decoration:none;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:background .15s}
.tile .dl:hover{background:var(--pp2)}
.tile .dl svg{width:18px;height:18px}
.tile .tag{position:absolute;left:10px;bottom:10px;display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:8px;background:rgba(18,18,18,.62);color:#fff;font-size:.74rem;font-weight:600;backdrop-filter:blur(6px);pointer-events:none}
.lb{position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;padding:22px;background:rgba(8,8,10,.9);backdrop-filter:blur(4px)}
.lb[hidden]{display:none}
.lb-inner{display:flex}
.lb img,.lb video{max-width:94vw;max-height:88vh;width:auto;height:auto;border-radius:12px;display:block;background:#000}
.lb .x{position:absolute;top:16px;right:18px;width:40px;height:40px;padding:0;border-radius:50%;background:rgba(255,255,255,.14);color:#fff;border:0;font-size:22px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s;z-index:2}
.lb .x:hover{background:rgba(255,255,255,.28)}
.lb .nav{position:absolute;top:50%;transform:translateY(-50%);width:46px;height:46px;padding:0;border:0;border-radius:50%;background:rgba(255,255,255,.14);color:#fff;font-size:30px;line-height:1;cursor:pointer;display:none;align-items:center;justify-content:center;transition:background .15s;z-index:2}
.lb.multi .nav{display:flex}
.lb .nav:hover{background:rgba(255,255,255,.28)}
.lb .prev{left:16px}
.lb .next{right:16px}
.lb .count{position:absolute;top:20px;left:50%;transform:translateX(-50%);color:#fff;font-size:.82rem;font-weight:600;background:rgba(0,0,0,.45);padding:5px 13px;border-radius:999px;display:none;z-index:2}
.lb.multi .count{display:block}
.spin{display:inline-block;width:16px;height:16px;border:2px solid var(--line);border-top-color:var(--accent);border-radius:50%;animation:s .7s linear infinite;vertical-align:-3px}
@keyframes s{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.spin{animation:none}}
</style>
</head>
<body>
<main>
<h1>Instagram Downloader</h1>
<p class="sub">Paste a public post, reel, photo, carousel or story link.</p>
<form id="f">
<div class="bar">
<input id="url" type="url" required placeholder="https://www.instagram.com/reel/..." autocomplete="off" />
<button id="go" type="submit" aria-label="Download" title="Download"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M4 21h16"/></svg></button>
</div>
<div class="cf-turnstile" data-sitekey="${siteKey}" data-appearance="interaction-only"></div>
</form>
<div id="out"></div>
<p class="note">Public content only. Need bulk or no limits? <a href="https://herascrape.com">herascrape.com</a></p>
</main>
<div id="lb" class="lb" hidden><button class="x" type="button" aria-label="Close">&times;</button><button class="nav prev" type="button" aria-label="Previous">&#8249;</button><button class="nav next" type="button" aria-label="Next">&#8250;</button><div class="count" id="lbn"></div><div class="lb-inner" id="lbc"></div></div>
<script>
const f=document.getElementById('f'),out=document.getElementById('out'),go=document.getElementById('go');
let lastUrl='',gallery=[],lbi=0;
function msg(t){out.innerHTML='<div class="msg">'+t+'</div>';lastUrl=''}
function esc(s){return (s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
f.addEventListener('submit',async e=>{
  e.preventDefault();
  const url=document.getElementById('url').value.trim();
  if(!url){return}
  if(url===lastUrl){return}
  const token=window.turnstile&&window.turnstile.getResponse?window.turnstile.getResponse():'';
  if(!token){msg("Just a moment — verifying you're human. Try again in a second.");return}
  go.disabled=true;msg('<span class="spin"></span> Fetching…');
  try{
    const r=await fetch('/resolve',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({url,turnstile_token:token})});
    if(r.ok){render(await r.json());lastUrl=url;return}
    let detail='';
    try{detail=(await r.json()).detail||''}catch(_){}
    msg(esc(detail)||"Couldn't fetch that one. Check the link and try again.");
  }catch(_){msg('Something went wrong, try again.')}
  finally{go.disabled=false;if(window.turnstile)window.turnstile.reset()}
});
const DL='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M4 21h16"/></svg>';
function tile(x,i){
  const img=x.thumbnail_url?'<img src="'+esc(x.thumbnail_url)+'" alt="" loading="lazy" referrerpolicy="no-referrer" />':'<div class="ph"></div>';
  const tag=x.kind==='video'?'<span class="tag">&#9654; '+(x.duration_s?Math.round(x.duration_s)+'s':'Video')+'</span>':'';
  const t=encodeURIComponent(x.token);
  return '<div class="tile" role="button" tabindex="0" data-i="'+i+'" title="Click to open">'+img+tag+'<a class="dl" href="/dl?t='+t+'" title="Download" aria-label="Download">'+DL+'</a></div>';
}
function render(d){
  const a=d.assets||[];
  if(!a.length){msg('Nothing downloadable in that link.');return}
  gallery=a;
  let html='';
  if(a.length>1){
    const t=a.map(x=>encodeURIComponent(x.token)).join(',');
    html+='<a class="zip" href="/dl/zip?t='+t+'">'+DL+' Download all '+a.length+' as .zip</a>';
    html+='<div class="grid">'+a.map((x,i)=>tile(x,i)).join('')+'</div>';
  }else{
    html+='<div class="single">'+tile(a[0],0)+'</div>';
  }
  out.innerHTML=html;
}
const lb=document.getElementById('lb'),lbc=document.getElementById('lbc'),lbn=document.getElementById('lbn');
function showLb(){
  const x=gallery[lbi];if(!x)return;
  const src='/view?t='+encodeURIComponent(x.token);
  lbc.innerHTML=(x.kind==='video'?'<video src="'+src+'" controls autoplay playsinline></video>':'<img src="'+src+'" alt="" />');
  lbn.textContent=(lbi+1)+' / '+gallery.length;
}
function openLb(i){
  lbi=i;lb.classList.toggle('multi',gallery.length>1);
  lb.hidden=false;document.body.style.overflow='hidden';showLb();
}
function nav(n){if(gallery.length<2)return;lbi=(lbi+n+gallery.length)%gallery.length;showLb()}
function closeLb(){lb.hidden=true;lbc.innerHTML='';document.body.style.overflow=''}
out.addEventListener('click',e=>{
  if(e.target.closest('.dl'))return;
  const el=e.target.closest('.tile');
  if(el&&el.dataset.i!==undefined)openLb(+el.dataset.i);
});
out.addEventListener('keydown',e=>{
  if(e.key!=='Enter'&&e.key!==' ')return;
  const el=e.target.closest('.tile');
  if(el&&el.dataset.i!==undefined){e.preventDefault();openLb(+el.dataset.i)}
});
lb.querySelector('.prev').addEventListener('click',()=>nav(-1));
lb.querySelector('.next').addEventListener('click',()=>nav(1));
lb.addEventListener('click',e=>{if(e.target===lb||e.target.closest('.x'))closeLb()});
let _tx=0;
lbc.addEventListener('touchstart',e=>{_tx=e.touches[0].clientX},{passive:true});
lbc.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-_tx;if(Math.abs(dx)>45)nav(dx<0?1:-1)});
document.addEventListener('keydown',e=>{
  if(lb.hidden)return;
  if(e.key==='Escape')closeLb();
  else if(e.key==='ArrowLeft')nav(-1);
  else if(e.key==='ArrowRight')nav(1);
});
</script>
</body>
</html>`;
}
