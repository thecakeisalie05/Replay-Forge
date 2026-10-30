const assert=require('node:assert/strict');const {normalize}=require('./normalize.cjs');
const replay={objects:['Archetypes.Ball.Ball_Default','Archetypes.Car.Car_Default'],names:['Ball','Car'],network_frames:{frames:[
{time:0,new_actors:[{actor_id:1,object_id:0,name_id:0,initial_trajectory:{location:{x:0,y:0,z:100}}},{actor_id:2,object_id:1,name_id:1,initial_trajectory:{location:{x:0,y:-100,z:40}}}],updated_actors:[{actor_id:1,attribute:{RigidBody:{location:{x:0,y:0,z:100}}}}]},
{time:0.05,new_actors:[],updated_actors:[{actor_id:1,attribute:{RigidBody:{location:{x:12,y:0,z:100}}}},{actor_id:2,attribute:{RigidBody:{location:{x:0,y:-80,z:40}}}}]}
]}};
const output=normalize(replay,'fixture.replay');assert.equal(output.frames.length,2);assert.equal(output.source,'decoded');assert.equal(output.frames[1].ball.position[0],12);assert.equal(output.players.length,1);assert.equal(output.frames[1].cars[output.players[0].id].position[1],-80);console.log('Boxcars normalization contract test passed');
