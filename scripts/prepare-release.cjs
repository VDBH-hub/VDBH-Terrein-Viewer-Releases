const fs=require('node:fs'),cp=require('node:child_process');
const pkg=require('../package.json'),lock=require('../package-lock.json'),entries=require('../changelog.json').entries;
if(pkg.version!==lock.version||pkg.version!==lock.packages[''].version)throw Error('Versies komen niet overeen.');
const news=entries.find(e=>e.version===pkg.version);if(!news)throw Error('Changelog ontbreekt.');
for(const file of pkg.build.files){if(file.startsWith('node_modules/'))continue;if(!fs.existsSync(file))throw Error('Bestand ontbreekt: '+file);}
for(const f of fs.readdirSync('.').filter(f=>/\.(c?js)$/.test(f)))cp.execFileSync(process.execPath,['--check',f],{stdio:'inherit'});
const notes=['## Nieuw in BETA '+pkg.version,...news.changes.map(c=>'- '+c),'','## Ook opgenomen sinds 0.2.59',...entries.filter(e=>e.version!==pkg.version&&Number(e.version.split('.')[2])>59).flatMap(e=>['','### BETA '+e.version,...e.changes.map(c=>'- '+c)]),'','## Installeren','Download de Setup.exe en voer deze uit. Bestaande projecten en rapporten blijven bewaard.','Het bouwpakket is beschikbaar als ZIP. latest.yml en het blockmap-bestand ondersteunen de automatische updater.'];
fs.writeFileSync('release-notes.md',notes.join('\n')+'\n');
console.log('Versie '+pkg.version+' en bronbestanden gecontroleerd.');
