// rrrocket is the Boxcars-backed CLI. This boundary is deliberately isolated from renderer and analytics.
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {randomUUID}=require('node:crypto');
const {normalize}=require('./normalize.cjs');
function executable(){
 const name=process.platform==='win32'?'rrrocket.exe':'rrrocket';
 const bundled=path.join(process.resourcesPath||'', 'bin',name);
 const local=path.join(__dirname,'..','tools','bin',name);
 if(fs.existsSync(bundled))return bundled;
 if(fs.existsSync(local))return local;
 return process.env.REPLAY_FORGE_RRROCKET||name;
}
function decode(file){
 return new Promise(async(resolve,reject)=>{
  const tmp=path.join(os.tmpdir(),'replay-forge-'+randomUUID());await fs.promises.mkdir(tmp,{recursive:true});
  const cp=spawn(executable(),['--network-parse',file],{cwd:tmp,windowsHide:true,env:{...process.env}});
  let stderr='',stdout='',finished=false;const timeout=setTimeout(()=>cp.kill(),90000);
  cp.stdout.on('data',b=>{stdout+=b.toString('utf8');if(stdout.length>100*1024*1024)cp.kill()});
  cp.stderr.on('data',b=>{stderr+=b.toString('utf8').slice(0,2000)});
  cp.on('error',e=>{if(!finished){finished=true;clearTimeout(timeout);fs.promises.rm(tmp,{recursive:true,force:true}).catch(()=>{});reject(Error('rrrocket could not start. Install the Windows MSVC binary or set REPLAY_FORGE_RRROCKET. '+e.message))}});
  cp.on('close',async code=>{clearTimeout(timeout);if(finished)return;finished=true;try{
    if(code!==0)throw Error('Boxcars decoder exited with '+code+': '+stderr.slice(0,600));
    // rrrocket normally writes a sibling JSON, but may emit JSON on stdout in other builds.
    let raw;try{raw=JSON.parse(stdout)}catch{}
    if(!raw){const candidates=[file.replace(/\.replay$/i,'.json'),path.join(tmp,path.basename(file).replace(/\.replay$/i,'.json'))];for(const p of candidates)if(fs.existsSync(p)){raw=JSON.parse(await fs.promises.readFile(p,'utf8'));if(p!==file.replace(/\.replay$/i,'.json'))await fs.promises.unlink(p);break}}
    if(!raw)throw Error('Boxcars completed but did not produce recognizable JSON');
    resolve(normalize(raw,path.basename(file)));
  }catch(e){reject(e)}finally{await fs.promises.rm(tmp,{recursive:true,force:true}).catch(()=>{})}});
 });
}
module.exports={decode};
