let all=[];
const uniq=a=>[...new Set(a)];
const asc=a=>a.slice().sort((x,y)=>x-y);

function opts(el,first,vals,fmtFn){
  el.innerHTML='<option value="">'+first+'</option>'+vals.map(v=>`<option value="${esc(v)}">${esc(fmtFn?fmtFn(v):v)}</option>`).join('');
}
/* كل خيارات الفلاتر بتنبني من الداتا الموجودة */
function buildFilters(){
  const prices=asc(uniq(all.map(r=>num(r.price)).filter(v=>v!=null)));
  const areas=asc(uniq(all.map(r=>num(r.area)).filter(v=>v!=null)));
  opts($('pmin'),'من',prices,fmt);opts($('pmax'),'إلى',prices,fmt);
  opts($('amin'),'من',areas);opts($('amax'),'إلى',areas);
  opts($('bt'),'الكل',uniq(all.map(r=>r.btype).filter(Boolean)));
  opts($('assoc'),'الكل',uniq(all.map(r=>r.assoc).filter(Boolean)).sort());
  const ds=uniq(all.flatMap(r=>r.dirs||[]));
  $('dirs').innerHTML=ds.length?ds.map(d=>`<label><input type="checkbox" value="${esc(d)}">${esc(d)}</label>`).join(''):'<span class="count">لا توجد بيانات بعد</span>';
}

function filtered(){
  const q=$('q').value.trim().toLowerCase();
  const pmin=num($('pmin').value),pmax=num($('pmax').value),amin=num($('amin').value),amax=num($('amax').value);
  const bt=$('bt').value,as=$('assoc').value;
  const ds=[...document.querySelectorAll('#dirs input:checked')].map(x=>x.value);
  return all.filter(r=>{
    const p=num(r.price),a=num(r.area);
    if(pmin!=null&&(p==null||p<pmin))return false;
    if(pmax!=null&&(p==null||p>pmax))return false;
    if(amin!=null&&(a==null||a<amin))return false;
    if(amax!=null&&(a==null||a>amax))return false;
    if(bt&&r.btype!==bt)return false;
    if(as&&r.assoc!==as)return false;
    if(ds.length&&!ds.some(d=>(r.dirs||[]).includes(d)))return false;
    if(q&&!(JSON.stringify(r)+split(r)).toLowerCase().includes(q))return false;
    return true;
  });
}

function render(){
  const rows=filtered();
  $('cnt').textContent='('+rows.length+' من '+all.length+')';
  const ps=rows.map(r=>num(r.price)).filter(v=>v!=null);
  $('stats').textContent=ps.length?`أقل سعر: ${fmt(Math.min(...ps))}  |  أعلى سعر: ${fmt(Math.max(...ps))}`:'';
  $('tb').innerHTML=rows.length?rows.map((r,i)=>`<tr>
    <td>${i+1}</td><td>${esc(r.assoc)}</td><td>${esc(r.area)}</td><td>${esc(r.floor)}</td>
    <td>${esc((r.dirs||[]).join('، '))}</td><td>${esc(split(r))}</td><td>${esc(r.btype)}</td>
    <td>${esc(r.owner)}</td><td dir="ltr" style="text-align:right">${esc(r.phone)}</td><td>${esc(fmt(num(r.price))||r.price)}</td>
    <td>${esc(r.rec)}</td><td class="notes">${esc(r.notes)}</td>
    <td class="row" style="flex-wrap:nowrap"><a class="sm" href="index.html?edit=${r.id}">تعديل</a><button class="sm del" data-d="${r.id}">حذف</button></td>
  </tr>`).join(''):'<tr><td colspan="13" class="empty">ما في نتائج. جرّب تمسح الفلاتر أو أضف عقار من صفحة الإضافة.</td></tr>';
}

async function init(){all=await loadAll();buildFilters();render()}
['q','pmin','pmax','amin','amax','bt','assoc'].forEach(id=>$(id).addEventListener('input',render));
$('dirs').addEventListener('change',render);
$('reset').onclick=()=>{
  $('q').value='';['pmin','pmax','amin','amax','bt','assoc'].forEach(id=>$(id).value='');
  document.querySelectorAll('#dirs input').forEach(x=>x.checked=false);render();
};
$('tb').onclick=async e=>{
  const b=e.target.closest('button[data-d]');if(!b)return;
  if(confirm('حذف هذا العقار؟')){try{await removeRecord(Number(b.dataset.d))}catch(err){alert('ما انحذف: '+err.message)}await init()}
};

const c=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
$('csv').onclick=()=>{
  const rows=filtered();if(!rows.length){alert('ما في بيانات للتصدير');return}
  const h=['اسم الجمعية','المساحة','الطابق','الاتجاه','غرف نوم','حمام','مطبخ','اسم المالك','ملاحظات','السعر','رقم المحضر','نوع البناء','رقم هاتف المالك'];
  const L=[h.map(c).join(',')].concat(rows.map(r=>[r.assoc,r.area,r.floor,(r.dirs||[]).join('، '),r.bed,r.bath,r.kit,r.owner,r.notes,r.price,r.rec,r.btype,r.phone].map(c).join(',')));
  download('العقارات.csv','\ufeff'+L.join('\r\n'),'text/csv;charset=utf-8');
};
$('json').onclick=()=>download('data.json',JSON.stringify(all,null,2),'application/json');

$('mode').textContent=modeText();
init();
