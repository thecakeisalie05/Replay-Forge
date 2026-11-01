// Header decoding adapted from the original Replay Forge parser.
// This is a roster, not a mapping of car actor order to specific players.
const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const numeric=x=>typeof x==='number'&&Number.isFinite(x)?x:typeof x==='string'&&x.trim()!==''&&Number.isFinite(Number(x))?Number(x):undefined;
const str=x=>typeof x==='string'&&x.trim()?x:undefined;
const fields=raw=>{
 const m=new Map();
 if(Array.isArray(raw))for(const e of raw){if(Array.isArray(e)&&typeof e[0]==='string')m.set(e[0],e[1]);else if(record(e))for(const [k,v] of Object.entries(e))m.set(k,v)}
 else if(record(raw))for(const [k,v] of Object.entries(raw))m.set(k,v);
 return m;
};
const teamOf=x=>{const n=numeric(x);return n===0?'blue':n===1?'orange':'unknown'};
function header(raw,fallback){
 const p=fields(raw.properties),roster=[],goals=Array.isArray(p.get('Goals'))?p.get('Goals'):[];
 const stats=Array.isArray(p.get('PlayerStats'))?p.get('PlayerStats'):[];
 for(let i=0;i<stats.length;i++){
  const entry=stats[i];if(!record(entry))continue;
  const name=str(entry.Name??entry.PlayerName??entry.name);
  if(!name)continue;
  roster.push({id:'header-'+i,name,team:teamOf(entry.Team??entry.PlayerTeam??entry.team),platform:str(entry.Platform??entry.platform),platformId:str(entry.OnlineID??entry.PlatformId??entry.platformId),credited:{score:numeric(entry.Score??entry.score),goals:numeric(entry.Goals??entry.goals),assists:numeric(entry.Assists??entry.assists),saves:numeric(entry.Saves??entry.saves),shots:numeric(entry.Shots??entry.shots)},source:'header'});
 }
 for(const e of goals){if(!record(e))continue;const name=str(e.PlayerName);if(name&&!roster.some(p=>p.name===name))roster.push({id:'header-goal-'+roster.length,name,team:teamOf(e.PlayerTeam),credited:{},source:'header-goal'})}
 const date=str(p.get('Date'));
 return {title:str(p.get('ReplayName'))||fallback,date:date||null,
  map:str(p.get('MapName'))||null,playlist:str(p.get('MatchType'))||null,
  teamSize:numeric(p.get('TeamSize'))??null,duration:numeric(p.get('RecordSeconds'))??null,
  scores:{blue:numeric(p.get('Team0Score'))??null,orange:numeric(p.get('Team1Score'))??null},
  gameBuild:numeric(p.get('BuildID'))??null,roster,goalCount:goals.length};
}
module.exports={header,fields};
