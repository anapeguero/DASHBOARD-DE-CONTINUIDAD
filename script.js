
const $=id=>document.getElementById(id);
const money=v=>{
  const n=Number(v)||0, a=Math.abs(n);
  if(a>=1e9)return `RD$ ${(n/1e9).toFixed(2)} B`;
  if(a>=1e6)return `RD$ ${(n/1e6).toFixed(1)} MM`;
  if(a>=1e3)return `RD$ ${(n/1e3).toFixed(1)} mil`;
  return `RD$ ${n.toLocaleString('es-DO',{maximumFractionDigits:0})}`;
};
const pct=v=>`${Math.round((Number(v)||0)*100)}%`;
const num=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
const txt=v=>(v??'').toString().trim();
const normalize=s=>txt(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const charts={};
let state={area:'Todas',quarter:'T1',page:'vp',center:'',actionArea:'Todas',onlyOpen:true};
let detail=[], monthly=[], actions=[];

function destroyChart(id){if(charts[id]){charts[id].destroy();delete charts[id]}}
function chart(id,type,labels,datasets,opts={}){
  destroyChart(id);
  const c=$(id); if(!c)return;
  charts[id]=new Chart(c,{
    type,data:{labels,datasets},
    options:{
      responsive:true,maintainAspectRatio:false,
      plugins:{legend:{position:'bottom',labels:{boxWidth:12,usePointStyle:true,font:{size:10}}},tooltip:{callbacks:{label:x=>`${x.dataset.label||''}: ${money(x.raw)}`}}},
      scales:opts.noScales?undefined:{
        y:{beginAtZero:true,grid:{color:'#e9eff4'},ticks:{callback:v=>money(v),font:{size:9}}},
        x:{grid:{display:false},ticks:{font:{size:9}}}
      }
    }
  })
}
function headerIndex(headers,candidates){
  const n=headers.map(normalize);
  for(const c of candidates){
    const q=normalize(c), i=n.findIndex(h=>h===q||h.includes(q)); if(i>=0)return i;
  }
  return -1;
}
function sheetRows(wb,name){
  const s=wb.Sheets[name]; if(!s)return [];
  return XLSX.utils.sheet_to_json(s,{header:1,defval:null,raw:true});
}
function areaOf(v){return normalize(v).includes('mantenimiento')?'Mantenimiento':'Operaciones'}
function currentDetail(){
  return detail.filter(r=>state.area==='Todas'||r.area===state.area).filter(r=>!state.center||r.center===state.center);
}
function aggregate(rows){
  return rows.reduce((a,r)=>{a.plan+=r.plan;a.real+=r.real;a.committed+=r.committed;return a},{plan:0,real:0,committed:0});
}
function execution(a){return a.real+a.committed}
function statusForRate(rate){
  if(rate>=.75)return {label:'En línea',cls:'good',color:'#35ad55'};
  if(rate>0)return {label:'Atención',cls:'warn',color:'#ff7816'};
  return {label:'Por iniciar',cls:'neutral',color:'#b8c0c7'};
}
function setRing(el,rate,color){if(!el)return;el.style.setProperty('--p',Math.max(0,Math.min(100,rate*100)));el.style.setProperty('--ring',color||statusForRate(rate).color)}
function updateViewChip(){
  $('viewChip').textContent=state.area==='Todas'
    ?'ⓘ  Vista actual: Todas las áreas (Operaciones + Mantenimiento)'
    :`ⓘ  Vista actual: ${state.area}`;
}
function fillAnnual(prefix){
  const a=aggregate(currentDetail()), e=execution(a), p=a.plan?e/a.plan:0;
  $(prefix+'Plan').textContent=money(a.plan);$(prefix+'Real').textContent=money(a.real);$(prefix+'Committed').textContent=money(a.committed);
  $(prefix+'Execution').textContent=money(e);$(prefix+'Pending').textContent=money(a.plan-e);
  const pctEl=$(prefix+'AnnualPct'); if(pctEl)pctEl.textContent=pct(p);
  const battery=pctEl?.closest('.battery-ring');setRing(battery,p,statusForRate(p).color);
  const cap=$(prefix+'AnnualCaption');if(cap)cap.textContent=`Ejecutado ${money(e)} de ${money(a.plan)} planificados`;
}
function quarterDef(){
  return [
    {id:'T1',label:'T1',range:'Abr – Jun',months:['Abril','Mayo','Junio']},
    {id:'T2',label:'T2',range:'Jul – Sep',months:['Julio','Agosto','Septiembre']},
    {id:'T3',label:'T3',range:'Oct – Dic',months:['Octubre','Noviembre','Diciembre']},
    {id:'T4',label:'T4',range:'Ene – Mar',months:['Enero','Febrero','Marzo']}
  ];
}
function monthlySubset(q){
  const def=quarterDef().find(x=>x.id===q);return monthly.filter(x=>def.months.includes(x.month));
}
function qAggregate(q){
  const rows=monthlySubset(q), plan=rows.reduce((s,x)=>s+x.plan,0), executed=rows.reduce((s,x)=>s+x.executed,0);
  return {plan,executed,rate:plan?executed/plan:0};
}
function renderQuarterCards(){
  $('vpQuarterCards').innerHTML=quarterDef().map(q=>{
    const a=qAggregate(q.id), st=statusForRate(a.rate);
    return `<article class="quarter-card">
      <h3>${q.label} <span style="font-weight:500">(${q.range})</span></h3>
      <div class="quarter-body">
        <div class="quarter-ring" style="--p:${Math.max(0,Math.min(100,a.rate*100))};--ring:${st.color}"><b>${pct(a.rate)}</b></div>
        <div class="quarter-info"><p><span>Plan:</span><b>${money(a.plan)}</b></p><p><span>Ejecución:</span><b>${money(a.executed)}</b></p><span class="status ${st.cls}">${st.label}</span></div>
      </div>
    </article>`
  }).join('');
}
function actionVisible(a){
  if(state.actionArea!=='Todas'&&a.area!==state.actionArea)return false;
  if(state.onlyOpen&&normalize(a.status)==='completado')return false;
  return true;
}
function isOpen(a){return normalize(a.status)!=='completado'}
function actionRow(a){
  const pr=normalize(a.priority), pcl=pr.includes('alta')?'high':pr.includes('media')?'medium':'low';
  const st=normalize(a.status), scl=st.includes('complet')?'complete':st.includes('pend')?'pending':'progress';
  return `<tr>
    <td><span class="pill ${pcl}">${a.priority||'—'}</span></td><td>${a.center||'—'}</td><td>${a.topic||'—'}</td>
    <td>${a.action||a.next||'—'}</td><td>${a.date||'—'}</td>
    <td><div class="progressline"><span>${Math.round(a.progress*100)}%</span><span class="progressbar"><i style="width:${Math.max(0,Math.min(100,a.progress*100))}%"></i></span></div></td>
    <td><span class="pill ${scl}">${a.status||'—'}</span></td>
  </tr>`;
}
function renderActions(){
  const all=actions.filter(actionVisible), open=all.filter(isOpen), high=open.filter(a=>normalize(a.priority).includes('alta'));
  $('actionOpen').textContent=open.length;$('actionHigh').textContent=high.length;
  $('actionImpact').textContent=money(open.reduce((s,a)=>s+a.impact,0));
  $('actionOwners').textContent=new Set(open.map(a=>a.owner).filter(Boolean)).size;
  const maint=all.filter(a=>a.area==='Mantenimiento'),ops=all.filter(a=>a.area==='Operaciones');
  $('maintOpenCount').textContent=`${maint.filter(isOpen).length} acciones abiertas`;$('opsOpenCount').textContent=`${ops.filter(isOpen).length} acciones abiertas`;
  $('maintActionBody').innerHTML=maint.length?maint.slice(0,8).map(actionRow).join(''):`<tr class="empty-row"><td colspan="7">Agrega acciones de Mantenimiento en la hoja “Plan de Acción”.</td></tr>`;
  $('opsActionBody').innerHTML=ops.length?ops.slice(0,8).map(actionRow).join(''):`<tr class="empty-row"><td colspan="7">Agrega acciones de Operaciones en la hoja “Plan de Acción”.</td></tr>`;

  const critical=open.filter(a=>normalize(a.priority).includes('alta'));
  const impact=open.reduce((s,a)=>s+a.impact,0);
  const qa=quarterDef().map(q=>({q,...qAggregate(q.id)})).sort((a,b)=>a.rate-b.rate)[0];
  $('alertsList').innerHTML=[
    `<div class="attention-item">🔴 <span><b>${critical.length}</b> acciones de alta prioridad abiertas.</span></div>`,
    `<div class="attention-item">🔴 <span><b>${money(impact)}</b> bajo seguimiento en acciones abiertas.</span></div>`,
    `<div class="attention-item">🔴 <span>${qa?`Ejecución de ${qa.q.label} en <b>${pct(qa.rate)}</b>.`:''}</span></div>`
  ].join('');

  const upcoming=open.filter(a=>a.dateObj).sort((a,b)=>a.dateObj-b.dateObj).slice(0,3);
  $('milestonesList').innerHTML=upcoming.length
    ?upcoming.map(a=>`<div class="milestone-item">${a.action||a.next||a.topic} — ${a.date}</div>`).join('')
    :`<div class="milestone-item">Agrega fechas de compromiso en “Plan de Acción” para ver próximos hitos.</div>`;
}
function renderMonths(){
  const rows=monthlySubset(state.quarter);
  $('monthCards').innerHTML=rows.map(m=>{
    const rate=m.plan?m.executed/m.plan:0;
    return `<article class="month-card"><h4>${m.month}</h4><div class="month-data">
      <div><span>PLAN</span><b>${money(m.plan)}</b></div><div><span>EJECUTADO</span><b>${money(m.executed)}</b></div><div><span>% AVANCE</span><b>${pct(rate)}</b></div>
    </div></article>`
  }).join('');
}
function renderGeneralCharts(){
  let cumP=0,cumE=0;
  const labels=monthly.map(x=>x.month), cp=monthly.map(x=>cumP+=x.plan), ce=monthly.map(x=>cumE+=x.executed);
  chart('curveChart','line',labels,[{label:'Plan acumulado',data:cp,borderColor:'#0c64b7',backgroundColor:'#0c64b7',tension:.25},{label:'Ejecutado acumulado',data:ce,borderColor:'#35ad55',backgroundColor:'#35ad55',tension:.25}]);
  chart('varianceChart','bar',labels,[{label:'Variación',data:monthly.map(x=>x.executed-x.plan),backgroundColor:monthly.map(x=>x.executed-x.plan>=0?'#35ad55':'#ef5360')}]);

  const by=new Map();
  currentDetail().forEach(r=>{const a=by.get(r.center)||{plan:0,exec:0};a.plan+=r.plan;a.exec+=r.real+r.committed;by.set(r.center,a)});
  const arr=[...by.entries()].sort((a,b)=>b[1].plan-a[1].plan).slice(0,20);
  chart('centerExecChart','bar',arr.map(x=>x[0]),[
    {label:'Plan',data:arr.map(x=>x[1].plan),backgroundColor:'#0c64b7'},
    {label:'Ejecución',data:arr.map(x=>x[1].exec),backgroundColor:'#35ad55'}
  ]);
}
function renderCenters(){
  const rows=currentDetail(), by=new Map();
  rows.forEach(r=>{const a=by.get(r.center)||{plan:0,real:0,committed:0};a.plan+=r.plan;a.real+=r.real;a.committed+=r.committed;by.set(r.center,a)});
  let arr=[...by.entries()].map(([center,a])=>({center,...a,exec:a.real+a.committed,pending:a.plan-a.real-a.committed}));
  arr.sort((a,b)=>b.plan-a.plan);
  const total=aggregate(rows), ex=execution(total);
  $('centerKpis').innerHTML=[
    ['Centros visibles',new Set(rows.map(r=>r.center)).size],['Plan',money(total.plan)],['Real',money(total.real)],['Comprometido',money(total.committed)],['% Ejecución',pct(total.plan?ex/total.plan:0)]
  ].map(x=>`<article class="center-kpi"><span>${x[0]}</span><b>${x[1]}</b></article>`).join('');
  chart('centerCompareChart','bar',arr.slice(0,18).map(x=>x.center),[
    {label:'Plan',data:arr.slice(0,18).map(x=>x.plan),backgroundColor:'#0c64b7'},
    {label:'Ejecución',data:arr.slice(0,18).map(x=>x.exec),backgroundColor:'#35ad55'}
  ]);
  const pend=[...arr].sort((a,b)=>b.pending-a.pending).slice(0,18);
  chart('centerPendingChart','bar',pend.map(x=>x.center),[{label:'Pendiente',data:pend.map(x=>x.pending),backgroundColor:'#ff7816'}]);
}
function renderDetail(){
  const q=normalize($('detailSearch').value), rows=currentDetail().filter(r=>!q||normalize([r.center,r.format,r.supra,r.description,r.area].join(' ')).includes(q));
  $('detailBody').innerHTML=rows.slice(0,500).map(r=>`<tr><td>${r.center}</td><td>${r.format}</td><td>${r.supra}</td><td>${r.description}</td>
    <td class="num">${money(r.plan)}</td><td class="num">${money(r.real)}</td><td class="num">${money(r.committed)}</td><td class="num">${money(r.real+r.committed)}</td>
    <td class="num">${money(r.plan-r.real-r.committed)}</td><td>${pct(r.plan?(r.real+r.committed)/r.plan:0)}</td><td>${r.area}</td></tr>`).join('');
}
function renderAll(){
  updateViewChip();fillAnnual('vp');fillAnnual('g');renderQuarterCards();renderActions();renderMonths();renderGeneralCharts();renderCenters();renderDetail();
}
function parseDetail(rows){
  if(!rows.length)return [];
  const h=rows[0];
  const c={
    center:headerIndex(h,['Centro']),format:headerIndex(h,['Formato']),supra:headerIndex(h,['Supranumero','Supranúmero']),
    desc:headerIndex(h,['Descripcion','Descripción']),plan:headerIndex(h,['Plan (RD$)','Plan RD$']),
    real:headerIndex(h,['Real (RD$)','Real RD$']),comm:headerIndex(h,['Comprometido (RD$)','Comprometido RD$']),
    area:headerIndex(h,['Responsable','Area','Área'])
  };
  return rows.slice(1).filter(r=>txt(r[c.center])).map(r=>({
    center:txt(r[c.center]),format:txt(r[c.format]),supra:txt(r[c.supra]),description:txt(r[c.desc]),
    plan:num(r[c.plan]),real:num(r[c.real]),committed:num(r[c.comm]),area:areaOf(r[c.area])
  }));
}
function parseMonthly(rows){
  if(!rows.length)return [];
  const h=rows[0], cm=headerIndex(h,['Mes']), cp=headerIndex(h,['Plan']), ce=headerIndex(h,['Ejecutado']);
  return rows.slice(1).filter(r=>txt(r[cm])).map(r=>({month:txt(r[cm]),plan:num(r[cp]),executed:num(r[ce])}));
}
function parseActions(rows){
  if(rows.length<2)return [];
  const h=rows[0], ix={
    id:headerIndex(h,['ID']),area:headerIndex(h,['Área','Area']),center:headerIndex(h,['Centro']),quarter:headerIndex(h,['Trimestre']),
    topic:headerIndex(h,['Tema']),situation:headerIndex(h,['Situación / Desviación','Situacion','Desviacion']),
    action:headerIndex(h,['Acción','Accion']),owner:headerIndex(h,['Responsable']),date:headerIndex(h,['Fecha compromiso']),
    status:headerIndex(h,['Estatus']),priority:headerIndex(h,['Prioridad']),impact:headerIndex(h,['Impacto RD$','Impacto']),
    progress:headerIndex(h,['% Avance','Avance']),next:headerIndex(h,['Próximo paso','Proximo paso']),
    updated:headerIndex(h,['Última actualización','Ultima actualizacion']),comment:headerIndex(h,['Comentario'])
  };
  const dateFmt=v=>{
    if(v instanceof Date)return v;
    if(typeof v==='number')return XLSX.SSF.parse_date_code(v)?new Date(XLSX.SSF.parse_date_code(v).y,XLSX.SSF.parse_date_code(v).m-1,XLSX.SSF.parse_date_code(v).d):null;
    const d=new Date(v);return isNaN(d)?null:d;
  };
  return rows.slice(1).filter(r=>txt(r[ix.action])||txt(r[ix.topic])).map(r=>{
    const dobj=dateFmt(r[ix.date]), rawP=num(r[ix.progress]), prog=rawP>1?rawP/100:rawP;
    return {area:areaOf(r[ix.area]),center:txt(r[ix.center]),topic:txt(r[ix.topic]),action:txt(r[ix.action]),owner:txt(r[ix.owner]),
      dateObj:dobj,date:dobj?new Intl.DateTimeFormat('es-DO',{day:'2-digit',month:'2-digit',year:'numeric'}).format(dobj):txt(r[ix.date]),
      status:txt(r[ix.status])||'Pendiente',priority:txt(r[ix.priority])||'Media',impact:num(r[ix.impact]),progress:prog,next:txt(r[ix.next])};
  });
}
async function load(){
  const res=await fetch('data.xlsx?ts='+Date.now()); if(!res.ok)throw new Error('No se pudo cargar data.xlsx');
  const buf=await res.arrayBuffer(), wb=XLSX.read(buf,{type:'array',cellDates:true});
  detail=parseDetail(sheetRows(wb,'Detalle Centro-Supra'));
  monthly=parseMonthly(sheetRows(wb,'Ejecucion mensual'));
  actions=parseActions(sheetRows(wb,'Plan de Acción').length?sheetRows(wb,'Plan de Acción'):sheetRows(wb,'Plan de Accion'));

  const centers=[...new Set(detail.map(x=>x.center))].sort();
  $('centerSelect').innerHTML='<option value="">Todos los centros</option>'+centers.map(x=>`<option>${x}</option>`).join('');
  $('lastUpdated').textContent=new Intl.DateTimeFormat('es-DO',{day:'2-digit',month:'long',year:'numeric'}).format(new Date());
  bind();renderAll();
}
function bind(){
  document.querySelectorAll('.nav-btn').forEach(b=>b.onclick=()=>{
    state.page=b.dataset.page;document.querySelectorAll('.nav-btn').forEach(x=>x.classList.toggle('active',x===b));
    document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));$('page-'+state.page).classList.add('active');
    $('headerSubtitle').textContent=state.page==='vp'?'RESUMEN EJECUTIVO PARA VP':state.page==='general'?'EJECUCIÓN GENERAL':state.page==='centros'?'ANÁLISIS POR CENTRO':'DETALLE DE INVERSIONES';
    setTimeout(renderAll,30);
  });
  document.querySelectorAll('#areaFilter button').forEach(b=>b.onclick=()=>{
    state.area=b.dataset.area;document.querySelectorAll('#areaFilter button').forEach(x=>x.classList.toggle('active',x===b));renderAll();
  });
  document.querySelectorAll('#quarterSelector button').forEach(b=>b.onclick=()=>{
    state.quarter=b.dataset.quarter;document.querySelectorAll('#quarterSelector button').forEach(x=>x.classList.toggle('active',x===b));renderMonths();
  });
  document.querySelectorAll('#actionAreaFilter button').forEach(b=>b.onclick=()=>{
    state.actionArea=b.dataset.actionArea;document.querySelectorAll('#actionAreaFilter button').forEach(x=>x.classList.toggle('active',x===b));renderActions();
  });
  $('onlyOpenActions').onchange=e=>{state.onlyOpen=e.target.checked;renderActions()};
  $('centerSelect').onchange=e=>{state.center=e.target.value;renderAll()};
  $('detailSearch').oninput=renderDetail;
}
window.addEventListener('DOMContentLoaded',()=>load().catch(err=>{
  console.error(err);document.body.insertAdjacentHTML('afterbegin',`<div style="padding:12px;background:#fee;color:#900;font-weight:700">Error cargando el dashboard: ${err.message}</div>`)
}));
