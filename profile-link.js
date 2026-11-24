(function(root){
 'use strict';
 function buildRoute(points){
  const segments=[];let total=0;
  for(let i=1;i<points.length;i++){
   const a=points[i-1],b=points[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
   if(length<=1e-10)continue;
   segments.push({a:a.slice(),b:b.slice(),start:total,length});total+=length;
  }
  return {segments,total};
 }
 function pointAt(route,station){
  if(!route.segments.length||!Number.isFinite(station))return null;
  const distance=Math.max(0,Math.min(route.total,station));
  let lo=0,hi=route.segments.length-1;
  while(lo<hi){const m=(lo+hi)>>1;if(route.segments[m].start+route.segments[m].length<distance)lo=m+1;else hi=m;}
  const segment=route.segments[lo],t=Math.max(0,Math.min(1,(distance-segment.start)/segment.length));
  return {point:segment.a.map((v,k)=>v+(segment.b[k]-v)*t),station:distance,segment:lo,t};
 }
 const colors=['#4aa3ff','#42c98a','#f0ad4e','#c084fc','#f472b6','#a3e635'];
 class ProfileLink{
  constructor(ctx){
   this.ctx=ctx;this.THREE=ctx.THREE;this.canvas=ctx.canvas;this.cache=null;this.state=null;this.models=new Map();this.markers=[];
   const doc=this.canvas.ownerDocument||document,host=this.canvas.parentElement;
   this.overlay=doc.createElement('canvas');this.overlay.className='profile-link-overlay';this.overlay.setAttribute('aria-hidden','true');host.appendChild(this.overlay);
   this.info=doc.createElement('div');this.info.className='profile-hover-info';this.info.hidden=true;this.info.setAttribute('role','status');host.appendChild(this.info);
   this.canvas.addEventListener('pointermove',e=>this.graphMove(e));
   this.canvas.addEventListener('pointerleave',()=>{if(this.state?.source==='graph')this.clear();});
   this.canvas.addEventListener('pointerdown',()=>this.clear());
  }
  setCache(cache){
   this.clear();this.cache=cache;
   this.route=cache?buildRoute(cache.trace):null;
   if(this.route&&!this.route.total)this.cache=null;
   this.placeOverlay();
  }
  ready(){return !!this.cache&&!!this.route?.total&&this.ctx.visible()&&!this.ctx.busy();}
  placeOverlay(){
   const r=this.canvas.getBoundingClientRect(),p=this.canvas.parentElement.getBoundingClientRect(),dpr=root.devicePixelRatio||1;
   this.overlay.style.left=(r.left-p.left)+'px';this.overlay.style.top=(r.top-p.top)+'px';this.overlay.style.width=r.width+'px';this.overlay.style.height=r.height+'px';
   this.overlay.width=Math.max(1,Math.round(this.canvas.clientWidth*dpr));this.overlay.height=Math.max(1,Math.round(this.canvas.clientHeight*dpr));
  }
  graphMove(e){
   if(!this.ready()||e.buttons){this.clear();return;}
   const r=this.canvas.getBoundingClientRect(),c=this.cache,x=(e.clientX-r.left)*c.width/Math.max(1,r.width),y=(e.clientY-r.top)*c.height/Math.max(1,r.height);
   if(x<c.left||x>c.width-c.right||y<c.top||y>c.height-c.bottom){this.clear();return;}
   this.show((x-c.left)/(c.width-c.left-c.right)*this.route.total,'graph',y);
  }
  show(station,source,pointerY=null){
   if(!this.ready())return;
   const hit=pointAt(this.route,station);if(!hit)return;
   const [x,y]=hit.point,c=this.cache;
   const values=c.series.map(series=>{const z=this.ctx.sample(series.surface,x,y);return {index:series.si,name:series.surface.name,z:Number.isFinite(z)?z:null};});
   let primary=values.find(v=>v.index===this.ctx.activeSurface()&&v.z!==null)||values.find(v=>v.z!==null)||null;
   if(pointerY!==null){let best=Infinity;for(const value of values)if(value.z!==null){const diff=Math.abs(this.yAt(value.z)-pointerY);if(diff<best){best=diff;primary=value;}}}
   this.state={station:hit.station,point:hit.point,values,primary,source};
   this.updateMarkers();this.paint();
   const world=this.ctx.world([x,y,0]);
   this.info.textContent='Afstand '+hit.station.toFixed(2)+' m · X '+world[0].toFixed(3)+' · Y '+world[1].toFixed(3)+' | '+values.map(v=>v.name+': '+(v.z===null?'geen hoogte':v.z.toFixed(3)+' m')).join(' · ');
   this.info.hidden=false;this.info.title=this.info.textContent;
  }
  yAt(z){const c=this.cache;return c.top+(c.max-z)/(c.max-c.min)*(c.height-c.top-c.bottom);}
  paint(){
   const g=this.overlay.getContext('2d'),dpr=root.devicePixelRatio||1;g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,this.overlay.width/dpr,this.overlay.height/dpr);
   if(!this.state||!this.cache)return;
   const c=this.cache,x=c.left+this.state.station/this.route.total*(c.width-c.left-c.right);
   g.save();g.beginPath();g.rect(c.left,c.top,c.width-c.left-c.right,c.height-c.top-c.bottom);g.clip();
   g.strokeStyle='#ffffff';g.lineWidth=1;g.setLineDash([4,3]);g.beginPath();g.moveTo(x,c.top);g.lineTo(x,c.height-c.bottom);g.stroke();g.setLineDash([]);
   for(const v of this.state.values)if(v.z!==null){const y=this.yAt(v.z);g.beginPath();g.arc(x,y,v===this.state.primary?4.5:3,0,Math.PI*2);g.fillStyle=colors[v.index%colors.length];g.fill();g.strokeStyle='#fff';g.stroke();}
   g.restore();
  }
  updateMarkers(){
   const T=this.THREE;
   while(this.markers.length<this.state.values.length){const marker=new T.Mesh(new T.SphereGeometry(.14,16,12),new T.MeshBasicMaterial({color:0xffffff,depthTest:false,depthWrite:false}));marker.renderOrder=1200;marker.userData.isProfileCursor=true;this.ctx.scene.add(marker);this.markers.push(marker);}
   this.markers.forEach((marker,i)=>{const value=this.state.values[i];marker.visible=!!value&&value.z!==null;if(marker.visible){marker.position.set(this.state.point[0],this.state.point[1],value.z);marker.material.color.set(colors[value.index%colors.length]);}});
  }
  bindModel(canvas,getCamera,name){
   if(this.models.has(canvas))return;
   const doc=canvas.ownerDocument||document,overlay=doc.createElement('div');overlay.className='profile-model-cursor';overlay.hidden=true;
   const pin=doc.createElement('span');pin.className='profile-model-dot';overlay.appendChild(pin);
   const label=doc.createElement('span');label.className='profile-model-info';overlay.appendChild(label);canvas.parentElement.appendChild(overlay);
   const move=e=>this.modelMove(e,canvas,getCamera(),name),leave=()=>{if(this.state?.source===name)this.clear();};
   canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerleave',leave);canvas.addEventListener('pointerdown',leave);
   this.models.set(canvas,{getCamera,name,overlay,label,move,leave});
  }
  unbindModel(canvas){const item=this.models.get(canvas);if(!item)return;canvas.removeEventListener('pointermove',item.move);canvas.removeEventListener('pointerleave',item.leave);canvas.removeEventListener('pointerdown',item.leave);item.overlay.remove();this.models.delete(canvas);if(this.state?.source===item.name)this.clear();}
  modelMove(e,canvas,camera,source){
   if(!this.ready()||!camera||e.buttons){this.clear();return;}
   const T=this.THREE,r=canvas.getBoundingClientRect();if(r.width<1||r.height<1){this.clear();return;}const mouse=new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),ray=new T.Raycaster();ray.setFromCamera(mouse,camera);
   const a=new T.Vector3(),b=new T.Vector3(),point=new T.Vector3(),onRay=new T.Vector3(),projected=new T.Vector3();let best=null,distance=14*14;
   for(const segment of this.route.segments){
    // Follow the same raised line used by the visible profile trace, including its 3D bends.
    a.fromArray(segment.a);b.fromArray(segment.b);a.z+=.3;b.z+=.3;
    ray.ray.distanceSqToSegment(a,b,onRay,point);projected.copy(point).project(camera);
    if(projected.z< -1||projected.z>1)continue;
    const px=(projected.x*.5+.5)*r.width,py=(-projected.y*.5+.5)*r.height,d2=(px-(e.clientX-r.left))**2+(py-(e.clientY-r.top))**2;
    if(d2<distance){const length=a.distanceToSquared(b),t=length?Math.max(0,Math.min(1,point.clone().sub(a).dot(b.clone().sub(a))/length)):0;distance=d2;best=segment.start+segment.length*t;}
   }
   if(best===null){this.clear();return;}this.show(best,source);
  }
  frame(){
   if(this.state&&!this.ready()){this.clear();return;}
   for(const [canvas,item] of this.models){
    const camera=item.getCamera(),v=this.state?.primary;if(!v||!camera){item.overlay.hidden=true;continue;}
    const p=new this.THREE.Vector3(this.state.point[0],this.state.point[1],v.z).project(camera),r=canvas.getBoundingClientRect(),parent=canvas.parentElement.getBoundingClientRect();
    const visible=p.z>=-1&&p.z<=1&&Math.abs(p.x)<=1&&Math.abs(p.y)<=1;item.overlay.hidden=!visible;
    if(visible){item.overlay.style.left=(r.left-parent.left+(p.x*.5+.5)*r.width)+'px';item.overlay.style.top=(r.top-parent.top+(-p.y*.5+.5)*r.height)+'px';item.label.textContent=this.state.station.toFixed(2)+' m · '+v.name+' · Z '+v.z.toFixed(3)+' m';}
   }
  }
  clear(){this.state=null;this.markers.forEach(m=>m.visible=false);for(const item of this.models.values())item.overlay.hidden=true;this.info.hidden=true;this.paint();}
 }
 const api={ProfileLink,buildRoute,pointAt};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VDBHProfileLink=api;
})(typeof window!=='undefined'?window:globalThis);
