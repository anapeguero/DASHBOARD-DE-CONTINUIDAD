const $=id=>document.getElementById(id), SOURCE='data.xlsx'; let rows=[], monthly=[], activePage='general', charts={}, multiState={};
const money=n=>'RD$'+Math.round(Number(n)||0).toLocaleString('en-US'), moneyM=n=>'RD$'+((Number(n)||0)/1e6).toFixed(1)+' M', pct=n=>(Number(n)||0).toFixed(2)+'%';
function norm(s){return String(s??'').trim()} function num(v){const n=Number(v);return Number.isFinite(n)?n:0} function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function destroy(k){if(charts[k]){charts[k].destroy();delete charts[k]}}
function totals(a){let plan=0,real=0,comm=0; a.forEach(r=>{plan+=r.plan;real+=r.real;comm+=r.comm}); const exec=real+comm; return {plan,real,comm,exec,pending:plan-exec,p:plan?exec/plan:0}}
function group(a,key){const m=new Map();a.forEach(r=>{const k=r[key]||'Sin clasificar';if(!m.has(k))m.set(k,[]);m.get(k).push(r)});return [...m].map(([label,v])=>({label,...totals(v)}))}
function kpisHTML(t){return [['P','Presupuesto',money(t.plan)],['R','Real',money(t.real)],['C','Comprometido',money(t.comm)],['E','Ejecución',money(t.exec)],['P','Pendiente',money(t.pending)],['%','% Ejecución',pct(t.p*100)]].map(x=>`<article class="kpi card"><div class="kpi-icon">${x[0]}</div><div><span>${x[1]}</span><strong>${x[2]}</strong></div></article>`).join('')}
function buildMulti(id,options,onchange){multiState[id]=new Set();const el=$(id);el.innerHTML=`<div class="multi-head"><span>Todos</span><b>⌄</b></div><div class="multi-menu"><label><input type="checkbox" data-all checked> Todos</label>${options.map(o=>`<label><input type="checkbox" value="${esc(o)}"> ${esc(o)}</label>`).join('')}</div>`;const head=el.querySelector('.multi-head'),menu=el.querySelector('.multi-menu');head.onclick=()=>el.classList.toggle('open');menu.addEventListener('change',e=>{const set=multiState[id];if(e.target.dataset.all!==undefined){set.clear();menu.querySelectorAll('input:not([data-all])').forEach(x=>x.checked=false);e.target.checked=true}else{menu.querySelector('[data-all]').checked=false;e.target.checked?set.add(e.target.value):set.delete(e.target.value);if(!set.size)menu.querySelector('[data-all]').checked=true}head.querySelector('span').textContent=set.size?`${set.size} tienda${set.size>1?'s':''} seleccionada${set.size>1?'s':''}`:'Todos';onchange()})}
function selected(id){return multiState[id]||new Set()} function fillSelect(id,vals){$(id).innerHTML='<option value="">Todos</option>'+[...new Set(vals.filter(Boolean))].sort().map(v=>`<option>${esc(v)}</option>`).join('')}
function filterRows(base,centerId,formatId,supraId){const cs=selected(centerId),f=$(formatId)?.value||'',s=$(supraId)?.value||'';return base.filter(r=>(!cs.size||cs.has(r.center))&&(!f||r.format===f)&&(!s||r.supra===s))}
const fiscalMonths=['Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre','Enero','Febrero','Marzo']; const qmap={T1:['Abril','Mayo','Junio'],T2:['Julio','Agosto','Septiembre'],T3:['Octubre','Noviembre','Diciembre'],T4:['Enero','Febrero','Marzo']};
function currentFiscalIndex(){const names=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];return fiscalMonths.indexOf(names[new Date().getMonth()])}

function arrangeGeneralLayout(){
  const page=$('page-general');
  if(!page)return;
  const filters=page.querySelector('.filters');
  const future=page.querySelector('.future-plan-card');
  const annual=page.querySelector('#generalKpis');
  const date=page.querySelector('.date-kpis');
  if(filters&&future&&annual&&date){
    filters.after(future);
    future.after(annual);
    annual.after(date);
  }
}

function renderGeneral(){
  arrangeGeneralLayout();
  const a=filterRows(rows,'gCenter','gFormat');
  const t=totals(a);
  $('generalKpis').innerHTML=kpisHTML(t);

  const q=$('gQuarter').value;
  let ms=monthly.filter(x=>!q||qmap[q].includes(x.month));

  const ci=currentFiscalIndex();
  let td=monthly.filter(x=>fiscalMonths.indexOf(x.month)<=ci);
  if(q)td=td.filter(x=>qmap[q].includes(x.month));

  const ptd=td.reduce((s,x)=>s+x.plan,0),
        etd=td.reduce((s,x)=>s+x.exec,0),
        cp=ptd?etd/ptd:0;

  $('planToDate').textContent=money(ptd);
  $('execToDate').textContent=money(etd);
  $('toDatePct').textContent=pct(cp*100);
  $('monthCaption').textContent=q?`acumulado dentro de ${q}`:`hasta ${fiscalMonths[Math.max(ci,0)]}`;
  $('toDateVariance').textContent=`${money(etd-ptd)} vs plan del período`;

  // Bloque de próximos meses: SOLO responde al filtro Trimestre.
  let futureMonths;
  if(q){
    futureMonths=monthly.filter(x=>qmap[q].includes(x.month));
    $('futurePlanTitle').textContent=`Ejecución mensual del ${q}`;
  }else{
    futureMonths=monthly.filter(x=>fiscalMonths.indexOf(x.month)>ci).slice(0,3);
    $('futurePlanTitle').textContent='Ejecución de los próximos 3 meses';
  }
  const futureTotal=futureMonths.reduce((s,x)=>s+x.plan,0);
  $('futurePlanTotal').textContent=money(futureTotal);
  $('futurePlanMonths').innerHTML=futureMonths.length
    ? futureMonths.map(x=>{
        const ratio=x.plan?x.exec/x.plan:0, display=Math.max(0,ratio*100), fill=Math.min(display,100);
        const cls=display>=100?'battery-over':display>=80?'battery-good':display>=50?'battery-mid':'battery-low';
        return `<div class="future-month ${fiscalMonths.indexOf(x.month)===ci?'current':''}">
          <div class="m-name">${esc(x.month)}</div>
          <div class="m-plan">${money(x.plan)}</div>
          <div class="m-note">Plan programado del mes</div>
          <div class="m-exec"><span>Ejecutado</span><b>${money(x.exec)}</b></div>
          <div class="month-status ${display>=100?'ahead':display>=80?'ontrack':'behind'}">${display>=100?'ADELANTADO':display>=80?'EN LÍNEA':'ATRASADO'}</div>
          <div class="battery-wrap">
            <div class="battery-label"><span>Ejecución del mes</span><b>${pct(display)}</b></div>
            <div class="battery-shell ${cls}">
              <div class="battery-terminal"></div>
              <div class="battery-fill" style="height:${fill}%"></div>
              <div class="battery-lines"><i></i><i></i><i></i><i></i></div>
            </div>
          </div>
        </div>`;
      }).join('')
    : `<div class="insight">No hay meses dentro del período seleccionado.</div>`;

  let ap=0,ae=0;
  const lp=[],le=[];
  ms.forEach(x=>{ap+=x.plan;ae+=x.exec;lp.push(ap);le.push(ae)});

  destroy('curve');
  charts.curve=new Chart($('curveChart'),{
    type:'line',
    data:{labels:ms.map(x=>x.month),datasets:[
      {label:'Plan acumulado',data:lp,borderColor:'#174a84',backgroundColor:'#174a84',tension:.25},
      {label:'Ejecución acumulada',data:le,borderColor:'#078d36',backgroundColor:'#078d36',tension:.25}
    ]},
    options:chartMoneyOpts()
  });

  destroy('variance');
  charts.variance=new Chart($('varianceChart'),{
    type:'bar',
    data:{labels:ms.map(x=>x.month),datasets:[{
      label:'Ejecución del mes - Plan del mes',
      data:ms.map(x=>x.exec-x.plan),
      backgroundColor:ms.map(x=>x.exec-x.plan>=0?'#078d36':'#d71920')
    }]},
    options:chartMoneyOpts(false)
  });

  const cg=group(a,'center').filter(x=>x.plan||x.exec).sort((x,y)=>y.exec-x.exec).slice(0,12);
  destroy('gc');
  charts.gc=new Chart($('gCenterChart'),{
    type:'bar',
    data:{labels:cg.map(x=>x.label),datasets:[
      {label:'Presupuesto',data:cg.map(x=>x.plan),backgroundColor:'#dbe3e6'},
      {label:'Ejecución (Real + Comprometido)',data:cg.map(x=>x.exec),backgroundColor:'#078d36'}
    ]},
    options:chartMoneyOpts(false,'y')
  });

  const top=[...cg].sort((x,y)=>y.p-x.p)[0];
  const monthPerf=ms.map(x=>({month:x.month,plan:x.plan,exec:x.exec,p:x.plan?x.exec/x.plan:0,d:x.exec-x.plan}));
  const below=monthPerf.filter(x=>x.p<1).sort((a,b)=>a.p-b.p);
  const best=monthPerf.filter(x=>x.plan>0).sort((a,b)=>b.p-a.p)[0];
  const centerAll=group(a,'center').filter(x=>x.exec>0).sort((x,y)=>y.exec-x.exec);
  const leader=centerAll[0];
  const leaderShare=leader&&t.exec?leader.exec/t.exec*100:0;
  const pendingShare=t.plan?Math.max(t.plan-t.exec,0)/t.plan*100:0;
  $('executiveRead').innerHTML=
    `<div class="insight ${cp>=1?'good':'warn'}"><b>${cp>=1?'Vamos por encima del plan acumulado del período.':'Vamos por debajo del plan acumulado del período.'}</b><br>Ejecutado mensual: ${money(etd)} vs Plan: ${money(ptd)} (${pct(cp*100)}).</div>
     ${below.length?`<div class="insight warn"><b>${esc(below[0].month)} presenta la mayor brecha frente al plan.</b><br>Faltan ${money(Math.abs(Math.min(below[0].d,0)))} para alcanzar lo programado del mes.</div>`:(best?`<div class="insight good"><b>Todos los meses visibles cumplen o superan su plan.</b><br>${esc(best.month)} registra el mayor cumplimiento con ${pct(best.p*100)}.</div>`:'')}
     <div class="insight"><b>${pct(pendingShare)} del presupuesto anual filtrado permanece pendiente.</b><br>Equivale a ${money(Math.max(t.plan-t.exec,0))}.</div>
     ${leader?`<div class="insight"><b>${esc(leader.label)} concentra la mayor ejecución entre los centros seleccionados.</b><br>Representa ${pct(leaderShare)} de la ejecución filtrada (${money(leader.exec)}).</div>`:''}`;
}
function moneyAxis(v){
  const n=Number(v)||0,a=Math.abs(n);
  if(a>=1e9)return 'RD$ '+(n/1e9).toFixed(a>=10e9?0:1)+' B';
  if(a>=1e6)return 'RD$ '+(n/1e6).toFixed(a>=10e6?0:1)+' MM';
  if(a>=1e3)return 'RD$ '+(n/1e3).toFixed(a>=10e3?0:1)+' mil';
  return 'RD$ '+Math.round(n).toLocaleString('en-US');
}
function chartMoneyOpts(legend=true,indexAxis='x'){
  const numeric=indexAxis==='y'?'x':'y',category=indexAxis==='y'?'y':'x';
  return {
    responsive:true,maintainAspectRatio:false,indexAxis,
    plugins:{legend:{display:legend}},
    scales:{
      [numeric]:{beginAtZero:true,ticks:{callback:moneyAxis},grid:{color:'#edf1f2'}},
      [category]:{grid:{display:false}}
    }
  }
}
function areaTemplate(area,id){
  const isOps=area==='Operaciones';
  return `<div class="area-head"><div><span class="section-kicker">ÁREA RESPONSABLE</span><h2>${area}</h2></div></div>
  <section class="card filters">
    <div class="section-title"><h2>Filtros de análisis</h2><button class="secondary-btn area-reset" data-id="${id}">Limpiar filtros</button></div>
    <div class="filter-grid area-filters">
      <div><label>Centro / Tienda</label><div id="${id}Center" class="multi"></div></div>
      <label>Formato<select id="${id}Format"></select></label>
      <label>Supranúmero<select id="${id}Supra"></select></label>
      <label>Estado de ejecución
        <select id="${id}ExecState">
          <option value="">Todas las partidas</option>
          <option value="none">Sin ejecución (Real = 0 y Comprometido = 0)</option>
          <option value="with">Con ejecución</option>
        </select>
        <span class="exec-filter-note">Permite aislar partidas que todavía no han iniciado.</span>
      </label>
    </div>
  </section>

  <section class="kpi-grid ${isOps?'area-kpi-operations':''}" id="${id}Kpis"></section>

  <section class="area-grid ${isOps?'operations-grid':''}">
    <article class="card">
      <div class="card-title">Estado financiero del presupuesto del área: Plan vs Comprometido vs Real</div>
      <div class="chart-box"><canvas id="${id}Flow"></canvas></div>
    </article>
    <article class="card">
      <div class="card-title">Top 10 partidas con mayor presupuesto pendiente de ejecutar</div>
      <div class="chart-box"><canvas id="${id}Pending"></canvas></div>
    </article>
    <article class="card">
      <div class="card-title">Alertas de gestión sobre la ejecución del área</div>
      <div id="${id}Alerts" class="alert-cards"></div>
      <div id="${id}Concentration" class="insight" style="margin-top:10px"></div>
    </article>
  </section>

  <section class="card detail-card">
    <div class="detail-head">
      <div><div class="card-title">Detalle de ejecución por tienda y partida</div><small id="${id}Count"></small></div>
      <button class="export-btn" data-export="${id}">Exportar vista CSV</button>
    </div>
    <div class="table-wrap">
      <table class="detail-table">
        <thead><tr>
          <th>Centro</th><th>Formato</th><th>Descripción de Partida</th>
          <th>Plan</th><th>Real</th><th>Comprometido</th><th>Ejecución</th><th>Pendiente</th>
          <th>% Ejec.</th>
        </tr></thead>
        <tbody id="${id}Body"></tbody>
      </table>
    </div>
  </section>`;
}
function areaBase(area){return rows.filter(r=>area==='Mantenimiento'?r.resp.includes('Mantenimiento'):r.resp===area)}
function filterAreaRows(base,id){
  let a=filterRows(base,id+'Center',id+'Format',id+'Supra');
  const state=$(id+'ExecState')?.value||'';
  if(state==='none')a=a.filter(r=>r.real===0&&r.comm===0);
  if(state==='with')a=a.filter(r=>r.real>0||r.comm>0);
  return a;
}
function renderArea(id,area){
  const base=areaBase(area),
        a=filterAreaRows(base,id),
        t=totals(a),
        isOps=area==='Operaciones';
  $(id+'Kpis').innerHTML=kpisHTML(t);

  destroy(id+'Flow');
  charts[id+'Flow']=new Chart($(id+'Flow'),{
    type:'bar',
    data:{labels:['Presupuesto aprobado','Comprometido','Real'],datasets:[{
      data:[t.plan,t.comm,t.real],
      backgroundColor:['#174a84','#ffd21a','#0aa4d6']
    }]},
    options:chartMoneyOpts(false)
  });

  const pg=group(a,'desc').filter(x=>x.pending>0).sort((x,y)=>y.pending-x.pending).slice(0,10);
  destroy(id+'Pending');
  charts[id+'Pending']=new Chart($(id+'Pending'),{
    type:'bar',
    data:{labels:pg.map(x=>x.label),datasets:[{
      label:'Presupuesto pendiente',
      data:pg.map(x=>x.pending),
      backgroundColor:'#d71920'
    }]},
    options:chartMoneyOpts(false,'y')
  });

  const noExec=a.filter(r=>r.plan>0&&r.real===0&&r.comm===0).length,
        over=a.filter(r=>r.plan>0&&r.exec>r.plan).length,
        highComm=a.filter(r=>r.plan>0&&r.comm/r.plan>=.8&&r.real/r.plan<.2).length,
        noPlan=a.filter(r=>r.plan===0&&r.exec>0).length;

  $(id+'Alerts').innerHTML=[
    [noExec,'Partidas sin ejecución'],
    [over,'Partidas sobre ejecutadas'],
    [highComm,'Alto compromiso y poco real'],
    [noPlan,'Ejecución sin presupuesto']
  ].map(x=>`<div class="alert-card"><strong>${x[0]}</strong><span>${x[1]}</span></div>`).join('');

  const pos=group(a,'desc').filter(x=>x.pending>0).sort((x,y)=>y.pending-x.pending),
        totalPend=pos.reduce((s,x)=>s+x.pending,0),
        topPend=pos.slice(0,8).reduce((s,x)=>s+x.pending,0);

  $(id+'Concentration').innerHTML=
    `<b>Concentración del pendiente:</b> las 8 partidas con mayor presupuesto pendiente concentran ${pct(totalPend?topPend/totalPend*100:0)} del pendiente positivo del área.`;


  $(id+'Count').textContent=`${a.length} registros`;

  $(id+'Body').innerHTML=a.map(r=>{
    return `<tr>
      <td><b>${esc(r.center)}</b></td>
      <td>${esc(r.format)}</td>
      <td>${esc(r.desc)}</td>
      <td class="money">${money(r.plan)}</td>
      <td class="money">${money(r.real)}</td>
      <td class="money">${money(r.comm)}</td>
      <td class="money"><b>${money(r.exec)}</b></td>
      <td class="money">${money(r.plan-r.exec)}</td>
      <td class="money pct">${pct(r.plan?r.exec/r.plan*100:0)}</td>
    </tr>`;
  }).join('');
}
function setupArea(id,area){
  const slot=document.querySelector(`#page-${id} .area-slot`);
  slot.innerHTML=areaTemplate(area,id);
  const base=areaBase(area);

  buildMulti(id+'Center',[...new Set(base.map(r=>r.center))].sort(),()=>renderArea(id,area));
  fillSelect(id+'Format',base.map(r=>r.format));

  const supras=[...new Map(base.filter(r=>r.supra).map(r=>[r.supra,`${r.desc||r.supra}`])).entries()]
    .sort((a,b)=>a[1].localeCompare(b[1]));
  $(id+'Supra').innerHTML='<option value="">Todos</option>'+
    supras.map(([v,l])=>`<option value="${esc(v)}">${esc(l)}</option>`).join('');

  $(id+'Format').onchange=
  $(id+'Supra').onchange=
  $(id+'ExecState').onchange=()=>renderArea(id,area);

  slot.querySelector('.area-reset').onclick=()=>{
    multiState[id+'Center'].clear();
    setupArea(id,area);
    renderArea(id,area);
  };

  slot.querySelector('[data-export]').onclick=()=>exportArea(id,area);
  renderArea(id,area);
}
function exportArea(id,area){
  const a=filterAreaRows(areaBase(area),id),isOps=area==='Operaciones';
  const hdr=['Centro','Formato','Supranumero','Descripcion','Plan','Real','Comprometido','Ejecucion','Pendiente','% Ejecucion'];

  const data=a.map(r=>{
    const row=[r.center,r.format,r.supra,r.desc,r.plan,r.real,r.comm,r.exec,r.plan-r.exec];
    row.push(r.plan?r.exec/r.plan:0);
    return row;
  });

  const lines=[hdr,...data]
    .map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(','))
    .join('\n');

  const blob=new Blob(['\ufeff'+lines],{type:'text/csv'}),
        u=URL.createObjectURL(blob),
        ael=document.createElement('a');

  ael.href=u;
  ael.download=`CAPEX_${area}.csv`;
  ael.click();
  URL.revokeObjectURL(u);
}
function chatAdd(t,s='bot'){const d=document.createElement('div');d.className='chat-message '+s;d.textContent=t;$('chatMessages').appendChild(d);$('chatMessages').scrollTop=99999}function activeRows(){if(activePage==='operaciones')return areaBase('Operaciones');if(activePage==='mantenimiento')return areaBase('Mantenimiento');return rows}function answer(q){q=q.toLowerCase();const a=activeRows(),t=totals(a),g=group(a,'desc').sort((x,y)=>y.pending-x.pending),c=group(a,'center').sort((x,y)=>y.exec-x.exec);if(q.includes('resumen'))return `Presupuesto: ${money(t.plan)}\nReal: ${money(t.real)}\nComprometido: ${money(t.comm)}\nEjecución: ${money(t.exec)} (${pct(t.p*100)})\nPendiente: ${money(t.pending)}`;if(q.includes('sin ejecucion')){const z=a.filter(r=>r.real===0&&r.comm===0&&r.plan>0);return `${z.length} registros con presupuesto no tienen Real ni Comprometido.`}

if(q.includes('pendiente'))return g.slice(0,5).map((x,i)=>`${i+1}. ${x.label}: ${money(x.pending)}`).join('\n');if(q.includes('centro'))return c[0]?`${c[0].label} tiene la mayor ejecución: ${money(c[0].exec)}.`:'Sin datos';return `En esta vista la ejecución es ${money(t.exec)} (${pct(t.p*100)}). Puedes preguntarme por resumen, centros o partidas con mayor pendiente.`}
async function load(){try{const r=await fetch(SOURCE+'?v=11',{cache:'no-store'});if(!r.ok)throw Error('No se pudo abrir data.xlsx');const b=await r.arrayBuffer(),wb=XLSX.read(b,{type:'array'}),d=XLSX.utils.sheet_to_json(wb.Sheets['Detalle Centro-Supra'],{defval:''}),m=XLSX.utils.sheet_to_json(wb.Sheets['Ejecucion mensual'],{defval:''});rows=d.map(x=>({center:norm(x.Centro),format:norm(x.Formato),supra:norm(x.Supranumero),desc:norm(x.Descripcion),plan:num(x['Plan (RD$)']),real:num(x['Real (RD$)']),comm:num(x['Comprometido (RD$)']),exec:num(x['Real (RD$)'])+num(x['Comprometido (RD$)']),resp:norm(x.Responsable)}));monthly=m.map(x=>({month:norm(x.Mes),plan:num(x.Plan),exec:num(x.Ejecutado)})).sort((a,b)=>fiscalMonths.indexOf(a.month)-fiscalMonths.indexOf(b.month));$('dataSource').textContent=`${rows.length} registros · ${monthly.length} meses · actualizado ${new Date().toLocaleString('es-DO')}`;buildMulti('gCenter',[...new Set(rows.map(r=>r.center))].sort(),renderGeneral);fillSelect('gFormat',rows.map(r=>r.format));$('gFormat').onchange=$('gQuarter').onchange=renderGeneral;document.querySelector('#page-general .reset-page').onclick=()=>location.reload();setupArea('operaciones','Operaciones');setupArea('mantenimiento','Mantenimiento');renderGeneral()}catch(e){$('dataSource').textContent='ERROR DE DATOS: '+e.message;$('dataSource').style.color='#d71920'}}
document.addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('.nav-btn').forEach(b=>b.onclick=()=>{activePage=b.dataset.page;document.querySelectorAll('.nav-btn').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id==='page-'+activePage))});$('chatToggle').onclick=()=>$('chatPanel').classList.toggle('open');$('chatClose').onclick=()=>$('chatPanel').classList.remove('open');document.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{chatAdd(b.dataset.q,'user');chatAdd(answer(b.dataset.q))});$('chatForm').onsubmit=e=>{e.preventDefault();const q=$('chatInput').value.trim();if(q){chatAdd(q,'user');chatAdd(answer(q));$('chatInput').value=''}};load()});
