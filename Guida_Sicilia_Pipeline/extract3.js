const fs=require('fs'),zlib=require('zlib');
const s=fs.readFileSync('C:/Users/lucad/Downloads/Guida_Sicilia.pdf').toString('latin1');
function a85(str){
  str=str.replace(/\s/g,'');
  const end=str.indexOf('~>'); if(end>=0) str=str.slice(0,end);
  const out=[]; let tuple=[],i=0;
  for(const ch of str){
    if(ch==='z'&&tuple.length===0){out.push(0,0,0,0);continue;}
    tuple.push(ch.charCodeAt(0)-33);
    if(tuple.length===5){
      let n=0; for(const t of tuple) n=n*85+t;
      out.push((n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255); tuple=[];
    }
  }
  if(tuple.length>0){
    const k=tuple.length; while(tuple.length<5)tuple.push(84);
    let n=0; for(const t of tuple) n=n*85+t;
    const b=[(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255];
    out.push(...b.slice(0,k-1));
  }
  return Buffer.from(out);
}
const re=/([\r\n])stream\r?\n/g; let m,out=[];
while((m=re.exec(s))){
  const st=m.index+m[0].length; const e=s.indexOf('endstream',st);
  try{ out.push(zlib.inflateSync(a85(s.slice(st,e))).toString('latin1')); }
  catch(err){ out.push('[FAIL '+err.message+']'); }
}
fs.writeFileSync('raw.txt',out.join('\n===STREAM===\n'),'latin1');
console.log('n',out.length,'len',out.join('').length);
