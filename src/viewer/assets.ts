import * as THREE from 'three';
export type TeamColor='blue'|'orange'|'unknown';
export function createCarModel(team:TeamColor):THREE.Group {
 const root=new THREE.Group();
 const color=team==='blue'?'#3398e5':team==='orange'?'#ee8b43':'#adbacc';
 const paint=new THREE.MeshPhysicalMaterial({color,metalness:.58,roughness:.25,clearcoat:.75,clearcoatRoughness:.18});
 const dark=new THREE.MeshStandardMaterial({color:'#192535',metalness:.2,roughness:.48});
 const glass=new THREE.MeshPhysicalMaterial({color:'#80abc8',metalness:.28,roughness:.13,transparent:true,opacity:.72});
 const rubber=new THREE.MeshStandardMaterial({color:'#121719',roughness:.94});
 const metal=new THREE.MeshStandardMaterial({color:'#718392',metalness:.7,roughness:.38});
 const add=(mesh:THREE.Mesh,pos:[number,number,number])=>{mesh.position.set(...pos);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);return mesh};
 // Car local +X is forward; unit scale ~2.4m length for visual legibility.
 add(new THREE.Mesh(new THREE.BoxGeometry(2.45,.45,1.22),paint),[0,0,0]);
 add(new THREE.Mesh(new THREE.BoxGeometry(1.1,.43,.99),glass),[-.16,.42,0]);
 add(new THREE.Mesh(new THREE.BoxGeometry(2.5,.17,1.1),dark),[0,-.25,0]);
 add(new THREE.Mesh(new THREE.BoxGeometry(.32,.23,1.3),paint),[.98,-.04,0]);
 add(new THREE.Mesh(new THREE.BoxGeometry(.14,.17,1.43),paint),[-1.05,.24,0]);
 add(new THREE.Mesh(new THREE.BoxGeometry(.11,.36,.12),metal),[-.94,.02,-.51]);
 add(new THREE.Mesh(new THREE.BoxGeometry(.11,.36,.12),metal),[-.94,.02,.51]);
 for(const x of [-.73,.73])for(const z of [-.7,.7]){
  const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.31,.31,.19,16),rubber);wheel.rotation.x=Math.PI/2;add(wheel,[x,-.20,z]);
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,.2,12),metal);hub.rotation.x=Math.PI/2;add(hub,[x,-.20,z+(z>0?.012:-.012)]);
 }
 for(const z of [-.38,.38]){
  const lamp=new THREE.Mesh(new THREE.BoxGeometry(.04,.09,.28),new THREE.MeshBasicMaterial({color:'#d7e8ff'}));add(lamp,[1.24,.04,z]);
 }
 return root;
}
export function createBallModel():THREE.Group{
 const group=new THREE.Group(),shell=new THREE.Mesh(new THREE.SphereGeometry(.92,32,24),new THREE.MeshStandardMaterial({color:'#e9e4d8',metalness:.04,roughness:.44}));
 shell.castShadow=true;group.add(shell);
 const rings=new THREE.Mesh(new THREE.IcosahedronGeometry(.925,1),new THREE.MeshBasicMaterial({color:'#565e64',wireframe:true,transparent:true,opacity:.32}));
 group.add(rings);return group;
}
export function createArenaDecorations():THREE.Group {
 const group=new THREE.Group();
 const stripe=new THREE.MeshStandardMaterial({color:'#184b43',roughness:.95,transparent:true,opacity:.62});
 for(let x=-36;x<37;x+=9){
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(4.5,101),stripe);
  mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.018,0);group.add(mesh);
 }
 for(const end of [-1,1]){
  const highlight=new THREE.Mesh(new THREE.BoxGeometry(19,.08,.24),new THREE.MeshBasicMaterial({color:end===1?'#f19a56':'#4da5f2'}));
  highlight.position.set(0,.06,end*51);group.add(highlight);
 }

 // Stadium perimeter, low-profile illuminated boundary and tiered stands.
 const rimMaterial=new THREE.MeshStandardMaterial({color:'#20384d',metalness:.52,roughness:.47});
 const rowMaterial=new THREE.MeshStandardMaterial({color:'#111d30',metalness:.18,roughness:.78});
 for(const side of [-1,1]){
  const strip=new THREE.Mesh(new THREE.BoxGeometry(1.2,1.2,104),rimMaterial);
  strip.position.set(side*42.5,.58,0);group.add(strip);
  const stands=new THREE.Mesh(new THREE.BoxGeometry(12,5,112),rowMaterial);
  stands.position.set(side*50,2.5,0);group.add(stands);
  const edge=new THREE.Mesh(new THREE.BoxGeometry(.15,.1,105),new THREE.MeshBasicMaterial({color:side<0?'#378ed9':'#d27d3b'}));
  edge.position.set(side*42,.22,0);group.add(edge);
 }
 for(const end of [-1,1]){
  const stands=new THREE.Mesh(new THREE.BoxGeometry(100,6,9),rowMaterial);
  stands.position.set(0,3,end*58);group.add(stands);
  const frameMaterial=new THREE.MeshStandardMaterial({color:'#8399af',metalness:.7,roughness:.35});
  for(const x of [-9.5,9.5]){
   const post=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,7.2,10),frameMaterial);
   post.position.set(x,3.6,end*51.8);group.add(post);
  }
  const crossbar=new THREE.Mesh(new THREE.BoxGeometry(19,.2,.2),frameMaterial);
  crossbar.position.set(0,7.2,end*51.8);group.add(crossbar);
 }
 // Small pad markers are visual landmarks only, not replay-derived pickup state.
 const padMat=new THREE.MeshBasicMaterial({color:'#c99d52',transparent:true,opacity:.45});
 for(const x of [-28,-14,14,28])for(const z of [-36,-18,18,36]){
  const pad=new THREE.Mesh(new THREE.CircleGeometry(.55,20),padMat);
  pad.rotation.x=-Math.PI/2;pad.position.set(x,.07,z);group.add(pad);
 }
 return group;
}
