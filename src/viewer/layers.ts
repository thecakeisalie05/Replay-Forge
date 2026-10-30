import * as THREE from 'three';
import type {ReplayEvent,Track} from './model';
/** Geometry for *inferred or supplied* event annotations. Detectors must remain outside the scene. */
export type OverlayLayer = {id:string;group:THREE.Group;update(time:number,track:Track):void;dispose():void};
export function createEventLayer():OverlayLayer{
 const group=new THREE.Group();const meshes:THREE.Mesh[]=[];
 const geometry=new THREE.RingGeometry(1.3,1.6,48);
 const material=new THREE.MeshBasicMaterial({color:'#f6d48e',transparent:true,opacity:.7,side:THREE.DoubleSide,depthWrite:false});
 let previousTrack:Track|null=null;
 const rebuild=(track:Track)=>{
  for(const m of meshes){group.remove(m)}meshes.length=0;
  for(const event of track.events){const i=track.frames.findIndex(f=>f.time>=event.time);if(i<0)continue;const frame=track.frames[i];const where=event.position||frame.ball.position;const ring=new THREE.Mesh(geometry,material.clone());ring.position.set(where[0]*.01,where[2]*.01,where[1]*.01);ring.rotation.x=Math.PI/2;ring.userData.event=event;ring.visible=false;group.add(ring);meshes.push(ring)}
 };
 return{id:'events',group,update(time,track){if(previousTrack!==track){for(const mesh of meshes){(mesh.material as THREE.Material).dispose()}rebuild(track);previousTrack=track}for(const mesh of meshes){const event=mesh.userData.event as ReplayEvent;const distance=Math.abs(time-event.time);mesh.visible=distance<1.25;const scale=1+Math.min(2,distance*1.5);mesh.scale.setScalar(scale);(mesh.material as THREE.MeshBasicMaterial).opacity=Math.max(0,.75-distance*.6)}},dispose(){for(const mesh of meshes){(mesh.material as THREE.Material).dispose()}geometry.dispose();material.dispose();group.clear();meshes.length=0}};
}
