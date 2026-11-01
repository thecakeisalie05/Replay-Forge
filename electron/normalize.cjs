// Boxcars -> Replay Forge track normalization.
// Car actor IDs are ephemeral; PlayerReplicationInfo actors are the stable match identities.
// Missing links remain explicit unresolved actors rather than guessed players/teams.
const xyz=v=>v&&[v.x,v.y,v.z].every(Number.isFinite)?[v.x,v.y,v.z]:null;
const ident=v=>Number(v&&typeof v==='object'?v.value:v);
const active=v=>{const a=v?.ActiveActor;return a?.active&&Number.isFinite(ident(a.actor))?ident(a.actor):null};
const carClass=s=>/Car_(?:TA|Default)|Archetypes\.Car\./i.test(s);
const ballClass=s=>/Ball_(?:TA|Default|Breakout|Hoops|Puck|Cube)|Archetypes\.Ball\./i.test(s);
const priClass=s=>/(?:^|\.)PRI_(?:TA|KnockOut_TA)|PlayerReplicationInfo/i.test(s);
const teamClass=s=>/Team_(?:Soccar_TA|TA)|Archetypes\.Teams\.Team/i.test(s);
function rigid(v){const rb=v?.RigidBody;if(!rb)return null;const location=xyz(rb.location);if(!location)return null;const pose={position:location};const velocity=xyz(rb.linear_velocity);if(velocity)pose.velocity=velocity;return pose}
function normalize(input,title){
 const raw=input?.replay||input,frames=raw?.network_frames?.frames;
 if(!Array.isArray(frames))throw Error('Boxcars network frames missing');
 const objects=raw.objects||[],names=raw.names||[];
 const actors=new Map(),poses=new Map(),carLife=new Map(),pri=new Map(),teamActors=new Map();
 const output=[];let warnings=0,lastTime=-Infinity,serial=0,peakCars=0,totalCarSpawns=0;
 for(const frame of frames){
  if(!Number.isFinite(frame.time)||frame.time<=lastTime){warnings++;continue}lastTime=frame.time;
  for(const deleted of frame.deleted_actors||[]){
   const aid=ident(deleted);actors.delete(aid);poses.delete(aid);
  }
  for(const created of frame.new_actors||[]){
   const aid=ident(created.actor_id);if(!Number.isFinite(aid))continue;
   poses.delete(aid);
   const typeName=String(objects[ident(created.object_id)]||'');
   const spawnName=String(names[ident(created.name_id)]||'');
   const kind=ballClass(typeName)?'ball':carClass(typeName)?'car':priClass(typeName)?'pri':teamClass(typeName)?'team':'other';
   const instance='actor-'+aid+'-'+(++serial);
   const item={kind,instance,aid,typeName,spawnName,priId:null};
   actors.set(aid,item);
   if(kind==='car'){carLife.set(instance,item);totalCarSpawns++}
   if(kind==='pri'&&!pri.has(aid))pri.set(aid,{name:null,teamId:null});
   if(kind==='team'){
    const match=spawnName.match(/Team([01])\b/i)||typeName.match(/Team([01])\b/i);
    if(match)teamActors.set(aid,Number(match[1]));
   }
   const p=xyz(created.initial_trajectory?.location);if(p&&(kind==='car'||kind==='ball'))poses.set(aid,{position:p});
  }
  for(const updated of frame.updated_actors||[]){
   const aid=ident(updated.actor_id),item=actors.get(aid);if(!item)continue;
   const property=String(objects[ident(updated.object_id)]||'');
   const attr=updated.attribute;
   if((item.kind==='car'||item.kind==='ball')&&(property.endsWith(':ReplicatedRBState')||attr?.RigidBody)){
    const state=rigid(attr);
    if(state)poses.set(aid,{...poses.get(aid),...state});else warnings++;
   }
   if(item.kind==='car'&&property==='Engine.Pawn:PlayerReplicationInfo'){
    const ref=active(attr);if(ref!==null)item.priId=ref;
   }
   if(item.kind==='pri'){
    const p=pri.get(aid)||{name:null,teamId:null};
    if(property==='Engine.PlayerReplicationInfo:PlayerName'&&typeof attr?.String==='string')p.name=attr.String;
    if(property==='Engine.PlayerReplicationInfo:Team')p.teamId=active(attr);
    pri.set(aid,p);
   }
  }
  let ball=null,activeCars=0;const cars={};
  for(const [aid,item] of actors){
   const pose=poses.get(aid);if(!pose)continue;
   if(item.kind==='ball')ball={...pose};
   if(item.kind==='car'){cars[item.instance]={...pose};activeCars++}
  }
  peakCars=Math.max(activeCars,peakCars);
  if(ball)output.push({time:frame.time,ball,cars});
 }
 if(output.length<2)throw Error('No usable ball physics frames decoded; unsupported or incomplete replay network schema');
 // PRI mapping is resolved after parsing because actor/car data may arrive earlier than the link.
 const aliases=new Map(),players=new Map();
 for(const [instance,car] of carLife){
  const info=car.priId===null?null:pri.get(car.priId);
  const canonical=car.priId===null?instance:'player-'+car.priId;
  aliases.set(instance,canonical);
  if(!players.has(canonical)){
   const team=info?.teamId===null||info?.teamId===undefined?null:teamActors.get(info.teamId);
   players.set(canonical,{id:canonical,name:info?.name||('Unresolved '+canonical),team:team===1?'orange':'blue',teamKnown:team===0||team===1,identityKnown:car.priId!==null});
  } else if(info?.name&&players.get(canonical).name.startsWith('Unresolved ')){
   players.get(canonical).name=info.name;
  }
 }
 const used=new Set(),merged=[];
 for(const frame of output){
  const cars={};for(const [instance,pose] of Object.entries(frame.cars)){const mapped=aliases.get(instance)||instance;cars[mapped]=pose;used.add(mapped)}
  merged.push({...frame,cars});
 }
 const participants=[...players.values()].filter(p=>used.has(p.id));
 const linked=participants.filter(p=>p.identityKnown).length;
 return{format:'replay-forge-tracks-v1',title,source:'decoded',players:participants,frames:merged,events:[],decode:{engine:'boxcars',warningCount:warnings,quality:linked===participants.length?'partial':'partial-unresolved',peakCars,totalCarSpawns,actorInstances:carLife.size,playerIdentities:linked,identityConfidence:linked===participants.length?'linked':'partial',teamConfidence:participants.every(p=>p.teamKnown)?'linked':'partial'}};
}
module.exports={normalize};
