import {useEffect,useRef} from 'react';
import * as THREE from 'three';
import type {Track,Pose} from './model';
import {frameAt} from './model';
type Props={track:Track;time:number;trails:boolean;vectors:boolean;follow:string};
const meters=0.01;
function interpolate(a:Pose,b:Pose,t:number):THREE.Vector3 {return new THREE.Vector3(...a.position).lerp(new THREE.Vector3(...b.position),t).multiplyScalar(meters)}
export default function Viewer3D({track,time,trails,vectors,follow}:Props){
 const el=useRef<HTMLDivElement>(null);const sceneRef=useRef<{update:(p:Props)=>void;destroy:()=>void}|null>(null);
 useEffect(()=>{
 const host=el.current;if(!host)return;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#08111d');
 const camera=new THREE.PerspectiveCamera(52,1,.5,3000);camera.position.set(88,118,155);
 const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.setSize(host.clientWidth,host.clientHeight);host.appendChild(renderer.domElement);
 const arena=new THREE.Group();scene.add(arena);scene.add(new THREE.HemisphereLight('#d5e7ff','#14263a',2.1));
 const light=new THREE.DirectionalLight('#ffffff',2.3);light.position.set(35,130,45);scene.add(light);
 const field=new THREE.Mesh(new THREE.PlaneGeometry(82,102),new THREE.MeshStandardMaterial({color:'#173c37',roughness:1,side:THREE.DoubleSide}));field.rotation.x=-Math.PI/2;arena.add(field);
 const lines=new THREE.Group();arena.add(lines);const material=new THREE.LineBasicMaterial({color:'#5c91ad',transparent:true,opacity:.65});
 function line(points:THREE.Vector3[]){const mesh=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),material);lines.add(mesh)}
 const rect=[[-41,-51],[41,-51],[41,51],[-41,51],[-41,-51]];line(rect.map(([x,z])=>new THREE.Vector3(x,.13,z)));
 line([new THREE.Vector3(-41,.13,0),new THREE.Vector3(41,.13,0)]);
 const circle=[];for(let i=0;i<=64;i++){const a=i*Math.PI*2/64;circle.push(new THREE.Vector3(Math.cos(a)*9,.15,Math.sin(a)*9))}line(circle);
 const grid=new THREE.GridHelper(102,18,'#33546b','#183a46');grid.position.y=.02;scene.add(grid);
 for(const z of [-52,52]){const goal=new THREE.Mesh(new THREE.BoxGeometry(19,7,2),new THREE.MeshBasicMaterial({color:z>0?'#fc985b':'#4bb4ff',wireframe:true}));goal.position.set(0,3.5,z);arena.add(goal)}
 const walls=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(83,22,103)),new THREE.LineBasicMaterial({color:'#314b66',transparent:true,opacity:.45}));walls.position.y=11;scene.add(walls);
 const ball=new THREE.Mesh(new THREE.SphereGeometry(.92,24,16),new THREE.MeshStandardMaterial({color:'#f5dfb2',metalness:.1,roughness:.48}));scene.add(ball);
 const cars=new Map<string,THREE.Mesh>();
 const arrows=new Map<string,THREE.ArrowHelper>();
 for(const player of track.players){const car=new THREE.Mesh(new THREE.BoxGeometry(2.7,.8,4.3),new THREE.MeshStandardMaterial({color:player.team==='blue'?'#37aeff':'#ff943e',metalness:.28,roughness:.4}));cars.set(player.id,car);scene.add(car);
 const arrow=new THREE.ArrowHelper(new THREE.Vector3(0,0,1),new THREE.Vector3(),4,player.team==='blue'?'#77ceff':'#ffce87');arrows.set(player.id,arrow);scene.add(arrow)}
 const trailGroup=new THREE.Group();scene.add(trailGroup);
 let dragging=false,lastX=0,lastY=0,az=.49,elv=.58,dist=200,pan=new THREE.Vector3();
 function pointerDown(e:PointerEvent){dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId)}
 function pointerMove(e:PointerEvent){if(!dragging)return;az-=(e.clientX-lastX)*.006;elv=THREE.MathUtils.clamp(elv+(e.clientY-lastY)*.005,.08,1.46);lastX=e.clientX;lastY=e.clientY}
 function pointerUp(){dragging=false}
 function wheel(e:WheelEvent){e.preventDefault();dist=THREE.MathUtils.clamp(dist*(1+e.deltaY*.001),45,440)}
 renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointermove',pointerMove);renderer.domElement.addEventListener('pointerup',pointerUp);renderer.domElement.addEventListener('wheel',wheel,{passive:false});
 const resize=new ResizeObserver(()=>{const w=host.clientWidth,h=Math.max(host.clientHeight,100);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h)});resize.observe(host);
 let animation=0;const state={track,time,trails,vectors,follow};
 const update=(p:Props)=>{Object.assign(state,p);const frames=p.track.frames;const i=frameAt(frames,p.time),a=frames[i],b=frames[Math.min(i+1,frames.length-1)];const t=a===b?0:THREE.MathUtils.clamp((p.time-a.time)/(b.time-a.time),0,1);
 ball.position.copy(interpolate(a.ball,b.ball,t)).setY(interpolate(a.ball,b.ball,t).z);
 // Replay coordinates: Rocket League X,Y horizontal, Z vertical. Three.js Y is vertical.
 const place=(pose:Pose,next:Pose)=>{const v=interpolate(pose,next,t);return new THREE.Vector3(v.x,v.z,v.y)};
 ball.position.copy(place(a.ball,b.ball));for(const player of p.track.players){const car=cars.get(player.id)!,arrow=arrows.get(player.id)!;const pos=a.cars[player.id],next=b.cars[player.id]||pos;car.visible=!!pos;arrow.visible=!!pos&&p.vectors&&!!pos.velocity;if(!pos)continue;car.position.copy(place(pos,next));car.rotation.y=-(pos.yaw||0);arrow.position.copy(car.position);if(arrow.visible){const vel=new THREE.Vector3(pos.velocity![0],pos.velocity![2],pos.velocity![1]);if(vel.lengthSq()>1){arrow.setDirection(vel.normalize());arrow.setLength(THREE.MathUtils.clamp(vel.length()*.01,2,22))}}}
 for(const child of [...trailGroup.children]){trailGroup.remove(child);(child as THREE.Line).geometry.dispose();((child as THREE.Line).material as THREE.Material).dispose()}
 if(p.trails){const from=Math.max(0,i-110);for(const id of ['ball',...p.track.players.map(x=>x.id)]){const points:THREE.Vector3[]=[];for(let j=from;j<=i;j++){const pose=id==='ball'?frames[j].ball:frames[j].cars[id];if(pose)points.push(new THREE.Vector3(pose.position[0]*meters,pose.position[2]*meters,pose.position[1]*meters))}if(points.length>1){const color=id==='ball'?'#fff0bd':p.track.players.find(x=>x.id===id)?.team==='blue'?'#4bbaff':'#ff954b';trailGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color,transparent:true,opacity:.75})))}}}
 pan= p.follow==='ball'?ball.position.clone():cars.get(p.follow)?.position.clone()||new THREE.Vector3(0,0,0);
 };
 const draw=()=>{animation=requestAnimationFrame(draw);const offset=new THREE.Vector3(Math.sin(az)*Math.cos(elv),Math.sin(elv),Math.cos(az)*Math.cos(elv)).multiplyScalar(dist);camera.position.copy(pan).add(offset);camera.lookAt(pan);renderer.render(scene,camera)};draw();update({track,time,trails,vectors,follow});
 sceneRef.current={update,destroy:()=>{cancelAnimationFrame(animation);resize.disconnect();renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointermove',pointerMove);renderer.domElement.removeEventListener('pointerup',pointerUp);renderer.domElement.removeEventListener('wheel',wheel);scene.traverse(obj=>{if(obj instanceof THREE.Mesh||obj instanceof THREE.Line||obj instanceof THREE.LineSegments){obj.geometry.dispose();const m=obj.material;if(Array.isArray(m))m.forEach(x=>x.dispose());else m.dispose()}});renderer.dispose();host.removeChild(renderer.domElement)}};
 return()=>{sceneRef.current?.destroy();sceneRef.current=null};
 },[track]);
 useEffect(()=>{sceneRef.current?.update({track,time,trails,vectors,follow})},[track,time,trails,vectors,follow]);
 return <div ref={el} style={{height:'100%',minHeight:380,width:'100%',cursor:'grab'}} aria-label="Three dimensional replay reconstruction"/>;
}
