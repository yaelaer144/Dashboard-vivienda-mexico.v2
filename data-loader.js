(function(){
  function parseCsvText(text){
    const lines=text.replace(/^\uFEFF/,'').trim().split(/\r?\n/); if(lines.length<2)return [];
    const delim=(lines[0].split('|').length>lines[0].split(',').length)?'|':',';
    const parseLine=s=>{const out=[];let cur='',q=false;for(let i=0;i<s.length;i++){const c=s[i];if(c==='"'){if(q&&s[i+1]==='"'){cur+='"';i++;}else q=!q;}else if(c===delim&&!q){out.push(cur);cur='';}else cur+=c;}out.push(cur);return out;};
    const h=parseLine(lines[0]).map(x=>x.trim());
    return lines.slice(1).filter(Boolean).map(line=>{const v=parseLine(line),o={};h.forEach((k,i)=>o[k]=(v[i]??'').trim());return o;});
  }
  async function csv(path){
    try{
      const r=await fetch(path,{cache:'no-store'});
      if(r.ok) return parseCsvText(await r.text());
    }catch(e){}
    // Cuando se abre directamente con file:/// algunos navegadores bloquean fetch().
    // Para las tres series críticas de Actividad económica usamos los datos embebidos.
    return window.LOCAL_CSV_DATA?.[path] || [];
  }
  const num=v=>{if(v==null||String(v).trim()==='')return null;const n=Number(String(v).replace(/,/g,''));return Number.isFinite(n)?n:null};
  function pick(o,names){for(const n of names){if(Object.prototype.hasOwnProperty.call(o,n)&&o[n]!==''&&o[n]!=null)return o[n]}return null}
  function normalizeQuarter(v){
    const s=String(v??'').trim();
    let m=s.match(/(20\d{2})[-_/ ]?(?:T|Q)?([1-4])$/i);
    if(m)return `${m[1]}-T${m[2]}`;
    m=s.match(/^(20\d{2})([1-4])$/);
    return m?`${m[1]}-T${m[2]}`:null;
  }
  function sortQuarter(a,b){return String(a).localeCompare(String(b));}
  function parseQuarterlyRows(rows){
    return rows.map(r=>({period:normalizeQuarter(pick(r,['periodo','period'])),total:num(pick(r,['total'])),formal:num(pick(r,['formal'])),informal:num(pick(r,['informal']))})).filter(x=>/^20\d{2}-T[1-4]$/.test(x.period||'')).sort((a,b)=>sortQuarter(a.period,b.period));
  }


  async function loadPeriodic(){
    const D=window.DASHBOARD_DATA;
    const [enoeLocal,enoeAnnual,imss,inpp,shf,iccAnnual,iccMonthly,iccComponentsMonthly,pibConstruction,vabQuarterly,igaeMonthly,ifbMonthly,imaiMonthly,enecEdifMM,inppConstructionLatest,vabComponents,priceHistory]=await Promise.all([
      csv('enoe_construccion_trimestral.csv'),
      csv('enoe_construccion_historico_anual.csv'),
      csv('imss_construccion_mensual.csv'),
      csv('inpp_componentes_construccion_mensual.csv'),
      csv('shf_indice_trimestral.csv'),
      csv('icc_ciudad_historico_anual.csv'),
      csv('icc_residencial_mensual.csv'),
      csv('icc_subindices_mensual.csv'),
      csv('pib_construccion_trimestral.csv'),
      csv('vab_edificacion_trimestral.csv'),
      csv('igae_construccion_mensual.csv'),
      csv('ifb_residencial_mensual.csv'),
      csv('imai_construccion_mensual.csv'),
      csv('enec_edificacion_variacion_mensual.csv'),
      csv('inpp_construccion_ultimo.csv'),
      csv('vab_edificacion_componentes_anual.csv'),
      csv('precios_historicos_2019_2024.csv')
    ]);


    if(pibConstruction.length){
      D.activity.pib_construction_quarterly=pibConstruction.map(r=>({period:normalizeQuarter(pick(r,['periodo','period'])),value_mdp:num(pick(r,['valor_mdp','value_mdp','nivel_mdp'])),yoy:num(pick(r,['variacion_anual_real','yoy','variacion_anual'])),share:num(pick(r,['participacion_pib','share']))})).filter(x=>x.period&&x.value_mdp!=null).sort((a,b)=>sortQuarter(a.period,b.period));
    }
    if(vabQuarterly.length){
      D.activity.vab_quarterly=vabQuarterly.map(r=>({period:normalizeQuarter(pick(r,['periodo','period'])),value_mdp:num(pick(r,['valor_mdp_2018_anualizado','valor_mdp','value_mdp','nivel_mdp'])),yoy:num(pick(r,['variacion_anual_real','yoy','variacion_anual'])),note:pick(r,['nota','note'])})).filter(x=>/^20\d{2}-T[1-4]$/.test(x.period||'')).sort((a,b)=>sortQuarter(a.period,b.period));
    } else if(D.activity.pib_construction_quarterly?.length){
      D.activity.vab_quarterly=D.activity.pib_construction_quarterly.map(x=>({period:x.period,value_mdp:x.value_mdp,yoy:x.yoy}));
    }
    if(vabComponents.length){
      D.activity.vab_components_annual=vabComponents.map(r=>({
        year:num(pick(r,['anio','year'])),
        residential:num(pick(r,['vab_residencial_mdp','residential'])),
        nonresidential:num(pick(r,['vab_no_residencial_mdp','nonresidential'])),
        source:pick(r,['fuente','source'])
      })).filter(x=>Number.isFinite(x.year)&&(x.residential!=null||x.nonresidential!=null)).sort((a,b)=>a.year-b.year);
    } else {
      D.activity.vab_components_annual=[];
    }
    if(igaeMonthly.length){
      D.activity.igae_monthly=igaeMonthly.map(r=>({period:pick(r,['periodo','period']),index:num(pick(r,['indice','index'])),mom:num(pick(r,['variacion_mensual','mom'])),yoy:num(pick(r,['variacion_anual','yoy']))})).filter(x=>x.period&&(x.index!=null||x.yoy!=null)).sort((a,b)=>String(a.period).localeCompare(String(b.period)));
    }
    if(ifbMonthly.length){
      D.activity.ifb_monthly=ifbMonthly.map(r=>({period:pick(r,['periodo','period']),index:num(pick(r,['indice','index'])),mom:num(pick(r,['variacion_mensual','mom'])),yoy:num(pick(r,['variacion_anual','yoy']))})).filter(x=>x.period&&(x.index!=null||x.yoy!=null)).sort((a,b)=>String(a.period).localeCompare(String(b.period)));
    }
    if(imaiMonthly.length){
      D.activity.imai_monthly=imaiMonthly.map(r=>({period:pick(r,['periodo','period']),index:num(pick(r,['indice','index'])),mom:num(pick(r,['variacion_mensual','mom'])),yoy:num(pick(r,['variacion_anual','yoy']))})).filter(x=>x.period&&(x.index!=null||x.yoy!=null)).sort((a,b)=>String(a.period).localeCompare(String(b.period)));
    }

    // Diagnóstico: deja constancia de que las tres series llegaron al navegador.
    console.info('[Dashboard] Actividad cargada:', {
      vab: D.activity.vab_quarterly?.length || 0,
      ifb: D.activity.ifb_monthly?.length || 0,
      imai: D.activity.imai_monthly?.length || 0
    });

    const enoeLocalNorm=parseQuarterlyRows(enoeLocal);
    D.labor.enoe_quarterly=enoeLocalNorm;
    D.labor.enoe_quarterly_error=enoeLocalNorm.length
      ? 'Serie trimestral local observada; no se completa con estimaciones ni con una fuente de definición distinta.'
      : 'No hay observaciones trimestrales ENOE válidas cargadas.';
    if(enoeAnnual.length){
      D.labor.enoe_annual=enoeAnnual.map(r=>({
        period:String(pick(r,['periodo','period'])),
        total:num(pick(r,['total'])),
        formal:num(pick(r,['formal'])),
        informal:num(pick(r,['informal']))
      })).filter(x=>/^20\d{2}$/.test(x.period)&&x.total!=null)
        .sort((a,b)=>a.period.localeCompare(b.period));
    }

    if(imss.length){
      const imssRows=imss.map(r=>({period:pick(r,['periodo','period']),construction:num(pick(r,['construccion','construction'])),edification:num(pick(r,['edificacion','edification']))})).filter(x=>x.period&&x.construction!=null);
      D.labor.imss_monthly=imssRows;
      D.labor.imss_edification_note='Serie mensual de empleos/puestos registrados ante el IMSS en el sector construcción.';
    }

    if(inpp.length){
      D.prices.inpp_components_monthly=inpp.map(r=>({
        period:pick(r,['periodo','period']),
        materials:num(pick(r,['materiales','materials'])),
        labor:num(pick(r,['mano_obra','remuneraciones','labor'])),
        machinery:num(pick(r,['maquinaria','alquiler_maquinaria','machinery']))
      })).filter(x=>x.period&&(x.materials!=null||x.labor!=null||x.machinery!=null));
    }

    if(shf.length){
      D.prices.shf_quarterly=shf.map(r=>({period:pick(r,['periodo','period']),yoy:num(pick(r,['variacion_anual','yoy','variacion'])) ,index:num(pick(r,['indice','index']))})).filter(x=>x.period&&(x.yoy!=null||x.index!=null));
    }

    if(iccAnnual.length){
      D.prices.icc_city_annual=iccAnnual.map(r=>({
        year:num(pick(r,['anio','year'])),
        city:pick(r,['ciudad','city']),
        general:num(pick(r,['indice_general','general','icc'])),
        materials:num(pick(r,['materiales','materials'])),
        machinery:num(pick(r,['maquinaria','alquiler_maquinaria','machinery'])),
        labor:num(pick(r,['mano_obra','remuneraciones','labor'])),
        period_note:pick(r,['nota_periodo','period_note']),
        source:pick(r,['fuente','source'])
      })).filter(x=>Number.isFinite(x.year)&&x.city&&x.general!=null).sort((a,b)=>a.year-b.year||String(a.city).localeCompare(String(b.city)));
    }

    if(iccMonthly.length){
      D.prices.icc_monthly=iccMonthly.map(r=>({period:pick(r,['periodo','period']),general:num(pick(r,['indice_general','general','icc']))})).filter(x=>x.period&&x.general!=null);
      D.prices.icc_monthly_note='Serie mensual cargada desde icc_residencial_mensual.csv';
    } else if((D.prices.icc_city_annual||[]).length){
      D.prices.icc_monthly=[];
      D.prices.icc_monthly_note='No se construye una serie mensual a partir de datos anuales. Se requiere la serie mensual oficial del ICC.';
    }

    // Subíndices nacionales del ICC: únicamente observaciones mensuales oficiales.
    if(iccComponentsMonthly.length){
      D.prices.icc_components_monthly=iccComponentsMonthly.map(r=>({
        period:pick(r,['periodo','period']),
        materials:num(pick(r,['materiales','materials'])),
        machinery:num(pick(r,['maquinaria','machinery'])),
        labor:num(pick(r,['labor','remuneraciones'])),
        source:pick(r,['fuente','source'])
      })).filter(x=>x.period && (x.materials!=null || x.machinery!=null || x.labor!=null))
        .sort((a,b)=>String(a.period).localeCompare(String(b.period)));
      D.prices.icc_components_latest=D.prices.icc_components_monthly.slice(-1);
      D.prices.icc_components_latest_note='Serie mensual oficial incorporada al proyecto. No se mensualizan datos anuales ni se insertan valores hardcodeados.';
      D.prices.icc_components_yoy_annual=[];
    } else {
      D.prices.icc_components_monthly=[];
      D.prices.icc_components_latest=[];
      D.prices.icc_components_yoy_annual=[];
      D.prices.icc_components_latest_note='N/D: no se encontró una serie mensual oficial local.';
    }

    if(enecEdifMM.length){
      D.activity.enec_edification_mm=enecEdifMM.map(r=>({
        period:pick(r,['periodo','period']),
        value:num(pick(r,['variacion_mensual_real','value']))
      })).filter(x=>x.period&&x.value!=null).sort((a,b)=>a.period.localeCompare(b.period));
    }
    if(inppConstructionLatest.length){
      D.prices.inpp_construction_latest=inppConstructionLatest.map(r=>({
        period:pick(r,['periodo','period']),
        monthly:num(pick(r,['variacion_mensual'])),
        cumulative:num(pick(r,['variacion_acumulada_dic'])),
        yoy:num(pick(r,['variacion_anual']))
      })).filter(x=>x.period);
    }
    if(priceHistory.length){
      D.prices.history_2019_2024=priceHistory.map(r=>({
        year:num(pick(r,['anio','year'])),
        icc_yoy:num(pick(r,['icc_residencial_var_anual_dic','icc_yoy'])),
        inpp_construction_yoy:num(pick(r,['inpp_construccion_var_anual_dic','inpp_construction_yoy'])),
        source_icc:pick(r,['fuente_icc','source_icc']),
        source_inpp:pick(r,['fuente_inpp','source_inpp'])
      })).filter(x=>Number.isFinite(x.year)&&(x.icc_yoy!=null||x.inpp_construction_yoy!=null)).sort((a,b)=>a.year-b.year);
    }

    D.activity._load_status={
      vab_quarterly:(D.activity.vab_quarterly||[]).length,
      ifb_monthly:(D.activity.ifb_monthly||[]).length,
      imai_monthly:(D.activity.imai_monthly||[]).length,
      igae_monthly:(D.activity.igae_monthly||[]).length,
      pib_construction_quarterly:(D.activity.pib_construction_quarterly||[]).length
    };
    return D;
  }
  window.DashboardDataLoader={get:()=>window.DASHBOARD_DATA,loadPeriodic};
})();
