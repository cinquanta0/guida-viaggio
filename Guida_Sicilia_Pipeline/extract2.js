const fs=require('fs'),zlib=require('zlib');
const buf=fs.readFileSync('C:/Users/lucad/Downloads/Guida_Sicilia.pdf');
const re=/([\r\n])stream\r?\n/g;
const s=buf.toString('latin1');
let m,out=[],tries=0;
while((m=re.exec(s))){
  const st=m.index+m[0].length;
  const e=s.indexOf('endstream',st);
  tries++;
  const data=Buffer.from(s.slice(st,e),'latin1');
  let inf=null;
  for(const f of [zlib.inflateSync,zlib.inflateRawSync,zlib.gunzipSync]){
    try{inf=f(data);break;}catch(err){}
  }
  if(inf) out.push(inf.toString('latin1')); else out.push('[FAIL len='+data.length+' first='+data.slice(0,4).toString('hex')+']');
}
fs.writeFileSync('raw.txt',out.join('\n===STREAM===\n'),'latin1');
console.log('tries',tries,'len',out.join('').length);
