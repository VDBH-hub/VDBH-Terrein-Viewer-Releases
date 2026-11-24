/* VDBH experimental SiteVision reader. Validated with supplied GCS900 v13 files.
 * Handles indexed 0x0601 TSF tiles and 2D LWK records 0, 1, 4, 6.
 * Unsupported encodings fail explicitly; no guessed geometry is returned.
 * Coordinates are preserved in the file's own coordinate system (not reprojected).
 */
(function (root) {
  'use strict';
  function fail(message) { throw new Error('Trimble-import: ' + message); }
  function reader(buffer) {
    if (!(buffer instanceof ArrayBuffer) || buffer.byteLength < 32) fail('ongeldig of te kort bestand.');
    const d = new DataView(buffer), bytes = new Uint8Array(buffer);
    function check(o, n) { if (!Number.isInteger(o) || !Number.isInteger(n) || o < 0 || n < 0 || o + n > bytes.length) fail('afgebroken bestand of ongeldige verwijzing.'); }
    const u16 = o => { check(o, 2); return d.getUint16(o, true); };
    const u32 = o => { check(o, 4); return d.getUint32(o, true); };
    const i32 = o => { check(o, 4); return d.getInt32(o, true); };
    const f32 = o => { check(o, 4); const x=d.getFloat32(o,true); if(!Number.isFinite(x))fail('ongeldig kommagetal.');return x; };
    const f64 = o => { check(o, 8); const x=d.getFloat64(o,true); if(!Number.isFinite(x))fail('ongeldig kommagetal.');return x; };
    const tag = (o, s) => o >= 0 && o+s.length <= bytes.length && [...s].every((c,i)=>bytes[o+i]===c.charCodeAt(0));
    const utf16 = (o,n) => { check(o,n*2);return new TextDecoder('utf-16le',{fatal:true}).decode(bytes.subarray(o,o+n*2)); };
    const indexOffset=u32(0);
    if (!tag(indexOffset,'TRMINDEX')) fail('geen ondersteunde SiteVision-index gevonden.');
    let o=indexOffset+8;const count=u32(o);o+=4;
    if(count<2||count>100000)fail('ongeldig aantal indexonderdelen.');
    const entries=[],names=new Set();
    for(let i=0;i<count;i++){
      const len=u16(o);o+=2;if(!len||len>512)fail('ongeldige onderdeelnaam.');
      const name=utf16(o,len);o+=len*2;const start=u32(o),size=u32(o+4);o+=8;
      check(start,size);if(start<4||start+size>indexOffset||names.has(name))fail('ongeldige of dubbele indexverwijzing.');
      entries.push({name,start,size,end:start+size});names.add(name);
    }
    if(o!==bytes.length)fail('onbekende gegevens na de index.');
    const ranges=entries.slice().sort((a,b)=>a.start-b.start);
    for(let i=1;i<ranges.length;i++)if(ranges[i].start<ranges[i-1].end)fail('overlappende indexonderdelen.');
    const h=entries.find(e=>e.name==='HEADER');
    if(!h||!tag(h.start,'TRMINDEX')||u16(h.start+8)!==0x0601)fail('deze SiteVision-versie wordt nog niet ondersteund.');
    return {d,bytes,check,u16,u32,i32,f32,f64,tag,entries,header:h};
  }
  function surface(buffer,name){
    const r=reader(buffer),tiles=r.entries.filter(e=>/\.TSF$/i.test(e.name));
    if(!tiles.length)fail('geen ondersteunde TIN-tegels in dit SVD-bestand.');
    if(tiles.some(t=>!/^[-]?\d+X[-]?\d+X0\.TSF$/i.test(t.name)))fail('SVD met meerdere hoogtelagen of onbekende tegelnamen wordt nog niet ondersteund.');
    const pts=[],faces=[],pointIds=new Map(),faceKeys=new Set();let vertexCount=0,duplicateFaces=0;
    for(const t of tiles){
      const s=t.start;
      if(!r.tag(s,'TRMSRFCE')||r.u16(s+8)!==0x0601||r.u16(s+10)!==0)fail('onbekende TIN-tegelindeling.');
      const nv=r.u16(s+12),ne=r.u16(s+14),nt=r.u16(s+16);
      const sideCount=[18,20,22,24].reduce((sum,k)=>sum+r.u16(s+k),0);
      if(!nv||!nt||34+nv*20+ne*8+nt*6+sideCount*2!==t.size)fail('TIN-tegel heeft een onbekende lengte.');
      vertexCount+=nv;if(vertexCount>5000000)fail('te veel terreinpunten voor deze viewer.');
      const ox=r.i32(s+26),oy=r.i32(s+30),localIds=[];
      for(let i=0;i<nv;i++){
        const o=s+34+i*20,x=r.f64(o)+ox,y=r.f64(o+8)+oy,z=r.i32(o+16)/10000;
        const key=x.toFixed(7)+","+y.toFixed(7)+","+z.toFixed(4);
        if(!pointIds.has(key)){pointIds.set(key,pts.length);pts.push([x,y,z]);}localIds.push(pointIds.get(key));
      }
      const edgeOffset=s+34+nv*20,faceOffset=edgeOffset+ne*8;
      for(let i=0;i<ne;i++){
        const o=edgeOffset+i*8;
        if(r.u16(o)>=nv||r.u16(o+2)>=nv)fail('ongeldige TIN-puntverwijzing.');
        for(const k of [4,6]){const f=r.u16(o+k);if(f!==65535&&f>=nt)fail('ongeldige TIN-vlakverwijzing.');}
      }
      for(let i=0;i<nt;i++){
        const edgeIds=[0,2,4].map(k=>r.u16(faceOffset+i*6+k));
        if(new Set(edgeIds).size!==3||edgeIds.some(v=>v>=ne))fail('ongeldige driehoekverbinding.');
        const counts=new Map();
        for(const id of edgeIds){
          const o=edgeOffset+id*8;
          if(r.u16(o+4)!==i&&r.u16(o+6)!==i)fail('inconsistente TIN-topologie.');
          for(const k of [0,2]){const v=r.u16(o+k);counts.set(v,(counts.get(v)||0)+1);}
        }
        if(counts.size!==3||[...counts.values()].some(n=>n!==2))fail('TIN-randen vormen geen driehoek.');
        const f=[...counts.keys()].map(v=>localIds[v]),a=pts[f[0]],b=pts[f[1]],c=pts[f[2]];
        const cross=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
        if(Math.abs(cross)<1e-12)fail('driehoek zonder geldig oppervlak.');
        const key=f.slice().sort((a,b)=>a-b).join(",");
        if(faceKeys.has(key)){duplicateFaces++;continue;}faceKeys.add(key);
        if(cross<0)[f[1],f[2]]=[f[2],f[1]];faces.push(f);
      }
    }
    const out=[{name,pts,faces,color:0x4aa3ff,sourceFormat:'SVD',sourceFaceCount:faces.length}];
    out.lineStrings=[];out.importInfo={tiles:tiles.length,triangles:faces.length,vertices:pts.length,duplicateFaces};
    return out;
  }
  function linework(buffer,name){
    const r=reader(buffer),tiles=r.entries.filter(e=>/\.LWK$/i.test(e.name));
    if(!tiles.length)fail('geen ondersteunde lijnwerktegels in dit SVL-bestand.');
    const lines=[];let skippedTexts=0,arcs=0,pointCount=0;
    for(const t of tiles){
      const s=t.start;if(!r.tag(s,'TRMLINES')||r.u16(s+8)!==0x0601)fail('onbekende lijnwerkversie.');
      const ox=r.i32(s+10),oy=r.i32(s+14);let o=s+18,ended=false;
      const need=n=>{if(o+n>t.end)fail('afgebroken lijnwerkrecord.');};
      const xy=p=>[ox+r.i32(p)/10000,oy+r.i32(p+4)/10000,0];
      const add=points=>{pointCount+=points.length;if(pointCount>10000000)fail('te veel lijnpunten voor deze viewer.');lines.push({points,closed:false,layer:name,is2D:true});};
      while(o<t.end){
        if(o===t.end-1&&r.bytes[o]===8){o++;ended=true;break;}
        need(21);const type=r.u16(o);
        // Only the observed 2D style encodings are accepted. Never treat unknown 3D data as 2D.
        if((type!==6&&r.bytes[o+2]!==1)||(type===6&&r.bytes[o+2]!==9))fail('onbekende lijnwerkstijl of 3D-record.');
        if(type===0){add([xy(o+5),xy(o+13)]);o+=21;}
        else if(type===1){
          need(23);const count=r.u16(o+21);if(count<2)fail('polyline met onvoldoende punten.');need(23+count*8);
          const points=[];for(let i=0;i<count;i++)points.push(xy(o+23+i*8));add(points);o+=23+count*8;
        }else if(type===4){
          need(57);const center=xy(o+21),start=xy(o+29),end=xy(o+37);
          const a=r.f32(o+45),b=r.f32(o+49),radius=r.f32(o+53),sweep=b-a;
          if(radius<=0||Math.abs(sweep)>Math.PI*2+1e-5)fail('onbekende boogdefinitie.');
          const predicted=angle=>[center[0]+radius*Math.cos(angle),center[1]+radius*Math.sin(angle)];
          const tol=Math.max(.002,radius*2e-6);
          if(Math.hypot(...predicted(a).map((v,k)=>v-start[k]))>tol||Math.hypot(...predicted(b).map((v,k)=>v-end[k]))>tol)fail('boogpunten komen niet overeen met de boogdefinitie.');
          // Chord deviation at most 1 mm, with a 5 degree upper angular step.
          const angleStep=Math.min(Math.PI/36,2*Math.acos(Math.max(-1,Math.min(1,1-.001/radius))));
          const count=Math.max(2,Math.ceil(Math.abs(sweep)/Math.max(angleStep,1e-6)));
          if(count>100000)fail('boog is te groot.');
          const points=[start];for(let i=1;i<count;i++)points.push([...predicted(a+sweep*i/count),0]);points.push(end);add(points);arcs++;o+=57;
        }else if(type===6){need(40);const count=r.u16(o+38);need(40+count*2);skippedTexts++;o+=40+count*2;}
        else fail('lijnwerkrecord '+type+' wordt nog niet ondersteund.');
      }
      if(!ended)fail('afsluiting van lijnwerktegel ontbreekt.');
    }
    if(!lines.length)fail('geen bruikbaar lijnwerk gevonden.');
    return {lines,skippedTexts,arcs,is2D:true,tiles:tiles.length};
  }
  root.VDBHTrimble=Object.freeze({surface,linework});
})(typeof window!=='undefined'?window:globalThis);
