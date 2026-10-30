// Converts Boxcars actor replication updates into a durable intermediate track.
// Requires decoded numeric coordinates; unsupported compressed coordinate variants are reported, never guessed.
function pos(v){if(!v||!['x','y','z'].every(k=>Number.isFinite(v[k])))return null;return [v.x,v.y,v.z]}
function num(v){return typeof v==='number'&&Number.isFinite(v)?v:undefined}
function normalize(input,title){
 const raw=input.replay||input;
 if(!raw||!raw.network_frames||!Array.isArray(raw.network_frames.frames))throw Error('Replay has no Boxcars network frames');
 const objects=raw.objects||[];const names=raw.names||[];
 const actors=new Map();const states=new Map();const teamMap=new Map();const players=new Map();
 const out=[];const events=[];
 const originalId=x=>Number(x?.value??x);
 const nameOf=id=>String(objects[originalId(id)]||'');
 const getActor=(id)=>actors.get(originalId(id));
 const isBall=s=>/Ball_(?:Default|Breakout|Hoops|Puck|Cube)|Ball_TA|Ball_/.test(s);
 const isCar=s=>/Car_TA|Car_Default/.test(s);
 let ballId=null;let warnings=0;
 for(const frame of raw.network_frames.frames){
  for(const del of frame.deleted_actors||[]){const id=originalId(del);const actor=actors.get(id);if(actor?.kind==='car')states.delete(actor.key);actors.delete(id);if(ballId===id)ballId=null}
  for(const a of frame.new_actors||[]){const id=originalId(a.actor_id),className=nameOf(a.object_id);let kind=isBall(className)?'ball':isCar(className)?'car':'other';
   const key='actor-'+id+'-'+frame.time;actors.set(id,{kind,key,className});
   if(kind==='ball')ballId=id;
   if(kind==='car'){const playerName=String(names[originalId(a.name_id)]||key);players.set(key,{id:key,name:playerName,team:'blue'});const p=pos(a.initial_trajectory?.location);if(p)states.set(key,{position:p})}
  }
  for(const u of frame.updated_actors||[]){const actor=getActor(u.actor_id);if(!actor)continue;const attr=u.attribute||{};
   if(attr.RigidBody){const rb=attr.RigidBody;const p=pos(rb.location);if(!p){warnings++;continue}
    const pose={position:p};const vel=pos(rb.linear_velocity);if(vel)pose.velocity=vel;
    if(actor.kind==='ball')states.set('ball',pose);else if(actor.kind==='car')states.set(actor.key,{...states.get(actor.key),...pose});
   }
   // Names and teams require resolving player replication associations; do not invent identities.
  }
  const ball=states.get('ball');if(!ball||!Number.isFinite(frame.time))continue;
  const cars={};for(const [k,v] of states)if(k!=='ball'&&v?.position)cars[k]={...v};
  out.push({time:frame.time,ball:{...ball},cars});
 }
 if(out.length<2)throw Error('Boxcars parsed the replay but no usable ball positions were reconstructed. The actor/coordinate schema may differ for this replay version.');
 const used=new Set(out.flatMap(f=>Object.keys(f.cars)));const participants=[...players.values()].filter(p=>used.has(p.id));
 // Unknown teams are visually marked neutral via blue placeholder only; never assert they reflect true teams.
 return {format:'replay-forge-tracks-v1',title,source:'decoded',players:participants,frames:out,events,decode:{engine:'boxcars via rrrocket',warningCount:warnings,identityConfidence:'unresolved',quality:'partial'}};
}
module.exports={normalize};
