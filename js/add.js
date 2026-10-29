let editId=null,cnt={bed:0,bath:0,hall:0,kit:0};
function setCtr(){document.querySelectorAll('.ctr').forEach(c=>c.querySelector('.n').textContent=cnt[c.dataset.k])}
document.querySelectorAll('.ctr button').forEach(b=>b.onclick=()=>{
  const k=b.closest('.ctr').dataset.k;cnt[k]=Math.max(0,cnt[k]+Number(b.dataset.d));setCtr();
});
function toast(t,bad){const e=$('toast');e.textContent=t;e.style.background=bad?'#b3261e':'';e.style.display='block';setTimeout(()=>e.style.display='none',bad?5000:2500)}
function resetForm(){
  $('f').reset();cnt={bed:0,bath:0,hall:0,kit:0};setCtr();editId=null;
  $('ft').textContent='إضافة عقار جديد';$('save').textContent='حفظ العقار';$('cancel').hidden=true;
  history.replaceState(null,'','index.html');
}
$('cancel').onclick=resetForm;

$('f').onsubmit=async e=>{
  e.preventDefault();
  const bt=document.querySelector('input[name=btype]:checked');
  const was=!!editId, btn=$('save'), old=btn.textContent;
  btn.disabled=true;btn.textContent='جاري الحفظ…';
  try{
    const where=await saveRecord({
      id:editId||Date.now(),
      assoc:$('assoc').value.trim(),area:$('area').value,floor:$('floor').value.trim(),
      dirs:[...document.querySelectorAll('#dirs input:checked')].map(x=>x.value),
      bed:cnt.bed,bath:cnt.bath,hall:cnt.hall,kit:cnt.kit,
      owner:$('owner').value.trim(),phone:$('phone').value.trim(),price:$('price').value,
      rec:$('rec').value.trim(),btype:bt?bt.value:'',notes:$('notes').value
    },was);
    resetForm();
    toast((was?'تم حفظ التعديل':'تم الحفظ')+(where==='github'?' على GitHub':' بالمتصفح'));
  }catch(err){toast('ما انحفظ: '+err.message,true);btn.textContent=old}
  btn.disabled=false;if(!editId)btn.textContent='حفظ العقار';
};
$('mode').textContent=modeText();

(async function(){
  const id=Number(new URLSearchParams(location.search).get('edit'));
  if(!id)return;
  const r=(await loadAll()).find(x=>x.id===id);if(!r)return;
  editId=id;
  $('assoc').value=r.assoc;$('area').value=r.area;$('floor').value=r.floor;$('owner').value=r.owner;
  $('phone').value=r.phone;$('price').value=num(r.price)??'';$('rec').value=r.rec;$('notes').value=r.notes;
  document.querySelectorAll('input[name=btype]').forEach(x=>x.checked=x.value===r.btype);
  document.querySelectorAll('#dirs input').forEach(x=>x.checked=(r.dirs||[]).includes(x.value));
  cnt={bed:r.bed||0,bath:r.bath||0,hall:r.hall||0,kit:r.kit||0};setCtr();
  $('ft').textContent='تعديل العقار';$('save').textContent='حفظ التعديل';$('cancel').hidden=false;
})();
