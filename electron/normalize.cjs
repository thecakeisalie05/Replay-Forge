const {header}=require('./header.cjs');
// Boxcars -> Replay Forge track normalization.
// Car actor IDs are ephemeral; PlayerReplicationInfo actors are the stable match identities.
// Missing links remain explicit unresolved actors rather than guessed players/teams.
const xyz=v=>v&&[v.x,v.y,v.z].every(Number.isFinite)?[v.x,v.y,v.z]:null;
const ident=v=>Number(v&&typeof v==='object'?v.value:v);
const active=v=>{const a=v?.ActiveActor||v?.Actor;const raw=a?.actor??a?.actor_id??a?.value;const n=ident(raw);return a&&a.active!==false&&raw!==undefined&&Number.isFinite(n)?n:null};
const readName=(v,names)=>{if(typeof v==='string')return v;for(const candidate of [v?.String,v?.Str,v?.Name,v?.string,v?.str])if(typeof candidate==='string'&&candidate.trim())return candidate;const idx=v?.Name?.value??v?.NameIndex??v?.Int;return Number.isInteger(idx)&&typeof names[idx]==='string'?names[idx]:null};
const carClass=s=>/Car_(?:TA|Default)|Archetypes\.Car\./i.test(s);
const ballClass=s=>/Ball_(?:TA|Default|Breakout|Hoops|Puck|Cube)|Archetypes\.Ball\./i.test(s);
const priClass=s=>/(?:^|\.)PRI_(?:TA|KnockOut_TA)|PlayerReplicationInfo/i.test(s);
const teamClass=s=>/Team_(?:Soccar_TA|TA)|Archetypes\.Teams\.Team/i.test(s);
function rigid(v){const rb=v?.RigidBody;if(!rb)return null;const location=xyz(rb.location);if(!location)return null;const pose={position:location};const velocity=xyz(rb.linear_velocity);if(velocity)pose.velocity=velocity;const q=rb.rotation;if(q&&[q.x,q.y,q.z,q.w].every(Number.isFinite))pose.orientation=[q.x,q.y,q.z,q.w];return pose}
function normalize(input,title){
 const raw=input?.replay||input,frames=raw?.network_frames?.frames;
 if(!Array.isArray(frames))throw Error('Boxcars network frames missing');
 const objects=raw.objects||[],names=raw.names||[];
 const match=header(raw,title);
 const actors=new Map(),poses=new Map(),carLife=new Map(),pri=new Map(),teamActors=new Map(),boostComponents=new Map(),boostValues=new Map();
 const output=[];let warnings=0,lastTime=-Infinity,serial=0,peakCars=0,totalCarSpawns=0;
 for(const frame of frames){
  if(!Number.isFinite(frame.time)||frame.time<=lastTime){warnings++;continue}lastTime=frame.time;
  for(const deleted of frame.deleted_actors||[]){
   const aid=ident(deleted);actors.delete(aid);poses.delete(aid);boostComponents.delete(aid);boostValues.delete(aid);
   for(const [component,vehicle] of boostComponents)if(vehicle===aid){boostComponents.delete(component);boostValues.delete(component)}
  }
  for(const created of frame.new_actors||[]){
   const aid=ident(created.actor_id);if(!Number.isFinite(aid))continue;
   poses.delete(aid);
   const typeName=String(objects[ident(created.object_id)]||'');
   const spawnName=String(names[ident(created.name_id)]||'');
   const kind=ballClass(typeName)?'ball':carClass(typeName)?'car':priClass(typeName)?'pri':teamClass(typeName)?'team':/CarComponent_Boost_TA/.test(typeName)?'boost':'other';
   const instance='actor-'+aid+'-'+(++serial);
   const item={kind,instance,aid,typeName,spawnName,priId:null};
   actors.set(aid,item);
   if(kind==='car'){carLife.set(instance,item);totalCarSpawns++}
   if(kind==='pri'&&!pri.has(aid))pri.set(aid,{name:null,teamId:null,stats:{}});
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
   if(item.kind==='car'&&/(?:^|:)(?:PlayerReplicationInfo|PRI)$/.test(property)){
    const ref=active(attr);if(ref!==null)item.priId=ref;
   }
   if(item.kind==='boost'){
    if(property==='TAGame.CarComponent_TA:Vehicle'){const vehicleId=active(attr);if(vehicleId!==null)boostComponents.set(aid,vehicleId)}
    if(property==='TAGame.CarComponent_Boost_TA:ReplicatedBoostAmount'&&Number.isFinite(attr?.Byte))boostValues.set(aid,Math.min(100,Math.max(0,attr.Byte/255*100)));
   }
   if(item.kind==='pri'){
    const p=pri.get(aid)||{name:null,teamId:null,stats:{}};
    if(/(?:^|:)(?:PlayerName|PlayerNamePrivate)$/.test(property)){const playerName=readName(attr,names);if(playerName)p.name=playerName}
    if(/(?:^|:)Team$/.test(property))p.teamId=active(attr);
    const stat=property.match(/^TAGame.PRI_TA:Match(Goals|Saves|Shots|Assists|Score|EpicSaves)$/);
    if(stat&&Number.isFinite(attr?.Int))p.stats[stat[1].toLowerCase()]=attr.Int;
    pri.set(aid,p);
   }
  }
  let ball=null,activeCars=0;const cars={};
  const boostByVehicle=new Map();for(const [component,vehicle] of boostComponents){const amount=boostValues.get(component);if(amount!==undefined)boostByVehicle.set(vehicle,amount)}
  for(const [aid,item] of actors){
   const pose=poses.get(aid);if(!pose)continue;
   if(item.kind==='ball')ball={...pose};
   if(item.kind==='car'){
    const boost=boostByVehicle.get(aid);
    cars[item.instance]=boost===undefined?{...pose}:{...pose,boost};activeCars++
   }
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
   players.set(canonical,{id:canonical,name:info?.name||('Unresolved '+canonical),team:team===1?'orange':team===0?'blue':'unknown',teamKnown:team===0||team===1,identityKnown:car.priId!==null,credited:info?.stats||null});
  } else if(info?.name&&players.get(canonical).name.startsWith('Unresolved ')){
   players.get(canonical).name=info.name;
  }
 }
 // Enrich PRI-confirmed identities from the header, never by arbitrary car array order.
 const candidates=new Map();for(const r of match.roster){const key=r.name.toLocaleLowerCase();const list=candidates.get(key)||[];list.push(r);candidates.set(key,list)}
 const claimed=new Set();
 for(const p of players.values()){
  if(!p.identityKnown||p.name.startsWith('Unresolved '))continue;
  const matching=(candidates.get(p.name.toLocaleLowerCase())||[]).filter(r=>!claimed.has(r.id));
  if(matching.length!==1)continue;
  const r=matching[0];claimed.add(r.id);
  if(p.team==='unknown'&&r.team!=='unknown'){p.team=r.team;p.teamKnown=true}
  p.credited={...r.credited,...p.credited};
  p.headerId=r.id;
 }
 const used=new Set(),merged=[];
 for(const frame of output){
  const cars={};for(const [instance,pose] of Object.entries(frame.cars)){const mapped=aliases.get(instance)||instance;cars[mapped]=pose;used.add(mapped)}
  merged.push({...frame,cars});
 }
 const participants=[...players.values()].filter(p=>used.has(p.id));
 const linked=participants.filter(p=>p.identityKnown).length;
 return{format:'replay-forge-tracks-v1',title:match.title,recordedAt:match.date,metadata:{map:match.map,playlist:match.playlist,teamSize:match.teamSize,duration:match.duration,scores:match.scores,gameBuild:match.gameBuild,goalCount:match.goalCount},roster:match.roster,source:'decoded',players:participants,frames:merged,events:[],decode:{engine:'boxcars',warningCount:warnings,quality:linked===participants.length?'partial':'partial-unresolved',peakCars,totalCarSpawns,actorInstances:carLife.size,playerIdentities:linked,identityConfidence:linked===participants.length?'linked':'partial',teamConfidence:participants.every(p=>p.teamKnown)?'linked':'partial'}};
}
module.exports={normalize};
