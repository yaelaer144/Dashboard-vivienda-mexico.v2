(function(){
  const brand='#c8102e', blue='#315d78', grey='#8b949e', green='#2f7654', gold='#aa7a2b';
  function line(id,labels,datasets,opts={}){
    const el=document.getElementById(id); if(!el||!window.Chart)return;
    const old=Chart.getChart?Chart.getChart(el):null; if(old)old.destroy();
    const singlePoint=(labels||[]).length<=1;
    new Chart(el,{type:singlePoint?'bar':'line',data:{labels,datasets},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{position:'bottom',labels:{boxWidth:10,font:{size:10}}},tooltip:{callbacks:{label:(ctx)=>`${ctx.dataset.label}: ${Number.isFinite(ctx.parsed.y)?ctx.parsed.y.toFixed(opts.decimals??1):'N/D'}${opts.suffix||''}`}}},scales:{x:{grid:{display:false},ticks:{font:{size:9},maxTicksLimit:12},title:{display:!!opts.xTitle,text:opts.xTitle||'',font:{size:10}}},y:{grid:{color:'#eef1f3'},ticks:{font:{size:9}},beginAtZero:!!opts.beginAtZero,title:{display:!!opts.yTitle,text:opts.yTitle||'',font:{size:10}}}}}});
  }
  function bar(id,labels,datasets,opts={}){
    const el=document.getElementById(id); if(!el||!window.Chart)return;
    const old=Chart.getChart?Chart.getChart(el):null; if(old)old.destroy();
    new Chart(el,{type:'bar',data:{labels,datasets},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{position:'bottom',labels:{boxWidth:10,font:{size:10}}},tooltip:{callbacks:{label:(ctx)=>`${ctx.dataset.label}: ${Number.isFinite(ctx.parsed.y)?ctx.parsed.y.toFixed(opts.decimals??1):'N/D'}${opts.suffix||''}`}}},scales:{x:{stacked:!!opts.stacked,grid:{display:false},ticks:{font:{size:9},maxTicksLimit:12}},y:{stacked:!!opts.stacked,grid:{color:'#eef1f3'},ticks:{font:{size:9}},beginAtZero:opts.beginAtZero!==false,title:{display:!!opts.yTitle,text:opts.yTitle||'',font:{size:10}}}}}});
  }
  function doughnut(id,labels,data,unit='Porcentaje de viviendas (%)'){
    const el=document.getElementById(id); if(!el||!window.Chart)return;
    const old=Chart.getChart?Chart.getChart(el):null; if(old)old.destroy();
    new Chart(el,{type:'doughnut',data:{labels,datasets:[{data,backgroundColor:[brand,blue,grey],borderColor:'#fff',borderWidth:3}]},options:{responsive:true,maintainAspectRatio:false,cutout:'62%',plugins:{legend:{position:'bottom',labels:{font:{size:10},boxWidth:10}},tooltip:{callbacks:{label:(ctx)=>`${ctx.label}: ${ctx.parsed.toFixed(1)}% · ${unit}`}}}}});
  }
  function ds(label,data,color,dash){return{label,data,borderColor:color,backgroundColor:color,tension:.25,pointRadius:2,pointHoverRadius:4,borderWidth:2,spanGaps:false,borderDash:dash||[]}}
  function yoy(values){return values.map((v,i)=>i===0||!Number.isFinite(v)||!Number.isFinite(values[i-1])||values[i-1]===0?null:(v/values[i-1]-1)*100);}
  function sameMonth(rows,key){
    const m=new Map(rows.map(r=>[r.period,r[key]]));
    return rows.map(r=>{const [y,mo]=r.period.split('-');const prev=m.get(`${Number(y)-1}-${mo}`);const v=r[key];return Number.isFinite(v)&&Number.isFinite(prev)&&prev!==0?(v/prev-1)*100:null;});
  }
  function biennialPP(years,values){return values.map((v,i)=>{if(i===0)return null;const dy=years[i]-years[i-1];return Number.isFinite(v)&&Number.isFinite(values[i-1])&&dy>0?(v-values[i-1])/dy:null;});}
  function quarterFromMonthly(rows, keys){
    const groups=new Map();
    (rows||[]).forEach(r=>{
      const m=String(r.period||'').match(/^(\d{4})-(\d{2})$/); if(!m)return;
      const year=Number(m[1]), month=Number(m[2]), q=Math.ceil(month/3), k=`${year}-T${q}`;
      if(!groups.has(k))groups.set(k,[]); groups.get(k).push(r);
    });
    return [...groups.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([period,rs])=>{
      const o={period,months:rs.length,partial:rs.length<3};
      keys.forEach(key=>{const vals=rs.map(r=>r[key]).filter(Number.isFinite);o[key]=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null;});
      return o;
    });
  }
  function quarterEndFromMonthly(rows, keys){
    const groups=new Map();
    (rows||[]).forEach(r=>{
      const m=String(r.period||'').match(/^(\d{4})-(\d{2})$/); if(!m)return;
      const year=Number(m[1]), month=Number(m[2]), q=Math.ceil(month/3), k=`${year}-T${q}`;
      if(!groups.has(k))groups.set(k,[]); groups.get(k).push(r);
    });
    return [...groups.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([period,rs])=>{
      rs.sort((a,b)=>String(a.period).localeCompare(String(b.period)));
      const last=rs[rs.length-1], mo=Number(String(last.period).slice(5,7));
      const expectedEnd=Number(period.slice(-1))*3;
      const o={period,partial:mo!==expectedEnd,sourcePeriod:last.period};
      keys.forEach(key=>o[key]=Number.isFinite(last[key])?last[key]:null);
      return o;
    });
  }
  function variationLine(id,labels,datasets,unit='Porcentaje (%)',suffix='%'){
    line(id,labels,datasets,{beginAtZero:false,yTitle:unit,suffix,decimals:1});
  }
  function noData(id,message='N/D · La serie oficial no está incluida en la descarga local.') {
    const el=document.getElementById(id); if(!el)return;
    const wrap=el.parentElement; if(!wrap)return;
    el.style.display='none';
    let note=wrap.querySelector('.chart-no-data');
    if(!note){ note=document.createElement('div'); note.className='chart-no-data'; wrap.appendChild(note); }
    note.textContent=message;
    note.style.cssText='height:100%;min-height:190px;display:flex;align-items:center;justify-content:center;text-align:center;padding:18px;color:#667085;font-size:13px;line-height:1.45;background:#fafbfc;border:1px dashed #d9dee5;border-radius:8px;box-sizing:border-box';
  }

  function displaySurfaceLabel(label,allCats=[]){
    const low=String(label||'').toLowerCase().replace(/²/g,'2');
    if(low.includes('38')&&(low.includes('menor')||low.includes('<38')))return '<38 m²';
    if(low.includes('45')&&(low.includes('menor')||low.includes('<45'))){
      const has38=allCats.some(x=>String(x).toLowerCase().includes('38'));
      return has38?'38–<45 m²':'<45 m²';
    }
    if((low.includes('45')&&low.includes('60'))||(low.includes('menor')&&low.includes('60')))return '45–<60 m²';
    if((low.includes('60')&&low.includes('80'))||(low.includes('menor')&&low.includes('80')))return '60–<80 m²';
    if((low.includes('mayor')&&low.includes('80'))||low.includes('80 m2 o mas')||low.includes('80 m² o más'))return '≥80 m²';
    return String(label||'Sin especificar');
  }
  function shareHistory(id,block,kind){
    const el=document.getElementById(id); if(!el||!window.Chart||!block||!Array.isArray(block.annual)||!block.annual.length)return;
    const old=Chart.getChart?Chart.getChart(el):null; if(old)old.destroy();
    const palette=[brand,blue,green,gold,grey,'#6c5b7b','#4b7f91','#9b6a45'];
    const labels=block.annual.map(r=>`${r.year}${r.partial?'*':''}`);
    const cats=block.categories||[];
    const datasets=cats.map((cat,i)=>({
      label:kind==='surface'?displaySurfaceLabel(cat,cats):cat,
      data:block.annual.map(r=>r.total?((Number(r.values?.[cat]||0)/r.total)*100):null),
      counts:block.annual.map(r=>Number(r.values?.[cat]||0)),
      borderColor:palette[i%palette.length],backgroundColor:palette[i%palette.length],
      borderWidth:2.2,pointRadius:3,pointHoverRadius:5,tension:.2,spanGaps:false,fill:false
    }));
    new Chart(el,{type:'line',data:{labels,datasets},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{position:'bottom',labels:{boxWidth:10,usePointStyle:true,pointStyle:'line',font:{size:10}}},tooltip:{callbacks:{label:(ctx)=>{const pct=Number.isFinite(ctx.parsed.y)?ctx.parsed.y.toFixed(1):'N/D';const n=ctx.dataset.counts?.[ctx.dataIndex]??0;return `${ctx.dataset.label}: ${pct}% · ${new Intl.NumberFormat('es-MX').format(n)} viviendas`;}}}},scales:{x:{grid:{display:false},ticks:{font:{size:9}}},y:{min:0,max:100,grid:{color:'#eef1f3'},ticks:{font:{size:9},callback:v=>`${v}%`},title:{display:true,text:'Participación en viviendas producidas (%)',font:{size:10}}}}}});
  }

  function ruvTotalHistory(id,block){
    const el=document.getElementById(id); if(!el||!window.Chart||!block||!Array.isArray(block.annual)||!block.annual.length)return;
    const rows=[...block.annual].sort((a,b)=>a.year-b.year);
    const labels=rows.map(r=>`${r.year}${r.partial?'*':''}`);
    const values=rows.map(r=>Number(r.total||0)/1000);
    line(id,labels,[ds('Viviendas producidas',values,brand)],{beginAtZero:false,yTitle:'Miles de viviendas',suffix:' mil',decimals:1});
  }
  function ruvSegmentHistory(id,block){
    const el=document.getElementById(id); if(!el||!window.Chart||!block||!Array.isArray(block.annual)||!block.annual.length)return;
    const old=Chart.getChart?Chart.getChart(el):null; if(old)old.destroy();
    const rows=[...block.annual].sort((a,b)=>a.year-b.year);
    const cats=block.categories||[];
    const palette=[brand,'#8d0b20','#d96a7c','#f0b6c0',grey,'#5e6670'];
    const datasets=cats.map((cat,i)=>({
      label:cat,
      data:rows.map(r=>r.total?Number(r.values?.[cat]||0)/r.total*100:null),
      counts:rows.map(r=>Number(r.values?.[cat]||0)),
      backgroundColor:palette[i%palette.length],
      borderColor:'#ffffff',borderWidth:1
    }));
    new Chart(el,{type:'bar',data:{labels:rows.map(r=>`${r.year}${r.partial?'*':''}`),datasets},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{position:'bottom',labels:{boxWidth:10,font:{size:10}}},tooltip:{callbacks:{label:(ctx)=>{const pct=Number.isFinite(ctx.parsed.y)?ctx.parsed.y.toFixed(1):'N/D';const n=ctx.dataset.counts?.[ctx.dataIndex]??0;return `${ctx.dataset.label}: ${pct}% · ${new Intl.NumberFormat('es-MX').format(n)} viviendas`;}}}},scales:{x:{stacked:true,grid:{display:false},ticks:{font:{size:9},maxRotation:0,minRotation:0}},y:{stacked:true,min:0,max:100,grid:{color:'#eef1f3'},ticks:{font:{size:9},callback:v=>`${v}%`},title:{display:true,text:'Participación en la producción (%)',font:{size:10}}}}}});
  }

  window.DashboardCharts={
    renderRuv(data){
      if(!data)return;
      ruvTotalHistory('prod-ruv-total',data.total);
      ruvSegmentHistory('prod-ruv-segment',data.segment);
    },
    render(){const D=window.DASHBOARD_DATA;
      // Resumen
      const sumShf=D.prices.shf_quarterly||[]; if(sumShf.length){line('sum-shf',sumShf.map(x=>x.period),[ds('Variación anual SHF',sumShf.map(x=>x.yoy),brand)],{beginAtZero:false,yTitle:'Porcentaje (%)',suffix:'%'});} else {line('sum-shf',D.prices.years,[ds('Variación anual SHF',D.prices.shf_yoy,brand)],{beginAtZero:false,yTitle:'Porcentaje (%)',suffix:'%'});}
      const sumEnoe=(D.labor.enoe_quarterly||[]).filter(x=>/^20\d{2}-T[1-4]$/.test(x.period||''));
      if(sumEnoe.length) line('sum-employment',sumEnoe.map(x=>x.period),[ds('Empleos en construcción',sumEnoe.map(x=>Number.isFinite(x.total)?x.total/1000:null),brand)],{beginAtZero:false,yTitle:'Millones de empleos',decimals:2});

      // PIB de vivienda: las visualizaciones viven en Producción de vivienda
      bar('act-pib',D.activity.years,Object.entries(D.activity.components).map(([label,data],i)=>({label,data,backgroundColor:[brand,blue,grey,gold][i]})),{stacked:true,yTitle:'Millones de pesos corrientes',decimals:0});
      line('act-share',D.activity.years,[ds('Participación del PIB de vivienda',D.activity.participation,brand)],{beginAtZero:false,yTitle:'Porcentaje del PIB (%)',suffix:'%'});

      // Actividad económica: respetar periodicidad de publicación
      const vabq=D.activity.pib_construction_quarterly||[];
      if(vabq.length) {
        line('act-vab',vabq.map(x=>x.period),[ds('VAB de construcción',vabq.map(x=>Number.isFinite(x.value_mdp)?x.value_mdp:null),blue)],{beginAtZero:false,yTitle:'Millones de pesos corrientes',decimals:0});
        variationLine('act-vab-var',vabq.map(x=>x.period),[ds('Variación anual real',vabq.map(x=>Number.isFinite(x.yoy)?x.yoy:null),brand)],'Porcentaje (%)','%');
      }
      const igaem=D.activity.igae_monthly||[];
      if(igaem.length){
        line('act-igae',igaem.map(x=>x.period),[ds('IGAE construcción',igaem.map(x=>x.index),blue)],{beginAtZero:false,yTitle:'Índice · Base 2018=100',decimals:1});
        variationLine('act-igae-var',igaem.map(x=>x.period),[ds('Variación anual',igaem.map(x=>x.yoy),brand)],'Porcentaje (%)','%');
      }
      const ifbm=D.activity.ifb_monthly||[];
      if(ifbm.length){
        line('act-ifb',ifbm.map(x=>x.period),[ds('IFB residencial',ifbm.map(x=>x.index),blue)],{beginAtZero:false,yTitle:'Índice 2019=100 · a.e.',decimals:1});
        variationLine('act-ifb-var',ifbm.map(x=>x.period),[ds('Variación anual',ifbm.map(x=>x.yoy),brand)],'Porcentaje (%)','%');
      }
      const imaim=D.activity.imai_monthly||[];
      if(imaim.length){
        line('act-imai',imaim.map(x=>x.period),[ds('IMAI construcción',imaim.map(x=>x.index),blue)],{beginAtZero:false,yTitle:'Índice 2021=100 · a.e.',decimals:1});
        variationLine('act-imai-var',imaim.map(x=>x.period),[ds('Variación anual',imaim.map(x=>x.yoy),brand)],'Porcentaje (%)','%');
      }

      // ENEC · actividad de empresas constructoras
      const enecA=D.activity.enec_production||[];
      const enecP=enecA.map(x=>x.period);
      if(enecA.length){
        line('act-enec-production',enecP,[ds('Edificación',enecA.map(x=>x.edification),brand),ds('Sector público',enecA.map(x=>x.public),blue),ds('Sector privado',enecA.map(x=>x.private),green)],{beginAtZero:false,yTitle:'Índice · Base 2018=100'});
        variationLine('act-enec-production-var',enecP,[ds('Edificación',sameMonth(enecA,'edification'),brand),ds('Sector público',sameMonth(enecA,'public'),blue),ds('Sector privado',sameMonth(enecA,'private'),green)]);
      }

      // Mercado laboral
      const eq=(D.labor.enoe_quarterly||[]).filter(x=>/^20\d{2}-T[1-4]$/.test(x.period));
      if(eq.length){
        const hasSplit=eq.every(x=>Number.isFinite(x.formal)&&Number.isFinite(x.informal));
        if(hasSplit) bar('lab-enoe',eq.map(x=>x.period),[{label:'Formal',data:eq.map(x=>x.formal),backgroundColor:blue},{label:'Informal',data:eq.map(x=>x.informal),backgroundColor:brand}],{stacked:true,yTitle:'Miles de empleos'});
        else bar('lab-enoe',eq.map(x=>x.period),[{label:'Empleos en construcción',data:eq.map(x=>x.total),backgroundColor:brand}],{yTitle:'Miles de empleos'});
      }
      else {const c=document.getElementById('lab-enoe'); if(c&&c.parentElement){c.style.display='none'; const m=document.createElement('div');m.className='note';m.style.padding='28px';m.innerHTML='<strong>Serie trimestral no disponible.</strong> El archivo ENOE no contiene observaciones válidas para mostrar.';c.parentElement.appendChild(m);}}
      const im=D.labor.imss_monthly||[]; if(im.length){const labels=im.map(x=>x.period), sets=[ds('Construcción',im.map(x=>x.construction),blue)]; if(im.some(x=>x.edification!=null))sets.push(ds('Edificación',im.map(x=>x.edification),brand)); line('lab-imss',labels,sets,{beginAtZero:false,yTitle:'Miles de empleos registrados'}); variationLine('lab-imss-var',labels,sets.map((z,i)=>ds(z.label,sameMonth(im,i===0?'construction':'edification'),z.borderColor)));} else {line('lab-imss',D.labor.years,[ds('Empleos registrados IMSS',D.labor.imss,blue)],{beginAtZero:false,yTitle:'Miles de empleos registrados'}); variationLine('lab-imss-var',D.labor.years,[ds('Puestos IMSS',yoy(D.labor.imss),blue)]);}
      const p=D.labor.monthly_indices.map(x=>x.period);
      line('lab-personal',p,[ds('Construcción',D.labor.monthly_indices.map(x=>x.empl_const),blue),ds('Edificación',D.labor.monthly_indices.map(x=>x.empl_edif),brand)],{beginAtZero:false,yTitle:'Índice · Base 2018=100'});
      variationLine('lab-personal-var',p,[ds('Construcción',sameMonth(D.labor.monthly_indices,'empl_const'),blue),ds('Edificación',sameMonth(D.labor.monthly_indices,'empl_edif'),brand)]);
      line('lab-hours',p,[ds('Construcción',D.labor.monthly_indices.map(x=>x.hours_const),blue),ds('Edificación',D.labor.monthly_indices.map(x=>x.hours_edif),brand)],{beginAtZero:false,yTitle:'Índice · Base 2018=100'});
      variationLine('lab-hours-var',p,[ds('Construcción',sameMonth(D.labor.monthly_indices,'hours_const'),blue),ds('Edificación',sameMonth(D.labor.monthly_indices,'hours_edif'),brand)]);
      line('lab-rem',p,[ds('Construcción',D.labor.monthly_indices.map(x=>x.rem_const),blue),ds('Edificación',D.labor.monthly_indices.map(x=>x.rem_edif),brand)],{beginAtZero:false,yTitle:'Índice · Base 2018=100'});
      variationLine('lab-rem-var',p,[ds('Construcción',sameMonth(D.labor.monthly_indices,'rem_const'),blue),ds('Edificación',sameMonth(D.labor.monthly_indices,'rem_edif'),brand)]);
      const salP=D.labor.salary_monthly.map(x=>x.period), salV=D.labor.salary_monthly.map(x=>x.daily);
      line('lab-salary',salP,[ds('SBC diario promedio',salV,green)],{beginAtZero:false,yTitle:'Pesos corrientes por día',suffix:' MXN/día'});
      variationLine('lab-salary-var',salP,[ds('SBC diario promedio',sameMonth(D.labor.salary_monthly,'daily'),green)]);
      const wt=D.labor.enec_worker_type_mom||[];
      if(wt.length){
        line('lab-enec-worker-type',wt.map(x=>x.period),[ds('Personal total',wt.map(x=>x.total),grey),ds('Obreros',wt.map(x=>x.workers),brand),ds('Administrativos',wt.map(x=>x.admin),blue)],{beginAtZero:false,yTitle:'Variación mensual desestacionalizada (%)',suffix:'%'});
      }

      // Producción
      line('prod-flow',D.production.years,[ds('Registradas',D.production.registered,blue),ds('Inicio de obra',D.production.started,gold),ds('Terminadas / producción',D.production.finished,brand)],{beginAtZero:false,yTitle:'Miles de viviendas'});
      variationLine('prod-flow-var',D.production.years,[ds('Registradas',yoy(D.production.registered),blue),ds('Inicio de obra',yoy(D.production.started),gold),ds('Terminadas / producción',yoy(D.production.finished),brand)]);
      const hv=D.production.enec_housing_yoy||[];
      if(hv.length){
        line('prod-enec-housing',hv.map(x=>x.period),[ds('Vivienda',hv.map(x=>x.housing),brand),ds('Edificación',hv.map(x=>x.edification),blue)],{beginAtZero:false,yTitle:'Variación anual real (%)',suffix:'%'});
      }

      // Precios
      const hv2=D.activity.enec_edification_mm||[];
      if(hv2.length){
        line('prod-enec-housing-activity',hv2.map(x=>x.period),[ds('Producción de edificación',hv2.map(x=>x.value),brand)],{beginAtZero:false,yTitle:'Variación mensual real (%)',suffix:'%'});
      }
      bar('prod-pvb',['Contratadas','En construcción','Entregadas'],[{label:'Viviendas',data:[604000,274000,24500],backgroundColor:brand}],{beginAtZero:true,yTitle:'Viviendas',decimals:0});
      const shq=D.prices.shf_quarterly||[]; if(shq.length){line('price-shf',shq.map(x=>x.period),[ds('Índice SHF · variación anual',shq.map(x=>x.yoy),brand)],{beginAtZero:false,yTitle:'Variación anual (%)',suffix:'%'});} else {line('price-shf',D.prices.years,[ds('Índice SHF · variación anual',D.prices.shf_yoy,brand)],{beginAtZero:false,yTitle:'Variación anual (%)',suffix:'%'});}
      // ICC e INPP: históricos oficiales 2019–2024 sin reconstruir niveles mensuales faltantes.
      const ph=D.prices.history_2019_2024||[];
      if(ph.length){
        variationLine('price-costs',ph.map(x=>String(x.year)),[ds('ICC residencial · variación anual a diciembre',ph.map(x=>x.icc_yoy),blue)],'Variación anual (%)','%');
        variationLine('price-housing-components',ph.map(x=>String(x.year)),[ds('INPP construcción · variación anual a diciembre',ph.map(x=>x.inpp_construction_yoy),brand)],'Variación anual (%)','%');
      }

      // Subíndices del ICC: sólo observaciones mensuales oficiales cargadas, sin puntos N/D artificiales.
      const iccm=D.prices.icc_components_monthly||[];
      if(iccm.length){
        line('price-inpp-components',iccm.map(x=>x.period),[
          ds('Materiales de construcción',iccm.map(x=>x.materials),blue),
          ds('Alquiler de maquinaria y equipo',iccm.map(x=>x.machinery),gold),
          ds('Mano de obra / remuneraciones',iccm.map(x=>x.labor),brand)
        ],{beginAtZero:false,yTitle:'Índice · base julio 2019 = 100',decimals:1});
      }

      // Financiamiento: mantener la periodicidad anual disponible, separado del INPP.
      const py=D.prices.inpp_years||[];
      if(py.length && (D.prices.bridge_rate||[]).length){
        line('price-financing',py,[
          ds('Costo de financiamiento / crédito puente',D.prices.bridge_rate||[],blue)
        ],{beginAtZero:false,yTitle:'Porcentaje (%)',suffix:'%',decimals:1});
      }

      // Condiciones habitacionales
      const cy=D.conditions.history_years||[];
      if(cy.length){
        line('cond-history',cy,[
          ds('Calidad y espacios',D.conditions.deprivation_history?.quality_space_pct||[],brand),
          ds('Servicios básicos',D.conditions.deprivation_history?.basic_services_pct||[],blue)
        ],{beginAtZero:false,yTitle:'Porcentaje de la población (%)',suffix:'%'});
      }
      const qd=D.conditions.qualitative_deficit||{};
      if(qd.components){
        bar('cond-needs-history',['Materiales','Espacios','Servicios'],[{label:'Viviendas con necesidad de mejoramiento',data:[qd.components.materials_pct,qd.components.spaces_pct,qd.components.services_pct],backgroundColor:brand}],{yTitle:'Porcentaje de viviendas (%)',suffix:'%'});
      }
      const th=D.conditions.tenure_history||{};
      if((th.years||[]).length){
        line('cond-tenure-compare',th.years,[ds('Propia + pagándose',th.own_plus_paying_pct||[],brand),ds('Rentada',th.rented_pct||[],blue)],{beginAtZero:false,yTitle:'Porcentaje de viviendas (%)',suffix:'%'});
        variationLine('cond-tenure-compare-var',th.years,[ds('Propia + pagándose',biennialPP(th.years,th.own_plus_paying_pct||[]),brand),ds('Rentada',biennialPP(th.years,th.rented_pct||[]),blue)],'Puntos porcentuales por año',' pp');
      }
      const tt=D.conditions.tenure||{};
      doughnut('cond-tenure',['Propia + pagándose','Rentada','Otra'],[tt.own_plus_paying,tt.rented,tt.other]);
      const dep=D.conditions.deprivation||{};
      bar('cond-deprivation',['Calidad y espacios','Servicios básicos'],[{label:'Porcentaje de la población',data:[dep.quality_space_2024,dep.basic_services_2024],backgroundColor:brand}],{yTitle:'Porcentaje de la población (%)',suffix:'%'});
      const mat=D.conditions.materials||{};
      bar('cond-materials',['Muros','Techos','Pisos'],[{label:'Material inadecuado',data:[mat.walls_inadequate,mat.roofs_inadequate,mat.floor_inadequate],backgroundColor:blue}],{yTitle:'Porcentaje de viviendas (%)',suffix:'%'});
    }
  };
})();
