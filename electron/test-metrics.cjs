const assert=require('node:assert/strict');const {summarize}=require('./metrics.cjs');
const track={players:[{id:'player',name:'Test',team:'blue'}],frames:[
 {time:0,cars:{player:{position:[0,0,50],boost:50}}},
 {time:.1,cars:{player:{position:[100,0,50],boost:45}}},
 {time:.2,cars:{player:{position:[200,0,50],boost:40}}}
]};
const m=summarize(track)[0];assert.equal(Math.round(m.averageSpeedUUPerS),1000);assert.equal(m.distanceUU,200);assert.equal(m.boostSpent,10);assert.equal(m.coverage,1);
track.frames[2].cars.player.position=[100000,0,50];const s=summarize(track)[0];assert.equal(s.observedFrames,1);assert.equal(s.distanceUU,100);console.log('Track metrics integration passed');
