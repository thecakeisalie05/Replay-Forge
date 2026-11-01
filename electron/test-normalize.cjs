const assert=require('node:assert/strict');const {normalize}=require('./normalize.cjs');
const replay={objects:['Archetypes.Ball.Ball_Default','Archetypes.Car.Car_Default'],names:['Ball','Car'],network_frames:{frames:[
{time:0,new_actors:[{actor_id:1,object_id:0,name_id:0,initial_trajectory:{location:{x:0,y:0,z:100}}},{actor_id:2,object_id:1,name_id:1,initial_trajectory:{location:{x:0,y:-100,z:40}}}],updated_actors:[{actor_id:1,attribute:{RigidBody:{location:{x:0,y:0,z:100}}}}]},
{time:0.05,new_actors:[],updated_actors:[{actor_id:1,attribute:{RigidBody:{location:{x:12,y:0,z:100}}}},{actor_id:2,attribute:{RigidBody:{location:{x:0,y:-80,z:40}}}}]}
]}};
const output=normalize(replay,'fixture.replay');assert.equal(output.frames.length,2);assert.equal(output.source,'decoded');assert.equal(output.frames[1].ball.position[0],12);assert.equal(output.players.length,1);assert.equal(output.frames[1].cars[output.players[0].id].position[1],-80);console.log('Boxcars normalization contract test passed');


const objects=['Archetypes.Ball.Ball_Default','Archetypes.Car.Car_Default','TAGame.RBActor_TA:ReplicatedRBState'];
const fake={objects,network_frames:{frames:[{time:0,new_actors:[{actor_id:1,object_id:0,initial_trajectory:{location:{x:0,y:0,z:100}}}],updated_actors:[]}]}};const frames=fake.network_frames.frames;
for(let n=0;n<37;n++){
 const actorId=100+n;
 frames.push({time:n*.1+.01,new_actors:[{actor_id:actorId,object_id:1,initial_trajectory:{location:{x:n,y:0,z:40}}}],updated_actors:[{actor_id:1,object_id:2,attribute:{RigidBody:{location:{x:n,y:0,z:100}}}}]});
 frames.push({time:n*.1+.05,deleted_actors:[actorId],updated_actors:[]});
}
const lifecycle=normalize(fake,'respawn.replay');
assert.equal(lifecycle.players.length,37,'Actor count is not a player-count limit');
assert.equal(lifecycle.decode.peakCars,1,'Only one car was concurrently active');
assert.equal(Object.keys(lifecycle.frames.at(-1).cars).length,0,'Deleted actor must disappear');
assert.equal(lifecycle.frames.at(-1).ball.position[0],36,'RigidBody update must advance ball');
console.log('Boxcars actor lifecycle and tagged attribute tests passed');

const linked={objects:[
'Archetypes.Ball.Ball_Default','Archetypes.Car.Car_Default','Archetypes.PRI.PRI_TA',
'TAGame.RBActor_TA:ReplicatedRBState','Engine.Pawn:PlayerReplicationInfo',
'Engine.PlayerReplicationInfo:PlayerName','TAGame.PRI_TA:MatchGoals','TAGame.PRI_TA:MatchSaves','TAGame.PRI_TA:MatchShots'
],network_frames:{frames:[
 {time:0,new_actors:[{actor_id:1,object_id:0,initial_trajectory:{location:{x:0,y:0,z:100}}},{actor_id:7,object_id:2},{actor_id:8,object_id:1,initial_trajectory:{location:{x:10,y:0,z:30}}}],updated_actors:[
 {actor_id:7,object_id:5,attribute:{String:'Rocket Player'}},
 {actor_id:7,object_id:6,attribute:{Int:2}},
 {actor_id:7,object_id:7,attribute:{Int:3}},
 {actor_id:7,object_id:8,attribute:{Int:5}},
 {actor_id:8,object_id:4,attribute:{ActiveActor:{active:true,actor:7}}}
 ]},
 {time:.05,updated_actors:[{actor_id:1,object_id:3,attribute:{RigidBody:{location:{x:10,y:0,z:100}}}}]},
 {time:.1,deleted_actors:[8],updated_actors:[]},
 {time:.15,new_actors:[{actor_id:9,object_id:1,initial_trajectory:{location:{x:50,y:0,z:30}}}],updated_actors:[{actor_id:9,object_id:4,attribute:{ActiveActor:{active:true,actor:7}}}]},
 {time:.2,updated_actors:[{actor_id:1,object_id:3,attribute:{RigidBody:{location:{x:20,y:0,z:100}}}}]}
]}};
const shared=normalize(linked,'linked.replay');
assert.equal(shared.players.length,1,'Two cars owned by the same PRI should be one player');
assert.equal(shared.players[0].name,'Rocket Player');
assert.equal(shared.players[0].id,'player-7');
assert.deepEqual(shared.players[0].credited,{goals:2,saves:3,shots:5});
assert.ok(shared.frames[0].cars['player-7']);
assert.ok(shared.frames.at(-1).cars['player-7']);
console.log('PRI association and respawn identity test passed');

const nameVariants=structuredClone(linked);
nameVariants.objects[5]='TAGame.PRI_TA:PlayerName';
nameVariants.network_frames.frames[0].updated_actors[0].attribute={Str:'Alternate Player'};
const alternate=normalize(nameVariants,'name-variants.replay');
assert.equal(alternate.players[0].name,'Alternate Player','Accept alternate PRI name properties and strings');
assert.equal(alternate.players[0].team,'unknown','Unresolved teams must not be fabricated');
console.log('Player-name variant regression test passed');

const withHeader=structuredClone(linked);
withHeader.properties=[
 ['ReplayName','Ranked Match'],['Date','2026-04-15 19:21:00'],['MapName','Stadium_P'],
 ['MatchType','Online'],['TeamSize',2],['Team0Score',3],['Team1Score',1],
 ['PlayerStats',[{Name:'Rocket Player',Team:1,Goals:2,Shots:5,Saves:3,Score:480,Platform:'Steam',OnlineID:'42'},{Name:'Other Player',Team:0,Goals:1}]]
];
const enriched=normalize(withHeader,'filename.replay');
assert.equal(enriched.title,'Ranked Match');
assert.equal(enriched.metadata.map,'Stadium_P');
assert.equal(enriched.metadata.teamSize,2);
assert.equal(enriched.roster.length,2);
assert.equal(enriched.roster[0].name,'Rocket Player');
assert.equal(enriched.roster[0].platform,'Steam');
assert.equal(enriched.roster[0].platformId,'42');
assert.equal(enriched.players[0].team,'orange','Unique PRI-header name match enriches team');
assert.equal(enriched.players[0].headerId,'header-0');
assert.equal(enriched.players[0].credited.goals,2);
const headerOnly=structuredClone(replay);
headerOnly.properties=withHeader.properties;
const unlinked=normalize(headerOnly,'no-pri.replay');
assert.equal(unlinked.roster.length,2,'Header roster remains even without a PRI link');
assert.equal(unlinked.players[0].team,'unknown','Do not guess car team from roster ordering');
assert.ok(unlinked.players[0].name.startsWith('Unresolved '),'Do not guess car name from roster ordering');
console.log('Original Replay Forge header metadata / roster integration passed');
