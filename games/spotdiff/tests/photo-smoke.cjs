// Development-only checks; never loaded or cached by the game.
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');

const TEST_ROOT=path.resolve(__dirname,'../../..');
const BASELINE_ROOT=process.env.DOUBLE_TAKE_BASELINE;
const OUTPUT=process.env.DOUBLE_TAKE_TEST_OUTPUT||path.join(TEST_ROOT,'test-results','spotdiff');
fs.mkdirSync(path.join(OUTPUT,'screens'),{recursive:true});
function out(name){return path.join(OUTPUT,name);}
assert(BASELINE_ROOT,'Set DOUBLE_TAKE_BASELINE to the unchanged 0.2.0 project root.');
const root=TEST_ROOT,original=BASELINE_ROOT;let useBaseline=false;
const server=http.createServer((req,res)=>{let p=path.join(useBaseline?original:root,decodeURIComponent(req.url.split('?')[0]));if(p.endsWith('/'))p+='index.html';try{res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.html')?'text/html':p.endsWith('.css')?'text/css':p.endsWith('.webp')?'image/webp':'application/octet-stream');res.end(fs.readFileSync(p))}catch{res.statusCode=404;res.end('missing')}}).listen(8771,'127.0.0.1');
const url='http://127.0.0.1:8771/games/spotdiff/',report={checks:[],errors:[],external:[],layouts:[]};
const ok=s=>{report.checks.push(s);console.log('PASS',s);};
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:375,height:667},hasTouch:true,isMobile:true,serviceWorkers:'block'});const page=await context.newPage();
page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8771')&&!r.url().startsWith('data:'))report.external.push(r.url())});
useBaseline=true;await page.goto(url);await page.locator('#btnCloseHelp').click();
const oldPixels=await page.evaluate(()=>{const out={};for(let n=2;n<=12;n++){let l=DT.level(n,1),c=document.createElement('canvas');c.width=355;c.height=237;let x=c.getContext('2d');x.scale(355/900,355/900);SceneArt.drawScene(x,l.scene,'a');out[l.theme]=c.toDataURL();}return out;});
let target=await page.evaluate(()=>__spotdiff.spot(0,0));await page.touchscreen.tap(target.x,target.y);
await page.locator('#btnHint').click();await page.waitForTimeout(400);
await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
const oldState=await page.evaluate(()=>({state:__spotdiff.state(),stats:__spotdiff.stats(),save:localStorage.getItem('spotdiff.game')}));
useBaseline=false;await page.reload();await page.waitForFunction(()=>CruiseArt.ready&&__spotdiff.crispReady());
let newState=await page.evaluate(()=>({state:__spotdiff.state(),stats:__spotdiff.stats(),save:localStorage.getItem('spotdiff.game')}));
for(const key of ['found','wrong','hints','level'])assert.deepEqual(newState.state[key],oldState.state[key],`saved ${key}`);
assert.deepEqual(newState.stats,oldState.stats);assert.equal(newState.save,oldState.save);ok('Existing 0.2.0 save, found differences, hints and stats resume unchanged');
const unchanged=await page.evaluate(old=>{let checks=[];for(let n=2;n<=12;n++){let l=DT.level(n,1),c=document.createElement('canvas');c.width=355;c.height=237;let x=c.getContext('2d');x.scale(355/900,355/900);SceneArt.drawScene(x,l.scene,'a');checks.push({theme:l.theme,same:old[l.theme]===c.toDataURL()});}return checks;},oldPixels);assert(unchanged.every(x=>x.same),JSON.stringify(unchanged));ok('Other 11 scene renderers are pixel-identical');
for(const [w,h] of [[320,480],[375,540],[375,667],[375,812],[390,844],[414,896],[568,320],[667,375],[812,375],[896,414],[768,1024],[1024,768],[1440,900]]){
await page.setViewportSize({width:w,height:h});await page.waitForTimeout(150);
let data=await page.evaluate(()=>{const r=e=>e.getBoundingClientRect().toJSON(),a=r(document.querySelector('#picA')),b=r(document.querySelector('#picB')),top=r(document.querySelector('.top')),bottom=r(document.querySelector('.toolbar'));return{w:innerWidth,h:innerHeight,a,b,top,bottom,scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],side:__spotdiff.sideBySide,targets:[...document.querySelectorAll('.top button,.toolbar button')].filter(x=>x.getBoundingClientRect().width).map(x=>({id:x.id,r:r(x)}))};});
assert.equal(data.scroll[0],w);assert.equal(data.scroll[1],h);
for(const pic of [data.a,data.b]){assert(pic.x>=0&&pic.right<=w);assert(pic.y>=data.top.bottom&&pic.bottom<=data.bottom.top);assert(pic.width>0&&pic.height>0);}
for(const target of data.targets){assert(target.r.width>=43.5&&target.r.height>=43.5,JSON.stringify(target));assert(target.r.x>=0&&target.r.right<=w+.1,JSON.stringify(target));}
report.layouts.push(data);
}
ok('13 phone/tablet/desktop sizes: both pictures and 44px controls visible, no page overflow');
// Simulated notch/home-bar geometry. Actual device safe areas still require a device check.
await page.setViewportSize({width:812,height:375});await page.addStyleTag({content:'.stage{--safe-left:44px!important;--safe-right:44px!important} .top{padding-left:54px!important;padding-right:54px!important} html.gg-fs-over .toolbar{bottom:27px!important}'});await page.evaluate(()=>dispatchEvent(new Event('resize')));await page.waitForTimeout(150);
let safe=await page.evaluate(()=>({P:__spotdiff.P,bottom:document.querySelector('.toolbar').getBoundingClientRect().top}));assert(safe.P.every(p=>p.x>=54&&p.x+p.w<=758&&p.y+p.h<=safe.bottom));ok('Simulated landscape notch and home indicator keep both pictures inside safe bounds');await page.reload();await page.waitForFunction(()=>CruiseArt.ready);
// Desktop click, wheel zoom, synchronized view and drag; touch tap already covered above.
await page.setViewportSize({width:1440,height:900});await page.waitForTimeout(150);await page.evaluate(()=>__spotdiff.startLevel(1));target=await page.evaluate(()=>__spotdiff.spot(1,1));await page.mouse.click(target.x,target.y);assert((await page.evaluate(()=>__spotdiff.state().found))[1]);ok('Mouse finds a difference in picture B');
await page.mouse.move(target.x,target.y);await page.mouse.wheel(0,-400);await page.waitForTimeout(200);let before=await page.evaluate(()=>({...__spotdiff.view}));assert(before.z>1);
await page.mouse.down();await page.mouse.move(target.x-55,target.y-25,{steps:5});await page.mouse.up();let after=await page.evaluate(()=>({...__spotdiff.view}));assert(after.cx!==before.cx||after.cy!==before.cy);await page.locator('#btnFit').click();await page.waitForTimeout(400);assert.equal(await page.evaluate(()=>__spotdiff.view.z),1);ok('Mouse zoom, pan and Zoom out work with the shared two-picture view');
// Genuine multi-touch input through CDP on the touch-enabled page.
await page.setViewportSize({width:375,height:667});await page.waitForTimeout(150);let rect=await page.locator('#picA').boundingBox(),cx=rect.x+rect.width/2,cy=rect.y+rect.height/2;
const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx-25,y:cy,id:1},{x:cx+25,y:cy,id:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx-60,y:cy,id:1},{x:cx+60,y:cy,id:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(150);assert((await page.evaluate(()=>__spotdiff.view.z))>1.5);await page.locator('#btnFit').click();await page.waitForTimeout(400);ok('Two-finger touch pinch works and resets without page scrolling');
// Existing menu and settings are used through real buttons.
await page.locator('#ggMenuBtn').click();await page.locator('#btnSettings').click();await page.locator('#themes button[data-theme="dark"]').click();await page.locator('#setSound').check();await page.locator('#setMusic').check();await page.locator('#setAds').uncheck();await page.locator('#btnCloseSettings').click();assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),'dark');let settings=await page.evaluate(()=>__spotdiff.settings());assert(settings.sound&&settings.music);await page.screenshot({path:out('screens/dark.png')});ok('Shared theme, sound, music and old-time ad settings remain usable');
for(let d=0;d<4;d++){await page.locator('#ggMenuBtn').click();await page.locator('#btnSettings').click();await page.locator(`#setDiff button[data-d="${d}"]`).click();await page.locator('#btnCloseSettings').click();assert.equal(await page.evaluate(()=>__spotdiff.lv.d),d);}
ok('All four difficulty modes start successfully through Settings');
// Complete a level with real taps, then advance using the existing result card.
await page.evaluate(()=>{__spotdiff.startLevel(1);Goobs.setTheme('light')});const count=await page.evaluate(()=>__spotdiff.lv.diffs.length);
for(let j=0;j<count;j++){let p=await page.evaluate(j=>__spotdiff.spot(j,j%2),j);await page.touchscreen.tap(p.x,p.y);await page.waitForTimeout(340);}
await page.waitForSelector('#ovEnd.show');assert(await page.evaluate(()=>__spotdiff.stats().cleared>0));const endButtons=await page.locator('#endActions').innerText();console.log('end',endButtons);await page.locator('#endActions button').first().click();await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>__spotdiff.state().level),2);ok('Completing a level records stats/stars and Next level starts the next seed');
await page.locator('#ggMenuBtn').click();await page.locator('#btnStats').click();assert((await page.locator('#statsBody').innerText()).length>20);await page.locator('#btnCloseStats').click();ok('Stats sheet displays recorded progress');
// Photo snapshots remain stable even when the player chooses original scenes next.
await page.evaluate(()=>{__spotdiff.setDiff(1);__spotdiff.startLevel(2)});
assert.equal(await page.evaluate(()=>__spotdiff.lv.renderer), 'photo-cafe-v1');
let point=await page.evaluate(()=>__spotdiff.spot(0,0));await page.touchscreen.tap(point.x,point.y);
await page.evaluate(()=>dispatchEvent(new Event('pagehide')));
let photograph=await page.evaluate(()=>({scene:__spotdiff.lv.scene,state:__spotdiff.state(),stats:__spotdiff.stats()}));
await page.locator('#ggMenuBtn').click();await page.locator('#btnSettings').click();await page.locator('#setScenes button[data-photo="0"]').click();await page.locator('#btnCloseSettings').click();
assert.deepEqual(await page.evaluate(()=>__spotdiff.lv.scene),photograph.scene);assert.deepEqual(await page.evaluate(()=>__spotdiff.state().found),photograph.state.found);
await page.reload();await page.waitForFunction(()=>PhotoTour.ready&&__spotdiff.crispReady());
assert.deepEqual(await page.evaluate(()=>__spotdiff.lv.scene),photograph.scene);assert.deepEqual(await page.evaluate(()=>__spotdiff.state().found),photograph.state.found);assert.deepEqual(await page.evaluate(()=>__spotdiff.stats()),photograph.stats);
ok('Photo save resumes exactly; selecting original scenes does not discard the current puzzle');
let remaining=await page.evaluate(()=>__spotdiff.lv.diffs.map((d,j)=>__spotdiff.state().found[j]?-1:j).filter(j=>j>=0));
for(const j of remaining){let point=await page.evaluate(j=>__spotdiff.spot(j,1),j);await page.touchscreen.tap(point.x,point.y);await page.waitForTimeout(340);}
await page.waitForSelector('#ovEnd.show');await page.locator('#endActions button').first().click();
assert.equal(await page.evaluate(()=>__spotdiff.lv.renderer),undefined);assert.equal(await page.evaluate(()=>__spotdiff.lv.theme),await page.evaluate(()=>DT.themeFor(3)));
ok('Original twelve-scene generator is available on the next puzzle');

await page.locator('#btnHome').click();await page.waitForURL('http://127.0.0.1:8771/');assert((await page.title()).includes('Goobs'));ok('Return to the main game collection works');
assert.equal(report.errors.length,0);assert.equal(report.external.length,0);ok('No browser script errors or external runtime requests');
await browser.close();fs.writeFileSync(out('verification.json'),JSON.stringify(report,null,2));server.close();
})().catch(e=>{console.error(e);report.failure=e.stack;fs.writeFileSync(out('verification.json'),JSON.stringify(report,null,2));server.close();process.exit(1)});
