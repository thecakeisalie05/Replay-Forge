import {describe,it,expect} from 'vitest';
import {summarizeTrack} from './trackMetrics';
import type {Track} from '../viewer/model';
const fixture:Track={format:'replay-forge-tracks-v1',title:'Fixture',source:'decoded',players:[{id:'a',name:'Actor',team:'blue'}],events:[],frames:[
{time:0,ball:{position:[0,0,100]},cars:{a:{position:[0,0,30],boost:50}}},
{time:.1,ball:{position:[0,0,100]},cars:{a:{position:[100,0,30],boost:45}}},
{time:.2,ball:{position:[0,0,100]},cars:{a:{position:[200,0,30],boost:40}}}
]};
describe('track metrics',()=>{it('integrates movement and boost',()=>{const m=summarizeTrack(fixture)[0];expect(m.averageSpeedUUPerS).toBeCloseTo(1000);expect(m.distanceUU).toBe(200);expect(m.boostSpent).toBe(10);expect(m.samples).toBe(2);});
it('discards teleports',()=>{const t=structuredClone(fixture);t.frames[2].cars.a.position=[99999,0,30];expect(summarizeTrack(t)[0].samples).toBe(1)})});
