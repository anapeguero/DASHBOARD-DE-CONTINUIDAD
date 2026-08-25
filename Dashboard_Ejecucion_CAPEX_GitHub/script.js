const SOURCE_FILE = "Panel de Ejecucion CAPEX.xlsx";
const SHEET_NAME = "Detalle Centro-Supra";

let allRows = [];
let filteredRows = [];
let charts = {};

const $ = id => document.getElementById(id);

const money = value => new Intl.NumberFormat("es-DO", {
  style:"currency", currency:"DOP", maximumFractionDigits:0
}).format(Number(value) || 0);

const money2 = value => new Intl.NumberFormat("es-DO", {
  style:"currency", currency:"DOP", maximumFractionDigits:2
}).format(Number(value) || 0);

const pct = value => `${(Number(value)||0).toLocaleString("es-DO",{minimumFractionDigits:2,maximumFractionDigits:2})}%`;

function num(v){
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (v == null || v === "") return 0;
  const cleaned = String(v).replace(/[RD$,\s]/g,"").replace("%","");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function normalize(v){
  return String(v ?? "").trim();
}

function calculateRow(r){
  const plan = num(r["Plan (RD$)"]);
  const real = num(r["Real (RD$)"]);
  const committed = num(r["Comprometido (RD$)"]);
  const execution = real + committed;
  const pending = plan - execution;
  const percent = plan ? execution / plan : 0;
  return {
    centro: normalize(r["Centro"]),
    formato: normalize(r["Formato"]),
    supra: normalize(r["Supranumero"]),
    descripcion: normalize(r["Descripcion"]),
    plan, real, committed, execution, pending, percent,
    status: normalize(r["Estatus"])
  };
}

async function loadWorkbook(arrayBuffer, sourceLabel){
  const workbook = XLSX.read(arrayBuffer, {type:"array"});
  const sheet = workbook.Sheets[SHEET_NAME] || workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new Error("No se encontró una hoja utilizable.");

  const raw = XLSX.utils.sheet_to_json(sheet, {defval:""});
  allRows = raw.map(calculateRow).filter(r => r.centro || r.supra || r.plan || r.real || r.committed);

  $("dataSource").textContent = `${sourceLabel} • ${allRows.length} registros cargados`;
  populateFilters();
  applyFilters();
}

async function loadDefault(){
  try{
    const response = await fetch(SOURCE_FILE);
    if(!response.ok) throw new Error(`No se pudo abrir ${SOURCE_FILE}`);
    const buffer = await response.arrayBuffer();
    await loadWorkbook(buffer, SOURCE_FILE);
  }catch(err){
    $("statusMessage").innerHTML =
      `<strong>No se pudo cargar el Excel automáticamente.</strong> ${err.message}. ` +
      `Puedes usar el botón <b>Cargar otro Excel</b>.`;
    $("dataSource").textContent = "Esperando archivo Excel...";
  }
}

function uniqueSorted(field){
  return [...new Set(allRows.map(r => r[field]).filter(Boolean))]
    .sort((a,b)=>a.localeCompare(b,"es",{numeric:true}));
}

function fillSelect(id, values, allLabel="Todos"){
  const select = $(id);
  const current = select.value;
  select.innerHTML = `<option value="">${allLabel}</option>` +
    values.map(v=>`<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
  if(values.includes(current)) select.value = current;
}

function populateFilters(){
  fillSelect("centerFilter", uniqueSorted("centro"));
  fillSelect("formatFilter", uniqueSorted("formato"));
  fillSelect("supraFilter", uniqueSorted("supra"));
  fillSelect("statusFilter", uniqueSorted("status"));
}

function applyFilters(){
  const center = $("centerFilter").value;
  const format = $("formatFilter").value;
  const supra = $("supraFilter").value;
  const status = $("statusFilter").value;

  filteredRows = allRows.filter(r =>
    (!center || r.centro === center) &&
    (!format || r.formato === format) &&
    (!supra || r.supra === supra) &&
    (!status || r.status === status)
  );

  render();
}

function aggregate(rows, field){
  const map = new Map();
  rows.forEach(r=>{
    const key = r[field] || "Sin clasificar";
    if(!map.has(key)) map.set(key,{plan:0,real:0,committed:0,execution:0});
    const x=map.get(key);
    x.plan += r.plan;
    x.real += r.real;
    x.committed += r.committed;
    x.execution += r.execution;
  });
  return [...map.entries()].map(([label,v])=>({label,...v,percent:v.plan?v.execution/v.plan:0}))
    .sort((a,b)=>b.execution-a.execution);
}

function totals(rows){
  const t = rows.reduce((a,r)=>{
    a.plan += r.plan;
    a.real += r.real;
    a.committed += r.committed;
    a.execution += r.execution;
    return a;
  },{plan:0,real:0,committed:0,execution:0});
  t.pending = t.plan - t.execution;
  t.percent = t.plan ? t.execution/t.plan : 0;
  return t;
}

function render(){
  const t = totals(filteredRows);
  $("kpiPlan").textContent = money(t.plan);
  $("kpiReal").textContent = money(t.real);
  $("kpiCommitted").textContent = money(t.committed);
  $("kpiExecuted").textContent = money(t.execution);
  $("kpiPending").textContent = money(t.pending);
  $("kpiPercent").textContent = pct(t.percent*100);
  $("gaugeValue").textContent = pct(t.percent*100);
  $("rowCount").textContent = `${filteredRows.length.toLocaleString("es-DO")} registros`;

  renderGauge(t.percent);
  renderCenterChart();
  renderSupraChart();
  renderComposition(t);
  renderTable();
}

function destroyChart(key){
  if(charts[key]) charts[key].destroy();
}

const chartBase = {
  responsive:true,
  maintainAspectRatio:false,
  plugins:{legend:{display:false}},
  animation:{duration:350}
};

function renderGauge(percent){
  destroyChart("gauge");
  const shown = Math.min(Math.max(percent,0),1);
  charts.gauge = new Chart($("gaugeChart"),{
    type:"doughnut",
    data:{datasets:[{
      data:[shown,Math.max(1-shown,0)],
      backgroundColor:["#008c70","#e7eeee"],
      borderWidth:0,
      cutout:"82%"
    }]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{enabled:false}}}
  });
}

function renderCenterChart(){
  destroyChart("center");
  const data = aggregate(filteredRows,"centro").slice(0,12);
  charts.center = new Chart($("centerChart"),{
    type:"bar",
    data:{
      labels:data.map(x=>x.label),
      datasets:[
        {label:"Plan",data:data.map(x=>x.plan),backgroundColor:"#d9e2e5"},
        {label:"Ejecución",data:data.map(x=>x.execution),backgroundColor:"#008c70"}
      ]
    },
    options:{
      ...chartBase,
      indexAxis:"y",
      plugins:{legend:{display:true,position:"bottom",labels:{font:{size:10}}}},
      scales:{
        x:{ticks:{callback:v=>formatMillions(v)},grid:{color:"#edf1f2"}},
        y:{ticks:{font:{size:9}},grid:{display:false}}
      }
    }
  });
}

function renderSupraChart(){
  destroyChart("supra");
  const data = aggregate(filteredRows,"supra").slice(0,12);
  charts.supra = new Chart($("supraChart"),{
    type:"bar",
    data:{
      labels:data.map(x=>x.label),
      datasets:[
        {label:"Plan",data:data.map(x=>x.plan),backgroundColor:"#d9e2e5"},
        {label:"Ejecución",data:data.map(x=>x.execution),backgroundColor:"#b0cf00"}
      ]
    },
    options:{
      ...chartBase,
      indexAxis:"y",
      plugins:{legend:{display:true,position:"bottom",labels:{font:{size:10}}}},
      scales:{
        x:{ticks:{callback:v=>formatMillions(v)},grid:{color:"#edf1f2"}},
        y:{ticks:{font:{size:9}},grid:{display:false}}
      }
    }
  });
}

function renderComposition(t){
  destroyChart("composition");
  charts.composition = new Chart($("compositionChart"),{
    type:"doughnut",
    data:{
      labels:["Real","Comprometido","Pendiente"],
      datasets:[{
        data:[Math.max(t.real,0),Math.max(t.committed,0),Math.max(t.pending,0)],
        backgroundColor:["#008c70","#b0cf00","#d9e2e5"],
        borderColor:"#fff",borderWidth:3
      }]
    },
    options:{
      responsive:true,maintainAspectRatio:false,
      plugins:{legend:{position:"bottom",labels:{font:{size:10},padding:12}}}
    }
  });
}

function renderTable(){
  const tbody = $("dataTable");
  tbody.innerHTML = filteredRows.map(r=>{
    const statusClass = statusBadgeClass(r.status, r.percent);
    return `<tr>
      <td><b>${escapeHtml(r.centro)}</b></td>
      <td>${escapeHtml(r.formato)}</td>
      <td>${escapeHtml(r.supra)}</td>
      <td>${escapeHtml(r.descripcion)}</td>
      <td class="num">${money2(r.plan)}</td>
      <td class="num">${money2(r.real)}</td>
      <td class="num">${money2(r.committed)}</td>
      <td class="num"><b>${money2(r.execution)}</b></td>
      <td class="num">${money2(r.pending)}</td>
      <td class="num"><b>${pct(r.percent*100)}</b></td>
      <td><span class="badge ${statusClass}">${escapeHtml(r.status || deriveStatus(r.percent))}</span></td>
    </tr>`;
  }).join("");
}

function deriveStatus(p){
  if(p>=1) return "Completado";
  if(p>0) return "En Progreso";
  return "Pendiente de ejecutar";
}

function statusBadgeClass(status,p){
  const s=(status||"").toLowerCase();
  if(p>=1 || s.includes("complet")) return "done";
  if(s.includes("sobre") || p>1) return "danger";
  if(s.includes("pendiente") || p===0) return "warn";
  return "";
}

function formatMillions(v){
  const n=Number(v)||0;
  if(Math.abs(n)>=1e9) return `RD$ ${(n/1e9).toFixed(1)} B`;
  if(Math.abs(n)>=1e6) return `RD$ ${(n/1e6).toFixed(1)} M`;
  if(Math.abs(n)>=1e3) return `RD$ ${(n/1e3).toFixed(0)} K`;
  return `RD$ ${n}`;
}

function escapeHtml(value){
  return String(value ?? "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function exportCSV(){
  const headers=["Centro","Formato","Supranúmero","Descripción","Plan","Real","Comprometido","Ejecución","Pendiente","% Ejecución","Estatus"];
  const lines=[headers.join(",")];
  filteredRows.forEach(r=>{
    lines.push([
      r.centro,r.formato,r.supra,r.descripcion,
      r.plan,r.real,r.committed,r.execution,r.pending,r.percent,r.status
    ].map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(","));
  });
  const blob=new Blob(["\ufeff"+lines.join("\n")],{type:"text/csv;charset=utf-8;"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="dashboard_ejecucion_filtrado.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

["centerFilter","formatFilter","supraFilter","statusFilter"].forEach(id=>{
  $(id).addEventListener("change",applyFilters);
});

$("resetBtn").addEventListener("click",()=>{
  ["centerFilter","formatFilter","supraFilter","statusFilter"].forEach(id=>$(id).value="");
  applyFilters();
});

$("fileInput").addEventListener("change",async e=>{
  const file=e.target.files[0];
  if(!file) return;
  try{
    await loadWorkbook(await file.arrayBuffer(), file.name);
    $("statusMessage").innerHTML =
      `<strong>Excel cargado:</strong> ${escapeHtml(file.name)}. ` +
      `Los indicadores y gráficos se recalcularon con la fórmula <b>Real + Comprometido</b>.`;
  }catch(err){
    $("statusMessage").innerHTML = `<strong>Error:</strong> ${escapeHtml(err.message)}`;
  }
});

$("exportBtn").addEventListener("click",exportCSV);

loadDefault();
