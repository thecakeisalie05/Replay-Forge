import {describe,it,expect} from 'vitest';
import {detectEvents,detectors} from './registry';
import type {Track} from '../viewer/model';
const t:Track={format:'replay-forge-tracks-v1',source:'decoded',title:'Test',events:[],players:[{id:'one',name:'Test car',team:'unknown'}],frames:[
{time:0,ball:{position:[0,0,90]},cars:{one:{position:[0,0,40],velocity:[1000,0,0]}}},
{time:.1,ball:{position:[0,0,90]},cars:{one:{position:[20,0,40],velocity:[400,0,0]}}},
{time:.2,ball:{position:[0,0,90]},cars:{one:{position:[50,0,155],velocity:[400,0,200]}}}
]};
describe('detector registry',()=>{it('exposes versioned detectors',()=>{expect(detectors.length).toBeGreaterThan(0);expect(detectors.every(d=>d.id&&d.version)).toBe(true)});
it('emits low-confidence candidates',()=>{const events=detectEvents(t);expect(events).toHaveLength(2);expect(events.every(e=>typeof e.confidence==='number'&&e.confidence<.5)).toBe(true)})});
