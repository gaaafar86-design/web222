function showShare(){
  const c=getCfg();$('share').hidden=!c;if(!c)return;
  const u=location.origin+location.pathname+'#c='+encodeURIComponent(b64enc(JSON.stringify(c)));
  $('link').value=u;
}
const c0=getCfg();
if(c0){$('owner').value=c0.owner;$('repo').value=c0.repo;$('branch').value=c0.branch||'main';$('token').value=c0.token;$('msg').textContent='مربوط حالياً: '+c0.owner+'/'+c0.repo}
showShare();

async function connect(c){
  const {arr,sha}=await ghGet(c);
  const r=await ghPut(c,arr,sha,'اختبار الربط');
  if(!r.ok)throw new Error(await ghErr(r));
  setCfg(c);return arr.length;
}
$('f').onsubmit=async e=>{
  e.preventDefault();
  const c={owner:$('owner').value.trim(),repo:$('repo').value.trim(),branch:$('branch').value.trim()||'main',token:$('token').value.trim()};
  $('msg').style.color='';$('msg').textContent='جاري الاختبار…';
  try{
    const n=await connect(c);
    $('msg').style.color='#0f6b6b';$('msg').textContent='تم الربط بنجاح. ('+n+' عقار موجود بالملف)';showShare();
  }catch(err){$('msg').style.color='#b3261e';$('msg').textContent='فشل: '+err.message}
};
$('off').onclick=()=>{clearCfg();$('token').value='';$('msg').style.color='';$('msg').textContent='تم فصل الربط';showShare()};
$('copy').onclick=async()=>{
  try{await navigator.clipboard.writeText($('link').value);$('cmsg').textContent='اننسخ الرابط'}
  catch(e){$('link').select();$('cmsg').textContent='حدد الرابط وانسخه يدوياً'}
};

/* فتح الصفحة من رابط الإعداد: بيربط تلقائياً وبيمسح التوكن من الرابط */
(async function(){
  const m=location.hash.match(/^#c=(.+)$/);if(!m)return;
  history.replaceState(null,'',location.pathname);
  $('msg').textContent='جاري الربط التلقائي…';
  try{
    const c=JSON.parse(b64dec(decodeURIComponent(m[1])));
    if(!c.owner||!c.repo||!c.token)throw new Error('الرابط ناقص');
    await ghGet(c);setCfg(c);
    $('msg').style.color='#0f6b6b';$('msg').textContent='تم الربط. جاري فتح صفحة الإضافة…';
    setTimeout(()=>location.href='index.html',1200);
  }catch(err){$('msg').style.color='#b3261e';$('msg').textContent='فشل الربط: '+err.message}
})();
