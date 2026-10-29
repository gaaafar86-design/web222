const c0=getCfg();
if(c0){$('owner').value=c0.owner;$('repo').value=c0.repo;$('branch').value=c0.branch||'main';$('token').value=c0.token;$('msg').textContent='مربوط حالياً: '+c0.owner+'/'+c0.repo}
$('f').onsubmit=async e=>{
  e.preventDefault();
  const c={owner:$('owner').value.trim(),repo:$('repo').value.trim(),branch:$('branch').value.trim()||'main',token:$('token').value.trim()};
  $('msg').style.color='';$('msg').textContent='جاري الاختبار…';
  try{
    const {arr,sha}=await ghGet(c);
    // اختبار كتابة: نعيد كتابة نفس المحتوى (بينشئ الملف إذا مش موجود)
    const r=await ghPut(c,arr,sha,'اختبار الربط');
    if(!r.ok)throw new Error(await ghErr(r));
    setCfg(c);
    $('msg').style.color='#0f6b6b';
    $('msg').textContent='تم الربط بنجاح. ('+arr.length+' عقار موجود بالملف)';
  }catch(err){$('msg').style.color='#b3261e';$('msg').textContent='فشل: '+err.message}
};
$('off').onclick=()=>{clearCfg();$('token').value='';$('msg').style.color='';$('msg').textContent='تم فصل الربط'};
