'use strict';
const path=require('node:path');
const {readTransfer}=require('./project-transfer.cjs');
function projectPathsFromArguments(args,cwd,pathAPI=path){
 if(!Array.isArray(args))return [];
 const files=[];for(let arg of args){
  if(typeof arg!=='string'||arg.startsWith('-')||/^[a-z]+:\/\//i.test(arg))continue;
  if(arg.startsWith('"')&&arg.endsWith('"'))arg=arg.slice(1,-1);
  if(!/\.vdbhproject$/i.test(arg))continue;
  files.push(pathAPI.resolve(cwd,arg));
 }return files;
}
class ProjectOpenQueue{
 constructor(reader=readTransfer){this.reader=reader;this.files=[];this.pending=new Set();this.serial=Promise.resolve();}
 get length(){return this.files.length;}
 enqueue(args,cwd){
  let count=0;for(const file of projectPathsFromArguments(args,cwd)){
   const key=process.platform==='win32'?file.toLowerCase():file;
   if(this.pending.has(key))continue;this.files.push({file,key});this.pending.add(key);count++;
  }return count;
 }
 take(){
  const job=this.serial.then(async()=>{
   const item=this.files.shift();if(!item)return null;
   try{const value=await this.reader(item.file);return {...value,fileName:path.basename(item.file)};}finally{this.pending.delete(item.key);}
  });this.serial=job.catch(()=>{});return job;
 }
}
module.exports={projectPathsFromArguments,ProjectOpenQueue};
