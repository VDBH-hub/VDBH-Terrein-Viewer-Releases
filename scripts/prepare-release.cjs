const fs=require('node:fs'),cp=require('node:child_process');
const pkg=require('../package.json'),lock=require('../package-lock.json'),entries=require('../changelog.json').entries;
if(pkg.version!==lock.version||pkg.version!==lock.packages[''].version)throw Error('Versies komen niet overeen.');
if(!/^\d+\.\d+\.\d+$/.test(pkg.version))throw Error('Gebruik een regulier versienummer voor deze release.');
const news=entries.find(e=>e.version===pkg.version);if(!news)throw Error('Changelog ontbreekt.');
for(const file of pkg.build.files){if(file.startsWith('node_modules/'))continue;if(!fs.existsSync(file))throw Error('Bestand ontbreekt: '+file);}
for(const f of fs.readdirSync('.').filter(f=>/\.(c?js)$/.test(f)))cp.execFileSync(process.execPath,['--check',f],{stdio:'inherit'});
const notes=['## Versie '+pkg.version,...news.changes.map(c=>'- '+c),'','## Installeren en bijwerken','Download de Setup.exe en voer deze uit. Bestaande lokaal opgeslagen projecten en rapporten blijven behouden.','Na installatie opent een dubbelklik op een .vdbhproject-bestand direct het model en de opmerkingen, ook als de viewer al openstaat.','Het bouwpakket bevat ook de volledige handleiding en een fictief voorbeeldproject. latest.yml en het blockmap-bestand ondersteunen de automatische updater.','','## Wijzigingen sinds de vorige gepubliceerde versie 0.2.69',...entries.filter(e=>/^0\.2\.(70|71|72|73|74)$/.test(e.version)).flatMap(e=>['','### Versie '+e.version,...e.changes.map(c=>'- '+c)])];
fs.writeFileSync('release-notes.md',notes.join('\n')+'\n');console.log('Versie '+pkg.version+' en bronbestanden gecontroleerd.');
