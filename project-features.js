(function(root){
 'use strict';
 const h=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const date=v=>new Date(v).toLocaleString('nl-NL',{dateStyle:'short',timeStyle:'short'});
 class Features{
  constructor(ctx){
   this.ctx=ctx;this.api=root.vdbhProjects;this.project=null;this.comments=[];this.objects=[];this.dirty=false;this.revision=0;this.busy=false;this.showLabels=true;
   this.status=document.getElementById('projectStatus');this.noteList=document.getElementById('projectComments');
   this.name=document.getElementById('projectName');this.number=document.getElementById('projectNumber');
   document.getElementById('projectSave').onclick=()=>this.action(()=>this.save());
   document.getElementById('projectOpen').onclick=()=>this.action(()=>this.chooseProject());
   document.getElementById('projectNew').onclick=()=>this.action(()=>this.newProject());
   document.getElementById('projectReports').onclick=()=>this.action(()=>this.showReports());
   document.getElementById('modeComment').onclick=()=>ctx.setMode('comment');
   document.getElementById('toggleCommentLabels').onclick=()=>{this.showLabels=!this.showLabels;document.getElementById('toggleCommentLabels').textContent=this.showLabels?'Labels: aan':'Labels: uit';};
   document.getElementById('openChangelog').onclick=()=>this.action(()=>this.showChangelog(false));
   for(const field of [this.name,this.number])field.addEventListener('input',()=>this.markDirty());
   root.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();if(!this.busy)this.action(()=>this.save());}});
   this.api?.onSaveBeforeClose(()=>this.action(async()=>{if(await this.save())this.api.closeAfterSave();}));
   if(!this.api){this.status.textContent='Projectopslag is beschikbaar in de Windows-app.';for(const id of ['projectSave','projectOpen','projectNew','projectReports'])document.getElementById(id).disabled=true;}
   this.renderComments();this.updateStatus();
   if(this.api)this.action(()=>this.showChangelog(true));
  }
  async action(fn){try{return await fn();}catch(e){this.ctx.message('Actie mislukt: '+e.message);return false;}}
  updateStatus(){if(!this.api)return;this.status.textContent=(this.project?'Project: '+this.project.name:'Nog geen opgeslagen project')+(this.dirty?' · Niet opgeslagen':' · '+(this.project?'Opgeslagen':'Kies een naam en sla op'));}
  markDirty(){if(this.busy)return;this.dirty=true;this.revision++;this.api?.setDirty(true);this.updateStatus();}
  clean(){this.dirty=false;this.api?.setDirty(false);this.updateStatus();}
  async lock(fn){
   if(this.busy||this.reportBusy||this.ctx.importBusy?.())throw Error('Wacht tot het importeren, de projectactie of rapportexport klaar is.');this.busy=true;
   const overlay=document.createElement('div');overlay.className='project-working';overlay.textContent='Project wordt verwerkt…';document.body.appendChild(overlay);
   const dialogs=Array.from(document.querySelectorAll('dialog[open]')).map(el=>({el,inert:el.inert}));dialogs.forEach(({el})=>el.inert=true);
   try{return await fn();}finally{dialogs.forEach(({el,inert})=>el.inert=inert);overlay.remove();this.busy=false;}
  }
  form(title,body,buttons){
   return new Promise(resolve=>{
    const dialog=document.createElement('dialog');dialog.className='project-dialog';
    dialog.innerHTML='<form><div class="project-dialog-head"><h2>'+h(title)+'</h2></div>'+body+'<div class="project-dialog-actions">'+buttons.map(b=>'<button type="'+(b.submit?'submit':'button')+'" data-result="'+h(b.value)+'" class="'+(b.primary?'primary':'')+'"'+(b.disabled?' disabled':'')+'>'+h(b.label)+'</button>').join('')+'</div></form>';
    let done=false;const finish=value=>{if(done)return;done=true;dialog.close();dialog.remove();resolve(value);};
    dialog.addEventListener('cancel',e=>{e.preventDefault();finish(null);});
    const form=dialog.querySelector('form');
    form.onsubmit=e=>{e.preventDefault();if(form.reportValidity())finish({value:'submit',fields:Object.fromEntries(new FormData(form))});};
    dialog.querySelectorAll('button[type=button]').forEach(b=>b.onclick=()=>finish({value:b.dataset.result}));
    document.body.appendChild(dialog);dialog.showModal();dialog.querySelector('input,textarea,button')?.focus();
   });
  }
  async projectDetails(){
   const r=await this.form('Project opslaan','<p>Bewaar de geladen modellen, ondergronden, metingen en opmerkingen samen.</p><label>Projectnaam<input name="name" required maxlength="160" value="'+h(this.name.value)+'"></label><label>Projectnummer<input name="number" maxlength="80" value="'+h(this.number.value)+'"></label>',[{value:'cancel',label:'Annuleren'},{submit:true,label:'Opslaan',primary:true}]);
   if(!r?.fields)return false;this.name.value=r.fields.name;this.number.value=r.fields.number;return true;
  }
  async save(){
   if(!this.api)return false;
   if(!this.name.value.trim()&&!await this.projectDetails())return false;
   return this.lock(async()=>{
    const state=this.ctx.capture(this.comments);root.VDBHProjectState.validateState(state);
    const p=await this.api.save({id:this.project?.id||null,name:this.name.value.trim(),number:this.number.value.trim(),expectedUpdatedAt:this.project?.updatedAt,state});
    this.project=p;this.clean();this.ctx.message('Project “'+p.name+'” opgeslagen.');return true;
   });
  }
  async mayLeave(){
   if(!this.dirty)return true;
   const r=await this.form('Wijzigingen bewaren?','<p>Dit project heeft niet-opgeslagen wijzigingen.</p>',[{value:'cancel',label:'Annuleren'},{value:'discard',label:'Doorgaan zonder opslaan'},{value:'save',label:'Eerst opslaan',primary:true}]);
   if(r?.value==='discard')return true;if(r?.value==='save')return !!await this.save();return false;
  }
  async newProject(){
   if(!this.api||!await this.mayLeave())return;
   const r=await this.form('Nieuw project','<label>Projectnaam<input name="name" required maxlength="160"></label><label>Projectnummer<input name="number" maxlength="80"></label>',[{value:'cancel',label:'Annuleren'},{submit:true,label:'Project maken',primary:true}]);
   if(!r?.fields)return;
   // Persist the empty project first. A failed disk write leaves the current model intact.
   const p=await this.lock(()=>this.api.save({name:r.fields.name,number:r.fields.number,state:this.ctx.empty()}));
   await this.lock(()=>this.ctx.restore(this.ctx.empty()));this.project=p;this.comments=[];this.renderComments();this.rebuildMarkers();this.name.value=p.name;this.number.value=p.number;this.clean();this.ctx.message('Nieuw project “'+p.name+'” geopend.');
  }
  async chooseProject(){
   if(!this.api)return;
   const {projects,warnings}=await this.api.list();
   const body='<p>Kies een opgeslagen project. Bronbestanden hoeven niet opnieuw te worden geïmporteerd.</p>'+warnings.map(w=>'<p class="project-warning">'+h(w)+'</p>').join('')+
    (projects.length?'<label>Project<select name="id">'+projects.map(p=>'<option value="'+h(p.id)+'">'+h((p.number?p.number+' · ':'')+p.name+' — '+date(p.updatedAt))+'</option>').join('')+'</select></label>':'<p>Er zijn nog geen projecten opgeslagen.</p>');
   const r=await this.form('Project openen',body,[{value:'cancel',label:'Sluiten'},...(projects.length?[{submit:true,label:'Openen',primary:true}]:[])]);
   if(r?.fields)await this.openProject(r.fields.id);
  }
  async openProject(projectId){
   if(!this.api||!await this.mayLeave())return;
   await this.lock(async()=>{
    const p=await this.api.load(projectId);root.VDBHProjectState.validateState(p.state);
    const rollback=this.ctx.capture(this.comments);
    try{await this.ctx.restore(p.state);}catch(e){try{await this.ctx.restore(rollback);}catch{}throw e;}
    this.comments=structuredClone(p.state.comments);this.project={id:p.id,name:p.name,number:p.number,createdAt:p.createdAt,updatedAt:p.updatedAt};
    this.name.value=p.name;this.number.value=p.number;this.rebuildMarkers();this.renderComments();this.clean();this.ctx.message('Project “'+p.name+'” geopend.');
   });
  }
  async renameProject(project){
   const r=await this.form('Projectgegevens wijzigen','<label>Projectnaam<input name="name" required maxlength="160" value="'+h(project.name)+'"></label><label>Projectnummer<input name="number" maxlength="80" value="'+h(project.number)+'"></label>',[{value:'cancel',label:'Annuleren'},{submit:true,label:'Opslaan',primary:true}]);
   if(!r?.fields)return false;
   await this.lock(async()=>{
    const next=await this.api.rename({id:project.id,expectedUpdatedAt:project.updatedAt,name:r.fields.name,number:r.fields.number});
    if(this.project?.id===project.id){this.project=next;this.name.value=next.name;this.number.value=next.number;this.updateStatus();}
   });
   this.ctx.message('Projectgegevens gewijzigd.');return true;
  }
  async deleteProject(project){
   const active=this.project?.id===project.id;
   if(active&&this.dirty){if(!await this.mayLeave())return false;project={...project,...this.project};}
   const reports=await this.api.reports(project.id);
   const r=await this.form('Project verwijderen','<p>Wil je <strong>'+h(project.name)+'</strong> verwijderen?</p><p>Het opgeslagen model, de opmerkingen en '+reports.length+' rapport'+(reports.length===1?'':'en')+' gaan samen naar de prullenbak. Je kunt het project daar later herstellen.</p>'+(active?'<p>Het actieve project wordt ook uit de viewer gesloten.</p>':''),[{value:'cancel',label:'Annuleren'},{value:'remove',label:'Naar prullenbak',primary:true}]);
   if(r?.value!=='remove')return false;
   await this.lock(async()=>{
    const rollback=active?this.ctx.capture(this.comments):null;
    const removed=await this.api.remove({id:project.id,expectedUpdatedAt:project.updatedAt});
    if(active){
     try{await this.ctx.restore(this.ctx.empty());}
     catch(e){await this.api.restore({id:removed.id,expectedDeletedAt:removed.deletedAt});try{await this.ctx.restore(rollback);}catch{}throw e;}
     this.project=null;this.comments=[];this.name.value='';this.number.value='';this.renderComments();this.rebuildMarkers();this.clean();
    }
   });
   this.ctx.message('Project “'+project.name+'” naar de prullenbak verplaatst.');return true;
  }
  async manageProjects(){
   if(!this.api)return;
   const dialog=document.createElement('dialog');dialog.className='project-dialog project-manager';
   dialog.innerHTML='<div class="project-dialog-head"><h2>Projectoverzicht</h2><button type="button" data-close>Sluiten</button></div><div class="manager-tabs"><button type="button" data-tab="projects" aria-pressed="true">Projecten</button><button type="button" data-tab="trash" aria-pressed="false">Prullenbak</button><button type="button" data-refresh>Vernieuwen</button></div><label>Zoeken<input type="search" placeholder="Projectnaam of projectnummer" aria-label="Projecten zoeken"></label><p class="manager-notice" role="status"></p><div class="manager-list"></div>';
   const host=dialog.querySelector('.manager-list'),notice=dialog.querySelector('.manager-notice'),search=dialog.querySelector('input');
   let tab='projects',request=0,rows=[];
   const close=()=>{request++;dialog.close();dialog.remove();};
   const button=(label,handler,extra='')=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.className=extra;b.onclick=()=>task(handler);return b;};
   const task=async fn=>{if(this.busy||this.reportBusy)return;try{const feedback=await fn();if(dialog.isConnected){await refresh();if(typeof feedback==='string')notice.textContent=feedback;}}catch(e){notice.textContent=e.message;}};
   const paint=()=>{
    host.replaceChildren();const term=search.value.trim().toLocaleLowerCase('nl-NL');
    const filtered=rows.filter(p=>(p.name+' '+p.number).toLocaleLowerCase('nl-NL').includes(term));
    if(!filtered.length){host.textContent=term?'Geen projecten gevonden.':tab==='trash'?'De prullenbak is leeg.':'Er zijn nog geen projecten opgeslagen.';return;}
    for(const p of filtered){
     const card=document.createElement('article');card.className='manager-project';
     const name=document.createElement('strong');name.textContent=(p.number?p.number+' · ':'')+p.name+(this.project?.id===p.id?' · Actief':'');card.appendChild(name);
     const info=document.createElement('p');info.textContent=(tab==='trash'?'Verwijderd: '+date(p.deletedAt):'Opgeslagen: '+date(p.updatedAt))+' · '+p.surfaces+' surface(s) · '+p.comments+' opmerking(en)';card.appendChild(info);
     const actions=document.createElement('div');actions.className='manager-actions';
     if(tab==='trash')actions.appendChild(button('Herstellen',async()=>{await this.lock(()=>this.api.restore({id:p.id,expectedDeletedAt:p.deletedAt}));return 'Project hersteld. Je vindt het terug onder Projecten.';},'primary'));
     else{
      actions.appendChild(button('Openen',async()=>{close();await this.openProject(p.id);},'primary'));
      actions.appendChild(button('Naam / nummer wijzigen',()=>this.renameProject(p)));
      actions.appendChild(button('Rapporten',async()=>{close();await this.showReports(p.id);}));
      actions.appendChild(button('Verwijderen',()=>this.deleteProject(p),'manager-delete'));
     }
     card.appendChild(actions);host.appendChild(card);
    }
   };
   const refresh=async()=>{
    const token=++request;host.textContent='Projecten laden…';
    try{const result=tab==='trash'?await this.api.trash():await this.api.list();if(token!==request||!dialog.isConnected)return;rows=result.projects;notice.textContent=result.warnings.join(' ');paint();}
    catch(e){if(token===request){notice.textContent=e.message;host.replaceChildren();}}
   };
   dialog.querySelector('[data-close]').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
   dialog.querySelector('[data-refresh]').onclick=refresh;
   dialog.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;dialog.querySelectorAll('[data-tab]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));refresh();});
   search.oninput=paint;document.body.appendChild(dialog);dialog.showModal();await refresh();
  }
  async showReports(projectId=null){
   if(!this.api)return;
   const {projects}=await this.api.list();if(!projects.length){this.ctx.message('Sla eerst een project op om rapporten te bewaren.');return;}
   const dialog=document.createElement('dialog');dialog.className='project-dialog project-reports';
   dialog.innerHTML='<div class="project-dialog-head"><h2>Rapporten per project</h2><button type="button">Sluiten</button></div><label>Project<select></select></label><div class="project-report-list" aria-live="polite"></div>';
   const select=dialog.querySelector('select'),host=dialog.querySelector('.project-report-list');
   projects.forEach(p=>{const o=document.createElement('option');o.value=p.id;o.textContent=(p.number?p.number+' · ':'')+p.name;select.appendChild(o);});if(projectId)select.value=projectId;else if(this.project)select.value=this.project.id;
   let request=0;
   const render=async()=>{
    const token=++request,projectId=select.value;host.textContent='Rapporten laden…';
    try{const rows=await this.api.reports(projectId);if(token!==request||!dialog.isConnected)return;host.replaceChildren();
     if(!rows.length){host.textContent='Voor dit project zijn nog geen rapporten gemaakt.';return;}
     for(const row of rows){const card=document.createElement('article');card.className='project-report-card';
      const strong=document.createElement('strong');strong.textContent=row.title;card.appendChild(strong);
      const detail=document.createElement('p');detail.textContent=date(row.createdAt)+(row.volume==null?'':' · '+row.volume.toLocaleString('nl-NL',{maximumFractionDigits:1})+' m³')+(row.materials?.length?' · '+row.materials.join(', '):'');card.appendChild(detail);
      const button=document.createElement('button');button.textContent='PDF openen';button.onclick=()=>this.action(()=>this.api.openReport(projectId,row.id));card.appendChild(button);host.appendChild(card);
     }
    }catch(e){if(token===request)host.textContent='Rapporten laden mislukt: '+e.message;}
   };
   select.onchange=render;const close=()=>{request++;dialog.close();dialog.remove();};dialog.querySelector('button').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});document.body.appendChild(dialog);dialog.showModal();await render();
  }
  async placeComment(point){
   if(this.busy)return;
   if(this.comments.length>=1000){this.ctx.message('Er kunnen maximaal 1.000 opmerkingen in een project staan.');return;}
   if(this.commentPlacing)return false;
   this.commentPlacing=true;this.ctx.completeTool?.();
   try{return !!await this.editComment(null,point);}finally{this.commentPlacing=false;}
  }
  async editComment(note,point){
   const p=point||note.point,world=this.ctx.world(p);
   const body='<p class="small muted">X '+world[0].toFixed(3)+' · Y '+world[1].toFixed(3)+' · Z '+world[2].toFixed(3)+' m</p><label>Opmerking<textarea name="text" maxlength="2000" rows="5" required>'+h(note?.text||'')+'</textarea></label><label>Status<select name="status"><option value="open">Open</option><option value="done"'+(note?.done?' selected':'')+'>Afgehandeld</option></select></label>';
   const r=await this.form(note?'Opmerking wijzigen':'Opmerking plaatsen',body,[{value:'cancel',label:'Annuleren'},...(note?[{value:'delete',label:'Verwijderen'}]:[]),{submit:true,label:'Bewaren',primary:true}]);
   if(r?.value==='delete')this.comments=this.comments.filter(n=>n.id!==note.id);
   else if(r?.fields){if(!r.fields.text.trim())return;const now=new Date().toISOString();
    if(note){note.text=r.fields.text.trim();note.done=r.fields.status==='done';note.updatedAt=now;}
    else this.comments.push({id:crypto.randomUUID(),text:r.fields.text.trim(),done:r.fields.status==='done',point:p.slice(),createdAt:now,updatedAt:now});
   }else return;
   this.rebuildMarkers();this.renderComments();this.markDirty();this.ctx.message('Opmerkingen bijgewerkt. Sla het project op om ze te bewaren.');return true;
  }
  clearComments(){this.comments=[];this.renderComments();this.rebuildMarkers();}
  renderComments(){
   this.noteList.replaceChildren();if(!this.comments.length){this.noteList.textContent='Klik op Opmerking plaatsen en daarna op het terrein.';return;}
   this.comments.forEach((note,i)=>{
    const card=document.createElement('article');card.className='project-comment-card';
    const text=document.createElement('p');text.textContent=(i+1)+'. '+note.text;card.appendChild(text);
    const state=document.createElement('small');state.textContent=note.done?'Afgehandeld':'Open';card.appendChild(state);
    for(const [label,fn] of [['Tonen',()=>this.ctx.focus(note.point)],['Wijzigen',()=>this.action(()=>this.editComment(note))]]){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=fn;card.appendChild(b);}
    this.noteList.appendChild(card);
   });
  }
  rebuildMarkers(){
   for(const obj of this.objects){this.ctx.scene.remove(obj);obj.geometry.dispose();obj.material.dispose();}this.objects=[];
   const T=this.ctx.THREE;
   this.comments.forEach(note=>{const marker=new T.Mesh(new T.SphereGeometry(.14,20,16),new T.MeshBasicMaterial({color:note.done?0x4dbe8c:0xff5a00,depthTest:true,depthWrite:true}));marker.position.set(...note.point);marker.renderOrder=1100;marker.userData.isComment=true;this.ctx.scene.add(marker);this.objects.push(marker);});
   for(const layer of document.querySelectorAll('.project-note-labels'))layer.replaceChildren();
  }
  labels(layer,camera,canvas){
   if(!layer)return;
   const signature=this.comments.map(n=>n.id+n.updatedAt).join('|');
   if(layer.dataset.signature!==signature||layer.childElementCount!==this.comments.length){layer.dataset.signature=signature;layer.replaceChildren();this.comments.forEach((note,i)=>{const el=layer.ownerDocument.createElement('span');el.className='project-note-label';el.style.setProperty('--note-color',note.done?'#4dbe8c':'#ff5a00');const badge=layer.ownerDocument.createElement('span');badge.className='project-note-badge';badge.textContent=(i+1)+'. '+note.text.slice(0,70)+(note.text.length>70?'…':'');el.title=note.text;const stem=layer.ownerDocument.createElement('span');stem.className='project-note-stem';const pin=layer.ownerDocument.createElement('span');pin.className='project-note-pin';el.appendChild(badge);el.appendChild(stem);el.appendChild(pin);layer.appendChild(el);});}
   const r=canvas.getBoundingClientRect();this.comments.forEach((note,i)=>{const el=layer.children[i],p=new this.ctx.THREE.Vector3(...note.point).project(camera),visible=this.showLabels&&p.z>=-1&&p.z<=1&&Math.abs(p.x)<=1&&Math.abs(p.y)<=1;el.style.display=visible?'block':'none';el.style.left=(p.x*.5+.5)*r.width+'px';el.style.top=(-p.y*.5+.5)*r.height+'px';});
  }
  async ensureReportProject(){if(!this.api)return true;return await this.action(()=>this.save());}
  async chooseExport(){
   if(this.busy||this.reportBusy||this.ctx.importBusy?.()||this.exportChoosing)return;
   this.exportChoosing=true;
   try{
    const buttons=[{value:'cancel',label:'Annuleren'},{value:'comments',label:'Opmerkingenrapport (PDF)',primary:true,disabled:!this.comments.length}];
    if(this.ctx.hasReport?.())buttons.push({value:'depot',label:'Depotrapport (PDF)'});
    const result=await this.form('PDF exporteren','<p>Het opmerkingenrapport bevat alle opmerkingen, hun status en exacte X-, Y- en Z-coördinaten. Deze export is beschikbaar zodra minstens één opmerking is geplaatst.</p><p>Een depotrapport is beschikbaar na een volumeberekening.</p>',buttons);
    if(result?.value==='comments')await this.exportCommentsPDF();
    else if(result?.value==='depot')await this.ctx.exportDepot?.();
   }finally{this.exportChoosing=false;}
  }
  async exportCommentsPDF(){
   if(this.busy||this.reportBusy||this.ctx.importBusy?.()||this.exportingComments)return false;
   if(!this.comments.length){this.ctx.message('Plaats eerst een opmerking in het model om een opmerkingenrapport te maken.');return false;}
   this.exportingComments=true;
   try{
    if(this.api&&!await this.save())return false;
    this.ctx.completeTool?.();this.beginReport();
    const pdf=await this.ctx.createPDF();
    const meta={project:this.project?.name||this.name.value.trim()||'Terreinmodel',number:this.project?.number||this.number.value.trim(),reportDate:new Date().toLocaleDateString('sv-SE')};
    root.VDBHCommentsReport.generate(pdf,meta,this.ctx.capture(this.comments));
    if(this.api)await this.api.saveReport({projectId:this.reportProjectId,title:'Opmerkingenrapport · '+meta.reportDate,metadata:meta,materials:[],pdf:new Uint8Array(pdf.output('arraybuffer'))});
    pdf.save('VDBH_Opmerkingen_'+(meta.number||meta.project).replace(/[^a-z0-9_-]/gi,'_')+'_'+meta.reportDate+'.pdf');
    this.ctx.message(this.api?'Opmerkingenrapport geëxporteerd en opgeslagen bij het project. Open het via Rapporten.':'Opmerkingenrapport geëxporteerd.');
    return true;
   }finally{if(this.reportBusy)this.endReport();this.exportingComments=false;}
  }
  beginReport(){this.reportBusy=true;this.reportProjectId=this.project?.id;this.reportOverlay=document.createElement('div');this.reportOverlay.className='project-working';this.reportOverlay.textContent='Rapport wordt gemaakt…';document.body.appendChild(this.reportOverlay);}
  endReport(){this.reportBusy=false;this.reportOverlay?.remove();this.reportOverlay=null;}
  async archivePDF(pdf,meta,d){
   if(!this.api)return;
   if(!this.project||!this.reportProjectId)throw Error('Sla eerst een project op.');
   const rows=d.boundaryResults||[],volume=rows.length?rows.reduce((sum,r)=>sum+Number(r.volumeM3??r.volume??0),0):Number(d.volume??d.net??0);
   await this.api.saveReport({projectId:this.reportProjectId,title:'Depotmeting · '+meta.reportDate,metadata:meta,volume,materials:[...new Set(rows.map(r=>r.material).filter(Boolean))],pdf:new Uint8Array(pdf.output('arraybuffer'))});
  }
  notesPDF(pdf,header,useFirstPage=false){
   if(!this.comments.length)return;
   let y=0,first=true;const start=()=>{if(!first||!useFirstPage)pdf.addPage();first=false;header('Opmerkingen bij het terreinmodel');pdf.setFont('helvetica','normal');pdf.setFontSize(9);pdf.setTextColor(25,38,32);y=55;};start();
   this.comments.forEach((note,i)=>{
    pdf.setFont('helvetica','normal');pdf.setFontSize(9);const point=this.ctx.world(note.point),lines=pdf.splitTextToSize(note.text,182);
    if(y>235)start();pdf.setFont('helvetica','bold');pdf.setFontSize(10);pdf.setTextColor(25,38,32);pdf.text((i+1)+'. '+(note.done?'Afgehandeld':'Open'),10,y);y+=6;
    pdf.setFont('helvetica','normal');pdf.setFontSize(8);pdf.text('X '+point[0].toFixed(3)+' · Y '+point[1].toFixed(3)+' · Z '+point[2].toFixed(3)+' m',10,y);y+=6;
    pdf.setFontSize(9);for(const line of lines){if(y>266)start();pdf.text(line,10,y);y+=4.5;}y+=7;
   });
  }
  async showChangelog(automatic){
   let news;if(this.api)news=await this.api.changelog();else{const response=await fetch('./changelog.json');if(!response.ok)throw Error('Wijzigingen konden niet worden geladen.');news={entries:(await response.json()).entries};}
   if(automatic&&!news.showAutomatically)return;
   const latest=news.entries.find(entry=>entry.version===news.version)||news.entries[0];
   const visibleEntries=latest?[latest]:[];
   const body='<p>Nieuw in VDBH Terrein Viewer. Deze melding verschijnt eenmaal per versie.</p>'+visibleEntries.map(entry=>'<section class="project-news"><h3>BETA '+h(entry.version)+' <small>'+h(entry.date||'')+'</small></h3><ul>'+entry.changes.map(c=>'<li>'+h(c)+'</li>').join('')+'</ul></section>').join('');
   const shown=this.form('Wat is er nieuw?',body,[{value:'close',label:'Sluiten',primary:true}]);
   // Mark after rendering, not before fetching; a failed status write is visible and retryable.
   if(this.api)try{await this.api.markChangelogSeen(news.version);}catch(e){this.ctx.message('Wijzigingen geopend; de eenmalige melding kon niet worden onthouden: '+e.message);}
   await shown;
  }
 }
 root.VDBHProjectFeatures=Features;
})(window);
