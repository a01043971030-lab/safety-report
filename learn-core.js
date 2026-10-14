// ===== 샘플 보고서 학습 엔진: 같은 양식의 PDF 보고서 여러 개를 비교해 '고정 내용'과 '현장마다 바뀌는 내용'을 분리 =====
const LRN={};
LRN.guess=v=>{const t=String(v).replace(/\s+/g,"");if(!t)return"";if(/^\d{4}[.\-]\d{1,2}$/.test(t))return"작성 연월";if(/^\d{4}년\d{1,2}월(\d{1,2}일)?$/.test(t))return/일$/.test(t)?"제출일(날짜)":"작성 연월";if(/대표이사귀하$/.test(t))return"수신(시공사 대표이사)";if(/^주소[:：]/.test(t))return"점검기관 주소";if(/^상호[:：]/.test(t))return"점검기관 상호";if(/^대표자[:：]/.test(t))return"대표자";if(/귀사에서/.test(t))return"제출문 본문";if(/^【.{2,40}】$/.test(t))return"공종 이름(【 】 안)";if(/(사업|공사|조성|정비)/.test(t)&&t.length<70&&!/(다\.|니다)$/.test(t))return"공사명";if(/(\(주\)|㈜|주식회사|종합건설|건설)/.test(t)&&t.length<30)return"회사명(시공사)";if(/\d차\)?(정기)?안전점검|보고서$/.test(t))return"보고서 제목·차수";return""};
LRN.nrm=t=>String(t).replace(/\s+/g,"");
LRN.tidy=t=>{t=String(t).trim();return /^(\S\s)+\S$/.test(t)?t.replace(/\s/g,""):t.replace(/\s{2,}/g," ")};
// 1) PDF 한 쪽의 글자 조각 → 줄(같은 높이의 조각을 묶고, 간격이 크면 칸으로 분리)
LRN.lines=function(items,H){
 const its=items.filter(i=>i.str&&i.str.trim()&&!/^[·.…\s_]+$/.test(i.str)).map(i=>({t:i.str,x:i.transform[4],y:H-i.transform[5],w:i.width,s:Math.hypot(i.transform[0],i.transform[1])||i.height||10}));
 its.sort((a,b)=>a.y-b.y||a.x-b.x);const rows=[];
 its.forEach(i=>{const r=rows[rows.length-1];if(r&&Math.abs(i.y-r.y)<=Math.max(2,.5*Math.min(i.s,r.s)))r.its.push(i);else rows.push({y:i.y,s:i.s,its:[i]})});
 const out=[];
 rows.forEach(r=>{r.its.sort((a,b)=>a.x-b.x);let cur=null;
  r.its.forEach(i=>{if(cur&&i.x-cur.x1<=2.2*Math.max(i.s,cur.s)){cur.t+=(i.x-cur.x1>.2*i.s?" ":"")+i.t;cur.x1=Math.max(cur.x1,i.x+i.w);cur.s=Math.max(cur.s,i.s)}
   else{cur={t:i.t,x0:i.x,x1:i.x+i.w,y:r.y,s:i.s};out.push(cur)}})});
 out.forEach(l=>{l.top=l.y-l.s*.85;l.bot=l.y+l.s*.25;l.t=LRN.tidy(l.t)});
 const xs=new Set(its.map(i=>Math.round(i.x/3))),ys=new Set(its.map(i=>Math.round(i.y/3)));if(its.length>25&&ys.size>its.length*.5&&xs.size<its.length*.3)out.vitems=its.map(i=>({t:i.t,x:i.x,y:i.y,w:i.w,s:i.s}));
 return out.sort((a,b)=>a.top-b.top||a.x0-b.x0)};
// 2) 쪽 종류(목차·세로쓰기·글자 적음)와 지문, 유사도
LRN.kind=p=>{const L=p.lines,n=L.length;if(n<3)return"few";const one=L.filter(l=>LRN.nrm(l.t).length<=1).length;if(one>=8&&one>n*.5)return"vert";const num=L.filter(l=>/^[·.…\s]*\d{1,3}$/.test(l.t.trim())).length,hd=L.filter(l=>/^\s*(제\s?\d+\s?장|\d+\.\d)/.test(l.t)).length;if(num>=6&&hd>=3)return"toc";return"ok"};
LRN.sig=p=>{const ts=new Set(),ls=new Set();p.lines.forEach(l=>{const n=LRN.nrm(l.t).replace(/\d+/g,"#");if(n.length>=2)ts.add(n);ls.add(Math.round(l.top/16)+":"+Math.round(l.x0/36))});return{ts,ls,kind:LRN.kind(p)}};
LRN.jac=(a,b)=>{if(!a.size&&!b.size)return 1;let i=0;for(const x of a)if(b.has(x))i++;return i/(a.size+b.size-i)};
LRN.sim=(a,b)=>(a.kind!="ok"||b.kind!="ok")?0:.5*LRN.jac(a.ts,b.ts)+.5*LRN.jac(a.ls,b.ls);
// 3) 두 보고서의 쪽 맞추기(순서 유지, 가장 비슷한 쪽끼리 짝짓기)
LRN.align=function(A,B,thr){thr=thr||.3;const n=A.length,m=B.length,S=A.map(()=>new Float32Array(m).fill(-1));
 const sim=(i,j)=>S[i][j]>=0?S[i][j]:(S[i][j]=LRN.sim(A[i].sig,B[j].sig));
 const D=Array.from({length:n+1},()=>new Float32Array(m+1));
 for(let i=1;i<=n;i++)for(let j=1;j<=m;j++){let v=Math.max(D[i-1][j],D[i][j-1]);const s=sim(i-1,j-1);if(s>=thr)v=Math.max(v,D[i-1][j-1]+s-thr+.01);D[i][j]=v}
 const pr=[];let i=n,j=m;
 while(i>0&&j>0){const s=sim(i-1,j-1);if(s>=thr&&Math.abs(D[i][j]-(D[i-1][j-1]+s-thr+.01))<1e-5){pr.push([i-1,j-1]);i--;j--}else if(D[i-1][j]>=D[i][j-1])i--;else j--}
 return pr.reverse()};
// 4) 글자 영역을 가린 뒤 그림 부분(표선·로고·사진)만 비교 → 다른 픽셀 비율
LRN.diffFrac=(A,B,la,lb,sc)=>{const w=A.w,h=A.h,mk=new Uint8Array(w*h);[la,lb].forEach(L=>L.forEach(l=>{const x0=Math.max(0,Math.floor((l.x0-3)*sc)),x1=Math.min(w,Math.ceil((l.x1+3)*sc)),y0=Math.max(0,Math.floor((l.top-3)*sc)),y1=Math.min(h,Math.ceil((l.bot+3)*sc));for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)mk[y*w+x]=1}));let n=0,d=0;for(let i=0;i<w*h;i++){if(mk[i])continue;n++;if(Math.abs(A.g[i]-B.g[i])>70)d++}return n?d/n:0};
// 5) 분석(합의 방식): 샘플 중 60% 이상에서 같으면 '고정', 다르면 '바뀌는 칸'
LRN.nav=function(base){const P=base.pages,out=[{label:"표지",bi:0}],seen=new Set(["표지"]),add=(label,bi)=>{if(seen.has(label))return;seen.add(label);out.push({label,bi})};
 P.forEach((p,bi)=>{if(bi==0)return;if((p.sig&&p.sig.kind=="toc")||p.lines.some(l=>/^(보고서)?목차$/.test(LRN.nrm(l.t))&&l.s>=12))add("목차",bi)});
 P.forEach((p,bi)=>{if(p.sig&&p.sig.kind=="toc")return;p.lines.forEach(l=>{const n=LRN.nrm(l.t),m=n.match(/^제(\d+)장/);if(m&&l.s>=18)add("제"+m[1]+"장",bi);if((/^[◉●■▣]?부록/.test(n)&&l.s>=14&&bi>0)||(n=="부"&&l.s>=20&&bi>0&&p.lines.some(x=>LRN.nrm(x.t)=="록"&&x.s>=20)))add("부록",bi)})});
 const chN=out.filter(o=>/^제\d+장$/.test(o.label)).length;
 if(chN<2&&P.length>3){const seenN=new Set();P.forEach((p,bi)=>{if(bi==0||(p.sig&&p.sig.kind=="toc"))return;p.lines.forEach(l=>{const n=LRN.nrm(l.t),m=n.match(/^(\d{1,2})[.)．]?(?=[^\d])(.{1,14})/)||n.match(/^([ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]+)[.)．]?(.{0,14})/);
   if(m&&l.s>=14&&l.top<P[bi].H*.45&&!seenN.has(m[1])&&seenN.size<14){seenN.add(m[1]);add((isNaN(+m[1])?m[1]:m[1]+".")+" "+(m[2]||"").slice(0,8),bi)}})})}
 if(out.length<3&&P.length>12){const step=Math.ceil(P.length/8);for(let bi=step;bi<P.length;bi+=step)add("p."+(bi+1)+"~",bi)}
 return out.sort((a,b)=>a.bi-b.bi)};
LRN.analyze=async function(samples,log,render,opt){log=log||(()=>{});opt=opt||{};const thr=opt.pix??.06;
 samples.forEach(s=>s.pages.forEach(p=>p.sig=LRN.sig(p)));
 const base=samples[0],others=samples.slice(1),N=samples.length;
 const maps=others.map((o,k)=>{const m=new Map();LRN.align(base.pages,o.pages).forEach(([a,b])=>m.set(a,b));log("쪽 맞추는 중 "+(k+1)+"/"+others.length);return m});
 const nav0=LRN.nav(base),ch1=(nav0.find(n=>n.label=="제1장")||nav0.find(n=>/^1\./.test(n.label))||{}).bi,frontEnd=Math.min(ch1!=null?ch1:Math.min(10,base.pages.length),16);
 others.forEach((o,k)=>{const used=new Set(maps[k].values());for(let bi=0;bi<frontEnd&&bi<o.pages.length;bi++){if(maps[k].has(bi)||used.has(bi))continue;let ok=true;maps[k].forEach((b,a)=>{if((a<bi)!=(b<bi))ok=false});if(ok){maps[k].set(bi,bi);used.add(bi)}}});
 const need=Math.max(1,Math.ceil(.6*others.length)),nrmSet=l=>new Set(l.map(x=>LRN.nrm(x.t)).filter(Boolean));
 const cand=[],pos={},fields=[],fkey=new Map();let done=0;
 for(let bi=0;bi<base.pages.length;bi++){const bp=base.pages[bi],kind=bp.sig.kind,front=bi<frontEnd;let live=front&&(kind=="toc"||kind=="vert");if(kind!="ok"&&!(front&&(live||kind=="few")))continue;
  const mt=maps.map(m=>m.has(bi)?m.get(bi):-1),cnt=mt.filter(x=>x>=0).length;if(cnt<need){if(!front)continue;live=true}
  let diff=0;
  if(render&&!live&&!(front&&kind=="ok")){const A=await render(0,bi,.5),ks=[];mt.forEach((q,k)=>{if(q>=0)ks.push(k)});const sub=ks.length>4?[ks[0],ks[ks.length/3|0],ks[ks.length*2/3|0],ks[ks.length-1]]:ks;let bad=0;
   for(const k of sub){const B=await render(k+1,mt[k],.5);if(A.w!=B.w||A.h!=B.h||LRN.diffFrac(A,B,bp.lines,others[k].pages[mt[k]].lines,.5)>thr)bad++}
   if(bad>.4*sub.length)continue;diff=bad/sub.length}
  const qs=mt.map((q,k)=>q<0?null:others[k].pages[q]),qm=qs.filter(Boolean),qset=qm.map(q=>nrmSet(q.lines)),fneed=Math.max(1,Math.ceil(.6*qm.length));
  const fixed=[],vari=[],pn=[];
  bp.lines.forEach(l=>{const n=LRN.nrm(l.t);if(!n)return;
   if(!live&&/^[-–—]?\d{1,3}[-–—]?$/.test(n)&&(l.top>bp.H*.88||l.top<bp.H*.1)){pn.push(l);return}
   (qset.filter(s=>s.has(n)).length>=fneed?fixed:vari).push(l)});
  if(live){vari.length=0;fixed.length=0}
  {const vs=[...vari].sort((a,b)=>a.top-b.top||a.x0-b.x0),mv=[];vs.forEach(l=>{const p=mv[mv.length-1];if(p&&Math.abs(l.top-p.top)<2&&l.x0-p.x1<3.5*p.s&&Math.abs(l.s-p.s)<.6&&Math.abs((p.x0+l.x1)/2-bp.W/2)<6){mv[mv.length-1]={...p,t:p.t+"  "+l.t,x1:l.x1,bot:Math.max(p.bot,l.bot),parts:[...(p.parts||[p]),...(l.parts||[l])]}}else mv.push(l)});vari.splice(0,vari.length,...mv)}
  const groups=[];vari.forEach(l=>{const g=groups.find(g=>{const e=g.l[g.l.length-1];return l.top-e.bot<1.4*l.s&&l.top>=e.top&&Math.min(l.x1,e.x1)>Math.max(l.x0,e.x0)&&Math.abs(l.x0-e.x0)<30&&!(Math.abs((l.x0+l.x1)/2-(e.x0+e.x1)/2)<3&&Math.abs(l.x0-e.x0)>6)&&Math.abs(l.s-e.s)<.6});if(g)g.l.push(l);else groups.push({l:[l]})});
  const slots=groups.map(g=>{const L=g.l,x0=Math.min(...L.map(l=>l.x0)),x1=Math.max(...L.map(l=>l.x1)),top=Math.min(...L.map(l=>l.top)),bot=Math.max(...L.map(l=>l.bot)),s=L.reduce((a,l)=>a+l.s,0)/L.length;
   const vals=[L.map(l=>l.t).join("\n")],box=[[x0,x1]];
   qs.forEach(q=>{if(!q){vals.push("");return}const hit=q.lines.filter(l=>LRN.nrm(l.t)&&l.x0<x1+6&&l.x1>x0-6&&l.top<bot+3&&l.bot>top-3&&!fixed.some(b=>LRN.nrm(b.t)==LRN.nrm(l.t)));vals.push(hit.map(l=>l.t).join("\n"));if(hit.length)box.push([Math.min(...hit.map(l=>l.x0)),Math.max(...hit.map(l=>l.x1))])});
   const sd=a=>{const m=a.reduce((x,y)=>x+y,0)/a.length;return Math.sqrt(a.reduce((x,y)=>x+(y-m)*(y-m),0)/a.length)};
   let al="left";if(box.length>2){if(sd(box.map(b=>b[0]))>2){if(sd(box.map(b=>(b[0]+b[1])/2))<=2.5)al="center";else if(sd(box.map(b=>b[1]))<=2.5)al="right"}}
   let lab=fixed.filter(f=>f.x1<=x0+2&&Math.abs((f.top+f.bot)/2-(top+bot)/2)<Math.max(s,bot-top)*.7).sort((a,b)=>b.x1-a.x1)[0];
   if(!lab||LRN.nrm(lab.t).length>14)lab=fixed.filter(f=>f.bot<=top+2&&top-f.bot<70&&LRN.nrm(f.t).length<=30).sort((a,b)=>b.bot-a.bot)[0];
   const n0=LRN.nrm(vals[0]).length;return{x0,x1,top,bot,s,al,dj:(L.length==1&&n0>=3&&(x1-x0)/n0>s*1.45)?1:0,rows:L.length,vals,label:lab?lab.t.replace(/[:：]\s*$/,""):""}});
  slots.forEach(sl=>{const key=JSON.stringify(sl.vals.map(LRN.nrm));let f=fkey.get(key);
   if(!f){f={id:"f"+fields.length,label:((sl.label&&!/[【】]/.test(sl.label)&&LRN.nrm(sl.label).length<=10)?sl.label:"")||LRN.guess(sl.vals[0])||sl.label||("p."+(bi+1)+" 항목"),vals:sl.vals,multi:sl.rows>1,page:bi,uses:0};fkey.set(key,f);fields.push(f)}
   f.uses++;if(sl.rows>1)f.multi=true;sl.fid=f.id;delete sl.vals});
  const title=[...fixed].sort((a,b)=>b.s-a.s)[0];
  pos[bi]=[bi,...mt];
  const inSlot=new Set(groups.flatMap(g=>g.l.flatMap(x=>x.parts||[x]))),isPn=new Set(pn);let all=bp.lines;
  if(kind=="vert"){const vi=bp.lines.vitems,srcL=vi?vi.map(i=>({t:i.t,x0:i.x,x1:i.x+i.w,top:i.y-i.s*.85,bot:i.y+i.s*.25,s:i.s,y:i.y})):all.map(l=>({...l,y:l.top+l.s*.85})),cols=[];[...srcL].sort((a,b)=>(a.x0+a.x1)/2-(b.x0+b.x1)/2||a.top-b.top).forEach(l=>{const cx=(l.x0+l.x1)/2,g=cols.find(g=>Math.abs(g.cx-cx)<6.5);if(g){g.it.push(l);g.cx=(g.cx*(g.it.length-1)+cx)/g.it.length}else cols.push({cx,it:[l]})});cols.forEach(g=>g.it.sort((a,b)=>a.top-b.top));
   const neu=/^[()（）\[\]【】·.,\s]+$/,segs=[];cols.forEach(g=>{let cur=null;g.it.forEach(l=>{const nt=neu.test(l.t);if(cur&&(nt||Math.abs(l.s-cur.s)<.8)&&l.y-cur.ly<2.3*cur.s){cur.t+=l.t;cur.bot=Math.max(cur.bot,l.bot);cur.x0=Math.min(cur.x0,l.x0);cur.x1=Math.max(cur.x1,l.x1);cur.n++;cur.last=l.top;cur.ly=l.y}else{cur={t:l.t,x0:l.x0,x1:l.x1,top:l.top,bot:l.bot,s:l.s,v:1,n:1,first:l.top,last:l.top,ly:l.y};segs.push(cur)}})});
   segs.forEach(g=>{g.pt=g.n>1?(g.last-g.first)/(g.n-1):g.s});all=segs}
  const lines=all.map(l=>({t:l.t,x0:+l.x0.toFixed(1),x1:+l.x1.toFixed(1),top:+l.top.toFixed(1),bot:+l.bot.toFixed(1),s:+l.s.toFixed(1),v:l.v?1:0,pt:l.pt?+l.pt.toFixed(2):0,num:(kind=="toc"&&/^[·.…\s]*\d{1,3}$/.test(String(l.t).trim()))?+String(l.t).replace(/\D/g,""):0,sl:inSlot.has(l)||isPn.has(l)?1:0}));
  cand.push({bi,lines,live,front,vert:kind=="vert"?1:0,toc:kind=="toc"?1:0,W:bp.W,H:bp.H,title:title?title.t.slice(0,26):"",slots,hf:!live&&bp.lines.some(l=>l.top<70)&&(bp.lines.some(l=>l.bot>bp.H-70)||pn.length>0),pn:pn.map(l=>({x0:l.x0,x1:l.x1,top:l.top,bot:l.bot,s:l.s,raw:l.t})),diff});
  if(++done%4==0){log("고정 쪽 확인 중… "+done+"쪽");if(opt.yield)await opt.yield()}}
 cand.forEach(c=>(c.lines||[]).forEach(l=>{if(!l.v||!l.t)return;const key="vs:"+LRN.nrm(l.t);let f=fkey.get(key);if(!f){f={id:"f"+fields.length,label:"책등 글자(세로) "+(fields.filter(x=>x.vs).length+1),vals:[l.t],multi:false,page:c.bi,uses:0,vs:1};fkey.set(key,f);fields.push(f)}f.uses++;l.fid=f.id}));
 let offBase=null;for(const c of cand){if(c.pn&&c.pn.length){const m=String(c.pn[0].raw).match(/\d+/);if(m){offBase=c.bi+1-(+m[0]);break}}}
 return{offBase,nav:LRN.nav(base),names:samples.map(s=>s.name),total:samples.map(s=>s.pages.length),cand,pos,fields,N}};
// 6) 사용자가 고른 고정 쪽 기준으로 '고정 쪽 + 자료 쪽(평균 쪽수)' 배치와 쪽번호 계산
LRN.layout=function(R,keep,gn){gn=gn||{};const T=R.cand.filter(c=>keep.has(c.bi)),out=[];let prev=null,idx=0;
 const gapAvg=(a,b)=>{const sz=[];for(let k=0;k<R.N;k++){const pa=a?R.pos[a.bi][k]:-1,pb=b?R.pos[b.bi][k]:R.total[k];if(pa==null||pb==null||(a&&pa<0)||(b&&pb<0))continue;sz.push(Math.max(0,pb-pa-1))}return sz.length?Math.round(sz.reduce((x,y)=>x+y,0)/sz.length):0};
 const addGap=(a,b,gi)=>{const n=Math.max(0,gn[gi]??gapAvg(a,b));out.push({k:"gap",gi,n,avg:gapAvg(a,b),from:a?a.bi:-1,at:idx});idx+=n};
 T.forEach((c,t)=>{addGap(prev,c,t);out.push({k:"tpl",c,at:idx});idx++;prev=c});addGap(prev,null,T.length);
 let off=0;for(const o of out)if(o.k=="tpl"&&o.c.pn.length){const m=o.c.pn[0].raw.match(/\d+/);if(m){off=(+m[0])-(o.at+1);break}}
 return{out,off,total:idx}};
if(typeof module!="undefined")module.exports=LRN;
