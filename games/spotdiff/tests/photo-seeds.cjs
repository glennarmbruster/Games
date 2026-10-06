// Frozen photographic seed contract plus structural invariants.
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const scope={};vm.createContext(scope);
const source=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
for(const m of source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))if(/var (SceneArt|DT) =/.test(m[1]))vm.runInContext(m[1],scope);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../photo-cruise.js'),'utf8'),scope);
const P=scope.PhotoCruise,hash=crypto.createHash('sha256');let mirrors=0;
for(let d=0;d<4;d++)for(let n=1;n<=500;n++){
  const l=P.level(n,d),again=P.level(n,d);assert.equal(JSON.stringify(l),JSON.stringify(again));
  assert.equal(l.diffs.length,scope.DT.diffCount(n,d));assert.equal(new Set(l.diffs.map(x=>x.id)).size,l.diffs.length);
  assert(!(l.diffs.some(x=>x.id==='drink')&&l.diffs.some(x=>x.id==='paper')));
  const ids=new Set(l.diffs.map(x=>x.id));
  for(const z of P.REGIONS){const a=l.scene.a[z.id],b=l.scene.b[z.id];assert(a>=0&&a<z.states&&b>=0&&b<z.states);assert.equal(a!==b,ids.has(z.id));}
  for(const q of l.diffs){const b=q.box,z=P.REGIONS.find(z=>z.id===q.id);assert(b.x>=0&&b.y>=0&&b.x+b.w<=900&&b.y+b.h<=600);assert.equal(b.x,(l.scene.mirror?1536-z.box[0]-z.box[2]:z.box[0])*900/1536);}
  if(l.scene.mirror)mirrors++;hash.update(JSON.stringify(l));
}
assert(mirrors>500&&mirrors<1500);
const digest=hash.digest('hex'),fixture=path.join(__dirname,'photo-seed-baseline.json');
if(process.argv.includes('--capture'))fs.writeFileSync(fixture,JSON.stringify({renderer:P.ID,levels:2000,sha256:digest},null,2)+'\n');
assert.equal(digest,JSON.parse(fs.readFileSync(fixture)).sha256);
console.log('PASS 2,000 photographic seeds: deterministic, valid states/counts, bounded mirrored targets, frozen save contract.');
