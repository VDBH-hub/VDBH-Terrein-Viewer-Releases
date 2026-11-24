(function(root){
 'use strict';
 function validateState(s){
  const bad=message=>{throw Error('Ongeldig project: '+message);};
  const list=(a,max,label)=>{if(!Array.isArray(a)||a.length>max)bad(label);return a;};
  const str=(v,max=1000)=>{if(typeof v!=='string'||v.length>max)bad('tekstveld');};
  const number=v=>{if(typeof v!=='number'||!Number.isFinite(v))bad('coördinaat of getal');};
  const point=p=>{if(!Array.isArray(p)||p.length!==3)bad('punt');p.forEach(number);};
  const points=(a,min=0)=>{list(a,5000000,'punten');if(a.length<min)bad('te weinig punten');a.forEach(point);};
  const color=v=>{if(v!==undefined&&!(typeof v==='number'&&Number.isInteger(v)&&v>=0&&v<=0xffffff)&&!(typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v)))bad('kleur');};
  if(!s||s.version!==1)bad('onbekende versie');
  if(s.origin!==null){if(!s.origin)bad('oorsprong');number(s.origin.x);number(s.origin.y);}
  let budget=0;
  for(const surf of list(s.surfaces,1000,'surfaces')){
   str(surf.name,500);points(surf.pts,3);budget+=surf.pts.length*3;
   for(const f of list(surf.faces,10000000,'driehoeken'))if(!Array.isArray(f)||f.length!==3||f.some(i=>!Number.isInteger(i)||i<0||i>=surf.pts.length))bad('driehoekverwijzing');
   budget+=surf.faces.length*3;color(surf.color);color(surf.displayColor);
   if(surf.opacity!==undefined){number(surf.opacity);if(surf.opacity<0||surf.opacity>1)bad('transparantie');}
  }
  for(const line of list(s.lines,1000000,'lijnen')){points(line.points,2);budget+=line.points.length*3;str(line.layer||'',500);}
  for(const u of list(s.underlays,1000,'ondergronden')){
   str(u.name,500);color(u.color);number(u.opacity);
   for(const o of list(u.objects,1000000,'lijnobjecten')){list(o.positions,30000000,'lijnpunten').forEach(number);if(o.positions.length%3)bad('lijncoördinaten');budget+=o.positions.length;}
   if(u.bounds)points(u.bounds);
  }
  for(const note of list(s.comments,1000,'opmerkingen')){str(note.id,80);str(note.text,2000);if(!note.text.trim())bad('lege opmerking');point(note.point);str(note.createdAt,40);str(note.updatedAt,40);}
  for(const h of list(s.heightPoints,100000,'hoogtepunten')){point(h.point);str(h.surface||'',500);}
  for(const p of list(s.profiles,10000,'profielen')){str(p.name,500);points(p.points,2);}
  points(s.trace);points(s.boundaryPoints);
  for(const b of list(s.boundaries,10000,'boundaries')){str(b.name,500);points(b.points,3);if(b.material)str(b.material,100);}
  if(s.boundaryLine)points(s.boundaryLine);
  if(!s.view||!s.settings)bad('weergave-instellingen');point(s.view.position);point(s.view.target);if(s.view.up){point(s.view.up);if(Math.hypot(...s.view.up)<.001)bad('camera-oriëntatie');}number(s.view.near);number(s.view.far);
  if(s.view.near<=0||s.view.far<=s.view.near)bad('camera-afstanden');
  for(const v of ['surfaceA','surfaceB'])if(!Number.isInteger(s.settings[v])||s.settings[v]<0)bad('surfacekeuze');
  if(!['depot','compare'].includes(s.settings.calcMode))bad('rekenmethode');
  if(s.settings.aerialOpacity!==undefined){number(s.settings.aerialOpacity);if(s.settings.aerialOpacity<0||s.settings.aerialOpacity>100)bad('luchtfoto-transparantie');}
  if(budget>50000000)bad('te veel geometrie');
  if(s.origin===null&&(s.surfaces.length||s.lines.length||s.underlays.length||s.comments.length))bad('oorsprong ontbreekt bij geometrie');
  return s;
 }
 const api={validateState};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VDBHProjectState=api;
})(typeof window!=='undefined'?window:globalThis);
