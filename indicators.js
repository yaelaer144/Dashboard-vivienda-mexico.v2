(function(){
  const MXN = new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0});
  const NUM = new Intl.NumberFormat('es-MX',{maximumFractionDigits:1});
  const ABBR = {mdp:'millones de pesos',k:'miles',ha:'hectáreas',ho:'horas'};
  window.FMT = {
    money:v=>Number.isFinite(v)?MXN.format(v):'N/D',
    number:(v,d=1)=>Number.isFinite(v)?new Intl.NumberFormat('es-MX',{maximumFractionDigits:d}).format(v):'N/D',
    pct:v=>Number.isFinite(v)?`${NUM.format(v)}%`:'N/D',
    millionsFromThousands:v=>Number.isFinite(v)?new Intl.NumberFormat('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2}).format(v/1000):'N/D',
    mdp:v=>Number.isFinite(v)?new Intl.NumberFormat('es-MX',{maximumFractionDigits:0}).format(v):'N/D',
    daily:v=>Number.isFinite(v)?MXN.format(v):'N/D'
  };
  function kpiValue(value,unit){
    if(!unit || value==='N/D') return {html:value,foot:''};
    const u=String(unit).trim();
    if(/^porcentaje/i.test(u)) return {html:value,foot:''};
    if(ABBR[u]) return {html:`${value} <span class="kpi-value-unit">${u}</span>`,foot:`*${u} = ${ABBR[u]}`};
    if(/^índice\s+/i.test(u)) return {html:`${value} <span class="kpi-value-unit">${u.replace(/^índice\s+/i,'')}</span>`,foot:''};
    return {html:`${value} <span class="kpi-value-unit">${u}</span>`,foot:''};
  }
  window.UI = {
    kpi:(label,value,context,unit,note)=>{const v=kpiValue(value,unit);return `<article class="kpi"><div class="kpi-label">${label}</div><div class="kpi-value">${v.html}</div>${context?`<div class="kpi-context">${context}</div>`:''}${v.foot?`<div class="kpi-unit">${v.foot}</div>`:''}${note?`<div class="kpi-explain"><strong>Qué mide:</strong> ${note}</div>`:''}</article>`;},
    pageHead:(title,copy,meta='')=>`<div class="page-head"><div><div class="eyebrow">Sistema de indicadores</div><h2>${title}</h2>${copy?`<p>${copy}</p>`:''}</div>${meta?`<span class="pill">${meta}</span>`:''}</div>`,
    card:(id,title,sub,copy,wide=false)=>`<article class="card ${wide?'wide':''}"><div class="card-head"><h3>${title}</h3><p>${sub}</p></div><div class="chart-wrap"><canvas id="${id}"></canvas></div><div class="card-copy">${copy}</div></article>`,
    dualCard:(id,varId,title,sub,copy,varTitle='Variación anual',varSub='Porcentaje respecto al año anterior',levelCopy='',varCopy='')=>`<article class="card wide dual-card"><div class="card-head"><h3>${title}</h3><p>${sub}</p></div><div class="dual-chart-grid"><div class="chart-panel"><div class="chart-panel-title">Nivel del indicador</div><div class="chart-wrap"><canvas id="${id}"></canvas></div>${levelCopy?`<div class="panel-copy">${levelCopy}</div>`:''}</div><div class="chart-panel variation-panel"><div class="chart-panel-title">${varTitle}</div><div class="chart-panel-sub">${varSub}</div><div class="chart-wrap"><canvas id="${varId}"></canvas></div>${varCopy?`<div class="panel-copy">${varCopy}</div>`:''}</div></div>${copy?`<div class="card-copy">${copy}</div>`:''}</article>`
  };
})();
