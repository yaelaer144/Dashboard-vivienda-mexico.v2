#!/usr/bin/env python3
from __future__ import annotations
import csv, io, os, json, re, urllib.parse, urllib.request
from pathlib import Path
from datetime import datetime, timezone, date
import requests
from pypdf import PdfReader

ROOT=Path(__file__).resolve().parent
UA='Mozilla/5.0 dashboard-vivienda-infonavit/2026'
BASE='https://www.inegi.org.mx/contenidos/saladeprensa/boletines'


def merge_csv(path, rows, key='periodo'):
    if not rows: return False
    old=[]
    if path.exists():
        with path.open(encoding='utf-8-sig',newline='') as f: old=list(csv.DictReader(f))
    fields=list(rows[0].keys())
    merged={str(r.get(key,'')):r for r in old if r.get(key)}
    for r in rows:
        k=str(r.get(key,''));
        if k:
            prev=merged.get(k,{})
            # Un valor vacío nuevo nunca borra un dato histórico ya validado.
            merged[k]={f:(r.get(f,'') if str(r.get(f,'')).strip()!='' else prev.get(f,'')) for f in fields}
    vals=[merged[k] for k in sorted(merged)]
    out=io.StringIO(); w=csv.DictWriter(out,fieldnames=fields,lineterminator='\n'); w.writeheader(); w.writerows(vals)
    new='\ufeff'+out.getvalue(); before=path.read_text(encoding='utf-8-sig') if path.exists() else ''
    if new.lstrip('\ufeff')!=before.lstrip('\ufeff'):
        path.write_text(new,encoding='utf-8'); return True
    return False


def get_text(url, timeout=60):
    req=urllib.request.Request(url,headers={'User-Agent':UA})
    with urllib.request.urlopen(req,timeout=timeout) as r: return r.read().decode('utf-8-sig','replace')


def get_pdf(url, timeout=30):
    try:
        r=requests.get(url,timeout=timeout,headers={'User-Agent':UA})
        return r.content if r.status_code==200 and r.content.startswith(b'%PDF') else None
    except requests.RequestException:
        return None


def pdf_text(content):
    return '\n'.join((p.extract_text() or '') for p in PdfReader(io.BytesIO(content)).pages)


def norm(s): return re.sub(r'\s+',' ',s.replace('−','-').replace('–','-')).strip()


def normalize_month_name(text):
    months={'enero':1,'febrero':2,'marzo':3,'abril':4,'mayo':5,'junio':6,'julio':7,'agosto':8,'septiembre':9,'octubre':10,'noviembre':11,'diciembre':12}
    m=re.search(r'cifras desestacionalizadas\s+([a-záéíóú]+)\s+de\s+(20\d{2})',text,re.I)
    if not m: return None
    mo=months.get(m.group(1).lower()); return f'{m.group(2)}-{mo:02d}' if mo else None


def latest_release(folder,prefix,months_back=3):
    today=date.today(); candidates=[]
    y,m=today.year,today.month
    for _ in range(months_back):
        candidates.append((y,m)); m-=1
        if m==0: y-=1; m=12
    for yy,mm in candidates:
        url=f'{BASE}/{yy}/{folder}/{prefix}{yy}_{mm:02d}.pdf'; content=get_pdf(url)
        if content: return content,url
    return None,None


def update_pib():
    today=date.today(); qmonths=[2,5,8,11]
    eligible=[m for m in qmonths if m<today.month or (m==today.month and today.day>=24)]
    tries=[eligible[-1]] if eligible else [11]
    year=today.year if eligible else today.year-1
    for mm in tries:
        cu=f'{BASE}/{year}/pibt/pib_Pcorr{year}_{mm:02d}.pdf'; ru=f'{BASE}/{year}/pibt/pib_Pconst{year}_{mm:02d}.pdf'
        c,r=get_pdf(cu),get_pdf(ru)
        if not(c and r): continue
        tc,tr=norm(pdf_text(c)),norm(pdf_text(r))
        mc=re.search(r'23\s+Construcci[oó]n\s+([\d\s]{5,20})\s+([\d.]+)',tc,re.I)
        mr=re.search(r'23\s+Construcci[oó]n\s+((?:-?[\d.]+\s+){5,8})',tr,re.I)
        qm=re.search(r'(primer|primero|segundo|tercer|tercero|cuarto)\s+trimestre\s+de\s+(20\d{2})',tr,re.I)
        if not(mc and mr and qm): continue
        q={'primer':1,'primero':1,'segundo':2,'tercer':3,'tercero':3,'cuarto':4}[qm.group(1).lower()]
        vals=[float(x) for x in re.findall(r'-?[\d.]+',mr.group(1))]
        level=int(re.sub(r'\D','',mc.group(1))); share=float(mc.group(2))
        row={'periodo':f'{qm.group(2)}-T{q}','valor_mdp':str(level),'variacion_anual_real':str(vals[-2]),'participacion_pib':str(share)}
        return merge_csv(ROOT/'pib_construccion_trimestral.csv',[row])
    return False


def chained_index(path, mom):
    try:
        if not path.exists() or mom is None: return ''
        with path.open(encoding='utf-8-sig',newline='') as f: rows=list(csv.DictReader(f))
        vals=[(r.get('periodo',''),r.get('indice','')) for r in rows if str(r.get('indice','')).strip()!='']
        if not vals: return ''
        vals.sort(key=lambda x:x[0]); last=float(vals[-1][1])
        return f'{last*(1+float(mom)/100):.3f}'.rstrip('0').rstrip('.')
    except Exception:
        return ''


def update_monthly_inegi(kind):
    spec={
      'igae':('igae','igae',r'23\s+Construcci[oó]n\s+([\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)'),
      'imai':('imai','imai',r'Construcci[oó]n\s+(-?[\d.]+)\s+(-?[\d.]+)'),
      'ifb':('ifb','imfbcf',r'\bResidencial\s+(-?[\d.]+)\s+(-?[\d.]+)')}
    folder,prefix,pattern=spec[kind]; content,url=latest_release(folder,prefix,4)
    if not content: return False
    text=norm(pdf_text(content)); p=normalize_month_name(text); m=re.search(pattern,text,re.I)
    if not(p and m): return False
    if kind=='igae':
        row={'periodo':p,'indice':m.group(1),'variacion_mensual':m.group(2),'variacion_anual':m.group(3)}; path='igae_construccion_mensual.csv'
    else:
        path='imai_construccion_mensual.csv' if kind=='imai' else 'ifb_residencial_mensual.csv'
        idx=chained_index(ROOT/path,m.group(1))
        row={'periodo':p,'indice':idx,'variacion_mensual':m.group(1),'variacion_anual':m.group(2)}
    return merge_csv(ROOT/path,[row])


def update_enoe():
    url=os.getenv('ENOE_CSV_URL','').strip()
    if url:
        rr=list(csv.DictReader(io.StringIO(get_text(url)))); rows=[]
        for r in rr:
            p=(r.get('periodo') or r.get('period') or '').strip()
            if p: rows.append({'periodo':p,'total':r.get('total',''),'formal':r.get('formal',''),'informal':r.get('informal','')})
        return merge_csv(ROOT/'enoe_construccion_trimestral.csv',rows)
    # Primero intenta la API para obtener historia trimestral completa con formalidad.
    base='https://api.datamexico.org/tesseract/data.jsonrecords'; dim='Classification of Formal and Informal Jobs of the First Activity'
    qcodes=[f'{y}{q}' for y in range(2018,datetime.now().year+1) for q in range(1,5)]
    params={'cube':'inegi_enoe','drilldowns':f'Quarter,{dim}','measures':'Workforce','Quarter':','.join(qcodes),dim:'1,2','Industry Actual Job':'23','parents':'false','sparse':'false','locale':'es'}
    try:
        raw=json.loads(get_text(base+'?'+urllib.parse.urlencode(params),90)); acc={}
        for r in raw.get('data',[]):
            q=str(r.get('Quarter ID') or r.get('Quarter') or '')
            if len(q)<5 or not q[:4].isdigit(): continue
            p=f'{q[:4]}-T{q[-1]}'
            try: v=float(r.get('Workforce'))/1000
            except: continue
            cid=str(r.get(dim+' ID','')); acc.setdefault(p,{'periodo':p,'total':'','formal':'','informal':''})
            if cid=='1': acc[p]['informal']=f'{v:.3f}'
            elif cid=='2': acc[p]['formal']=f'{v:.3f}'
        rows=[]
        for p,r in sorted(acc.items()):
            if r['formal'] and r['informal']:
                total=float(r['formal'])+float(r['informal'])
                if 2500<=total<=15000: r['total']=f'{total:.3f}'; rows.append(r)
        if rows: return merge_csv(ROOT/'enoe_construccion_trimestral.csv',rows)
    except Exception as e: print('ENOE API:',e)
    return False


def direct(name, env, fields):
    url=os.getenv(env,'').strip()
    if not url: return False
    rr=list(csv.DictReader(io.StringIO(get_text(url,90)))); rows=[]
    for r in rr:
        p=(r.get('periodo') or r.get('period') or '').strip()
        if p: rows.append({'periodo':p,**{f:r.get(f,'') for f in fields}})
    return merge_csv(ROOT/name,rows)


def update_vab_edificacion_direct():
    # Fuente exacta opcional. Nunca se sustituye edificación con el total de construcción.
    return direct('vab_edificacion_trimestral.csv','VAB_EDIFICACION_CSV_URL',['valor_mdp_2018_anualizado','variacion_anual_real','nota'])


def update_ifb_direct_or_release():
    # Si se configura una exportación longitudinal exacta, se prefiere a cualquier boletín.
    if os.getenv('IFB_RESIDENCIAL_CSV_URL','').strip():
        return direct('ifb_residencial_mensual.csv','IFB_RESIDENCIAL_CSV_URL',['indice','variacion_mensual','variacion_anual'])
    return update_monthly_inegi('ifb')


def update_imai_direct_or_release():
    if os.getenv('IMAI_CONSTRUCCION_CSV_URL','').strip():
        return direct('imai_construccion_mensual.csv','IMAI_CONSTRUCCION_CSV_URL',['indice','variacion_mensual','variacion_anual'])
    return update_monthly_inegi('imai')


def update_imss():
    return direct('imss_construccion_mensual.csv','IMSS_CSV_URL',['construccion','edificacion'])

changed=[]
for label,fn in [
 ('PIB construcción',update_pib),('VAB edificación',update_vab_edificacion_direct),('IGAE',lambda:update_monthly_inegi('igae')),('IFB',update_ifb_direct_or_release),('IMAI',update_imai_direct_or_release),
 ('ENOE',update_enoe),('IMSS',update_imss),('SHF',lambda:direct('shf_indice_trimestral.csv','SHF_CSV_URL',['variacion_anual','indice'])),('INPP',lambda:direct('inpp_componentes_construccion_mensual.csv','INPP_CSV_URL',['materiales','mano_obra','maquinaria']))]:
    try:
        if fn(): changed.append(label)
    except Exception as e: print(label,'error:',e)
(ROOT/'auto_update_status.json').write_text(json.dumps({'checked_at_utc':datetime.now(timezone.utc).isoformat(),'updated_sources':changed},ensure_ascii=False,indent=2),encoding='utf-8')
print('Fuentes actualizadas:',', '.join(changed) if changed else 'ninguna; se conservaron los últimos datos validados')
