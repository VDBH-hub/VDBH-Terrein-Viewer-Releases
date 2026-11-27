'use strict';
const fs=require('node:fs/promises');
const {gzip,gunzip}=require('node:zlib');
const {promisify}=require('node:util');
const {validateState}=require('./project-state.js');
const compress=promisify(gzip),expand=promisify(gunzip);
const MAX_BYTES=250*1024*1024;
function text(value,max,required=false){if(typeof value!=='string'||value.length>max||(required&&!value.trim()))throw Error('Ongeldige projectgegevens in het projectbestand.');return value.trim();}
function validateTransfer(value){
 if(!value||value.format!=='VDBH_PROJECT_PACKAGE')throw Error('Dit is geen VDBH-projectbestand.');
 if(value.version!==1)throw Error('Deze versie van het projectbestand wordt niet ondersteund. Werk de Terrein Viewer bij.');
 const name=text(value.name,160,true),number=text(value.number,80),appVersion=text(value.appVersion,40),exportedAt=text(value.exportedAt,40);
 if(!Number.isFinite(Date.parse(exportedAt)))throw Error('Ongeldige exportdatum in het projectbestand.');
 validateState(value.state);
 return {format:'VDBH_PROJECT_PACKAGE',version:1,name,number,appVersion,exportedAt,state:value.state};
}
async function encodeTransfer(payload,appVersion){
 const value=validateTransfer({format:'VDBH_PROJECT_PACKAGE',version:1,name:payload?.name,number:payload?.number||'',appVersion,exportedAt:new Date().toISOString(),state:payload?.state});
 const json=Buffer.from(JSON.stringify(value),'utf8');if(json.length>MAX_BYTES)throw Error('Het project is groter dan 250 MB.');
 const bytes=await compress(json,{level:6});if(bytes.length>MAX_BYTES)throw Error('Het projectbestand is groter dan 250 MB.');return bytes;
}
async function decodeTransfer(bytes,maxBytes=MAX_BYTES){
 if(!Buffer.isBuffer(bytes))bytes=Buffer.from(bytes);
 if(!bytes.length||bytes.length>MAX_BYTES)throw Error('Het projectbestand is leeg of groter dan 250 MB.');
 let json;try{json=await expand(bytes,{maxOutputLength:Math.min(maxBytes,MAX_BYTES)});}catch{throw Error('Het projectbestand is beschadigd, ongeldig of te groot om te openen.');}
 let value;try{value=JSON.parse(json.toString('utf8'));}catch{throw Error('Het projectbestand bevat ongeldige projectgegevens.');}
 return validateTransfer(value);
}
async function readTransfer(file){
 const stat=await fs.stat(file);if(!stat.isFile()||stat.size>MAX_BYTES)throw Error('Het projectbestand is ongeldig of groter dan 250 MB.');
 return decodeTransfer(await fs.readFile(file));
}
function suggestedName(name,number){const base=[number,name].filter(Boolean).join('_').replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').replace(/[. ]+$/,'').slice(0,120)||'VDBH_Project';return 'VDBH_'+base+'.vdbhproject';}
module.exports={encodeTransfer,decodeTransfer,readTransfer,validateTransfer,suggestedName};
