/* Level Up Academy — self-contained review tool (no external services) */
(function(){
'use strict';
var PAGE=document.body.getAttribute('data-review-name')||document.title;
var KEY='lua-review:'+location.pathname;
var TEXT_SEL='h1,h2,h3,h4,h5,h6,p,li,a,button,label,span,small,strong,em,blockquote,figcaption,td,th,dt,dd,summary,option,legend';
var state={edits:{},pins:[]};
try{var s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.edits)state=s;}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}updateCount();}
var mode='off';

var css=document.createElement('style');css.textContent=[
'#lr-bar{position:fixed;z-index:2147483000;left:50%;bottom:calc(10px + env(safe-area-inset-bottom));transform:translateX(-50%);display:flex;gap:4px;padding:5px;background:#1d2633;border-radius:999px;box-shadow:0 6px 24px rgba(0,0,0,.3);font:600 13px/1 -apple-system,system-ui,sans-serif;max-width:calc(100vw - 16px);box-sizing:border-box}',
'#lr-bar button{all:unset;cursor:pointer;color:#fff;padding:9px 11px;border-radius:999px;white-space:nowrap;min-height:20px;display:flex;align-items:center;-webkit-tap-highlight-color:transparent}',
'#lr-bar button.on{background:#F8EE4E;color:#1d2633}',
'#lr-bar button.send{background:#2f7de1}',
'#lr-bar .n{background:#e5484d;color:#fff;border-radius:9px;padding:2px 6px;margin-left:4px;font-size:11px}',
'@media(max-width:360px){#lr-bar{font-size:12px}#lr-bar button{padding:8px 8px}}',
'body.lr-edit [data-lr-ed]{outline:2px dashed #2f7de1;outline-offset:2px;cursor:text}',
'body.lr-edit [data-lr-ed]:focus{outline:2px solid #2f7de1;background:rgba(47,125,225,.06)}',
'[data-lr-changed]{background:rgba(248,238,78,.55)!important;box-shadow:0 0 0 2px #e0c400!important}',
'body.lr-comment,body.lr-comment *{cursor:pointer!important;-webkit-user-select:none;user-select:none}',
'.lr-pin{position:absolute;z-index:2147482000;width:26px;height:26px;margin:-26px 0 0 -13px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#e5484d;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);cursor:pointer!important}',
'.lr-pin b{display:block;transform:rotate(45deg);color:#fff;font:700 12px/22px system-ui,sans-serif;text-align:center}',
'#lr-banner{position:fixed;z-index:2147483000;top:calc(8px + env(safe-area-inset-top));left:50%;transform:translateX(-50%);background:#1d2633;color:#fff;font:500 13px/1.3 system-ui,sans-serif;padding:7px 12px;border-radius:8px;max-width:calc(100vw - 24px);box-sizing:border-box;text-align:center;pointer-events:none}',
'#lr-modal{position:fixed;inset:0;z-index:2147483600;background:rgba(10,15,25,.55);display:flex;align-items:flex-end;justify-content:center}',
'@media(min-width:640px){#lr-modal{align-items:center}}',
'#lr-modal .box{background:#fff;color:#1d2633;width:100%;max-width:560px;max-height:85vh;overflow:auto;border-radius:16px 16px 0 0;padding:16px;box-sizing:border-box;font:15px/1.4 system-ui,sans-serif}',
'@media(min-width:640px){#lr-modal .box{border-radius:16px}}',
'#lr-modal h3{margin:0 0 8px;font-size:17px}',
'#lr-modal textarea{width:100%;box-sizing:border-box;font:16px/1.4 system-ui,sans-serif;border:1px solid #c8cfd8;border-radius:8px;padding:8px;min-height:90px}',
'#lr-modal pre{white-space:pre-wrap;word-break:break-word;background:#f3f5f8;padding:10px;border-radius:8px;font:13px/1.45 ui-monospace,Menlo,monospace;max-height:45vh;overflow:auto}',
'#lr-modal .row{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}',
'#lr-modal .row button,#lr-modal .row a{all:unset;cursor:pointer;background:#245B8A;color:#fff;padding:10px 14px;border-radius:8px;font-weight:600;font-size:14px}',
'#lr-modal .row .sec{background:#e6eaf0;color:#1d2633}',
'#lr-modal .row .del{background:#e5484d}',
'body{padding-bottom:70px}'
].join('\n');document.head.appendChild(css);

/* disable forms */
document.addEventListener('submit',function(e){e.preventDefault();toast('Form sending is turned off in review mode.');},true);

/* candidate text elements: leaf-ish elements with own text */
function ownText(el){for(var n=el.firstChild;n;n=n.nextSibling)if(n.nodeType===3&&n.nodeValue.trim())return true;return false;}
var els=[].slice.call(document.querySelectorAll(TEXT_SEL)).filter(function(el){return !el.closest('#lr-bar,#lr-modal,script,style,select')&&ownText(el);});
els.forEach(function(el,i){el.setAttribute('data-lr-ed',i);el.__orig=el.innerText.trim();});
function sectionOf(el){var s=el.closest('section,header,footer,nav,main,[id]');var name='';
  if(s){var h=s.querySelector('h1,h2,h3');name=(h&&h.__orig)||s.id||s.tagName.toLowerCase();}
  return name.replace(/\s+/g,' ').slice(0,60)||'Page';}
function applyEdits(){Object.keys(state.edits).forEach(function(i){var el=document.querySelector('[data-lr-ed="'+i+'"]');if(el){el.innerText=state.edits[i].now;el.setAttribute('data-lr-changed','');}});}
applyEdits();
document.addEventListener('input',function(e){var el=e.target.closest&&e.target.closest('[data-lr-ed]');if(!el||mode!=='edit')return;
  var i=el.getAttribute('data-lr-ed'),now=el.innerText.trim();
  if(now===el.__orig){delete state.edits[i];el.removeAttribute('data-lr-changed');}
  else{state.edits[i]={section:sectionOf(el),orig:el.__orig,now:now};el.setAttribute('data-lr-changed','');}
  save();},true);
/* block navigation/clicks while editing or commenting */
document.addEventListener('click',function(e){
  if(e.target.closest('#lr-bar,#lr-modal'))return;
  if(e.target.closest('.lr-pin')){e.preventDefault();e.stopPropagation();openPin(+e.target.closest('.lr-pin').dataset.n);return;}
  if(mode==='edit'){var a=e.target.closest('a,button,summary,label');if(a){e.preventDefault();}}
  if(mode==='comment'){e.preventDefault();e.stopPropagation();if(Date.now()-lastTouchPin>800)addPin(e.pageX,e.pageY,e.target);}
},true);
/* touch: iOS may not fire click on plain text, so handle taps directly */
var ts=null,lastTouchPin=0;
document.addEventListener('touchstart',function(e){if(mode!=='comment'||e.touches.length!==1||e.target.closest('#lr-bar,#lr-modal,.lr-pin')){ts=null;return;}var t=e.touches[0];ts={x:t.pageX,y:t.pageY,t:Date.now()};},{passive:true,capture:true});
document.addEventListener('touchend',function(e){if(!ts||mode!=='comment')return;var t=e.changedTouches[0];
  if(Math.abs(t.pageX-ts.x)<10&&Math.abs(t.pageY-ts.y)<10&&Date.now()-ts.t<600){e.preventDefault();lastTouchPin=Date.now();var el=document.elementFromPoint(t.clientX,t.clientY);addPin(t.pageX,t.pageY,el);}ts=null;},{passive:false,capture:true});
function setEditable(on){els.forEach(function(el){if(on){el.setAttribute('contenteditable','true');el.setAttribute('spellcheck','true');}else el.removeAttribute('contenteditable');});}

/* pins */
var pinLayer=document.createElement('div');pinLayer.style.cssText='position:absolute;left:0;top:0;width:0;height:0;';document.body.appendChild(pinLayer);
function nearby(t){var el=t&&t.closest?t:null;while(el&&el!==document.body){var tx=(el.innerText||'').trim().replace(/\s+/g,' ');if(tx){return tx.slice(0,80)+(tx.length>80?'…':'');}el=el.parentElement;}return '(blank area)';}
function renderPins(){pinLayer.innerHTML='';var W=document.documentElement.clientWidth;state.pins.forEach(function(p){var d=document.createElement('div');d.className='lr-pin';d.dataset.n=p.n;
  var x=p.rx!=null?p.rx*W:p.x;x=Math.max(14,Math.min(W-14,x));d.style.left=x+'px';d.style.top=p.y+'px';d.innerHTML='<b>'+p.n+'</b>';d.title=p.note;pinLayer.appendChild(d);});updateCount();}
function addPin(x,y,t){var n=state.pins.reduce(function(m,p){return Math.max(m,p.n);},0)+1;var W=document.documentElement.clientWidth;
  var p={n:n,x:x,rx:x/W,y:y,near:nearby(t),section:t&&t.closest?sectionOf(t):'',note:''};
  modal('<h3>Pin '+n+' — your note</h3><div style="font-size:13px;color:#5a6472;margin-bottom:6px">Near: “'+esc(p.near)+'”</div><textarea id="lr-note" placeholder="What should change here?"></textarea><div class="row"><button id="lr-ok">Save pin</button><button class="sec" id="lr-cancel">Cancel</button></div>');
  var ta=document.getElementById('lr-note');setTimeout(function(){ta.focus();},50);
  document.getElementById('lr-ok').onclick=function(){p.note=ta.value.trim()||'(no note)';state.pins.push(p);save();renderPins();closeModal();};
  document.getElementById('lr-cancel').onclick=closeModal;}
function openPin(n){var p=state.pins.filter(function(q){return q.n===n;})[0];if(!p)return;
  modal('<h3>Pin '+n+'</h3><div style="font-size:13px;color:#5a6472;margin-bottom:6px">Near: “'+esc(p.near)+'”</div><textarea id="lr-note"></textarea><div class="row"><button id="lr-ok">Save</button><button class="del" id="lr-del">Delete pin</button><button class="sec" id="lr-cancel">Close</button></div>');
  var ta=document.getElementById('lr-note');ta.value=p.note;
  document.getElementById('lr-ok').onclick=function(){p.note=ta.value.trim()||'(no note)';save();renderPins();closeModal();};
  document.getElementById('lr-del').onclick=function(){state.pins=state.pins.filter(function(q){return q.n!==n;});save();renderPins();closeModal();};
  document.getElementById('lr-cancel').onclick=closeModal;}
var rt;window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(renderPins,150);});

/* summary */
function summary(){var L=[],ed=Object.keys(state.edits).map(function(k){return state.edits[k];});
  L.push('Level Up Academy — website feedback');L.push('Page: '+PAGE);L.push('Link: '+location.href.split('#')[0]);L.push('Date: '+new Date().toLocaleString());L.push('');
  L.push('TEXT CHANGES ('+ed.length+')');if(!ed.length)L.push('  none');
  ed.forEach(function(e,i){L.push('');L.push((i+1)+'. Section: '+e.section);L.push('   Was: "'+e.orig+'"');L.push('   Now: "'+e.now+'"');});
  L.push('');L.push('COMMENTS / PINS ('+state.pins.length+')');if(!state.pins.length)L.push('  none');
  state.pins.slice().sort(function(a,b){return a.n-b.n;}).forEach(function(p){L.push('');L.push('Pin '+p.n+(p.section?' — Section: '+p.section:''));L.push('   Near: "'+p.near+'"');L.push('   Note: '+p.note);});
  return L.join('\n');}
window.__lrSummary=summary;
function openSend(){var s=summary();
  modal('<h3>Send my changes</h3><div style="font-size:13px;color:#5a6472;margin-bottom:6px">Copy this and text/email it, or download the file.</div><pre id="lr-sum"></pre><div class="row"><button id="lr-copy">Copy</button><button id="lr-dl">Download .txt</button><a id="lr-mail" class="sec">Email</a><button class="sec" id="lr-cancel">Close</button></div>');
  document.getElementById('lr-sum').textContent=s;
  document.getElementById('lr-copy').onclick=function(){var b=this;copy(s,function(ok){b.textContent=ok?'Copied ✓':'Select & copy above';});};
  document.getElementById('lr-dl').onclick=function(){var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([s],{type:'text/plain'}));a.download='LevelUp-feedback-'+PAGE.replace(/[^a-z0-9]+/gi,'-')+'.txt';document.body.appendChild(a);a.click();setTimeout(function(){a.remove();},500);};
  var m=document.getElementById('lr-mail');m.href='mailto:?subject='+encodeURIComponent('Website feedback — '+PAGE)+'&body='+encodeURIComponent(s.slice(0,1800));
  document.getElementById('lr-cancel').onclick=closeModal;}
function copy(s,cb){if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(s).then(function(){cb(true);},function(){fallback();});}else fallback();
  function fallback(){var t=document.createElement('textarea');t.value=s;t.style.cssText='position:fixed;top:0;left:0;opacity:0;font-size:16px';document.body.appendChild(t);t.select();t.setSelectionRange(0,s.length);var ok=false;try{ok=document.execCommand('copy');}catch(e){}t.remove();cb(ok);}}

/* ui */
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function modal(h){closeModal();var m=document.createElement('div');m.id='lr-modal';m.innerHTML='<div class="box">'+h+'</div>';m.addEventListener('click',function(e){if(e.target===m)closeModal();});document.body.appendChild(m);}
function closeModal(){var m=document.getElementById('lr-modal');if(m)m.remove();}
var banner;function showBanner(t){if(!banner){banner=document.createElement('div');banner.id='lr-banner';document.body.appendChild(banner);}banner.textContent=t;banner.style.display=t?'block':'none';}
var tt;function toast(t){showBanner(t);clearTimeout(tt);tt=setTimeout(function(){setMode(mode);},2200);}
var bar=document.createElement('div');bar.id='lr-bar';
bar.innerHTML='<button data-m="edit">✏️ Edit</button><button data-m="comment">📍 Comment</button><button class="send" data-a="send">Send<span class="n" id="lr-n">0</span></button><button data-a="reset" title="Reset">↺</button>';
document.body.appendChild(bar);
bar.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;
  if(b.dataset.m)setMode(mode===b.dataset.m?'off':b.dataset.m);
  else if(b.dataset.a==='send')openSend();
  else if(b.dataset.a==='reset'){modal('<h3>Reset everything?</h3><p>This removes all your edits and pins on this page.</p><div class="row"><button class="del" id="lr-yes">Reset</button><button class="sec" id="lr-cancel">Cancel</button></div>');
    document.getElementById('lr-yes').onclick=function(){state={edits:{},pins:[]};save();location.reload();};document.getElementById('lr-cancel').onclick=closeModal;}});
function setMode(m){mode=m;document.body.classList.toggle('lr-edit',m==='edit');document.body.classList.toggle('lr-comment',m==='comment');setEditable(m==='edit');
  [].forEach.call(bar.querySelectorAll('[data-m]'),function(b){b.classList.toggle('on',b.dataset.m===m);});
  showBanner(m==='edit'?'Edit mode: tap any text and type':m==='comment'?'Comment mode: tap anywhere to drop a pin':'');}
function updateCount(){var c=document.getElementById('lr-n');if(c)c.textContent=Object.keys(state.edits).length+state.pins.length;}
renderPins();setMode('off');
})();
