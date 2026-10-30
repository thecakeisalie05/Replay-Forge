// Boxcars is packaged as a separate native Rust process; Electron renderer remains sandboxed.
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const {normalize}=require('./normalize.cjs');
function executable(){
 const name=process.platform==='win32'?'replay-forge-decoder.exe':'replay-forge-decoder';
 const packaged=path.join(process.resourcesPath||'','bin',name);
 const local=path.join(__dirname,'..','decoder','target','release',name);
 if(fs.existsSync(packaged))return packaged;
 if(fs.existsSync(local))return local;
 throw Error('Boxcars helper is missing. Build it with cargo build --manifest-path decoder/Cargo.toml --release.');
}
function decode(file){
 return new Promise((resolve,reject)=>{
  let command;try{command=executable()}catch(e){reject(e);return}
  const cp=spawn(command,[file],{windowsHide:true,stdio:['ignore','pipe','pipe']});
  let stdout='',stderr='',settled=false;const max=120*1024*1024;
  const timer=setTimeout(()=>cp.kill(),90000);
  cp.stdout.on('data',b=>{if(stdout.length+b.length>max){cp.kill();return}stdout+=b.toString('utf8')});
  cp.stderr.on('data',b=>{stderr=(stderr+b.toString('utf8')).slice(-4000)});
  cp.on('error',e=>{if(!settled){settled=true;clearTimeout(timer);reject(Error('Could not start Boxcars: '+e.message))}});
  cp.on('close',code=>{clearTimeout(timer);if(settled)return;settled=true;try{if(code!==0)throw Error(stderr||'Boxcars decode failed (exit '+code+')');resolve(normalize(JSON.parse(stdout),path.basename(file)))}catch(e){reject(e)}});
 });
}
module.exports={decode};