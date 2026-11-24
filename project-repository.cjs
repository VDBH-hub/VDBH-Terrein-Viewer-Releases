'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const {randomUUID}=require('node:crypto');
const {validateState}=require('./project-state.js');
const MAX_JSON=250*1024*1024,MAX_PDF=100*1024*1024;
const idPattern=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
function id(v){if(typeof v!=='string'||!idPattern.test(v))throw Error('Ongeldig project- of rapportnummer.');return v;}
function text(v,max,required=false){if(typeof v!=='string'||v.length>max||(required&&!v.trim()))throw Error('Ongeldige projectgegevens.');return v.trim();}
async function atomic(file,value){
 await fs.mkdir(path.dirname(file),{recursive:true});
 const temp=file+'.'+randomUUID()+'.tmp';
 try{const h=await fs.open(temp,'wx');try{await h.writeFile(value);await h.sync();}finally{await h.close();}await fs.rename(temp,file);}finally{await fs.rm(temp,{force:true}).catch(()=>{});}
}
class ProjectRepository{
 constructor(root){this.root=path.resolve(root);this.queue=Promise.resolve();}
 folder(projectId){return path.join(this.root,id(projectId));}
 serial(fn){const job=this.queue.then(fn);this.queue=job.catch(()=>{});return job;}
 async readJSON(file,max=MAX_JSON){const stat=await fs.stat(file);if(stat.size>max)throw Error('Opgeslagen bestand is te groot.');return JSON.parse(await fs.readFile(file,'utf8'));}
 async read(projectId){
  const p=await this.readJSON(path.join(this.folder(projectId),'project.json'));
  if(p.format!=='VDBH_PROJECT'||p.version!==1||p.id!==projectId)throw Error('Onbekende projectversie.');
  validateState(p.state);return p;
 }
 async list(){
  await fs.mkdir(this.root,{recursive:true});const projects=[],warnings=[];
  for(const entry of await fs.readdir(this.root,{withFileTypes:true})){
   if(!entry.isDirectory()||!idPattern.test(entry.name))continue;
   try{const p=await this.read(entry.name);projects.push({id:p.id,name:p.name,number:p.number,createdAt:p.createdAt,updatedAt:p.updatedAt,surfaces:p.state.surfaces.length,comments:p.state.comments.length});}
   catch{warnings.push('Een opgeslagen project kon niet worden gelezen ('+entry.name+').');}
  }
  projects.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));return {projects,warnings};
 }
 save(payload){return this.serial(async()=>{
  if(!payload||typeof payload!=='object')throw Error('Projectgegevens ontbreken.');
  const name=text(payload.name,160,true),number=text(payload.number||'',80);validateState(payload.state);
  const projectId=payload.id==null?randomUUID():id(payload.id),folder=this.folder(projectId);
  let previous=null;if(payload.id)previous=await this.read(projectId);
  if(previous&&payload.expectedUpdatedAt!==previous.updatedAt)throw Error('Dit project is elders gewijzigd. Open het opnieuw voordat je opslaat.');
  const now=new Date(Math.max(Date.now(),previous?Date.parse(previous.updatedAt)+1:0)).toISOString();const p={format:'VDBH_PROJECT',version:1,id:projectId,name,number,createdAt:previous?.createdAt||now,updatedAt:now,state:payload.state};
  const data=JSON.stringify(p);if(Buffer.byteLength(data)>MAX_JSON)throw Error('Het project is groter dan 250 MB.');
  if(previous)await atomic(path.join(folder,'project.previous.json'),JSON.stringify(previous));
  await atomic(path.join(folder,'project.json'),data);
  return {id:p.id,name:p.name,number:p.number,createdAt:p.createdAt,updatedAt:p.updatedAt};
 });}
 rename(payload){return this.serial(async()=>{
  const p=await this.read(id(payload.id));
  if(payload.expectedUpdatedAt!==p.updatedAt)throw Error('Dit project is inmiddels gewijzigd. Vernieuw het overzicht.');
  const name=text(payload.name,160,true),number=text(payload.number||'',80);
  const next={...p,name,number,updatedAt:new Date(Math.max(Date.now(),Date.parse(p.updatedAt)+1)).toISOString()};
  await atomic(path.join(this.folder(p.id),'project.previous.json'),JSON.stringify(p));
  await atomic(path.join(this.folder(p.id),'project.json'),JSON.stringify(next));
  return {id:p.id,name,number,createdAt:p.createdAt,updatedAt:next.updatedAt};
 });}
 remove(payload){return this.serial(async()=>{
  const p=await this.read(id(payload.id));
  if(payload.expectedUpdatedAt!==p.updatedAt)throw Error('Dit project is inmiddels gewijzigd. Vernieuw het overzicht.');
  const source=this.folder(p.id),trash=path.join(this.root,'.trash'),destination=path.join(trash,p.id);
  await fs.mkdir(trash,{recursive:true});
  try{await fs.access(destination);throw Error('Er staat al een verwijderd project met dit nummer in de prullenbak.');}catch(e){if(e.code!=='ENOENT')throw e;}
  const deletedAt=new Date().toISOString();
  await atomic(path.join(source,'trash-info.json'),JSON.stringify({id:p.id,deletedAt}));
  await fs.rename(source,destination);
  return {id:p.id,name:p.name,number:p.number,deletedAt};
 });}
 async trash(){
  const folder=path.join(this.root,'.trash'),projects=[],warnings=[];
  let entries;try{entries=await fs.readdir(folder,{withFileTypes:true});}catch(e){if(e.code==='ENOENT')return {projects,warnings};throw e;}
  for(const entry of entries){
   if(!entry.isDirectory()||!idPattern.test(entry.name))continue;
   try{
    const p=await this.readJSON(path.join(folder,entry.name,'project.json'));
    const info=await this.readJSON(path.join(folder,entry.name,'trash-info.json'),1024);
    if(p.format!=='VDBH_PROJECT'||p.version!==1||p.id!==entry.name||info.id!==entry.name)throw Error('Ongeldig verwijderd project.');
    validateState(p.state);projects.push({id:p.id,name:p.name,number:p.number,updatedAt:p.updatedAt,deletedAt:info.deletedAt,surfaces:p.state.surfaces.length,comments:p.state.comments.length});
   }catch{warnings.push('Een verwijderd project kon niet worden gelezen ('+entry.name+').');}
  }
  projects.sort((a,b)=>b.deletedAt.localeCompare(a.deletedAt));return {projects,warnings};
 }
 restore(payload){return this.serial(async()=>{
  const projectId=id(payload.id),source=path.join(this.root,'.trash',projectId),destination=this.folder(projectId);
  const p=await this.readJSON(path.join(source,'project.json'));
  const info=await this.readJSON(path.join(source,'trash-info.json'),1024);
  if(p.id!==projectId||p.format!=='VDBH_PROJECT'||p.version!==1||info.id!==projectId)throw Error('Onbekend verwijderd project.');
  validateState(p.state);
  if(payload.expectedDeletedAt!==info.deletedAt)throw Error('De prullenbak is inmiddels gewijzigd. Vernieuw het overzicht.');
  try{await fs.access(destination);throw Error('Dit project bestaat al. Het is niet overschreven.');}catch(e){if(e.code!=='ENOENT')throw e;}
  await fs.rename(source,destination);await fs.rm(path.join(destination,'trash-info.json'),{force:true}).catch(()=>{});
  return {id:p.id,name:p.name,number:p.number,createdAt:p.createdAt,updatedAt:p.updatedAt};
 });}
 async reports(projectId){
  await this.read(projectId);let rows;
  try{rows=await this.readJSON(path.join(this.folder(projectId),'reports','index.json'),10*1024*1024);}
  catch(e){if(e.code==='ENOENT')return [];throw Error('Het rapportenoverzicht kon niet worden gelezen.');}
  if(!Array.isArray(rows))throw Error('Het rapportenoverzicht is ongeldig.');
  return rows.map(r=>{id(r.id);return r;}).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
 }
 saveReport(payload){return this.serial(async()=>{
  const project=await this.read(id(payload.projectId));
  const data=Buffer.from(payload.pdf||[]);if(data.length<5||data.length>MAX_PDF||data.subarray(0,5).toString()!=='%PDF-')throw Error('Ongeldig PDF-rapport.');
  const title=text(payload.title,200,true),meta=payload.metadata||{};
  const summary={reportDate:text(meta.reportDate||'',32),surveyDate:text(meta.surveyDate||'',32),projectName:text(meta.project||project.name,160),projectNumber:text(meta.number||project.number,80),volume:Number(payload.volume),materials:payload.materials};
  if(!Number.isFinite(summary.volume))summary.volume=null;
  summary.materials=Array.isArray(summary.materials)?summary.materials.slice(0,1000).map(x=>text(x,100)):[];
  const reportId=randomUUID(),folder=path.join(this.folder(project.id),'reports');
  const row={id:reportId,title,createdAt:new Date().toISOString(),...summary,sizeBytes:data.length};
  const rows=await this.reports(project.id);await atomic(path.join(folder,reportId+'.pdf'),data);
  try{await atomic(path.join(folder,'index.json'),JSON.stringify([...rows,row]));}
  catch(e){await fs.rm(path.join(folder,reportId+'.pdf'),{force:true});throw e;}
  return row;
 });}
 async reportPath(projectId,reportId){
  id(reportId);const rows=await this.reports(projectId);if(!rows.some(r=>r.id===reportId))throw Error('Rapport niet gevonden in dit project.');
  const file=path.join(this.folder(projectId),'reports',reportId+'.pdf');await fs.access(file);return file;
 }
}
module.exports={ProjectRepository,atomic};
