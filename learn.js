// ===== 샘플 불러오기: 같은 양식의 PDF 보고서 여러 개 → 고정 내용 유지 + 입력칸 자동 생성 =====
(function(){
const $=id=>document.getElementById(id),esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const FONT='"HY신명조","한컴바탕","함초롬바탕","Batang",serif';
let S=[],DOCS=[],R=null,V={},GN={},KEEP=new Set(),IMG={},RAST={},RASTN={},PE={},PX={},EDITM=false,BUF=null,saveT=null;window.LMODE=false;
const TYPES=[{id:"form",name:"거푸집 보고서"},{id:"pile",name:"항타기 보고서"},{id:"other",name:"기타 보고서"}];let SEL="",ST={};
const toastL=m=>window.toast?window.toast(m,6000):console.log(m);
window.addEventListener('error',e=>{try{window.toast('오류: '+(e.message||e.error),9000)}catch(x){}});window.addEventListener('unhandledrejection',e=>{try{window.toast('오류: '+((e.reason&&e.reason.message)||e.reason),9000)}catch(x){}});
const sleep=()=>new Promise(r=>setTimeout(r));
// ---- 화면 뼈대
const css=document.createElement("style");css.textContent=`
#ldlg{position:fixed;inset:0;background:#0007;z-index:98;display:none;align-items:center;justify-content:center;padding:10px}
#ldlg .bx{background:var(--pn);color:var(--tx);border:1px solid var(--bd);border-radius:10px;padding:16px 18px;width:min(760px,100%);max-height:92vh;overflow:auto;box-shadow:0 6px 24px #0006}
#ldlg h3{margin:0 0 6px}#ldlg p{margin:4px 0;font-size:13px}#ldlg .row{display:flex;gap:8px;justify-content:flex-end;margin-top:12px;flex-wrap:wrap}
#lprog{font-size:13px;color:var(--ac);min-height:18px;margin-top:8px;white-space:pre-line}
.lgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;margin-top:8px}
.lcard{border:1px solid var(--bd);border-radius:6px;padding:4px;font-size:12px;display:block;cursor:pointer}.lcard img{width:100%;display:block;border:1px solid var(--bd)}
#lpanel{width:360px;min-width:270px;overflow:auto;padding:10px;background:var(--pn);border-right:1px solid var(--bd);display:none}
#lview{flex:1;overflow:auto;padding:16px;display:none}
#lpanel label{display:block;font-size:12px;margin:8px 0 2px;opacity:.85}#lpanel small{opacity:.6}
#lpanel input[type=text],#lpanel textarea,#lpanel input[type=number]{width:100%;border:1px solid var(--bd);border-radius:5px;padding:5px;background:var(--bg);color:var(--tx);font:inherit}
#lpanel h4{margin:14px 0 4px;border-bottom:1px solid var(--bd);padding-bottom:3px}
.lalt{padding:8px 14px}.le[contenteditable]:hover{outline:1px dashed #7a9cc6}.le[contenteditable]:focus{outline:2px solid #1f4e8c66;background:#fffbe0}.lov[contenteditable]{cursor:text}.cv{content-visibility:auto;contain-intrinsic-size:auto 842pt 595pt}@media print{.cv{content-visibility:visible!important}}.lp{position:relative;background:#fff;color:#000;margin:0 auto 14px;box-shadow:0 1px 6px #0004;overflow:hidden;font-family:${FONT}}
.lp>img.ras{position:absolute;inset:0;width:100%;height:100%}.lmask{position:absolute;background:#fff}
.lov{position:absolute;white-space:pre-wrap;word-break:keep-all;color:#000;font-family:${FONT}}
.lstrip{position:absolute;left:0;right:0;background-repeat:no-repeat;background-size:100% auto}
.lgap{position:absolute;left:30pt;right:30pt;display:flex;align-items:center;justify-content:center;text-align:center;border:1px dashed #aaa;color:#999;font:12px sans-serif}
.lgap img{width:100%;height:100%;object-fit:contain}
#ldrop:hover{background:var(--bg)}.hxv{margin:0 0 6pt;white-space:pre-wrap;word-break:keep-all}.hxv.v{background:#fff6c8}
#tybar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:8px 12px;background:var(--pn);border-bottom:2px solid var(--ac)}#tybar b{font-size:13px;margin-right:4px}#tybar button{font-weight:700;padding:7px 14px}#tybar button.on{background:var(--ac);color:#fff;border-color:var(--ac)}#tybar button.has::after{content:' ●';color:#2e9e5b;font-size:10px}#tybar .gap{flex:1}#tybar button.alt{font-weight:400;opacity:.85}#lmb{display:none!important}@media(min-width:761px){main{height:calc(100vh - 140px)!important}}
@media print{#tybar{display:none!important}#lpanel,#ldlg{display:none!important}#lview{padding:0;overflow:visible}.lp{margin:0;box-shadow:none;page-break-after:always}.lgap.empty{display:none}}`;
document.head.appendChild(css);
document.body.insertAdjacentHTML("beforeend",`<div id="ldlg"><div class="bx"><h3>샘플 보고서 불러오기</h3><div id="lbody"></div><div id="lprog"></div><div class="row" id="lbtn"></div></div></div>`);
const main=document.querySelector("main");main.insertAdjacentHTML("beforeend",`<div id="lpanel"></div><div id="lview"></div>`);
$("tabs").insertAdjacentHTML("afterend",'<div class="tabs" id="ltabs" style="display:none"></div>');
const hdr=document.querySelector("header");hdr.insertAdjacentHTML("afterend",`<div id="tybar"><b>보고서 종류 불러오기</b>${TYPES.map(t=>`<button data-t="${t.id}">${t.name}</button>`).join("")}<span class="gap"></span><button data-t="base" class="alt">기본 양식(예시)</button></div>`);hdr.insertAdjacentHTML("afterbegin",`<button id="lmb" style="display:none" onclick="lrnToggle()">학습한 양식 열기</button>`);
// ---- pdf.js
function loadScript(src){return new Promise((ok,no)=>{const s=document.createElement("script");s.src=src;s.onload=ok;s.onerror=()=>no(new Error(src+" 파일을 불러오지 못했습니다"));document.head.appendChild(s)})}
async function pdfReady(){if(!window.pdfjsLib)await loadScript("vendor/pdf.min.js");window.pdfjsLib.GlobalWorkerOptions.workerSrc="vendor/pdf.worker.min.js"}
const prog=m=>{$("lprog").textContent=m};
// ---- 1단계: 파일 선택
let FILES=[];
const kindOf=n=>{n=n.toLowerCase();return n.endsWith(".pdf")?"PDF":n.endsWith(".hwpx")?"한글(hwpx)":n.endsWith(".hwp")?"한글(hwp)":n.endsWith(".json")?"입력값":""};
function addFiles(list){for(const f of list){if(!kindOf(f.name))continue;if(FILES.some(x=>x.name==f.name&&x.size==f.size))continue;FILES.push(f)}renderList()}
function renderList(){const hw=FILES.filter(f=>/\.hwp$/i.test(f.name)).length,tot=FILES.reduce((a,f)=>a+f.size,0)/1048576;
 $("lfl").innerHTML=FILES.length?`<div style="margin-top:8px"><b>${FILES.length}개 선택됨</b> <small>(합계 ${tot.toFixed(0)}MB)</small> <button id="lclr">모두 지우기</button></div><div style="max-height:210px;overflow:auto;margin-top:6px;font-size:13px">${FILES.map((f,i)=>`<div style="display:flex;gap:6px;align-items:center;padding:2px 0;border-bottom:1px solid var(--bd)"><span style="font-size:11px;background:var(--bg);border:1px solid var(--bd);border-radius:4px;padding:0 4px;white-space:nowrap">${kindOf(f.name)}</span><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(f.name)}</span><small>${(f.size/1048576).toFixed(1)}MB</small><button data-rm="${i}">✕</button></div>`).join("")}</div>${hw?`<p style="color:#b00020">※ .hwp(옛 한글 형식) ${hw}개는 읽을 수 없어 제외됩니다. 한글에서 [파일 → 다른 이름으로 저장]으로 <b>.hwpx</b> 또는 <b>PDF</b>로 저장해서 올려주세요.</p>`:""}`:""}
const typeRadios=()=>`<div style="display:flex;gap:12px;flex-wrap:wrap;margin:8px 0;font-size:14px"><b>어떤 보고서의 샘플인가요?</b>${TYPES.map(t=>`<label style="display:flex;gap:4px;align-items:center"><input type="radio" name="lty" value="${t.id}"${t.id==(SEL&&SEL!="base"?SEL:"form")?" checked":""}>${t.name}</label>`).join("")}</div>`;
function lrnOpen0(){FILES=[];$("ldlg").style.display="flex";$("lbody").innerHTML=`<p><b>같은 양식의 샘플 보고서 5개 이상</b>을 올려주세요. <b>PDF</b> 또는 <b>한글(.hwpx)</b> 파일을 한 번에 <b>10개 이상</b>도 선택할 수 있고, 여러 번에 나눠 추가해도 됩니다.</p>${typeRadios()}<div id="ldrop" style="border:2px dashed var(--bd);border-radius:8px;padding:20px;text-align:center;cursor:pointer;margin-top:8px">여기에 파일을 끌어다 놓거나 눌러서 선택<br><small>Ctrl+A 로 폴더의 파일을 모두 선택할 수 있습니다</small></div><input type="file" id="lfi" multiple hidden accept=".pdf,.hwpx,.hwp,.json,application/pdf,application/json"><div id="lfl"></div><p style="font-size:12px;opacity:.8;margin-top:8px">※ PDF와 한글 파일은 섞지 말고 같은 형식끼리 올리세요. 저장해 둔 입력값 파일(.json)도 여기서 불러올 수 있습니다. 파일이 크고 많으면 몇 분 걸릴 수 있습니다.</p>`;
 $("lbtn").innerHTML=`<button id="lx">닫기</button><button id="lgo" style="background:var(--ac);color:#fff">분석 시작</button>`;prog("");
 $("lx").onclick=()=>$("ldlg").style.display="none";const dz=$("ldrop"),fi=$("lfi");dz.onclick=()=>fi.click();fi.onchange=()=>{addFiles(fi.files);fi.value=""};
 dz.ondragover=e=>{e.preventDefault();dz.style.background="var(--bg)"};dz.ondragleave=()=>dz.style.background="";dz.ondrop=e=>{e.preventDefault();dz.style.background="";addFiles(e.dataTransfer.files)};
 $("lfl").onclick=e=>{const r=e.target.dataset.rm;if(r!=null){FILES.splice(+r,1);renderList()}if(e.target.id=="lclr"){FILES=[];renderList()}};$("lgo").onclick=start};
window.lrnOpen=function(){try{lrnOpen0()}catch(e){console.error(e);window.toast('창을 열지 못했습니다: '+e.message,9000)}};
async function start(){const fs=FILES.filter(f=>!/\.hwp$/i.test(f.name));if(!fs.length)return prog("파일을 먼저 선택하세요.");
 const rb=document.querySelector("input[name=lty]:checked");if(rb&&rb.value!=SEL){slotSave();SEL=rb.value;slotLoad(rb.value);markBar()}
 const js=fs.filter(f=>/\.json$/i.test(f.name)),pdfs=fs.filter(f=>/\.pdf$/i.test(f.name)),hxs=fs.filter(f=>/\.hwpx$/i.test(f.name));
 if(js.length&&!pdfs.length&&!hxs.length){const t=await js[0].text();let o;try{o=JSON.parse(t)}catch(e){return prog("입력값 파일(.json)을 읽지 못했습니다.")}
  if(o.__lrn){if(!R&&!HR)return prog("학습한 양식 파일입니다. 먼저 같은 양식의 샘플 PDF를 분석해야 불러올 수 있습니다.");V=Object.assign(V,o.V||{});GN=o.GN||GN;enter();$("ldlg").style.display="none";return}
  const inp=$("lf"),dt=new DataTransfer();dt.items.add(js[0]);inp.files=dt.files;inp.dispatchEvent(new Event("change"));$("ldlg").style.display="none";return}
 if(pdfs.length&&hxs.length)return prog("PDF와 한글(hwpx) 파일이 섞여 있습니다. 같은 형식끼리만 분석할 수 있어요. (목록에서 ✕로 빼 주세요)");
 if(hxs.length){if(hxs.length<2)return prog("한글(hwpx) 샘플은 최소 2개가 필요합니다. (5개 이상 권장)");return startHx(hxs)}
 if(pdfs.length<2)return prog("샘플 PDF는 최소 2개가 필요합니다. (5개 이상 권장)");
 $("lgo").disabled=true;KIND="pdf";HR=null;
 try{await pdfReady();S=[];DOCS=[];GC.clear();
  for(const f of pdfs){const buf=await f.arrayBuffer(),doc=await pdfjsLib.getDocument({data:new Uint8Array(buf.slice(0))}).promise,pages=[];
   for(let i=1;i<=doc.numPages;i++){const p=await doc.getPage(i),vp=p.getViewport({scale:1}),tc=await p.getTextContent();pages.push({W:vp.width,H:vp.height,lines:LRN.lines(tc.items,vp.height)});if(i%4==0){prog("글자 읽는 중: "+f.name+" "+i+"/"+doc.numPages);await sleep()}}
   S.push({name:f.name.replace(/\.pdf$/i,""),pages});DOCS.push(doc);if(S.length==1)BUF=buf}
  prog("샘플끼리 비교하는 중…");await sleep();
  R=await LRN.analyze(S,prog,renderGray,{yield:sleep});
  if(!R.cand.length){prog("고정 양식을 찾지 못했습니다. 같은 양식의 보고서인지, 글자가 있는 PDF인지 확인하세요.");$("lgo").disabled=false;return}
  await review()}catch(e){console.error(e);prog("분석 중 오류: "+e.message);$("lgo").disabled=false}}
// ---- 쪽 그림(글자 영역 비교용 흑백 / 확인용 썸네일)
const GC=new Map();
async function canvasOf(si,pi,sc,docs){const p=await (docs||DOCS)[si].getPage(pi+1),vp=p.getViewport({scale:sc}),c=document.createElement("canvas");c.width=Math.ceil(vp.width);c.height=Math.ceil(vp.height);const g=c.getContext("2d",{willReadFrequently:true});g.fillStyle="#fff";g.fillRect(0,0,c.width,c.height);await p.render({canvasContext:g,viewport:vp}).promise;return c}
async function renderGray(si,pi,sc){const k=si+":"+pi+":"+sc;if(GC.has(k))return GC.get(k);const c=await canvasOf(si,pi,sc),d=c.getContext("2d").getImageData(0,0,c.width,c.height).data,a=new Uint8Array(c.width*c.height);for(let i=0;i<a.length;i++)a[i]=(d[i*4]*.3+d[i*4+1]*.59+d[i*4+2]*.11)|0;const r={g:a,w:c.width,h:c.height};if(GC.size>60)GC.delete(GC.keys().next().value);GC.set(k,r);return r}
// ---- 2단계: 고정 쪽 확인(잘못 분류된 쪽은 해제)
async function review(){prog("확인용 그림을 만드는 중…");const cards=[];
 for(const c of R.cand){const cv=await canvasOf(0,c.bi,.22);cards.push(`<label class="lcard"><img src="${cv.toDataURL("image/jpeg",.6)}"><input type="checkbox" data-k="${c.bi}" checked> p.${c.bi+1} ${esc(c.title)}<br><small>바뀌는 칸 ${c.slots.length}개${c.diff>0?" · 일부 샘플과 그림이 다름":""}</small></label>`)}
 $("lbody").innerHTML=`<p><b>분석 결과</b>: 샘플 ${R.N}개 · 고정 쪽 후보 ${R.cand.length}쪽 · 입력칸 ${R.fields.length}개 · 샘플 쪽수 ${R.total.join(" / ")}</p><p>아래 쪽은 <b>모든 샘플에서 같은 양식</b>으로 확인된 쪽입니다. 체크된 쪽은 <b>그대로 유지</b>되고, 글자가 다른 부분만 입력칸이 됩니다. <b>사진·도면·현장마다 내용이 완전히 다른 쪽이 섞여 있으면 체크를 해제</b>하세요(자료 쪽으로 처리됩니다).</p><div class="lgrid" id="lgrid">${cards.join("")}</div>`;
 $("lbtn").innerHTML=`<button id="la">전체 해제/선택</button><button id="lx">닫기</button><button id="lok" style="background:var(--ac);color:#fff">이 양식으로 사용</button>`;prog("");
 $("lx").onclick=()=>$("ldlg").style.display="none";let on=true;$("la").onclick=()=>{on=!on;document.querySelectorAll("#lgrid input").forEach(i=>i.checked=on)};
 $("lok").onclick=async()=>{KEEP=new Set([...document.querySelectorAll("#lgrid input:checked")].map(i=>+i.dataset.k));if(!KEEP.size)return prog("최소 1쪽은 선택하세요.");
  V={};R.fields.forEach(f=>V[f.id]=f.vals[0]);GN={};IMG={};PE={};PX={};$("lok").disabled=true;await rasters();enter();$("ldlg").style.display="none";persist();persistHeavy()}}
let PT=0,fixTry=0,FBv={},CURL=null;
async function rasters(tok){const out={},outN={},R0=R,K0=KEEP,D0=DOCS;let n=0;for(const c of R0.cand){if(!K0.has(c.bi))continue;if(tok!=null&&tok!==PT)return false;prog("고정 쪽을 그림으로 저장하는 중 "+(++n)+"/"+K0.size);const cv=await canvasOf(0,c.bi,1.7,D0);if(tok!=null&&tok!==PT)return false;out[c.bi]=cv.toDataURL("image/jpeg",.88);{const g=cv.getContext("2d");g.fillStyle="#fff";(c.lines||[]).forEach(l=>g.fillRect((l.x0-1.5)*1.7,(l.top-1)*1.7,(l.x1-l.x0+3)*1.7,(l.bot-l.top+2)*1.7));outN[c.bi]=cv.toDataURL("image/jpeg",.8)}await sleep()}if(tok!=null&&tok!==PT)return false;RAST=out;RASTN=outN;prog("");return true}
// ---- 학습한 양식 화면
async function fixMissing(){if(KIND!="pdf"||!R||!BUF||fixTry>2||!R.cand.some(c=>KEEP.has(c.bi)&&(!RAST[c.bi]||(c.lines&&!RASTN[c.bi]))))return;fixTry++;const tok=PT;try{const ok=await reopen(tok);if(ok&&tok===PT&&window.LMODE)drawView()}catch(e){console.warn(e)}}
function enter(){setTimeout(fixMissing,50);window.LMODE=true;["panel","view","tabs"].forEach(i=>{const e=$(i);if(e)e.style.display="none"});$("lpanel").style.display="block";$("lview").style.display="block";markBar();
 const nav=(KIND=="pdf"&&R&&R.nav&&R.nav.length>1)?R.nav:[],lt=$("ltabs");lt.style.display=nav.length?"flex":"none";lt.innerHTML=nav.map((n,i)=>`<button data-i="${i}"${i==0?' class="on"':""}>${esc(n.label)}</button>`).join("");ACT=0;drawPanel();drawView()}
window.lrnToggle=async function(){try{if(window.LMODE){window.LMODE=false;$("lpanel").style.display="none";$("lview").style.display="none";$("panel").style.display="";$("view").style.display="";$("tabs").style.display="";$("ltabs").style.display="none";$("lmb").textContent="학습한 양식 열기";return}
 if(!R&&!HR){$("lmb").style.display="none";window.toast("저장된 학습 양식이 없습니다. 위쪽 ‘샘플 불러오기’로 먼저 분석하세요.",7000);return}
 if(KIND=="pdf"&&!Object.keys(RAST).length){window.toast("양식을 여는 중입니다… (PDF 읽는 도구를 불러오는 데 몇 초 걸립니다)",30000);await reopen()}
 enter();window.toast("학습한 양식을 열었습니다",2500)}catch(e){console.error(e);window.toast("학습한 양식을 열지 못했습니다: "+e.message+"\n(‘샘플 불러오기’로 다시 분석해 주세요)",12000)}};
let ACT=0,lsync=false;const lockL=()=>{lsync=true;setTimeout(()=>lsync=false,350)};

$("lpanel").addEventListener("change",e=>{if(e.target.id!="lem")return;EDITM=e.target.checked;if(EDITM&&R&&R.cand.some(c=>KEEP.has(c.bi)&&!c.lines)){window.toast("이 양식은 예전 방식으로 만들어져 글자 편집을 쓸 수 없습니다. ‘샘플 다시 불러오기’로 다시 분석해 주세요.",8000)}drawView();persist()});
{const LV=$("lview");let pt0;
 LV.addEventListener("input",e=>{const t=e.target;if(!t.classList||!t.classList.contains("lov"))return;const txt=t.innerText.replace(/\u00a0/g," ").replace(/\n$/,"");
  if(t.dataset.of){V[t.dataset.of]=txt;document.querySelectorAll('[data-of="'+t.dataset.of+'"]').forEach(x=>{if(x!==t)x.textContent=txt});const inp=document.querySelector('#lpanel [data-f="'+t.dataset.of+'"]');if(inp)inp.value=txt}
  else if(t.dataset.k)PE[t.dataset.k]=txt;
  else if(t.dataset.px){const[bi,i]=t.dataset.px.split(":");if(PX[bi]&&PX[bi][i])PX[bi][i].t=txt}
  clearTimeout(pt0);pt0=setTimeout(persist,500)});
 LV.addEventListener("focusout",e=>{const t=e.target;if(t.dataset&&t.dataset.px&&!t.innerText.trim()){const[bi,i]=t.dataset.px.split(":");(PX[bi]||[]).splice(+i,1);drawView();persist()}});
 LV.addEventListener("dblclick",e=>{if(!EDITM)return;const pgEl=e.target.closest&&e.target.closest(".lp");if(!pgEl||!pgEl.dataset.bi||e.target.classList.contains("lov"))return;const bi=pgEl.dataset.bi,c=R.cand.find(x=>x.bi==+bi),r=pgEl.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*c.W,y=(e.clientY-r.top)/r.height*c.H;
  (PX[bi]=PX[bi]||[]).push({x:+x.toFixed(1),y:+(y-7).toFixed(1),s:11,t:"새 글자"});drawView();persist();const el=document.querySelector('[data-px="'+bi+":"+(PX[bi].length-1)+'"]');if(el){el.focus();document.execCommand&&document.execCommand("selectAll",false,null)}})}
const isLegacy=()=>!!(R&&R.cand&&R.cand.some(c=>!c.lines));
function fieldHtml(f){const ph=esc((f.vals.slice(1).find(x=>x)||"").slice(0,60)),v=esc(V[f.id]??"");return `<div class="lfl" data-t="${esc((f.label+" "+f.vals.join(" ")).toLowerCase())}"><label>${esc(f.label)} <small>(${f.uses}곳 반영)</small></label>${f.multi||(V[f.id]||"").length>40?`<textarea data-f="${f.id}" rows="${Math.min(8,Math.max(2,(V[f.id]||"").split("\n").length))}" placeholder="${ph}">${v}</textarea>`:`<input type="text" data-f="${f.id}" value="${v}" placeholder="${ph}">`}</div>`}
function drawPanel(){if(KIND=="hwpx")return hxPanel();lockL();const used=new Set();R.cand.filter(c=>KEEP.has(c.bi)).forEach(c=>{c.slots.forEach(s=>used.add(s.fid));(c.lines||[]).forEach(l=>{if(l.fid)used.add(l.fid)})});const FL=R.fields.filter(f=>used.has(f.id));
 const nav=R.nav&&R.nav.length>1?R.nav:[{label:"입력칸",bi:0}],secOf=bi=>{let s=0;nav.forEach((n,i)=>{if(n.bi<=bi)s=i});return s},secs=nav.map(n=>({label:n.label,f:[],g:[]}));
 FL.forEach(f=>secs[secOf(f.page)].f.push(f));const L=LRN.layout(R,KEEP,GN);L.out.filter(o=>o.k=="gap"&&(o.avg>0||(IMG[o.gi]||[]).length)).forEach(o=>secs[secOf(o.from+1)].g.push(o));
 let h=`${isLegacy()?`<div style="border:2px solid #b00020;background:#fff0f0;color:#7a0016;padding:8px 10px;border-radius:6px;font-size:13px;margin-bottom:8px"><b>이 양식은 예전 방식으로 분석되어 표지·목차가 빠져 있습니다.</b><br>같은 샘플을 한 번 더 불러오면 표지·목차까지 샘플 틀 그대로 나오고, 바뀌는 부분만 입력칸이 됩니다.</div>`:""}<p style="margin:0 0 8px"><button onclick="lrnOpen()">샘플 다시 불러오기</button></p><label style="display:flex;gap:6px;align-items:flex-start;font-size:13px;margin:0 0 8px;padding:6px 8px;border:1px solid var(--bd);border-radius:6px"><input type="checkbox" id="lem"${EDITM?" checked":""}><span><b>쪽 글자 직접 편집</b><br><small>글자를 눌러 고치고(수정), 지우면 삭제, 빈 곳을 두 번 누르면 글상자가 추가됩니다(삽입).</small></span></label><p style="font-size:13px"><b>학습한 양식</b><br>${esc(R.names[0])} 외 ${R.N-1}개 샘플<br>고정 쪽 ${KEEP.size}쪽 · 입력칸 ${FL.length}개</p><input type="text" id="lq" placeholder="입력칸 검색 (이름·내용)" style="margin-bottom:8px">`;
 if(ACT>=secs.length)ACT=0;
 secs.forEach((s,i)=>{const pg=s.g.reduce((a,o)=>a+o.n,0);const frontSec=!!(R.nav&&R.nav.length>1&&i==0),isCore=f=>!f.vs&&(frontSec||f.uses>1),core=s.f.filter(isCore),rest=s.f.filter(f=>!isCore(f)),fl=arr=>{let b="",last=-1;arr.forEach(f=>{if(f.page!=last){b+=`<div style="font-size:11px;opacity:.55;margin-top:8px">── 기준 보고서 p.${f.page+1} ──</div>`;last=f.page}b+=fieldHtml(f)});return b};let body=fl(core);if(rest.length)body+=`<details class="ldet" style="margin-top:10px;border-top:1px dashed var(--bd);padding-top:6px"><summary style="cursor:pointer;font-size:13px;font-weight:700;opacity:.85">상세 입력칸 (${rest.length}개)</summary>${fl(rest)}</details>`;
  if(s.g.length)body+=`<h4>자료 쪽 (사진·도면·계산서 등)</h4>`+s.g.map(o=>`<label>${o.from<0?"맨 앞":"p."+(o.from+1)+" 다음"} 자료 쪽 <small>(샘플 평균 ${o.avg}쪽)</small></label><input type="number" min="0" max="300" data-g="${o.gi}" value="${o.n}"><input type="file" accept="image/*" multiple data-gi="${o.gi}" style="margin-top:4px">`).join("");
  h+=`<details data-sec="${i}"${i==ACT?" open":""} style="border:1px solid var(--bd);border-radius:6px;margin-bottom:8px;padding:4px 8px"><summary style="font-weight:700;cursor:pointer">${esc(s.label)} <small>(입력칸 ${s.f.length}${pg?" · 자료 쪽 "+pg+"쪽":""})</small></summary>${body||'<p style="font-size:12px;opacity:.7">이 구역에는 바뀌는 입력칸이 없습니다.</p>'}</details>`});
 $("lpanel").innerHTML=h;const q=$("lq");q.oninput=()=>{const t=q.value.trim().toLowerCase();lockL();document.querySelectorAll("#lpanel details").forEach(d=>{let n=0;d.querySelectorAll(".lfl").forEach(e=>{const ok=!t||e.dataset.t.includes(t);e.style.display=ok?"":"none";if(ok)n++});if(t)d.open=n>0;else if(d.classList.contains("ldet"))d.open=false})}}
// 위쪽 메뉴 ↔ 입력 구역 ↔ 미리보기 연동
function outPos(bi){return outPosL(LRN.layout(R,KEEP,GN),bi)}
function lgo(i,scrollPanel){if(!R||!R.nav)return;ACT=i;lockL();const ds=[...document.querySelectorAll("#lpanel details[data-sec]")];ds.forEach((d,k)=>d.open=(k==i));
 document.querySelectorAll("#ltabs button").forEach((b,k)=>b.classList.toggle("on",k==i));const d=ds[i],p=$("lpanel");if(d&&scrollPanel)p.scrollTo({top:p.scrollTop+d.getBoundingClientRect().top-p.getBoundingClientRect().top-6,behavior:"smooth"});
 const el=$("lp"+outPos(R.nav[i].bi)),v=$("lview");if(el){const dy=el.getBoundingClientRect().top-v.getBoundingClientRect().top-8;v.scrollTo({top:v.scrollTop+dy,behavior:Math.abs(dy)>4000?"auto":"smooth"})}}
$("ltabs").addEventListener("click",e=>{const b=e.target.closest("button");if(b)lgo(+b.dataset.i,true)});
$("lpanel").addEventListener("toggle",e=>{const d=e.target;if(lsync||d.tagName!="DETAILS"||!d.open||d.dataset.sec==null)return;lgo(+d.dataset.sec,false)},true);
$("lpanel").addEventListener("input",e=>{const f=e.target.dataset.f,g=e.target.dataset.g;
 if(f){V[f]=e.target.value;document.querySelectorAll('[data-of="'+f+'"]').forEach(x=>x.textContent=e.target.value);persist()}
 else if(g!=null){GN[g]=Math.max(0,+e.target.value||0);drawView();persist()}});
$("lpanel").addEventListener("change",async e=>{const gi=e.target.dataset.gi;if(gi==null||!e.target.files.length)return;
 const rd=f=>new Promise(r=>{const x=new FileReader();x.onload=()=>r(x.result);x.readAsDataURL(f)});
 IMG[gi]=await Promise.all([...e.target.files].sort((a,b)=>a.name.localeCompare(b.name,"ko",{numeric:true})).map(rd));if((GN[gi]??0)<IMG[gi].length){GN[gi]=IMG[gi].length}drawPanel();drawView()});
function ov(s,c,edit){if(!edit&&FBv[s.fid]!==undefined&&V[s.fid]===FBv[s.fid])return"";if(s.dj){const w=s.x1-s.x0,hh=s.bot-s.top;return `<div class="lmask" style="left:${s.x0-1}pt;top:${s.top-.5}pt;width:${w+2}pt;height:${hh+1}pt"></div><div class="lov dj"${edit?' contenteditable="true" spellcheck="false"':""} data-of="${s.fid}" style="top:${s.top}pt;left:${s.x0}pt;width:${w}pt;font-size:${s.s}pt;line-height:${hh}pt;text-align:justify;text-align-last:justify;text-justify:inter-character;white-space:pre-wrap">${esc(V[s.fid]??"")}</div>`}const w=s.x1-s.x0,h=s.bot-s.top,lh=h/s.rows,bw=s.rows>1?w+4:Math.max(w+24,60);let pos;
 if(s.al=="center")pos=`left:${(s.x0+s.x1)/2-bw/2}pt;width:${bw}pt;text-align:center`;else if(s.al=="right")pos=`left:${s.x1-bw}pt;width:${bw}pt;text-align:right`;else pos=`left:${s.x0}pt;width:${Math.min(bw,c.W-s.x0-8)}pt`;
 return `<div class="lmask" style="left:${s.x0-1}pt;top:${s.top-.5}pt;width:${w+2}pt;height:${h+1}pt"></div><div class="lov"${edit?' contenteditable="true" spellcheck="false"':""} data-of="${s.fid}" style="top:${s.top}pt;${pos};font-size:${s.s}pt;line-height:${lh}pt">${esc(V[s.fid]??"")}</div>`}
function pnov(p,num,edit){if(!edit&&String(p.raw).replace(/\D/g,"")===String(num))return"";return `<div class="lmask" style="left:${p.x0-1}pt;top:${p.top-.5}pt;width:${p.x1-p.x0+2}pt;height:${p.bot-p.top+1}pt"></div><div class="lov" style="left:${p.x0-6}pt;top:${p.top}pt;width:${p.x1-p.x0+12}pt;text-align:center;font-size:${p.s}pt;line-height:${p.bot-p.top}pt">${esc(p.raw.replace(/\d+/,num))}</div>`}
const maskOf=l=>`<div class="lmask" style="left:${l.x0-1}pt;top:${l.top-.5}pt;width:${l.x1-l.x0+2}pt;height:${l.bot-l.top+1}pt"></div>`;
const lineOv=(l,t,k,edit,fid)=>{const w=l.x1-l.x0,lh=l.bot-l.top;let ls=0;if(l.v){const n0=Math.max(1,(l.t||"").length),n=Math.max(1,[...String(t)].length),p0=l.pt||l.s;let pp=p0;if(n>n0&&n>1)pp=Math.max(l.s*.45,Math.min(p0,(lh-l.s*.25-l.s)/(n-1)));ls=pp-l.s}
 return `<div class="lov le"${edit?' contenteditable="true" spellcheck="false"':""}${fid?` data-of="${fid}"`:""} data-k="${k}" style="left:${l.x0}pt;top:${l.top}pt;${l.v?`width:${w+2}pt;height:${lh}pt;writing-mode:vertical-rl;text-orientation:upright;letter-spacing:${ls.toFixed(2)}pt;line-height:${l.s}pt;overflow:visible;`:`min-width:${w}pt;line-height:${lh}pt;`}font-size:${l.s}pt;white-space:pre">${esc(t)}</div>`};
const boxOv=(b,bi,i,edit)=>`<div class="lov le bxn"${edit?' contenteditable="true" spellcheck="false"':""} data-px="${bi}:${i}" style="left:${b.x}pt;top:${b.y}pt;min-width:20pt;font-size:${b.s}pt;line-height:${(b.s*1.3).toFixed(1)}pt;white-space:pre">${esc(b.t)}</div>`;
function outPosL(L,bi){let r=-1,best=0;L.out.forEach((o,k)=>{if(o.k=="tpl"){if(o.c.bi==bi)r=o.at;if(o.c.bi<=bi)best=o.at}else{const nx=L.out.slice(k+1).find(x=>x.k=="tpl"),hi=nx?nx.c.bi:1e9;if(bi>o.from&&bi<hi&&o.n>0)r=o.at+Math.min(bi-o.from-1,o.n-1)}});return r>=0?r:best}
const newNum=n=>outPosL(CURL,n-1+R.offBase)+1+CURL.off;
const hfOf=c=>c.lines?(!c.live&&c.lines.some(l=>l.top<70)&&(c.lines.some(l=>l.bot>c.H-70)||c.pn.length>0)):c.hf;
function tplHTML(c,num,pg){const edit=EDITM,img=edit?(RASTN[c.bi]||RAST[c.bi]):RAST[c.bi];let h=`<div class="lp cv" id="lp${pg}" data-bi="${c.bi}" style="width:${c.W}pt;height:${c.H}pt">${img?`<img class="ras" decoding="async" src="${img}">`:""}`;
 h+=c.slots.map(s=>ov(s,c,edit)).join("")+c.pn.map(p=>pnov(p,num,edit)).join("");
 (c.lines||[]).forEach((l,li)=>{if(l.sl)return;const k=c.bi+":"+li,pe=PE[k];
  if(l.fid){const val=V[l.fid]??l.t;if(edit)h+=lineOv(l,val,k,true,l.fid);else if(val!==FBv[l.fid])h+=maskOf(l)+lineOv(l,val,k,false,l.fid);return}
  let t=pe!==undefined?pe:l.t,changed=pe!==undefined;
  if(l.num&&R.offBase!=null&&pe===undefined){const nn=newNum(l.num);if(nn!==l.num){t=String(nn);changed=true}}
  if(edit)h+=lineOv(l,t,k,true);else if(changed)h+=maskOf(l)+lineOv(l,t,k,false)});
 (PX[c.bi]||[]).forEach((b,i)=>{h+=boxOv(b,c.bi,i,edit)});return h+"</div>"}
function drawView(){if(KIND=="hwpx")return hxView();const L=LRN.layout(R,KEEP,GN),v=$("lview"),y=v.scrollTop,tpls=L.out.filter(o=>o.k=="tpl");let h="",pg=0;FBv={};R.fields.forEach(f=>FBv[f.id]=f.vals[0]);CURL=L;
 L.out.forEach(o=>{if(o.k=="tpl"){h+=tplHTML(o.c,o.at+1+L.off,pg);pg++}
  else for(let m=0;m<o.n;m++){const idx=o.at+m;let ref=[...tpls].reverse().find(t=>t.at<idx&&hfOf(t.c)&&(t.at%2)==(idx%2))||[...tpls].reverse().find(t=>t.at<idx&&hfOf(t.c)),c=ref&&ref.c,W=c?c.W:595.2,H=c?c.H:841.92,u=(IMG[o.gi]||[])[m];
   h+=`<div class="lp cv" id="lp${pg}" style="width:${W}pt;height:${H}pt">`;
   if(c){const bg=`background-image:url(${RAST[c.bi]||""})`;h+=`<div class="lstrip" style="top:0;height:72pt;${bg};background-position:0 0"></div><div class="lstrip" style="top:${H-70}pt;height:70pt;${bg};background-position:0 100%"></div>`+c.slots.filter(s=>s.bot<72||s.top>H-70).map(s=>ov(s,c)).join("")+c.pn.map(p=>pnov(p,idx+1+L.off)).join("")}
   h+=`<div class="lgap${u?"":" empty"}" style="top:80pt;bottom:78pt">${u?`<img src="${u}">`:(isLegacy()&&o.from<0?`<div style="padding:20px;line-height:1.7;color:#7a0016"><b style="font-size:15px">이 양식에는 표지·목차가 없습니다</b><br>예전 방식으로 분석된 양식입니다.<br>같은 샘플을 다시 불러오면 표지·목차가 샘플 틀 그대로 나옵니다.<br><button onclick="lrnOpen()" style="margin-top:10px;padding:8px 16px;background:var(--ac);color:#fff;font-weight:700">샘플 다시 불러오기</button></div>`:"")}</div></div>`;pg++}});
 v.innerHTML=h||"<p>표시할 쪽이 없습니다.</p>";v.scrollTop=y;window.__lpages=pg;const w=$("warn");if(w)w.textContent="학습한 양식 · 총 "+pg+"쪽 (고정 "+tpls.length+"쪽 + 자료 "+(pg-tpls.length)+"쪽) · 쪽번호는 샘플과 같은 방식으로 자동 계산"}
// ---- 저장 / 복원 / 버튼
window.lrnBtn=function(k){const L=KIND=="hwpx"?HR:R;if(!L){window.toast("먼저 이 보고서 종류의 샘플(5개 이상)을 ‘샘플 불러오기’로 분석하세요.",6000);return}
 if(k=="save"){window.saveFile((L.names[0]||"학습양식").slice(0,30)+"_학습양식_입력값.json",JSON.stringify({__lrn:1,names:L.names,V,GN},null,1));return}
 if(k=="reset"){window.ask("입력한 내용을 샘플(기준 보고서)의 내용으로 되돌릴까요?",()=>{V={};L.fields.forEach(f=>V[f.id]=f.vals[0]);GN={};IMG={};PE={};PX={};enter();persist();window.toast("복원했습니다")});return}
 if(k=="hwpx"&&KIND=="hwpx")return hxExport();
 if(KIND=="pdf"&&(k=="docx"||k=="hwpx"))return exportDocx(k);
 window.toast(KIND=="hwpx"?"한글 샘플로 만든 양식은 '한글파일(hwpx) 받기'로만 저장합니다.":"PDF 샘플로 만든 양식은 PDF 저장(오른쪽 위 ‘PDF 저장 / 인쇄’)만 지원합니다. 한글·워드 파일은 한글(hwpx) 샘플로 양식을 만들거나 기본 양식에서 받을 수 있습니다.",7000)};
// ---- 이 브라우저에 보관(다음에 다시 열 때 분석 생략)
const saveTs={};
function idbOpen(){return new Promise(res=>{try{const q=indexedDB.open(DBN(),1);q.onupgradeneeded=()=>q.result.createObjectStore("kv");q.onerror=()=>res(null);q.onsuccess=()=>res(q.result)}catch(e){res(null)}})}
async function idbPut(key,val){const db=await idbOpen();if(!db)return false;return new Promise(res=>{try{const tx=db.transaction("kv","readwrite");tx.objectStore("kv").put(val,key);tx.oncomplete=()=>res(true);tx.onerror=()=>res(false);tx.onabort=()=>res(false)}catch(e){res(false)}})}
async function idbGet(key){const db=await idbOpen();if(!db)return null;return new Promise(res=>{try{const g=db.transaction("kv").objectStore("kv").get(key);g.onsuccess=()=>res(g.result||null);g.onerror=()=>res(null)}catch(e){res(null)}})}
function persist(){if(SEL=="base"||(!R&&!HR))return;slotSave();const key="tpl_"+SEL,rec={kind:KIND,buf:KIND=="hwpx"?BUF:null,R,HR,V,GN,keep:[...KEEP],pe:PE,px:PX};clearTimeout(saveTs[key]);
 saveTs[key]=setTimeout(()=>{idbPut(key,rec).then(ok=>{if(!ok)console.warn("양식 저장 실패")})},700)}
function persistHeavy(){if(SEL=="base"||KIND!="pdf"||!R)return;const id=SEL,buf=BUF,ras=RAST,rn=RASTN;(async()=>{if(buf)await idbPut("buf_"+id,buf);if(ras&&Object.keys(ras).length)await idbPut("rast_"+id,ras);if(rn&&Object.keys(rn).length)await idbPut("rastn_"+id,rn)})()}
async function reopen(tok){const buf=BUF;await pdfReady();const d=[await pdfjsLib.getDocument({data:new Uint8Array(buf.slice(0))}).promise];if(tok!=null&&tok!==PT)return false;DOCS=d;GC.clear();return await rasters(tok)}
const mk=d=>({KIND:d.kind||"pdf",BUF:d.buf,R:d.R||null,HR:d.HR||null,V:d.V||{},GN:d.GN||{},KEEP:new Set(d.keep||[]),IMG:{},RAST:{},RASTN:{},PE:d.pe||{},PX:d.px||{},ACT:0});
function slotSave(){if(!SEL||SEL=="base")return;ST[SEL]={KIND,BUF,R,HR,V,GN,KEEP,IMG,RAST,RASTN,PE,PX,ACT}}
function slotLoad(id){const s=ST[id]||{};KIND=s.KIND||"pdf";BUF=s.BUF||null;R=s.R||null;HR=s.HR||null;V=s.V||{};GN=s.GN||{};KEEP=s.KEEP||new Set();IMG=s.IMG||{};RAST=s.RAST||{};RASTN=s.RASTN||{};PE=s.PE||{};PX=s.PX||{};ACT=s.ACT||0}
function markBar(){document.querySelectorAll("#tybar button").forEach(b=>{const id=b.dataset.t;b.classList.toggle("on",id==SEL);b.classList.toggle("has",id!="base"&&!!(id==SEL?(R||HR):(ST[id]&&(ST[id].R||ST[id].HR))))})}
function hideBase(){["panel","view","tabs"].forEach(i=>{const e=$(i);if(e)e.style.display="none"});$("lpanel").style.display="block";$("lview").style.display="block"}
function showBase(){window.LMODE=false;$("lpanel").style.display="none";$("lview").style.display="none";$("ltabs").style.display="none";["panel","view","tabs"].forEach(i=>{const e=$(i);if(e)e.style.display=""});const w=$("warn");try{view()}catch(e){}}
function emptyState(id){window.LMODE=true;hideBase();$("ltabs").style.display="none";const nm=TYPES.find(t=>t.id==id).name,pre=id=="other"?"":`<button class="lalt" onclick="lrnBase('${id}')">기본 양식(예시)으로 먼저 작성해 보기</button>`;
 $("lpanel").innerHTML=`<h3 style="margin-top:0">${nm}</h3><p style="font-size:13px">같은 양식의 샘플 보고서를 <b>5개 이상</b> 불러오면, 변하지 않는 틀·서식은 그대로 두고 바뀌는 내용만 입력칸으로 만들어 드립니다.</p><p style="font-size:13px">PDF 또는 한글(.hwpx) 파일을 한 번에 여러 개 선택할 수 있습니다.</p>`;
 $("lview").innerHTML=`<div class="lp" style="width:595pt;min-height:420pt;height:auto;padding:60pt 40pt;text-align:center;font-family:sans-serif"><h2 style="margin:0 0 10px">${nm}</h2><p style="font-size:15px;line-height:1.7">아직 불러온 샘플이 없습니다.<br><b>같은 양식의 샘플 보고서 5개 이상</b>을 불러오면<br>바뀌는 부분만 입력칸으로 자동 생성됩니다.</p><p style="margin:22px 0"><button onclick="lrnOpen()" style="font-size:16px;padding:12px 26px;background:var(--ac);color:#fff;font-weight:700">샘플 불러오기</button></p>${pre?`<p>${pre}</p><p style="font-size:12px;color:#888">기본 양식은 ‘흙막이 지보공’ 샘플로 만든 예시이며 이 종류에 맞게 고쳐 써야 합니다.</p>`:""}</div>`;
 const w=$("warn");if(w)w.textContent=nm+" · 샘플 대기 중";markBar()}
window.lrnBase=function(id){const key=id=="form"?"동바리":id=="pile"?"항타":null;try{if(key&&TPL[key]){F.type=key;F.part=TPL[key].label;draw()}}catch(e){}pick("base")};
async function pick(id){const tok=++PT;fixTry=0;slotSave();SEL=id;try{localStorage.setItem(NS("lrn_sel"),id)}catch(e){}
 if(id=="base"){slotLoad("__none__");showBase();markBar();return}
 slotLoad(id);if(!(R||HR)){emptyState(id);return}
 try{if(KIND=="pdf"&&!Object.keys(RAST).length){window.toast("저장된 양식을 여는 중입니다…",8000);const r=await idbGet("rast_"+id);if(tok!==PT)return;
   if(r&&Object.keys(r).length){RAST=r;const rn=await idbGet("rastn_"+id);if(tok!==PT)return;if(rn)RASTN=rn}else{if(!BUF){BUF=await idbGet("buf_"+id);if(tok!==PT)return}if(!BUF)throw new Error("저장된 원본이 없습니다");window.toast("고정 쪽 그림을 처음 만드는 중입니다… (이번 한 번만 오래 걸립니다)",60000);const ok=await reopen(tok);if(!ok||tok!==PT)return;persistHeavy()}}
  if(tok!==PT)return;enter();window.toast(TYPES.find(t=>t.id==id).name+" 양식을 열었습니다",2500)}catch(e){console.error(e);emptyState(id);window.toast("양식을 열지 못했습니다: "+e.message+" — 샘플을 다시 불러와 주세요.",12000)}}
window.lrnPick=pick;
function boot(){if(ST.__old){if(!ST.other)ST.other=ST.__old;delete ST.__old}markBar();let last="form";try{last=localStorage.getItem(NS("lrn_sel"))||"form"}catch(e){}if(last!="base"&&!TYPES.some(t=>t.id==last))last="form";pick(last)}
document.getElementById("tybar").addEventListener("click",e=>{const b=e.target.closest("button");if(b)pick(b.dataset.t)});
try{const q=indexedDB.open(DBN(),1);q.onupgradeneeded=()=>q.result.createObjectStore("kv");q.onerror=()=>boot();q.onsuccess=()=>{const st=q.result.transaction("kv").objectStore("kv");let left=TYPES.length+1;const fin=()=>{if(--left==0)boot()};
 TYPES.forEach(t=>{const g=st.get("tpl_"+t.id);g.onsuccess=()=>{const d=g.result;if(d&&(d.R||d.HR))ST[t.id]=mk(d);fin()};g.onerror=fin});
 const g0=st.get("tpl");g0.onsuccess=()=>{const d=g0.result;if(d&&(d.R||d.HR))ST.__old=mk(d);fin()};g0.onerror=fin}}catch(e){setTimeout(boot,0)}
// ---- 한글(hwpx) 샘플: 문단을 비교해 고정 문단은 그대로, 바뀌는 문단만 입력칸 → 결과는 샘플 hwpx 파일 자체를 고쳐 저장
let KIND="pdf",HR=null;
const ptext=t=>{let s="";t.childNodes.forEach(n=>{if(n.nodeType==3)s+=n.data;else if(n.localName=="lineBreak")s+="\n";else if(n.localName=="tab")s+="\t"});return s};
async function hxParse(zip){const names=Object.keys(zip.files).filter(n=>/^Contents\/section\d+\.xml$/i.test(n)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})),secs=[],paras=[];
 for(const n of names){const doc=new DOMParser().parseFromString(await zip.file(n).async("string"),"application/xml");if(doc.getElementsByTagName("parsererror").length)throw new Error(n+" 해석 실패");secs.push({n,doc});
  for(const p of doc.getElementsByTagNameNS("*","p")){const ts=[];for(const r of p.children)if(r.localName=="run")for(const t of r.children)if(t.localName=="t")ts.push(t);paras.push({p,ts,doc,text:ts.map(ptext).join("")})}}
 return{secs,paras,ne:paras.map((q,i)=>i).filter(i=>paras[i].text.trim())}}
async function hxRead(f){const zip=await JSZip.loadAsync(await f.arrayBuffer());if(!zip.file("Contents/header.xml")&&!Object.keys(zip.files).some(n=>/^Contents\/section/i.test(n)))throw new Error(f.name+": 한글(hwpx) 문서가 아닙니다");const d=await hxParse(zip);d.name=f.name.replace(/\.hwpx$/i,"");return d}
function lcsMap(A,B){const n=A.length,m=B.length;if(n*m>8e7)throw new Error("문서가 너무 깁니다");const W=m+1,D=new Uint16Array((n+1)*W);
 for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)D[i*W+j]=A[i]===B[j]?D[(i+1)*W+j+1]+1:Math.max(D[(i+1)*W+j],D[i*W+j+1]);
 const mp=new Map();let i=0,j=0;while(i<n&&j<m){if(A[i]===B[j]){mp.set(i,j);i++;j++}else if(D[(i+1)*W+j]>=D[i*W+j+1])i++;else j++}return mp}
const TK=/[“”"'‘’「」【】()\[\]<>,.:;·]|[^\s“”"'‘’「」【】()\[\]<>,.:;·]+|\s+/g,isW=t=>/^\s+$/.test(t);
function splitPara(bt,others){const B=bt.match(TK)||[],ow=others.map(o=>(o.match(TK)||[]).filter(t=>!isW(t))),bw=[];B.forEach((t,i)=>{if(!isW(t))bw.push(i)});const BW=bw.map(i=>B[i]);
 const maps=ow.map(o=>lcsMap(BW,o)),need=Math.max(1,Math.ceil(.6*maps.length)),fx=BW.map((_,i)=>maps.filter(m=>m.has(i)).length>=need);
 if(fx.filter(Boolean).length<2||fx.every(Boolean))return null;const segs=[];let cur=0;
 for(let i=0;i<BW.length;){if(fx[i]){i++;continue}let j=i;while(j+1<BW.length&&!fx[j+1])j++;const a=bw[i],b=bw[j];if(a>cur)segs.push({s:B.slice(cur,a).join("")});
  const v=[B.slice(a,b+1).join("")];maps.forEach((m,k)=>{let p=-1,q=-1;for(let x=i-1;x>=0;x--)if(m.has(x)){p=m.get(x);break}for(let x=j+1;x<BW.length;x++)if(m.has(x)){q=m.get(x);break}v.push(ow[k].slice(p+1,q<0?ow[k].length:q).join(" "))});
  segs.push({v});cur=b+1;i=j+1}
 if(cur<B.length)segs.push({s:B.slice(cur).join("")});return segs}
function hxAnalyze(S){const nz=s=>s.ne.map(i=>LRN.nrm(s.paras[i].text)),base=S[0],A=nz(base),maps=S.slice(1).map(s=>lcsMap(A,nz(s))),need=Math.max(1,Math.ceil(.6*maps.length));
 const fixed=A.map((_,i)=>maps.filter(m=>m.has(i)).length>=need),fields=[],blocks=[],key=new Map();
 for(let i=0;i<A.length;){if(fixed[i]){i++;continue}let j=i;while(j+1<A.length&&!fixed[j+1])j++;
  const vals=[base.ne.slice(i,j+1).map(x=>base.paras[x].text).join("\n")];
  S.slice(1).forEach((s,k)=>{const m=maps[k];let p=-1,q=-1;for(let a=i-1;a>=0;a--)if(m.has(a)){p=m.get(a);break}for(let a=j+1;a<A.length;a++)if(m.has(a)){q=m.get(a);break}
   vals.push(s.ne.slice(p+1,q<0?s.ne.length:q).map(x=>s.paras[x].text).join("\n"))});
  let lab="";for(let a=i-1;a>=0&&a>i-6;a--)if(fixed[a]){const t=base.paras[base.ne[a]].text.trim();if(t.length<=24){lab=t.replace(/[:：]\s*$/,"");break}}
  if(j==i){const oth=vals.slice(1).filter(x=>x&&!x.includes("\n"));const sg=!vals[0].includes("\n")&&oth.length>=2?splitPara(vals[0],oth):null;
   if(sg){const out=[];sg.forEach(s=>{if(s.v){const k2=JSON.stringify(s.v.map(LRN.nrm));let f=key.get(k2);if(!f){f={id:"h"+fields.length,label:lab||("항목 "+(fields.length+1)),vals:s.v,multi:false,uses:0,page:i};key.set(k2,f);fields.push(f)}f.uses++;out.push({f:f.id})}else out.push({s:s.s})});blocks.push({idx:[base.ne[i]],segs:out});i=j+1;continue}}
  const kk=JSON.stringify(vals.map(LRN.nrm));let f=key.get(kk);if(!f){f={id:"h"+fields.length,label:lab||("항목 "+(fields.length+1)),vals,multi:j>i||vals[0].includes("\n"),uses:0,page:i};key.set(kk,f);fields.push(f)}
  f.uses++;blocks.push({fid:f.id,idx:base.ne.slice(i,j+1)});i=j+1}
 return{names:S.map(s=>s.name),fields,blocks,fixedN:fixed.filter(Boolean).length,total:A.length,N:S.length}}
async function startHx(fs){$("lgo").disabled=true;
 try{if(!window.JSZip)throw new Error("압축 도구(JSZip)를 불러오지 못했습니다");const SM=[];
  for(const f of fs){prog("한글 파일 읽는 중: "+f.name+" ("+(SM.length+1)+"/"+fs.length+")");SM.push(await hxRead(f));await sleep()}
  prog("샘플끼리 비교하는 중…");await sleep();HR=hxAnalyze(SM);BUF=await fs[0].arrayBuffer();KIND="hwpx";R=null;
  if(!HR.fields.length){prog("바뀌는 내용을 찾지 못했습니다. 서로 다른 현장의 보고서인지 확인하세요.");$("lgo").disabled=false;return}
  $("lbody").innerHTML=`<p><b>분석 결과 (한글 파일)</b>: 샘플 ${HR.N}개 · 문단 ${HR.total}개 중 <b>고정 ${HR.fixedN}개</b> · <b>바뀌는 입력칸 ${HR.fields.length}개</b></p><p>고정 문단은 샘플 한글 파일 그대로(서식·표·글꼴 100%) 유지되고, 입력칸에 쓴 내용만 바뀐 <b>한글(.hwpx) 파일</b>로 저장됩니다.</p><p style="font-size:12px;opacity:.8">※ 사진·그림은 첫 번째 샘플의 것이 그대로 남습니다. 한글에서 열어 교체하세요.</p>`;
  $("lbtn").innerHTML=`<button id="lx">닫기</button><button id="lok" style="background:var(--ac);color:#fff">이 양식으로 사용</button>`;prog("");
  $("lx").onclick=()=>$("ldlg").style.display="none";$("lok").onclick=()=>{V={};HR.fields.forEach(f=>V[f.id]=f.vals[0]);GN={};enter();$("ldlg").style.display="none";persist()}}
 catch(e){console.error(e);prog("분석 중 오류: "+e.message);$("lgo").disabled=false}}
function hxPanel(){let h=`<p style="margin:0 0 8px"><button onclick="lrnOpen()">샘플 다시 불러오기</button></p><p style="font-size:13px"><b>학습한 양식 (한글 파일)</b><br>${esc(HR.names[0])} 외 ${HR.N-1}개 샘플<br>입력칸 ${HR.fields.length}개</p><input type="text" id="lq" placeholder="입력칸 검색 (이름·내용)"><h4>입력칸</h4>`;
 HR.fields.forEach(f=>{const ph=esc((f.vals.slice(1).find(x=>x)||"").slice(0,60)),v=esc(V[f.id]??"");
  h+=`<div class="lfl" data-t="${esc((f.label+" "+f.vals.join(" ")).toLowerCase())}"><label>${esc(f.label)} <small>(${f.uses}곳 반영)</small></label>${f.multi||(V[f.id]||"").length>40?`<textarea data-f="${f.id}" rows="${Math.min(8,Math.max(2,(V[f.id]||"").split("\n").length))}" placeholder="${ph}">${v}</textarea>`:`<input type="text" data-f="${f.id}" value="${v}" placeholder="${ph}">`}</div>`});
 $("lpanel").innerHTML=h;const q=$("lq");q.oninput=()=>{const t=q.value.trim().toLowerCase();document.querySelectorAll("#lpanel .lfl").forEach(e=>e.style.display=!t||e.dataset.t.includes(t)?"":"none")}}
async function hxBase(){const zip=await JSZip.loadAsync(BUF.slice(0));return{zip,d:await hxParse(zip)}}
async function hxView(){const{d}=await hxBase(),first=new Map();HR.blocks.forEach(b=>{first.set(b.idx[0],b);b.idx.slice(1).forEach(i=>first.set(i,null))});let h="";
 d.ne.forEach(i=>{if(first.has(i)){const b=first.get(i);if(b&&b.segs)h+=`<div class="hxv">${b.segs.map(s=>s.f?`<mark class="v" data-of="${s.f}" style="background:#fff6c8">${esc(V[s.f]??"")}</mark>`:esc(s.s)).join("")}</div>`;else if(b)h+=`<div class="hxv v" data-of="${b.fid}">${esc(V[b.fid]??"")}</div>`}else h+=`<div class="hxv">${esc(d.paras[i].text)}</div>`});
 $("lview").innerHTML=`<div class="lp" style="width:595pt;height:auto;min-height:400pt;padding:36pt 40pt;font-size:11pt;line-height:1.7"><p style="font:12px sans-serif;color:#888;border-bottom:1px dashed #ccc;padding-bottom:6px">글 내용 미리보기 (쪽·서식은 한글 파일에서 샘플 그대로 유지됩니다)</p>${h}</div>`;
 const w=$("warn");if(w)w.textContent="학습한 양식(한글 파일) · 고정 문단 "+HR.fixedN+"개 + 입력칸 "+HR.fields.length+"개 · '한글파일(hwpx) 받기'로 저장"}
function hxSet(par,text){if(!par.ts.length)return;const t0=par.ts[0];while(t0.firstChild)t0.removeChild(t0.firstChild);const qn=t0.prefix?t0.prefix+":":"";
 text.split("\n").forEach((ln,i)=>{if(i)t0.appendChild(par.doc.createElementNS(t0.namespaceURI,qn+"lineBreak"));if(ln)t0.appendChild(par.doc.createTextNode(ln))});
 par.ts.slice(1).forEach(t=>{while(t.firstChild)t.removeChild(t.firstChild)});[...par.p.children].filter(c=>c.localName=="linesegarray").forEach(c=>par.p.removeChild(c))}
async function hxExport(){try{window.toast("한글 파일을 만드는 중입니다…",15000);const{zip,d}=await hxBase();
 HR.blocks.forEach(b=>{if(b.segs){hxSet(d.paras[b.idx[0]],b.segs.map(s=>s.f?(V[s.f]??""):s.s).join(""));return}const lines=String(V[b.fid]??"").split("\n"),m=b.idx.length;b.idx.forEach((pi,t)=>hxSet(d.paras[pi],t<m-1?(lines[t]??""):lines.slice(m-1).join("\n")))});
 const ser=new XMLSerializer();d.secs.forEach(s=>zip.file(s.n,'<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>'+ser.serializeToString(s.doc.documentElement)));
 zip.file("mimetype","application/hwp+zip",{compression:"STORE"});const u8=await zip.generateAsync({type:"uint8array",compression:"DEFLATE",mimeType:"application/hwp+zip"});
 await window.saveFile((HR.names[0]||"보고서").slice(0,30)+"_작성본.hwpx",u8)}catch(e){console.error(e);window.toast("저장 오류: "+e.message,8000)}}


// ---- 내 작성본: 로그인한 계정 안에 이름을 붙여 저장 / 다시 열기 / 삭제
document.body.insertAdjacentHTML("beforeend",`<div id="ddlg" style="position:fixed;inset:0;background:#0007;z-index:98;display:none;align-items:center;justify-content:center;padding:10px"><div style="background:var(--pn);color:var(--tx);border:1px solid var(--bd);border-radius:10px;padding:16px 18px;width:min(640px,100%);max-height:92vh;overflow:auto;box-shadow:0 6px 24px #0006"><h3 style="margin:0 0 4px">내 작성본</h3><p style="margin:0 0 8px;font-size:12px;opacity:.8" id="duser"></p><div style="display:flex;gap:6px;flex-wrap:wrap"><input id="dname" type="text" placeholder="저장할 이름 (예: 구례고 항타기 2차)" style="flex:1;min-width:200px;padding:7px;border:1px solid var(--bd);border-radius:6px;background:var(--bg);color:var(--tx)"><button id="dsave" style="background:var(--ac);color:#fff;font-weight:700">현재 내용 저장</button></div><div id="dmsg" style="font-size:13px;min-height:18px;margin:6px 0;color:var(--ac)"></div><div id="dlist" style="max-height:50vh;overflow:auto"></div><div style="display:flex;justify-content:flex-end;margin-top:10px"><button id="dclose">닫기</button></div></div></div>`);
const TN=id=>id=="base"?"기본 양식":(TYPES.find(t=>t.id==id)||{name:id}).name;
const dList=async()=>(await idbGet("drafts"))||[];
const dMsg=m=>{$("dmsg").textContent=m};
async function dRender(){const L=await dList();$("dlist").innerHTML=L.length?`<table style="width:100%;border-collapse:collapse;font-size:13px">${L.map(m=>`<tr style="border-top:1px solid var(--bd)"><td style="padding:6px 4px"><b>${esc(m.name)}</b><br><small style="opacity:.7">${esc(TN(m.mode))} · ${new Date(m.ts).toLocaleString("ko-KR")}</small></td><td style="text-align:right;white-space:nowrap"><button data-o="${m.id}">열기</button> <button data-x="${m.id}">삭제</button></td></tr>`).join("")}</table>`:`<p style="opacity:.7;font-size:13px">저장한 작성본이 없습니다.</p>`}
window.draftsOpen=async function(){$("ddlg").style.display="flex";$("duser").textContent=(window.UID?"계정: "+window.UID+" · ":"")+"지금 보이는 화면("+TN(SEL)+")의 입력 내용을 이름을 붙여 저장해 두고, 나중에 다시 열 수 있습니다. (첨부 이미지는 저장되지 않습니다)";
 const L=SEL=="base"?(window.F&&F.name)||"기본 양식":TN(SEL);$("dname").value=L+" "+new Date().toISOString().slice(2,10);dMsg("");await dRender()};
async function dSave(){const name=$("dname").value.trim();if(!name)return dMsg("저장할 이름을 입력하세요.");let data;
 if(SEL=="base")data={F:JSON.parse(JSON.stringify(F)),ED:JSON.parse(JSON.stringify(ED))};
 else{const L=KIND=="hwpx"?HR:R;if(!L)return dMsg("이 종류에는 아직 양식이 없습니다. 먼저 샘플을 불러와 양식을 만든 뒤 저장할 수 있습니다.");data={V:{...V},GN:{...GN},pe:{...PE},px:JSON.parse(JSON.stringify(PX)),sample:L.names[0]}}
 const list=await dList(),ex=list.find(x=>x.name==name&&x.mode==SEL),id=ex?ex.id:"d"+Date.now();
 if(!(await idbPut("draft:"+id,data)))return dMsg("저장하지 못했습니다. (브라우저 저장 공간을 쓸 수 없는 화면일 수 있습니다)");
 const nl=list.filter(x=>x.id!=id);nl.unshift({id,name,mode:SEL,ts:Date.now()});await idbPut("drafts",nl);dMsg(ex?"같은 이름의 작성본을 덮어썼습니다.":"저장했습니다.");await dRender()}
async function dOpen(id){const L=await dList(),m=L.find(x=>x.id==id);if(!m)return;const data=await idbGet("draft:"+id);if(!data)return dMsg("저장된 내용을 찾지 못했습니다.");
 if(m.mode=="base"){if(SEL!="base")await pick("base");F=Object.assign(def(),data.F||{});ED=data.ED||{};saveED();try{localStorage.setItem(NS("sr2"),JSON.stringify(F))}catch(e){}draw()}
 else{if(SEL!=m.mode)await pick(m.mode);const Lm=KIND=="hwpx"?HR:R;if(!Lm)return dMsg(TN(m.mode)+"에 양식이 없어 열 수 없습니다. 먼저 샘플을 불러오세요.");
  V=Object.assign({},V,data.V||{});GN=data.GN||{};PE=data.pe||{};PX=data.px||{};enter();persist();if(data.sample&&Lm.names[0]!==data.sample)window.toast("이 작성본은 다른 샘플로 만든 양식에서 저장한 것이라 일부 값이 맞지 않을 수 있습니다.",8000)}
 $("ddlg").style.display="none";window.toast("‘"+m.name+"’을(를) 열었습니다",3000)}
async function dDel(id){const L=await dList(),m=L.find(x=>x.id==id);if(!m)return;window.ask("‘"+m.name+"’ 작성본을 삭제할까요?",async()=>{await idbPut("drafts",L.filter(x=>x.id!=id));await idbPut("draft:"+id,null);await dRender();dMsg("삭제했습니다.")})}
$("dsave").onclick=dSave;$("dclose").onclick=()=>$("ddlg").style.display="none";
$("dlist").onclick=e=>{const o=e.target.dataset.o,x=e.target.dataset.x;if(o)dOpen(o);if(x)dDel(x)};
document.addEventListener("click",e=>{if(e.target&&e.target.id=="dbtn")window.draftsOpen()});


// ---- 한글·워드에서 직접 편집: 글자를 지운 쪽 그림 위에 글자 상자를 올린 편집용 워드(.docx) 파일
async function buildEditableDocx(){
 if(!window.JSZip)throw new Error("압축 도구(JSZip)를 불러오지 못했습니다");
 const L=LRN.layout(R,KEEP,GN);CURL=L;FBv={};R.fields.forEach(f=>FBv[f.id]=f.vals[0]);
 const zip=new JSZip(),rels=[],emu=v=>Math.round(v*12700),xe=s=>String(s??"").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),FONT=window.__DOCX_FONT||"바탕";
 let rid=0,did=100;const imgCache=new Map();
 const loadImg=u=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=u});
 const addImg=u=>{if(imgCache.has(u))return imgCache.get(u);const m=/^data:image\/(png|jpe?g|gif);base64,(.*)$/.exec(u);if(!m)return null;const ext=m[1]=="png"?"png":m[1]=="gif"?"gif":"jpeg",id="rIdI"+(++rid);zip.file("word/media/i"+rid+"."+(ext=="jpeg"?"jpg":ext),m[2],{base64:true});rels.push(`<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/i${rid}.${ext=="jpeg"?"jpg":ext}"/>`);imgCache.set(u,id);return id};
 const pic=(u,x,y,w,hh,behind)=>{const r=addImg(u);if(!r)return"";const id=++did;return `<w:r><w:drawing><wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="${id}" behindDoc="${behind?1:0}" locked="0" layoutInCell="1" allowOverlap="1"><wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="page"><wp:posOffset>${emu(x)}</wp:posOffset></wp:positionH><wp:positionV relativeFrom="page"><wp:posOffset>${emu(y)}</wp:posOffset></wp:positionV><wp:extent cx="${emu(w)}" cy="${emu(hh)}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapNone/><wp:docPr id="${id}" name="그림${id}"/><wp:cNvGraphicFramePr/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${id}" name="그림${id}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${r}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${emu(w)}" cy="${emu(hh)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:anchor></w:drawing></w:r>`};
 const tb=b=>{const id=++did,jc={center:"center",right:"right",dist:"distribute",left:"left"}[b.al||"left"],paras=String(b.t).split("\n").map(ln=>`<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="${Math.max(20,Math.round(b.lh*20))}" w:lineRule="exact"/><w:jc w:val="${jc}"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="${FONT}" w:eastAsia="${FONT}" w:hAnsi="${FONT}" w:cs="${FONT}"/>${b.b?"<w:b/>":""}${b.sp?`<w:spacing w:val="${Math.round(b.sp*20)}"/>`:""}<w:sz w:val="${Math.round(b.s*2)}"/><w:szCs w:val="${Math.round(b.s*2)}"/></w:rPr><w:t xml:space="preserve">${xe(ln)}</w:t></w:r></w:p>`).join("");
  return `<w:r><w:drawing><wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="${id}" behindDoc="0" locked="0" layoutInCell="1" allowOverlap="1"><wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="page"><wp:posOffset>${emu(b.x)}</wp:posOffset></wp:positionH><wp:positionV relativeFrom="page"><wp:posOffset>${emu(b.y)}</wp:posOffset></wp:positionV><wp:extent cx="${emu(b.w)}" cy="${emu(b.h)}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapNone/><wp:docPr id="${id}" name="글상자${id}"/><wp:cNvGraphicFramePr/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"><wps:wsp><wps:cNvSpPr txBox="1"/><wps:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${emu(b.w)}" cy="${emu(b.h)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom>${b.fill?'<a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill>':"<a:noFill/>"}<a:ln><a:noFill/></a:ln></wps:spPr><wps:txbx><w:txbxContent>${paras}</w:txbxContent></wps:txbx><wps:bodyPr rot="0" vert="${b.vert?"eaVert":"horz"}" wrap="${b.wrap?"square":"none"}" lIns="0" tIns="0" rIns="0" bIns="0" anchor="t" anchorCtr="0"><a:noAutofit/></wps:bodyPr></wps:wsp></a:graphicData></a:graphic></wp:anchor></w:drawing></w:r>`};
 // 글줄 하나를 글자 상자 정보로
 const spread=(l,t)=>{const n=LRN.nrm(t).length;return !l.v&&n>=3&&(l.x1-l.x0)/n>l.s*1.45};
 const lineBox=(l,t,fill,right)=>{const lh=l.bot-l.top;if(l.v){const n0=Math.max(1,(l.t||"").length),n=Math.max(1,[...String(t)].length),p0=l.pt||l.s;let pp=p0;if(n>n0&&n>1)pp=Math.max(l.s*.45,Math.min(p0,(lh-l.s*1.25)/(n-1)));const bw=l.s*1.5,cx=(l.x0+l.x1)/2;return{x:cx-bw/2,y:l.top,w:bw,h:lh,s:l.s,t:[...String(t)].join("\n"),al:"center",lh:Math.max(l.s*.6,pp),fill}}
  if(right){const w=(l.x1-l.x0)+10;return{x:l.x1-w+2,y:l.top,w,h:lh,s:l.s,t,al:"right",lh,fill}}
  if(spread(l,t))return{x:l.x0,y:l.top,w:l.x1-l.x0,h:lh,s:l.s,t,al:"dist",lh,b:l.s>=24,fill};
  return{x:l.x0,y:l.top,w:(l.x1-l.x0)+6,h:lh,s:l.s,t,al:"left",lh,b:l.s>=24,fill}};
 const slotBox=(s,fill)=>{const w=s.x1-s.x0,hh=s.bot-s.top,t=V[s.fid]??"";if(s.dj)return{x:s.x0,y:s.top,w,h:hh,s:s.s,t,al:"dist",lh:hh,fill};const bw=s.rows>1?w+4:Math.max(w+24,60),lh=hh/s.rows;let x=s.x0,al="left";if(s.al=="center"){x=(s.x0+s.x1)/2-bw/2;al="center"}else if(s.al=="right"){x=s.x1-bw;al="right"}return{x,y:s.top,w:bw,h:hh,s:s.s,t,al,lh,wrap:s.rows>1,fill}};
 const pnBox=(p,num,fill)=>({x:p.x0-6,y:p.top,w:p.x1-p.x0+12,h:p.bot-p.top,s:p.s,t:String(p.raw).replace(/\d+/,num),al:"center",lh:p.bot-p.top,fill});
 // 쪽 하나의 상자 목록. full=true: 글자를 지운 바탕 위에 모든 글자를 글자 상자로
 const tplItems=(c,num)=>{const full=!!(RASTN[c.bi]&&c.lines),bg=full?RASTN[c.bi]:RAST[c.bi],boxes=[],fill=!full;
  c.slots.forEach(s=>{if(full||V[s.fid]!==FBv[s.fid])boxes.push(slotBox(s,fill))});
  c.pn.forEach(p=>{if(full||String(p.raw).replace(/\D/g,"")!==String(num))boxes.push(pnBox(p,num,fill))});
  (c.lines||[]).forEach((l,li)=>{if(l.sl)return;const k=c.bi+":"+li,pe=PE[k];let t=pe!==undefined?pe:l.t,ch=pe!==undefined,right=false;
   if(l.fid){t=V[l.fid]??l.t;ch=t!==FBv[l.fid]}else if(l.num&&R.offBase!=null&&pe===undefined){const nn=newNum(l.num);right=true;if(nn!==l.num){t=String(nn);ch=true}}else if(l.num)right=true;
   if(full||ch)boxes.push(lineBox(l,t,fill,right&&!l.v))});
  (PX[c.bi]||[]).forEach(b=>boxes.push({x:b.x,y:b.y,w:Math.max(40,b.t.length*b.s*.9),h:b.s*1.3,s:b.s,t:b.t,al:"left",lh:b.s*1.3,fill:false}));
  return{bg,W:c.W,H:c.H,boxes}};
 const crop=async(u,W,H,y0,y1)=>{const im=await loadImg(u);if(!im)return null;const k=im.naturalWidth/W,cv=document.createElement("canvas");cv.width=im.naturalWidth;cv.height=Math.max(1,Math.round((y1-y0)*k));cv.getContext("2d").drawImage(im,0,y0*k,im.naturalWidth,cv.height,0,0,cv.width,cv.height);return cv.toDataURL("image/jpeg",.88)};
 const tpls=L.out.filter(o=>o.k=="tpl"),pages=[];let total=L.out.reduce((a,o)=>a+(o.k=="tpl"?1:o.n),0),done=0;
 for(const o of L.out){
  if(o.k=="tpl"){pages.push(tplItems(o.c,o.at+1+L.off));prog&&0;continue}
  for(let m=0;m<o.n;m++){const idx=o.at+m,ref=[...tpls].reverse().find(t=>t.at<idx&&hfOf(t.c)&&(t.at%2)==(idx%2))||[...tpls].reverse().find(t=>t.at<idx&&hfOf(t.c)),c=ref&&ref.c,W=c?c.W:595.2,H=c?c.H:841.92,u=(IMG[o.gi]||[])[m],pg={bg:null,strips:[],W,H,boxes:[],img:null};
   if(c){const src=RASTN[c.bi]||RAST[c.bi],full=!!(RASTN[c.bi]&&c.lines);const top=await crop(src,c.W,c.H,0,72),bot=await crop(src,c.W,c.H,c.H-70,c.H);if(top)pg.strips.push({u:top,x:0,y:0,w:c.W,h:72});if(bot)pg.strips.push({u:bot,x:0,y:c.H-70,w:c.W,h:70});
    c.slots.filter(s=>s.bot<72||s.top>c.H-70).forEach(s=>{if(full||V[s.fid]!==FBv[s.fid])pg.boxes.push(slotBox(s,!full))});c.pn.forEach(q=>{const nm=idx+1+L.off;if(full||String(q.raw).replace(/\D/g,"")!==String(nm))pg.boxes.push(pnBox(q,nm,!full))});
    if(full)(c.lines||[]).forEach(l=>{if(l.sl||l.v)return;if(l.bot<72||l.top>c.H-70)pg.boxes.push(lineBox(l,l.t,false,false))})}
   if(u){const im=await loadImg(u);if(im){const aw=W-60,ah=H-160,k=Math.min(aw/im.naturalWidth,ah/im.naturalHeight),w=im.naturalWidth*k,hh=im.naturalHeight*k;pg.img={u,x:(W-w)/2,y:80+(ah-hh)/2,w,h:hh}}}
   pages.push(pg)}}
 const body=pages.map((pg,i)=>{const items=[];if(pg.bg){const r=pic(pg.bg,0,0,pg.W,pg.H,true);items.push(r)}(pg.strips||[]).forEach(s=>items.push(pic(s.u,s.x,s.y,s.w,s.h,true)));if(pg.img)items.push(pic(pg.img.u,pg.img.x,pg.img.y,pg.img.w,pg.img.h,false));pg.boxes.forEach(b=>items.push(tb(b)));
  return `<w:p><w:pPr>${i?"<w:pageBreakBefore/>":""}<w:spacing w:before="0" w:after="0" w:line="20" w:lineRule="exact"/></w:pPr>${items.join("")}</w:p>`}).join("");
 zip.file("[Content_Types].xml",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpg" ContentType="image/jpeg"/><Default Extension="jpeg" ContentType="image/jpeg"/><Default Extension="png" ContentType="image/png"/><Default Extension="gif" ContentType="image/gif"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>');
 zip.file("_rels/.rels",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
 zip.file("word/_rels/document.xml.rels",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdS" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'+rels.join("")+"</Relationships>");
 zip.file("word/styles.xml",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="'+FONT+'" w:eastAsia="'+FONT+'" w:hAnsi="'+FONT+'"/><w:sz w:val="22"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>');
 zip.file("word/document.xml",'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"><w:body>'+body+'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="0" w:right="0" w:bottom="0" w:left="0" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr></w:body></w:document>');
 const u8=await zip.generateAsync({type:"uint8array",compression:"DEFLATE"});
 await window.saveFile((R.names[0]||"보고서").slice(0,30)+"_편집용.docx",u8);return{pages:pages.length,boxes:pages.reduce((a,p)=>a+p.boxes.length,0),bytes:u8.length}}
async function exportDocx(k){try{window.toast("편집 가능한 문서를 만드는 중입니다… (쪽이 많으면 1분 이상 걸립니다)",90000);const r=await buildEditableDocx();window.toast((k=="hwpx"?"한글(.hwpx) 형식은 지원하지 않아, 한글에서 열 수 있는 워드(.docx) 편집용 파일로 저장했습니다. 한글에서 이 파일을 열어 편집하세요. ":"편집용 워드 파일을 저장했습니다. ")+"("+r.pages+"쪽)",12000)}catch(e){console.error(e);window.toast("저장 오류: "+e.message,9000)}}
window.__exportDocx=buildEditableDocx;

window.__lrn={get R(){return R},get V(){return V},get PE(){return PE},get PX(){return PX},get newNum(){return newNum},get L(){return CURL}};
})();
