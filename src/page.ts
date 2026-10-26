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
form{display:flex;flex-direction:column;gap:12px}
input[type=url]{width:100%;padding:14px 16px;font-size:1rem;border:1px solid var(--line);border-radius:10px;background:var(--card);color:var(--ink);text-align:left}
input[type=url]:focus{outline:2px solid var(--accent);outline-offset:1px}
button{padding:13px 18px;font-size:1rem;font-weight:600;border:0;border-radius:10px;background:var(--accent);color:var(--bg);cursor:pointer}
button:disabled{opacity:.5;cursor:default}
.note{color:var(--muted);font-size:.85rem;margin-top:14px}
.cf-turnstile{display:flex;justify-content:center}
.cf-turnstile:empty{display:none}
.msg{margin-top:20px;padding:14px 16px;border:1px solid var(--line);border-radius:10px;background:var(--card)}
.zip{display:inline-flex;align-items:center;gap:9px;margin:24px auto 0;padding:13px 22px;border-radius:12px;background:var(--pp);color:#fff;text-decoration:none;font-weight:650;box-shadow:0 8px 22px -8px var(--pp);transition:transform .12s,box-shadow .15s,background .15s}
.zip:hover{background:var(--pp2);transform:translateY(-1px);box-shadow:0 12px 28px -8px var(--pp)}
.zip:active{transform:translateY(0)}
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
.tile .dl{position:absolute;top:10px;right:10px;width:38px;height:38px;display:flex;align-items:center;justify-content:center;border-radius:11px;background:var(--pp);color:#fff;text-decoration:none;box-shadow:0 4px 14px -2px rgba(79,70,229,.55);transition:background .15s,transform .12s}
.tile .dl:hover{background:var(--pp2);transform:scale(1.08)}
.tile .dl:active{transform:scale(.9)}
.tile .dl svg{width:20px;height:20px}
.tile .tag{position:absolute;left:10px;bottom:10px;display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:8px;background:rgba(18,18,18,.62);color:#fff;font-size:.74rem;font-weight:600;backdrop-filter:blur(6px);pointer-events:none}
.lb{position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;padding:22px;background:rgba(8,8,10,.9);backdrop-filter:blur(4px)}
.lb[hidden]{display:none}
.lb-inner{position:relative;display:flex}
.lb img,.lb video{max-width:94vw;max-height:88vh;width:auto;height:auto;border-radius:12px;display:block;background:#000}
.lb .x{position:absolute;top:-14px;right:-14px;width:36px;height:36px;border-radius:50%;background:#fff;color:#111;border:0;font-size:22px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,.45)}
.lb .vdl{position:absolute;right:12px;bottom:12px;width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:12px;background:var(--pp);color:#fff;text-decoration:none;box-shadow:0 6px 18px -4px rgba(79,70,229,.6)}
.lb .vdl svg{width:22px;height:22px}
footer{margin-top:40px;color:var(--muted);font-size:.85rem}
footer a{color:var(--ink)}
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
<input id="url" type="url" required placeholder="https://www.instagram.com/reel/..." autocomplete="off" />
<div class="cf-turnstile" data-sitekey="${siteKey}" data-appearance="interaction-only"></div>
<button id="go" type="submit">Download</button>
</form>
<div id="out"></div>
<p class="note">Public content only. Need bulk or no limits? <a href="https://herascrape.com">herascrape.com</a></p>
<footer>A free tool by <a href="https://herascrape.com">herascrape</a>.</footer>
</main>
<div id="lb" class="lb" hidden><div class="lb-inner" id="lbc"></div></div>
<script>
const f=document.getElementById('f'),out=document.getElementById('out'),go=document.getElementById('go');
let lastUrl='';
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
function tile(x){
  const img=x.thumbnail_url?'<img src="'+esc(x.thumbnail_url)+'" alt="" loading="lazy" referrerpolicy="no-referrer" />':'<div class="ph"></div>';
  const tag=x.kind==='video'?'<span class="tag">&#9654; '+(x.duration_s?Math.round(x.duration_s)+'s':'Video')+'</span>':'';
  const t=encodeURIComponent(x.token);
  return '<div class="tile" role="button" tabindex="0" data-t="'+t+'" data-k="'+esc(x.kind)+'" title="Click to open">'+img+tag+'<a class="dl" href="/dl?t='+t+'" title="Download" aria-label="Download">'+DL+'</a></div>';
}
function render(d){
  const a=d.assets||[];
  if(!a.length){msg('Nothing downloadable in that link.');return}
  let html='';
  if(a.length>1){
    const t=a.map(x=>encodeURIComponent(x.token)).join(',');
    html+='<a class="zip" href="/dl/zip?t='+t+'">'+DL+' Download all '+a.length+' as .zip</a>';
    html+='<div class="grid">'+a.map(tile).join('')+'</div>';
  }else{
    html+='<div class="single">'+tile(a[0])+'</div>';
  }
  out.innerHTML=html;
}
const lb=document.getElementById('lb'),lbc=document.getElementById('lbc');
function openLb(t,kind){
  const src='/view?t='+t;
  lbc.innerHTML=(kind==='video'?'<video src="'+src+'" controls autoplay playsinline></video>':'<img src="'+src+'" alt="" />')
    +'<button class="x" type="button" aria-label="Close">&times;</button>'
    +'<a class="vdl" href="/dl?t='+t+'" title="Download" aria-label="Download">'+DL+'</a>';
  lb.hidden=false;document.body.style.overflow='hidden';
}
function closeLb(){lb.hidden=true;lbc.innerHTML='';document.body.style.overflow=''}
out.addEventListener('click',e=>{
  if(e.target.closest('.dl'))return;
  const el=e.target.closest('.tile');
  if(el&&el.dataset.t)openLb(el.dataset.t,el.dataset.k);
});
out.addEventListener('keydown',e=>{
  if(e.key!=='Enter'&&e.key!==' ')return;
  const el=e.target.closest('.tile');
  if(el&&el.dataset.t){e.preventDefault();openLb(el.dataset.t,el.dataset.k)}
});
lb.addEventListener('click',e=>{if(e.target===lb||e.target.closest('.x'))closeLb()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!lb.hidden)closeLb()});
</script>
</body>
</html>`;
}
