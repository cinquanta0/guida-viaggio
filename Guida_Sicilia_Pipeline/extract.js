const fs=require('fs'),zlib=require('zlib');
const buf=fs.readFileSync('C:/Users/lucad/Downloads/Guida_Sicilia.pdf');
let out=[];
let idx=0;
while(true){
  const s=buf.indexOf('stream',idx);
  if(s<0)break;
  let st=s+6;
  if(buf[st]===13)st++;
  if(buf[st]===10)st++;
  const e=buf.indexOf('endstream',st);
  if(e<0)break;
  const data=buf.slice(st,e);
  try{
    const inf=zlib.inflateSync(data);
    out.push(inf.toString('latin1'));
  }catch(err){}
  idx=e+9;
}
fs.writeFileSync('raw.txt',out.join('\n===PAGE===\n'),'latin1');
console.log('streams:',out.length, 'bytes:', out.join('').length);
