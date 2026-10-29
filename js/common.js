const KEY='realestate_records_v1', DKEY='realestate_deleted_v1';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>{const n=parseFloat(String(v??'').replace(/[^\d.]/g,''));return isNaN(n)?null:n};
const fmt=n=>n==null?'':Number(n).toLocaleString('en-US');
function split(r){const p=[];if(r.bed)p.push(r.bed+' نوم');if(r.bath)p.push(r.bath+' حمام');if(r.kit)p.push(r.kit+' مطبخ');return p.join('، ')}
function rd(k){try{return JSON.parse(localStorage.getItem(k)||'[]')}catch(e){return[]}}
function wr(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){alert('تعذر الحفظ في المتصفح')}}
const getLocal=()=>rd(KEY), setLocal=v=>wr(KEY,v);
const getDeleted=()=>rd(DKEY), setDeleted=v=>wr(DKEY,v);

/* ===== إعدادات GitHub (بتنحفظ بمتصفحك فقط، ما بتنرفع مع الملفات) ===== */
const CFG='realestate_gh_cfg_v1', DATA_PATH='data/data.json';
function getCfg(){try{const c=JSON.parse(localStorage.getItem(CFG)||'null');return c&&c.owner&&c.repo&&c.token?c:null}catch(e){return null}}
function setCfg(c){localStorage.setItem(CFG,JSON.stringify(c))}
function clearCfg(){localStorage.removeItem(CFG)}
const b64enc=str=>{const b=new TextEncoder().encode(str);let s='';for(let i=0;i<b.length;i+=8192)s+=String.fromCharCode(...b.subarray(i,i+8192));return btoa(s)};
const b64dec=t=>new TextDecoder().decode(Uint8Array.from(atob(t.replace(/\s/g,'')),c=>c.charCodeAt(0)));
function ghUrl(c){return `https://api.github.com/repos/${c.owner}/${c.repo}/contents/${DATA_PATH}`}
function ghHead(c){return {'Authorization':'Bearer '+c.token,'Accept':'application/vnd.github+json'}}
async function ghErr(r){
  if(r.status===401)return 'التوكن غلط أو منتهي';
  if(r.status===403)return 'ما في صلاحية. تأكد إن التوكن عنده Contents: Read and write';
  if(r.status===404)return 'ما لقيت المستودع. تأكد من اسم الحساب واسم المستودع وصلاحية التوكن عليه';
  let m='';try{m=(await r.json()).message}catch(e){}
  return 'خطأ من GitHub ('+r.status+') '+m;
}
async function ghGet(c){
  const r=await fetch(ghUrl(c)+'?ref='+encodeURIComponent(c.branch||'main')+'&t='+Date.now(),{headers:ghHead(c),cache:'no-store'});
  if(r.status===404){
    // نفرق بين "الملف مش موجود" و "المستودع مش موجود"
    let m='';try{m=(await r.clone().json()).message||''}catch(e){}
    if(/Not Found/i.test(m)){
      const rr=await fetch(`https://api.github.com/repos/${c.owner}/${c.repo}`,{headers:ghHead(c)});
      if(!rr.ok)throw new Error(await ghErr(rr));
    }
    return {arr:[],sha:undefined};
  }
  if(!r.ok)throw new Error(await ghErr(r));
  const j=await r.json();
  let arr=[];try{arr=JSON.parse(b64dec(j.content||''))}catch(e){arr=[]}
  return {arr:Array.isArray(arr)?arr:[],sha:j.sha};
}
async function ghPut(c,arr,sha,msg){
  const body={message:msg,content:b64enc(JSON.stringify(arr,null,2)),branch:c.branch||'main'};
  if(sha)body.sha=sha;
  return fetch(ghUrl(c),{method:'PUT',headers:Object.assign({'Content-Type':'application/json'},ghHead(c)),body:JSON.stringify(body)});
}
/* يقرأ آخر نسخة، يعدّل عليها، ويكتبها بالملف (مع إعادة المحاولة إذا تعارض مع حدا تاني) */
async function ghMutate(fn,msg){
  const c=getCfg();
  for(let i=0;i<3;i++){
    const {arr,sha}=await ghGet(c);
    const out=fn(arr);
    const r=await ghPut(c,out,sha,msg);
    if(r.ok)return out;
    if(r.status!==409&&r.status!==422)throw new Error(await ghErr(r));
  }
  throw new Error('صار تعارض بالحفظ، جرب مرة تانية');
}

/* ===== القراءة والحفظ ===== */
async function loadAll(){
  const c=getCfg();
  if(c){try{return (await ghGet(c)).arr}catch(e){console.warn(e);alert('تعذر القراءة من GitHub: '+e.message)}}
  let remote=[];
  try{const r=await fetch(DATA_PATH+'?t='+Date.now(),{cache:'no-store'});if(r.ok)remote=await r.json()}catch(e){}
  const local=getLocal(), ids=new Set(local.map(r=>r.id)), del=new Set(getDeleted());
  return remote.filter(r=>!ids.has(r.id)).concat(local).filter(r=>!del.has(r.id));
}
async function removeRecord(id){
  if(getCfg()){await ghMutate(a=>a.filter(r=>r.id!==id),'حذف عقار');return}
  setLocal(getLocal().filter(r=>r.id!==id));
  const d=getDeleted();if(!d.includes(id)){d.push(id);setDeleted(d)}
}
async function saveRecord(rec,isEdit){
  if(getCfg()){
    await ghMutate(a=>{const i=a.findIndex(r=>r.id===rec.id);if(i>=0)a[i]=rec;else a.unshift(rec);return a},isEdit?'تعديل عقار':'إضافة عقار');
    return 'github';
  }
  const l=getLocal(), i=l.findIndex(r=>r.id===rec.id);
  if(i>=0)l[i]=rec;else l.unshift(rec);
  setLocal(l);
  setDeleted(getDeleted().filter(x=>x!==rec.id));
  return 'local';
}
function modeText(){const c=getCfg();return c?`متصل بـ GitHub: ${c.owner}/${c.repo} — الحفظ مباشرة بملف data.json`:'غير متصل بـ GitHub — الحفظ بالمتصفح فقط (روح على الإعدادات)'}
function download(name,text,type){
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();
}
