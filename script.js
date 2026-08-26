const SOURCE_FILE = "Panel de Ejecucion CAPEX.xlsx";
const SHEET_NAME = "Detalle Centro-Supra";
let allRows = [], filteredRows = [], charts = {};
const $ = id => document.getElementById(id);
const money = value => new Intl.NumberFormat("es-DO",{style:"currency",currency:"DOP",maximumFractionDigits:0}).format(Number(value)||0);
const money2 = value => new Intl.NumberFormat("es-DO",{style:"currency",currency:"DOP",maximumFractionDigits:2}).format(Number(value)||0);
const pct = value => `${(Number(value)||0).toLocaleString("es-DO",{minimumFractionDigits:2,maximumFractionDigits:2})}%`;
function num(v){if(typeof v==="number") return Number.isFinite(v)?v:0;if(v==null||v==="")return 0;const n=Number(String(v).replace(/[RD$,\s]/g,"").replace("%",""));return Number.isFinite(n)?n:0}
function normalize(v){return String(v??"").trim()}
function calculateRow(r){
  const plan=num(r["Plan (RD$)"]), real=num(r["Real (RD$)"]), committed=num(r["Comprometido (RD$)"]);
  const execution=real+committed, pending=plan-execution, percent=plan?execution/plan:0;
  return {centro:normalize(r["Centro"]),formato:normalize(r["Formato"]),supra:normalize(r["Supranumero"]),descripcion:normalize(r["Descripcion"])||"Sin descripción",plan,real,committed,execution,pending,percent,status:normalize(r["Estatus"])};
}
async function loadWorkbook(arrayBuffer,sourceLabel){
  const workbook=XLSX.read(arrayBuffer,{type:"array"});
  const sheet=workbook.Sheets[SHEET_NAME]||workbook.Sheets[workbook.SheetNames[0]];
  if(!sheet)throw new Error("No se encontró una hoja utilizable.");
  const raw=XLSX.utils.sheet_to_json(sheet,{defval:""});
  allRows=raw.map(calculateRow).filter(r=>r.centro||r.descripcion||r.plan||r.real||r.committed);
  $("dataSource").textContent=`${sourceLabel} • ${allRows.length} registros cargados`;
  populateFilters();applyFilters();
}
async function loadDefault(){
  try{
    if(typeof XLSX==="undefined") throw new Error("No se pudo cargar la librería de Excel.");
    if(typeof Chart==="undefined") throw new Error("No se pudo cargar la librería de gráficos.");const response=await fetch(SOURCE_FILE);if(!response.ok)throw new Error(`No se pudo abrir ${SOURCE_FILE}`);await loadWorkbook(await response.arrayBuffer(),SOURCE_FILE)}
  catch(err){$("dataSource").textContent="No se pudo cargar la fuente de datos: "+err.message}
}
function uniqueSorted(field){return [...new Set(allRows.map(r=>r[field]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"es",{numeric:true}))}
function fillSelect(id,values,allLabel="Todos"){const s=$(id),cur=s.value;s.innerHTML=`<option value="">${allLabel}</option>`+values.map(v=>`<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");if(values.includes(cur))s.value=cur}
function fillSupraFilter(){
  const select=$("supraFilter"), current=select.value;
  const map=new Map();
  allRows.forEach(r=>{if(r.supra&&!map.has(r.supra))map.set(r.supra,r.descripcion||r.supra)});
  const options=[...map.entries()].sort((a,b)=>a[1].localeCompare(b[1],"es",{numeric:true}));
  select.innerHTML='<option value="">Todos</option>'+options.map(([value,label])=>`<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join("");
  if(options.some(([value])=>value===current))select.value=current;
}
function populateFilters(){fillSelect("centerFilter",uniqueSorted("centro"));fillSelect("formatFilter",uniqueSorted("formato"));fillSupraFilter()}
function applyFilters(){
  const center=$("centerFilter").value,format=$("formatFilter").value,supra=$("supraFilter").value;
  filteredRows=allRows.filter(r=>(!center||r.centro===center)&&(!format||r.formato===format)&&(!supra||r.supra===supra));render()
}
function aggregate(rows,field){const map=new Map();rows.forEach(r=>{const key=r[field]||"Sin clasificar";if(!map.has(key))map.set(key,{plan:0,real:0,committed:0,execution:0});const x=map.get(key);x.plan+=r.plan;x.real+=r.real;x.committed+=r.committed;x.execution+=r.execution});return [...map.entries()].map(([label,v])=>({label,...v,percent:v.plan?v.execution/v.plan:0})).sort((a,b)=>b.execution-a.execution)}
function totals(rows){const t=rows.reduce((a,r)=>{a.plan+=r.plan;a.real+=r.real;a.committed+=r.committed;a.execution+=r.execution;return a},{plan:0,real:0,committed:0,execution:0});t.pending=t.plan-t.execution;t.percent=t.plan?t.execution/t.plan:0;return t}
function render(){const t=totals(filteredRows);$("kpiPlan").textContent=money(t.plan);$("kpiReal").textContent=money(t.real);$("kpiCommitted").textContent=money(t.committed);$("kpiExecuted").textContent=money(t.execution);$("kpiPending").textContent=money(t.pending);$("kpiPercent").textContent=pct(t.percent*100);$("gaugeValue").textContent=pct(t.percent*100);$("rowCount").textContent=`${filteredRows.length.toLocaleString("es-DO")} registros`;renderGauge(t.percent);renderCenterChart();renderSupraChart();renderFormatChart();renderSupraDistributionChart();renderTable()}
function destroyChart(key){if(charts[key])charts[key].destroy()}
const chartBase={responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},animation:{duration:350}};
function renderGauge(percent){destroyChart("gauge");const shown=Math.min(Math.max(percent,0),1);charts.gauge=new Chart($("gaugeChart"),{type:"doughnut",data:{datasets:[{data:[shown,Math.max(1-shown,0)],backgroundColor:["#0aa4d6","#e6ecef"],borderWidth:0,cutout:"82%"}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{enabled:false}}}})}
function renderCenterChart(){destroyChart("center");const data=aggregate(filteredRows,"centro").slice(0,12);charts.center=new Chart($("centerChart"),{type:"bar",data:{labels:data.map(x=>x.label),datasets:[{label:"Plan",data:data.map(x=>x.plan),backgroundColor:"#dce4e7"},{label:"Ejecución",data:data.map(x=>x.execution),backgroundColor:"#078d36"}]},options:{...chartBase,indexAxis:"y",plugins:{legend:{display:true,position:"bottom",labels:{font:{size:10}}}},scales:{x:{ticks:{callback:v=>formatMillions(v)},grid:{color:"#edf1f2"}},y:{ticks:{font:{size:9}},grid:{display:false}}}}})}
function renderSupraChart(){destroyChart("supra");const data=aggregate(filteredRows,"descripcion").slice(0,12);charts.supra=new Chart($("supraChart"),{type:"bar",data:{labels:data.map(x=>shortLabel(x.label,32)),datasets:[{label:"Plan",data:data.map(x=>x.plan),backgroundColor:"#dce4e7"},{label:"Ejecución",data:data.map(x=>x.execution),backgroundColor:"#2525ad"}]},options:{...chartBase,indexAxis:"y",plugins:{legend:{display:true,position:"bottom",labels:{font:{size:10}}},tooltip:{callbacks:{title:items=>data[items[0].dataIndex].label}}},scales:{x:{ticks:{callback:v=>formatMillions(v)},grid:{color:"#edf1f2"}},y:{ticks:{font:{size:9}},grid:{display:false}}}}})}
function renderFormatChart(){
  destroyChart("format");
  const data=aggregate(filteredRows,"formato").filter(x=>x.label!=="Sin clasificar");
  charts.format=new Chart($("formatChart"),{
    type:"bar",
    data:{
      labels:data.map(x=>x.label),
      datasets:[{label:"% Ejecución",data:data.map(x=>x.percent*100),backgroundColor:"#078d36"}]
    },
    options:{
      responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>`${ctx.raw.toFixed(2)}%`}}},
      scales:{
        y:{beginAtZero:true,ticks:{callback:v=>v+"%"},grid:{color:"#edf1f2"}},
        x:{grid:{display:false}}
      }
    }
  });
}
function renderSupraDistributionChart(){
  destroyChart("supraDistribution");

  const data=aggregate(filteredRows,"descripcion")
    .filter(x=>x.plan>0)
    .sort((a,b)=>b.plan-a.plan);

  const top=data.slice(0,7);
  const rest=data.slice(7);
  if(rest.length){
    top.push({
      label:"Otros",
      plan:rest.reduce((sum,x)=>sum+x.plan,0),
      real:0,
      committed:0,
      execution:0,
      percent:0
    });
  }

  const palette=["#12407e","#0aa4d6","#078d36","#ffd21a","#d71920","#8b989e","#2525ad","#6dbb45"];

  charts.supraDistribution=new Chart($("supraDistributionChart"),{
    type:"doughnut",
    data:{
      labels:top.map(x=>x.label),
      datasets:[{
        data:top.map(x=>x.plan),
        backgroundColor:top.map((_,i)=>palette[i%palette.length]),
        borderColor:"#ffffff",
        borderWidth:2,
        cutout:"58%"
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      plugins:{
        legend:{
          position:"right",
          labels:{
            boxWidth:12,
            usePointStyle:true,
            pointStyle:"circle",
            font:{size:10},
            generateLabels(chart){
              const ds=chart.data.datasets[0];
              const total=ds.data.reduce((a,b)=>a+b,0);
              return chart.data.labels.map((label,i)=>{
                const value=ds.data[i];
                const percent=total?value/total*100:0;
                return {
                  text:`${shortLabel(label,27)} · ${formatMillions(value)} (${percent.toFixed(1)}%)`,
                  fillStyle:ds.backgroundColor[i],
                  strokeStyle:ds.backgroundColor[i],
                  lineWidth:0,
                  hidden:false,
                  index:i
                };
              });
            }
          }
        },
        tooltip:{
          callbacks:{
            label:ctx=>{
              const total=ctx.dataset.data.reduce((a,b)=>a+b,0);
              const p=total?ctx.raw/total*100:0;
              return `${ctx.label}: ${money2(ctx.raw)} (${p.toFixed(2)}%)`;
            }
          }
        }
      }
    }
  });
}
function renderTable(){$("dataTable").innerHTML=filteredRows.map(r=>`<tr><td><b>${escapeHtml(r.centro)}</b></td><td>${escapeHtml(r.formato)}</td><td>${escapeHtml(r.descripcion)}</td><td class="num">${money2(r.plan)}</td><td class="num">${money2(r.real)}</td><td class="num">${money2(r.committed)}</td><td class="num"><b>${money2(r.execution)}</b></td><td class="num">${money2(r.pending)}</td><td class="num"><b>${pct(r.percent*100)}</b></td></tr>`).join("")}
function shortLabel(v,n){return v.length>n?v.slice(0,n-1)+"…":v}
function formatMillions(v){const n=Number(v)||0;if(Math.abs(n)>=1e9)return`RD$ ${(n/1e9).toFixed(1)} B`;if(Math.abs(n)>=1e6)return`RD$ ${(n/1e6).toFixed(1)} M`;if(Math.abs(n)>=1e3)return`RD$ ${(n/1e3).toFixed(0)} K`;return`RD$ ${n}`}
function escapeHtml(value){return String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
function exportCSV(){const headers=["Centro","Formato","Descripción de Partida","Plan","Real","Comprometido","Ejecución","Pendiente","% Ejecución"];const lines=[headers.join(",")];filteredRows.forEach(r=>{lines.push([r.centro,r.formato,r.descripcion,r.plan,r.real,r.committed,r.execution,r.pending,r.percent].map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(","))});const blob=new Blob(["\ufeff"+lines.join("\n")],{type:"text/csv;charset=utf-8;"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="dashboard_ejecucion_filtrado.csv";a.click();URL.revokeObjectURL(a.href)}
["centerFilter","formatFilter","supraFilter"].forEach(id=>$(id).addEventListener("change",applyFilters));
$("resetBtn").addEventListener("click",()=>{["centerFilter","formatFilter","supraFilter"].forEach(id=>$(id).value="");applyFilters()});
$("exportBtn").addEventListener("click",exportCSV);
loadDefault();
