const fs=require('node:fs');const path=require('node:path');const {decode}=require('./boxcars.cjs');const {summarize}=require('./metrics.cjs');
const REVISION=5;let running=false,cancelled=false;
function cacheFile(app){return path.join(app.getPath('userData'),'analysis.json')}
function read(app){try{const j=JSON.parse(fs.readFileSync(cacheFile(app),'utf8'));return j&&typeof j==='object'?j:{}}catch{return {}}}
function write(app,results){const target=cacheFile(app);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target+'.tmp',JSON.stringify(results));fs.renameSync(target+'.tmp',target)}
async function analyze(app,replays,webContents){
 if(running)throw Error('Analysis already in progress');running=true;cancelled=false;
 const results=read(app);const entries=[];let completed=0,decoded=0,skipped=0,failed=0;
 try {
  for(const replay of replays){
   if(cancelled)break;
   const key=replay.sha256;const existing=results[key];
   if(existing&&existing.revision===REVISION&&existing.status==='ok'){skipped++;entries.push(existing);completed++;continue}
   try{
    const track=await decode(replay.path);const entry={revision:REVISION,status:'ok',sha256:key,filename:replay.name,fileDate:new Date(replay.mtimeMs).toISOString(),title:track.title,sourceDate:track.recordedAt||null,recordedDuration:track.metadata?.duration??null,players:summarize(track),roster:track.roster||[],metadata:track.metadata||null,decode:track.decode||null};
    results[key]=entry;entries.push(entry);decoded++;
   }catch(e){failed++;const entry={revision:REVISION,status:'error',sha256:key,filename:replay.name,error:String(e)};results[key]=entry;entries.push(entry)}
   completed++;write(app,results);
   if(webContents&&!webContents.isDestroyed())webContents.send('analysis:progress',{total:replays.length,completed,decoded,skipped,failed,active:true});
  }
  return{total:replays.length,completed,decoded,skipped,failed,cancelled,entries};
 }finally{
  running=false;write(app,results);
  if(webContents&&!webContents.isDestroyed())webContents.send('analysis:progress',{total:replays.length,completed,decoded,skipped,failed,active:false,cancelled});
 }
}
function stop(){cancelled=true}
function clear(app){if(running)throw Error('Cannot clear analysis while a scan is running');try{fs.rmSync(cacheFile(app),{force:true})}catch(e){throw e}return true}
module.exports={analyze,read,stop,clear};
