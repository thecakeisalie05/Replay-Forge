import {useMemo} from 'react';
import type {Track} from '../viewer/model';
import {summarizeTrack} from './trackMetrics';
const format=(n:number|null,unit='')=>n===null?'Unavailable':n.toFixed(1)+unit;
export default function TrackSummary({track}:{track:Track}){
 const metrics=useMemo(()=>summarizeTrack(track),[track]);
 return <section className="track-summary"><h3>Observed movement statistics <small>{track.source==='demo'?'SYNTHETIC INPUT':'EXPERIMENTAL DECODE'}</small></h3><p>Per car actor, not verified per player. Speed is computed from observed displacement; air time is height-based. Missing and discontinuous intervals are excluded.</p><div className="track-scroll"><table><thead><tr><th>CAR ACTOR</th><th>AVG SPEED</th><th>PEAK SPEED</th><th>AIR TIME*</th><th>ZERO BOOST</th><th>BOOST SPENT</th><th>GOALS</th><th>SAVES</th><th>SHOTS</th><th>COVERAGE</th></tr></thead><tbody>{metrics.map(m=><tr key={m.actorId}><td>{m.name}</td><td>{format(m.averageSpeedUUPerS,' uu/s')}</td><td>{format(m.peakSpeedUUPerS,' uu/s')}</td><td>{format(m.airSeconds,' s')}</td><td>{format(m.zeroBoostSeconds,' s')}</td><td>{format(m.boostSpent,' pts')}</td><td>{m.credited?.goals??'—'}</td><td>{m.credited?.saves??'—'}</td><td>{m.credited?.shots??'—'}</td><td>{Math.round(100*m.coverage)}%</td></tr>)}</tbody></table></div><p>*Height above 130 uu is not the same as airborne contact state. All metrics exclude gaps and likely teleportation and must be validated against replays.</p></section>
}
