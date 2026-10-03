'use strict';
const COUNTRIES='السعودية|اليمن|عُمان|الإمارات العربية المتحدة|قطر|البحرين|الكويت|الأردن|العراق|فلسطين|سوريا|لبنان|مصر|السودان|ليبيا|تونس|الجزائر|المغرب|موريتانيا|إيران|أفغانستان|باكستان|بنغلاديش|المالديف|أذربيجان|كازاخستان|قيرغيزستان|طاجيكستان|تركمانستان|أوزبكستان|تركيا|ألبانيا|إندونيسيا|ماليزيا|بروناي|السنغال|غامبيا|غينيا|غينيا بيساو|سيراليون|مالي|النيجر|بوركينا فاسو|بنين|توغو|ساحل العاج|نيجيريا|تشاد|الكاميرون|الغابون|أوغندا|جيبوتي|الصومال|موزمبيق|جزر القمر|غيانا|سورينام|الهند|البوسنة والهرسك'.split('|');
const REGION_NAMES='الجزيرة العربية|العراق وبلاد الشام|شمال أفريقيا|إيران وجنوب آسيا|آسيا الوسطى والقوقاز|أوروبا|جنوب شرق آسيا|غرب أفريقيا|وسط وشرق أفريقيا|الأمريكتان|فصول تكميلية'.split('|');
const regionOf=c=>c<7?0:c<12?1:c<19?2:c<24?3:c<30?4:c<32?5:c<35?6:c<47?7:c<55?8:c<57?9:10;
const NAV=[['leaders','الحكام والقادة'],['wars','الحروب والصراعات'],['firaq','الفرق والردود'],['figures','القادة العسكريون والحركات'],['scholars','العلماء والمفتون']];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ar=v=>String(v??'').replace(/\d/g,n=>'٠١٢٣٤٥٦٧٨٩'[n]);
const norm=v=>String(v??'').normalize('NFKD').replace(/[\u064b-\u065f\u0670\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').toLowerCase();
const DAY=86400000, MIN=Date.UTC(1926,0,8), MAX=Date.UTC(2026,8,30)+DAY;
function stamp(v,last=false){const p=String(v).split('-').map(Number);if(!p[0])return NaN;if(p.length===1)return Date.UTC(p[0]+(last?1:0),0,1);if(p.length===2)return Date.UTC(p[0],p[1]-(last?0:1),1);return Date.UTC(p[0],p[1]-1,p[2])+(last?DAY:0);}
function hijriStart(y){return (1948439.5+354*(y-1)+Math.floor((3+11*y)/30)-2440587.5)*DAY;}
function hijriYear(t){let y=Math.floor((t/DAY+2440587.5-1948439.5)/354.367)+1;while(hijriStart(y)>t)y--;while(hijriStart(y+1)<=t)y++;return y;}
let D, items=[], current=[], selected='', ah=true, redrawTimer;
const $=id=>document.getElementById(id);
function sourceURL(n){const x=typeof n==='number'?D.sources[n]:n;return typeof x==='string'&&/^https?:\/\//.test(x)?x:'';}
function sources(ids){return [...new Set(ids||[])].map((n,i)=>{const u=sourceURL(n);return u?`<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">المصدر ${ar(i+1)} ↗</a>`:'';}).join('');}
function normalizeData(){
 if(D.items)return D.items;
 return D.rows.map(r=>{
  if(D.kind==='leaders')return {id:r[0],name:r[1],category:String(r[9]),description:r[5]+'؛ '+r[6],note:r[10]||'',sources:[r[7]],spans:[[r[2],r[3],r[4],r[5],String(r[9]),'bar',r[8],r[6]]]};
  if(D.kind==='wars')return {id:r[0],name:r[1],description:r[2],outcome:r[3],note:r[4],sources:r[5],spans:r[6],category:String(r[6][0][4])};
  if(D.kind==='figures')return {id:r[0],name:r[1],category:String(r[6]),description:r[7],outcome:r[8],note:r[9],sources:r[10],records:r[11]||[],spans:[[r[2],r[4],r[5],r[3],String(r[6]),'bar',r[12]]]};
  if(D.kind==='scholars')return {id:r[0],name:r[1],category:r[3],description:r[7],note:r[8],sources:r[9],fiqh:r[4],birth:r[5],endLabel:r[6],endType:r[14],mufti:r[12],dissent:r[13],spans:[[r[2],r[5],r[6],'نطاق الحياة حتى الوفاة أو آخر رصد',r[3],'life',r[11]],...r[10]]};
  return r;
 });
}
function categoryLabel(k){return D.categories?.[k]?.[0]||k||'غير محدد';}
function color(k){return D.categories?.[k]?.[1]||'#477c70';}
function init(){
 D=window.CHART_DATA;if(!D){document.body.innerHTML='<p class="error">تعذر تحميل بيانات الصفحة. تأكد من وجود مجلد البيانات ثم أعد فتح الصفحة.</p>';return;}
 items=normalizeData();document.title=D.title+' — المخططات الموسوعية';
 const regional=D.kind==='firaq', regs=regional?D.regions.map((r,i)=>[i,r.name]):REGION_NAMES.map((n,i)=>[i,n]);
 document.body.innerHTML=`<header><a class="brand" href="index.html">المخططات الموسوعية العربية</a><nav><a href="index.html">الفهرس</a>${NAV.map(([k,n])=>`<a href="${k}.html" ${k===D.kind?'aria-current="page"':''}>${n}</a>`).join('')}</nav></header><main><div class="kicker">الجزيرة العربية أولًا · ١٣٤٤–١٤٤٨ هـ / ١٩٢٦–٢٠٢٦ م</div><h1>${esc(D.title)}</h1><p class="credit">أعددت هذه المخططات بمساعدة تشات جي بي تي لتنظيم المادة وترجمتها وعرضها. المداخل مرتبطة بمصادرها وقابلة للمراجعة والتصحيح.</p><section class="controls"><div class="filters"><label>البحث<input id="search" type="search" placeholder="ابحث بالاسم أو البلد أو الموضوع"></label><label>الإقليم<select id="region"><option value="">جميع الأقاليم</option>${regs.map(([v,n])=>`<option value="${v}">${esc(n)}</option>`).join('')}</select></label>${regional?'':`<label>البلد<select id="country"><option value="">جميع البلدان</option>${COUNTRIES.slice(0,D.kind==='scholars'?59:57).map((n,i)=>`<option value="${i}">${esc(n)}</option>`).join('')}</select></label>`}<label>التصنيف<select id="category"><option value="">جميع التصنيفات</option>${Object.entries(D.categories||{}).map(([k,v])=>`<option value="${esc(k)}">${esc(v[0])}</option>`).join('')}</select></label>${D.kind==='scholars'?'<label>نوع السجل<select id="special"><option value="">جميع التراجم</option><option value="mufti">مناصب الإفتاء</option><option value="dissent">نزاع أو معارضة موثقة</option></select></label><label class="check"><input id="life" type="checkbox" checked>إظهار نطاق الحياة</label>':''}${D.kind==='figures'?'<label>السجل المنسوب<select id="special"><option value="">جميع الشخصيات</option><option value="legal">سجل قانوني</option><option value="honor">تكريم منسوب</option></select></label>':''}${regional?'':`<label>من سنة ميلادية<input id="from" type="number" min="1926" max="2026" value="1926"></label><label>إلى سنة ميلادية<input id="to" type="number" min="1926" max="2026" value="2026"></label><label>تكبير الزمن<input id="zoom" type="range" min="0" max="160" value="0" aria-label="تكبير المحور الزمني"></label><label class="check"><input id="empty" type="checkbox">إظهار الصفوف الخالية</label>`}</div><div class="buttons"><button id="arabia" class="primary">الجزيرة العربية فقط</button><button id="reset">عرض الجميع</button>${regional?'':'<button id="fit">ملاءمة العرض</button><button id="axis">المحور: هجري أولًا</button><button data-years="1926,1959">١٩٢٦–١٩٥٩</button><button data-years="1960,1989">١٩٦٠–١٩٨٩</button><button data-years="1990,2009">١٩٩٠–٢٠٠٩</button><button data-years="2010,2026">٢٠١٠–٢٠٢٦</button>'}<button id="export">تنزيل السجل المعروض</button></div><p class="help">${regional?'اختر مدخلًا لقراءة التعريف ومسائل المقارنة والردود المنسوبة. المواضع الإقليمية فصول بحث، لا إحصاء للسكان.':'اضغط على اسم أو شريط لعرض التفاصيل والمصادر. ضيّق الفترة أو كبّر العرض لقراءة المقاطع القصيرة. الزمن يتقدم من اليمين إلى اليسار.'}</p></section><div class="legend">${Object.entries(D.categories||{}).map(([k,v])=>`<span><i style="background:${esc(v[1])}"></i>${esc(v[0])}</span>`).join('')}${regional?'':'<span>▧ آخر رصد أو فترة غير محسومة</span><span>◇ حدث مؤرخ</span>'}${D.kind==='scholars'?'<span>الشريط الفاتح: نطاق الحياة</span>':''}</div><div id="rangeError" role="status"></div><div id="chartWrap" tabindex="0" aria-label="المخطط التفاعلي"><div id="timeline"></div></div><p id="status" class="small" aria-live="polite"></p><p class="notice">تعريب مختصر للنسخة البحثية السابقة، وحدها ٣٠ سبتمبر ٢٠٢٦؛ ليس تحديثًا مستقلًا للوقائع. الخط أو النطاق لا يثبت استمرار المنصب أو النزاع حتى اليوم. السنوات الهجرية حساب مدني، لا توثيق للرؤية المحلية. الخانات الخالية لا تثبت غياب الأحداث.</p><section id="detail" class="detail" hidden></section><section class="register"><h2>سجل المداخل</h2><div class="table-wrap"><table><thead><tr><th>المدخل</th><th>${regional?'الأقاليم':'البلدان والفترة'}</th><th>الوصف</th><th>${regional?'حالة البحث':'النتيجة أو الملاحظة'}</th></tr></thead><tbody id="register"></tbody></table></div></section><details class="method"><summary>المنهج وحدود القراءة</summary><p>حُفظت أسماء السجلات وفتراتها من المادة السابقة، مع تعريب مختصر للشروح. بعض الأسماء الأجنبية لها صيغ تعريب متعددة. راجع المصدر المرتبط قبل الاستشهاد، وميّز تاريخ الواقعة من تاريخ رصدها.</p><p>تظهر المدد التي لا يعرف منها إلا العام أو الشهر بحدود حسابية لتسهيل الرسم. المقاطع القصيرة توسع بصريًا ليمكن اختيارها. لا تجمع مراحل الحرب المتداخلة باعتبارها حروبًا مستقلة.</p><p>الألوان تصنيفات وصفية وليست مراتب أو أحكامًا على الأشخاص. النسبة العلمية أو المذهبية لا تثبت انتماءً سياسيًا؛ ومنصب الإفتاء الوطني يختلف عن الإفتاء الإقليمي أو منصب جماعة دينية. الاتهام والعقوبة والإدانة ورفع الإدراج سجلات مختلفة.</p><p>في الفرق والردود، يُنسب النقد إلى قائله وتُحدد المسألة؛ لا يُنسب قول إلى جميع الأفراد ولا تُستنتج النيات. المداخل غير المكتملة موسومة بذلك، ولا يرسم لها تاريخ حضور إقليمي مفترض.</p></details><footer><a href="index.html">العودة إلى فهرس المخططات</a> · <a href="https://om4rw8.wixsite.com/games">الموقع الرئيسي</a></footer></main>`;
 for(const id of ['search','region','country','category','special','from','to','zoom','empty','life'])if($(id))$(id).addEventListener(id==='search'||id==='zoom'?'input':'change',()=>{clearTimeout(redrawTimer);redrawTimer=setTimeout(draw,70);});
 $('arabia').onclick=()=>{$('region').value='0';if($('country'))$('country').value='';draw();};
 $('reset').onclick=()=>{for(const id of ['search','region','country','category','special'])if($(id))$(id).value='';if($('from')){$('from').value=1926;$('to').value=2026;$('zoom').value=0;}draw();};
 if($('fit'))$('fit').onclick=()=>{$('zoom').value=0;draw();};
 if($('axis'))$('axis').onclick=()=>{ah=!ah;$('axis').textContent=ah?'المحور: هجري أولًا':'المحور: ميلادي أولًا';draw();};
 document.querySelectorAll('[data-years]').forEach(b=>b.onclick=()=>{[$('from').value,$('to').value]=b.dataset.years.split(',');$('zoom').value=0;draw();});
 $('export').onclick=exportRows;
 document.body.addEventListener('click',e=>{const b=e.target.closest('[data-id]');if(b)show(b.dataset.id);});
 const q=new URLSearchParams(location.search);if(q.has('q'))$('search').value=q.get('q');draw();if(q.has('id'))show(q.get('id'),false);
 window.addEventListener('resize',()=>{clearTimeout(redrawTimer);redrawTimer=setTimeout(draw,130);});
}
function filtered(){
 const q=norm($('search').value),r=$('region').value,c=$('country')?.value||'',k=$('category').value,sp=$('special')?.value||'';
 return items.filter(p=>{
  const countries=[...new Set((p.spans||[]).map(s=>s[0]))];
  if(q&&!norm([p.name,p.description,p.outcome,p.note,...countries.map(i=>COUNTRIES[i])].join(' ')).includes(q))return false;
  if(D.kind==='firaq'){if(r!==''&&!p.regions.includes(+r))return false;}else{if(r!==''&&!countries.some(i=>regionOf(i)===+r))return false;if(c!==''&&!countries.includes(+c))return false;}
  if(k!==''&&String(p.category)!==k&&!(p.spans||[]).some(s=>String(s[4])===k))return false;
  if(sp==='mufti'&&!p.mufti||sp==='dissent'&&!p.dissent)return false;
  if((sp==='legal'||sp==='honor')&&!(p.records||[]).some(x=>x[0]===sp))return false;
  return true;
 });
}
function draw(){
 current=filtered();if(D.kind==='firaq'){drawRegions();register();return;}
 let fy=+$('from').value,ty=+$('to').value;if(!Number.isInteger(fy)||!Number.isInteger(ty)||fy<1926||ty>2026||fy>ty){$('rangeError').textContent='أدخل فترة صحيحة بين ١٩٢٦ و٢٠٢٦، بحيث لا تسبق النهاية البداية.';return;}$('rangeError').textContent='';
 const A=Math.max(MIN,Date.UTC(fy,0,1)),B=Math.min(MAX,Date.UTC(ty+1,0,1)),label=innerWidth<700?150:220,width=Math.max(240,$('chartWrap').clientWidth-label-4,(ty-fy+1)*(+$('zoom').value)),pos=t=>100*(t-A)/(B-A);
 document.documentElement.style.setProperty('--label',label+'px');
 const tickCount=Math.max(2,Math.floor(width/90)),years=(B-A)/DAY/(ah?354.367:365.2425),step=years/tickCount>7?10:years/tickCount>3?5:years/tickCount>1.5?2:1,ticks=[];
 if(ah){for(let y=hijriYear(A);y<=hijriYear(B);y++){const t=hijriStart(y);if(t>=A&&t<B&&y%step===0)ticks.push([t,ar(y)+' هـ',ar(new Date(t).getUTCFullYear())+' م']);}}else for(let y=fy;y<=ty;y++){const t=Date.UTC(y,0,1);if(t>=A&&t<B&&y%step===0)ticks.push([t,ar(y)+' م',ar(hijriYear(t))+' هـ']);}
 const grid=ticks.map(([t])=>`<i class="gridline" style="right:${pos(t)}%"></i>`).join('');
 let out=`<div class="axis"><div class="axis-label">البلد / الإقليم<small>نطاقات متزامنة · انقر للتفاصيل</small></div><div class="rail" style="width:${width}px">${ticks.map(([t,a,b])=>`<div class="tick" style="right:${pos(t)}%"><b>${a}</b><small>${b}</small></div>`).join('')}</div></div>`,lastRegion=-1,bars=0;
 current=current.filter(p=>(p.spans||[]).some(s=>stamp(s[1])<B&&stamp(s[2],true)>A));
 const group=new Map();for(const p of current)for(const s of p.spans||[]){if($('region').value!==''&&regionOf(s[0])!==+$('region').value||$('country').value!==''&&s[0]!==+$('country').value||$('category').value!==''&&String(s[4])!==$('category').value)continue;if(s[5]==='life'&&$('life')&&!$('life').checked)continue;let a=Math.max(A,stamp(s[1])),b=Math.min(B,stamp(s[2],true));if(!Number.isFinite(a)||!Number.isFinite(b)||b<=a)continue;if(!group.has(s[0]))group.set(s[0],[]);group.get(s[0]).push({p,s,a,b});}
 for(let c=0;c<(D.kind==='scholars'?59:57);c++){
  if($('region').value!==''&&regionOf(c)!==+$('region').value||$('country').value!==''&&c!==+$('country').value)continue;
  const list=group.get(c)||[];if(!list.length&&!$('empty').checked)continue;
  if(regionOf(c)!==lastRegion){lastRegion=regionOf(c);out+=`<div class="region-row"><span>${REGION_NAMES[lastRegion]}</span></div>`;}
  let end=[],html='',height=46;const personBase=new Map();
  if(D.kind==='scholars'){for(const x of list)if(!personBase.has(x.p.id))personBase.set(x.p.id,personBase.size*72);height=Math.max(46,personBase.size*72+9);}
  list.sort((a,b)=>a.a-b.a||a.b-b.b);
  for(const x of list){let y;if(D.kind==='scholars')y=personBase.get(x.p.id)+(x.s[5]==='life'?7:x.s[5]==='event'?47:36);else{let lane=end.findIndex(t=>t<=x.a);if(lane<0)lane=end.length;end[lane]=Math.max(x.b,x.a+8/width*(B-A));y=8+lane*33;height=Math.max(height,y+34);}
   const right=pos(x.a),w=Math.max(x.s[5]==='event'?11:7,(x.b-x.a)/(B-A)*width),title=x.p.name+' — '+(x.s[3]||'')+' — '+ar(x.s[1])+' إلى '+ar(x.s[2]),col=color(x.s[4]);
   html+=`<button class="bar ${x.s[5]||'bar'} ${x.s[6]?'open':''} ${x.p.id===selected?'selected':''} ${w<30?'short':''}" data-id="${esc(x.p.id)}" title="${esc(title)}" aria-label="${esc(title)}" style="right:${right}%;top:${y}px;width:${w}px;--bar:${esc(col)};background-color:${esc(col)}">${x.s[5]==='event'?'':esc(x.p.name)}</button>`;bars++;
   if(x.s[6]&&x.b<B)html+=`<span class="tail" title="الفترة اللاحقة غير متحققة" style="right:${pos(x.b)}%;top:${y+13}px;width:${100-pos(x.b)}%"></span>`;
  }
  out+=`<div class="country-row"><div class="country-label"><strong>${COUNTRIES[c]}</strong><small>${ar(new Set(list.map(x=>x.p.id)).size)} مدخلًا معروضًا</small></div><div class="rail" style="width:${width}px;height:${height}px">${grid}${html||'<p class="empty">لا يوجد مدخل مطابق في هذه النسخة.</p>'}</div></div>`;
 }
 $('timeline').style.width=(width+label)+'px';$('timeline').innerHTML=out;$('status').textContent=`${ar(current.length)} مدخلًا مطابقًا · ${ar(bars)} مقطعًا مرسومًا · افتح السجل لقراءة الأسماء القصيرة.`;register();
}
function drawRegions(){
 $('chartWrap').classList.add('regional');let out='';D.regions.forEach((r,i)=>{if($('region').value!==''&&i!==+$('region').value)return;const p=current.filter(p=>p.regions.includes(i));out+=`<section class="region-card"><h2>${esc(r.name)}</h2><p class="small">${esc(r.note||'توزيع لفصول البحث، لا تقرير للانتشار السكاني.')}</p><div class="chips">${p.map(x=>`<button data-id="${esc(x.id)}" style="border-right:4px solid ${esc(color(x.category))}">${esc(x.name)}<small>${esc(categoryLabel(x.category))}</small></button>`).join('')||'<p>لا مداخل مطابقة لهذا الاختيار.</p>'}</div></section>`;});$('timeline').innerHTML=out;$('status').textContent=ar(current.length)+' مدخلًا مطابقًا؛ المداخل غير المنجزة موسومة في التفاصيل.';
}
function register(){
 $('register').innerHTML=current.map(p=>{const spans=p.spans||[],cs=[...new Set(spans.map(s=>COUNTRIES[s[0]]))].join('، '),period=spans.length?ar(spans[0][1])+' — '+ar(spans[0][2]):'';return `<tr><td><button data-id="${esc(p.id)}">${esc(p.name)}</button><small>${esc(categoryLabel(p.category))}</small></td><td>${D.kind==='firaq'?p.regions.map(i=>esc(D.regions[i].name)).join('، '):esc(cs)+'<small>'+esc(period)+'</small>'}</td><td>${esc(p.description||'')}</td><td>${esc(p.outcome||p.status||p.note||'')}</td></tr>`;}).join('');
}
function show(id,scroll=true){
 const p=items.find(x=>String(x.id)===String(id));if(!p)return;selected=p.id;document.querySelectorAll('.bar').forEach(x=>x.classList.toggle('selected',x.dataset.id===String(id)));
 let text=`<div class="detail-head"><div><div class="small">${esc(categoryLabel(p.category))}</div><h2>${esc(p.name)}</h2></div><button id="close">إغلاق التفاصيل</button></div><p>${esc(p.description||'')}</p>`;
 if(p.fiqh)text+=`<p><b>الانتماء الفقهي:</b> ${esc(p.fiqh)}</p>`;
 if(p.birth)text+=`<p><b>الميلاد:</b> ${ar(p.birth)} · <b>${esc(p.endType||'نهاية نطاق الرصد')}:</b> ${ar(p.endLabel)}</p>`;
 if(p.outcome)text+=`<h3>النتيجة أو آخر حالة مسجلة</h3><p>${esc(p.outcome)}</p>`;
 if(p.note)text+=`<p class="notice">${esc(p.note)}</p>`;
 if(p.question)text+=`<h3>مسائل المقارنة</h3><p>${esc(p.question)}</p>`;
 if(p.status)text+=`<p><b>حالة البحث:</b> ${esc(p.status)}</p>`;
 text+=`<div class="sources">${sources(p.sources)}</div>`;
 if(p.spans?.length)text+=`<h3>الفترات والأحداث</h3><div class="table-wrap"><table><thead><tr><th>البلد</th><th>الفترة</th><th>الدور أو الحدث</th><th>القيد</th></tr></thead><tbody>${p.spans.map(s=>`<tr><td>${COUNTRIES[s[0]]}</td><td>${ar(s[1])} — ${ar(s[2])}</td><td>${esc(s[3]||'')}<small>${esc(s[7]||'')}</small></td><td>${esc(s[8]||'')}${s[6]?' آخر رصد مسجل؛ ليس تاريخ انتهاء مثبتًا.':''}</td></tr>`).join('')}</tbody></table></div>`;
 for(const rec of p.records||[])text+=`<section class="record"><h3>${esc(rec[1])}</h3><small>${ar(rec[2])}</small><p>${esc(rec[3])}</p><div class="sources">${sources([rec[4]])}</div></section>`;
 for(const key of p.issues||[]){const n=D.notes[key];if(n)text+=`<section class="record"><h3>${esc(n.title)}</h3><p><b>المسألة:</b> ${esc(n.question)}</p><p><b>الرد المنسوب:</b> ${esc(n.answer)}</p><p><b>الدليل:</b> ${esc(n.evidence)}</p><p class="small">${esc(n.limit)}</p><div class="sources">${sources(n.sources)}</div></section>`;}
 $('detail').innerHTML=text;$('detail').hidden=false;$('close').onclick=()=>{$('detail').hidden=true;};if(scroll)$('detail').scrollIntoView({behavior:'smooth',block:'start'});try{const u=new URL(location.href);u.searchParams.set('id',p.id);history.replaceState(null,'',u);}catch{}
}
function exportRows(){
 const cell=x=>'"'+String(x??'').replace(/"/g,'""')+'"';const head=['الاسم','التصنيف','البلدان أو الأقاليم','الفترات','الوصف','النتيجة','الملاحظات','المصادر'];const rows=current.map(p=>[p.name,categoryLabel(p.category),D.kind==='firaq'?p.regions.map(i=>D.regions[i].name).join('؛ '):[...new Set((p.spans||[]).map(s=>COUNTRIES[s[0]]))].join('؛ '),(p.spans||[]).map(s=>ar(s[1])+' إلى '+ar(s[2])).join('؛ '),p.description,p.outcome||p.status,p.note,(p.sources||[]).map(sourceURL).join(' | ')]);const blob=new Blob(['\ufeff'+[head,...rows].map(r=>r.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=D.kind+'-ar.csv';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
