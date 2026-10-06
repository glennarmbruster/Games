// Usage: node games/spotdiff/tests/seed-compat.cjs
// Fixture was captured from the unmodified uploaded 0.2.0 source.
const fs=require('fs'),vm=require('vm'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
function load(text){const scope={};vm.createContext(scope);for(const m of text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)){if(/var (SceneArt|DT) =/.test(m[1]))vm.runInContext(m[1],scope);}return scope;}
function hash(l){return crypto.createHash('sha256').update(JSON.stringify(l)).digest('hex');}
const fixture=JSON.parse(fs.readFileSync(path.join(__dirname,'seed-baseline.json'))),scope=load(source);
for(const row of fixture.levels)assert.equal(hash(scope.DT.level(row.n,row.d)),row.hash,`Level ${row.n}, difficulty ${row.d} changed`);
const logic=[...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes('var DT ='))[1];
assert.equal(hash(logic),fixture.logicHash,'Level rules or hit/scoring logic changed');
console.log(`PASS: ${fixture.levels.length} complete seeded levels match 0.2.0; logic unchanged.`);
