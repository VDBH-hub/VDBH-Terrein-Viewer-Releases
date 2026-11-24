(function(root){
 'use strict';
 class DesktopLayout{
  constructor(ctx){
   document.body.classList.add('desktop-ready');this.ctx=ctx;this.nav=document.getElementById('appMenuBar');this.active=-1;this.lastTool=null;
   const click=id=>()=>document.getElementById(id)?.click();
   const file=id=>()=>document.getElementById(id)?.click();
   const native=()=>!!root.vdbhProjects;
   this.definitions=[
    {name:'Start',groups:[{items:[
     {name:'Nieuw project',run:click('projectNew'),enabled:native},
     {name:'Project openen',run:click('projectOpen'),enabled:native},
     {name:'Project opslaan',run:click('projectSave'),shortcut:'Ctrl+S',enabled:native},
     {name:'Projectoverzicht',run:()=>ctx.features.action(()=>ctx.features.manageProjects()),enabled:native},
     {name:'Afsluiten',run:()=>ctx.features.action(()=>root.vdbhProjects.quit()),enabled:native,divider:true}
    ]}]},
    {name:'Bestanden',groups:[{items:[
     {name:'Importeren',run:file('file')},
     {name:'Ondergrond',run:file('underlayFile')},
     {name:'Exporteren',run:()=>ctx.features.action(()=>ctx.features.chooseExport()),enabled:()=>!ctx.features.reportBusy&&(ctx.features.comments.length>0||ctx.hasReport())}
    ]}]},
    {name:'Gereedschappen',groups:[
     {name:'Meten & Profielen',items:[
      {name:'Opmerking plaatsen',run:click('modeComment'),mode:'comment'},
      {name:'Hoogtepunt',run:click('modePoint'),mode:'point'},
      {name:'Hoogtepunten verwijderen',run:click('clearHeightPointsBtn')},
      {name:'Lijnprofiel',run:click('modeLine'),mode:'line'},
      {name:'Polyline-profiel',run:click('modePoly'),mode:'poly'},
      {name:'Profielen verwijderen',run:click('clearProfilesBtn')}
     ]},
     {name:'Boundary & Selectie',items:[
      {name:'Boundary tekenen',run:click('modeBoundary'),mode:'boundary'},
      {name:'Boundary selecteren',run:click('modeSelectBoundary'),mode:'selectBoundary'},
      {name:'Boundary sluiten',run:click('finishBoundary')},
      {name:'Bereken volume',run:click('calculateBoundary')},
      {name:'Selectie wissen',run:click('clearLine')}
     ]}
    ]},
    {name:'Help',groups:[{items:[
     {name:'Handleiding',run:click('openHelp'),shortcut:'F1'},
     {name:'Wat is Nieuw?',run:click('openChangelog')}
    ]}]}
   ];
   this.buildQuickTools();
   this.buttons=[];this.popups=[];
   this.definitions.forEach((def,i)=>{
    const button=document.createElement('button');button.type='button';button.textContent=def.name;button.id='menuButton'+i;button.className='app-menu-button';button.setAttribute('role','menuitem');button.setAttribute('aria-haspopup','menu');button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls','menuPopup'+i);
    const popup=document.createElement('div');popup.className='app-menu-popup'+(def.groups.length>1?' menu-wide':'');popup.id='menuPopup'+i;popup.hidden=true;popup.setAttribute('role','menu');popup.setAttribute('aria-labelledby',button.id);
    def.groups.forEach(group=>{
     const section=document.createElement('div');section.className='app-menu-section';section.setAttribute('role','group');
     if(group.name){section.setAttribute('aria-label',group.name);const heading=document.createElement('div');heading.className='app-menu-heading';heading.textContent=group.name;section.appendChild(heading);}
     group.items.forEach(item=>{
      const action=document.createElement('button');action.type='button';action.className='app-menu-item'+(item.divider?' menu-divider':'');action.tabIndex=-1;action.setAttribute('role',item.mode?'menuitemcheckbox':'menuitem');if(item.mode)action.setAttribute('aria-checked','false');action.dataset.commandName=item.name;
      const label=document.createElement('span');label.textContent=item.name;action.appendChild(label);
      if(item.shortcut){const shortcut=document.createElement('kbd');shortcut.textContent=item.shortcut;action.appendChild(shortcut);}
      action.onclick=()=>{if(ctx.features.busy||ctx.features.reportBusy||ctx.features.ctx?.importBusy?.())return;this.close();item.run();};
      item.element=action;section.appendChild(action);
     });popup.appendChild(section);
    });
    button.onclick=()=>this.active===i?this.close():this.open(i);
    button.addEventListener('mouseenter',()=>{if(this.active!==-1&&this.active!==i)this.open(i);});
    button.addEventListener('keydown',e=>{
     if(['ArrowDown','ArrowUp','Enter',' '].includes(e.key)){e.preventDefault();e.stopPropagation();this.open(i,e.key==='ArrowUp'?'last':'first');}
     else if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();e.stopPropagation();const next=(i+(e.key==='ArrowRight'?1:-1)+4)%4;this.buttons[next].focus();if(this.active!==-1)this.open(next);}
    });
    this.buttons.push(button);this.popups.push(popup);this.nav.appendChild(button);this.nav.appendChild(popup);
   });
   const current=document.createElement('span');current.id='activeToolStatus';current.className='active-tool-status';current.setAttribute('role','status');this.nav.appendChild(current);
   document.addEventListener('pointerdown',e=>{if(!this.nav.contains(e.target))this.close();});
   document.addEventListener('keydown',e=>this.key(e));root.addEventListener('resize',()=>this.close());root.addEventListener('blur',()=>this.close());
   document.getElementById('toggleProfile').onclick=()=>this.toggleProfile();
   const message=document.getElementById('message');message.setAttribute('role','status');message.setAttribute('aria-live','polite');
   if(typeof MutationObserver!=='undefined')new MutationObserver(()=>message.title=message.textContent).observe(message,{childList:true,characterData:true,subtree:true});
   for(const [id,side] of [['toggleLayersPanel','left'],['toggleVolumePanel','right']])document.getElementById(id).onclick=()=>{
    const other=side==='left'?'right':'left';document.body.classList.remove('workspace-show-'+other);document.body.classList.toggle('workspace-show-'+side);
   };
   this.setTool('none');
  }
  buildQuickTools(){
   const host=document.getElementById('viewerQuickTools');this.quickTools=[];
   const icons={
    'Opmerking plaatsen':'<path d="M4 3h16v12H9l-5 4V3Z"/><path d="M8 7h8M8 11h5"/>',
    'Hoogtepunt':'<circle cx="12" cy="12" r="6"/><path d="M12 2v6m0 8v6M2 12h6m8 0h6"/>',
    'Hoogtepunten verwijderen':'<circle cx="8" cy="8" r="4"/><path d="M8 2v3M2 8h3m9 6 7 7m0-7-7 7"/>',
    'Lijnprofiel':'<path d="m4 18 16-12M3 21h18"/><circle cx="4" cy="18" r="2"/><circle cx="20" cy="6" r="2"/>',
    'Polyline-profiel':'<path d="m3 17 6-8 6 5 6-10M3 21h18"/><circle cx="9" cy="9" r="1.5"/><circle cx="15" cy="14" r="1.5"/>',
    'Profielen verwijderen':'<path d="m3 15 5-7 5 5 5-9M3 21h9m3-6 6 6m0-6-6 6"/>',
    'Boundary tekenen':'<path d="m4 8 8-5 8 5-2 12H6Z"/><path d="m15 17 6-6 2 2-6 6-3 1Z"/>',
    'Boundary selecteren':'<path stroke-dasharray="2 2" d="M3 3h16v16H3Z"/><path d="m10 9 11 5-5 2-2 5-4-12Z"/>',
    'Boundary sluiten':'<path d="m3 7 7-4 8 4v12H4V7"/><path d="m11 12 3 3 7-7"/>',
    'Bereken volume':'<path d="m3 7 9-4 9 4-9 4-9-4Zm0 0v10l9 4 9-4V7M12 11v10"/>',
    'Selectie wissen':'<path stroke-dasharray="2 2" d="M3 3h15v15H3Z"/><path d="m14 14 7 7m0-7-7 7"/>'
   };
   this.definitions[2].groups.forEach((group,index)=>{
    const section=document.createElement('div');section.className='viewer-tool-group';section.setAttribute('role','group');section.setAttribute('aria-label',group.name);
    group.items.forEach(item=>{
     const button=document.createElement('button');button.id='quickTool'+this.quickTools.length;button.type='button';button.className='viewer-tool-button';button.title=item.name;button.setAttribute('aria-label',item.name);
     button.innerHTML='<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+icons[item.name]+'</svg>';
     if(item.mode)button.setAttribute('aria-pressed','false');
     if(item.name.includes('verwijderen')||item.name==='Selectie wissen')button.className+=' viewer-tool-clear';
     button.onclick=()=>{if(this.toolsBusy())return;this.close();item.run();this.updateQuickTools(this.ctx.mode());};
     button.addEventListener('keydown',e=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
      e.preventDefault();e.stopPropagation();const buttons=this.quickTools.map(t=>t.button).filter(b=>!b.disabled),i=buttons.indexOf(button);if(!buttons.length)return;
      buttons[e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(e.key==='ArrowLeft'?-1:1)+buttons.length)%buttons.length].focus();
     });
     this.quickTools.push({button,item});section.appendChild(button);
    });host.appendChild(section);
   });
  }
  toolsBusy(){return !!(this.ctx.features.busy||this.ctx.features.reportBusy||this.ctx.features.ctx?.importBusy?.());}
  updateQuickTools(mode){
   const busy=this.toolsBusy();
   for(const {button,item} of this.quickTools){
    button.disabled=busy||(item.name==='Boundary sluiten'&&mode!=='boundary');
    if(item.mode){button.classList.toggle('active',mode===item.mode);button.setAttribute('aria-pressed',String(mode===item.mode));}
   }
  }
  enabledItems(){return this.active<0?[]:Array.from(this.popups[this.active].querySelectorAll('.app-menu-item')).filter(b=>!b.disabled);}
  open(i,focus=null){
   if(this.ctx.features.busy||this.ctx.features.reportBusy||this.ctx.features.ctx?.importBusy?.())return;
   this.close();this.active=i;
   for(const group of this.definitions[i].groups)for(const item of group.items){item.element.disabled=item.enabled?!item.enabled():false;if(item.mode)item.element.setAttribute('aria-checked',String(this.ctx.mode()===item.mode));}
   const popup=this.popups[i],button=this.buttons[i];popup.hidden=false;button.setAttribute('aria-expanded','true');
   const rect=button.getBoundingClientRect(),width=popup.getBoundingClientRect().width;
   popup.style.left=Math.max(5,Math.min(rect.left,root.innerWidth-width-5))+'px';popup.style.top=(rect.bottom+2)+'px';
   popup.style.maxHeight=Math.max(120,root.innerHeight-rect.bottom-10)+'px';
   const items=this.enabledItems();if(focus&&items.length)items[focus==='last'?items.length-1:0].focus();
  }
  close(focus=false){const old=this.active;this.active=-1;this.popups.forEach(p=>p.hidden=true);this.buttons.forEach(b=>b.setAttribute('aria-expanded','false'));if(focus&&old>=0)this.buttons[old].focus();}
  key(e){
   if(this.active>=0){
    if(e.key==='Escape'){e.preventDefault();this.close(true);return;}
    if(e.key==='Tab'){this.close();return;}
    const items=this.enabledItems(),index=items.indexOf(document.activeElement);
    if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();if(!items.length)return;const next=e.key==='Home'?0:e.key==='End'?items.length-1:(index+(e.key==='ArrowUp'?-1:1)+items.length)%items.length;items[next].focus();return;}
    if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();this.open((this.active+(e.key==='ArrowRight'?1:3))%4,'first');return;}
   }
   if(document.querySelector('dialog[open],#helpOverlay.open'))return;
   if(e.key==='F1'){e.preventDefault();document.getElementById('openHelp').click();}
   if(e.key==='F10'){e.preventDefault();this.open(0,'first');}
   const index=e.altKey&&!e.ctrlKey?{s:0,b:1,g:2,h:3}[e.key.toLowerCase()]:undefined;
   if(index!==undefined){e.preventDefault();this.open(index,'first');}
  }
  setTool(mode){
   this.updateQuickTools(mode);
   if(mode===this.lastTool)return;this.lastTool=mode;
   const labels={none:'Geen gereedschap actief',comment:'Opmerking plaatsen',point:'Hoogtepunt',line:'Lijnprofiel',poly:'Polyline-profiel',boundary:'Boundary tekenen',selectBoundary:'Boundary selecteren'};
   document.getElementById('activeToolStatus').textContent=labels[mode]||'Geen gereedschap actief';
   if(mode==='line'||mode==='poly')this.toggleProfile(true);
  }
  toggleProfile(value){
   const panel=document.getElementById('profileDock'),show=value??panel.hidden;panel.hidden=!show;
   const button=document.getElementById('toggleProfile');button.classList.toggle('active',show);button.setAttribute('aria-expanded',String(show));this.ctx.resizeProfile();
  }
 }
 root.VDBHDesktopLayout=DesktopLayout;
})(window);
