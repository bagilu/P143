import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {PHOTO_SCENES} from '../photo-scenes.js';
import {PhotoView,photoViewport} from '../photo-view.js';
import {SolarLightClock} from '../solar-light-clock.js';
process.chdir(new URL('../',import.meta.url).pathname);
let checks=0;
for(const [name,action] of [['entry','underwater'],['underwater','cabin']]){
 const scene=PHOTO_SCENES[name],h=scene.hotspots.find(h=>h.action===action);
 for(const [w,height] of [[1920,1080],[1363,936],[390,844],[844,390]])for(const yaw of [-.65,0,.65]){
  globalThis.innerWidth=w;globalThis.innerHeight=height;
  const c=photoViewport(scene.width,scene.height,w,height,scene.zoom,yaw,0);
  const x=(h.x+h.w/2-c.x)/c.width*w,y=(h.y+h.h/2-c.y)/c.height*height;
  assert.equal(PhotoView.prototype.hit.call({crop:c,scenes:PHOTO_SCENES,view:name},x,y),action);checks++;
 }
}
const scene=PHOTO_SCENES.underwater;
assert.equal(scene.seaMask,undefined,'Do not distort corals with surface-wave animation');
for(const plate of ['day','gold','night'])assert.ok(existsSync(scene.plates[plate]));
const clock=new SolarLightClock(new Date('2026-11-09T12:00:00+08:00'));
for(const [minute,weights] of [[720,[1,0,0]],[clock.sample().solar.sunset,[0,1,0]],[1260,[0,0,1]]]){clock.select(minute);assert.deepEqual(clock.sample().state.weights,weights);}
const app=readFileSync('app.js','utf8'),home=readFileSync('index.html','utf8'),page=readFileSync('seaside.html','utf8');
assert.ok(app.includes("photo-view.js?v=0.051")&&app.includes("photo-scenes.js?v=0.051"));
assert.ok(page.includes('app.js?v=0.051')&&page.includes('V0.051'));
assert.ok(home.includes('world-shell.js?v=0.051')&&home.includes('Web Version V0.051'));
assert.ok(home.indexOf('Web Version V0.051')<home.indexOf('SBI-P-SDS v3.6'));
assert.ok(!page.includes('underwater')&&!page.includes('海底'),'No visible new entrance label');
const text=readdirSync('.').filter(f=>/\.(js|html|css)$/.test(f)).map(f=>readFileSync(f,'utf8')).join('\n');
assert.ok(!/supabase|\/rest\/v1|graphql|\.from\s*\(/i.test(text));
const secret=/\b(?:sk-proj-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{30,}|sb_secret_[A-Za-z0-9_-]{20,})\b/;
assert.ok(!secret.test(text));
const history=execFileSync('git',['log','--all','-p','--format=','--','*.html','*.js','*.json'],{encoding:'utf8',maxBuffer:128e6});assert.ok(!secret.test(history));
assert.ok(!execFileSync('git',['ls-files'],{encoding:'utf8'}).split('\n').some(f=>/(^|\/)config\.js$/.test(f)));
writeFileSync('docs/qa-v0051.md',`# P143 V0.051 · SBI-P-SDS v3.6 驗證\n\n日期：2026-11-09（台灣時間）。基線：${execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()}。\n\n- PASS：兩個隱藏熱點使用原圖座標，${checks} 組桌機／手機裁切與平移座標測試。\n- PASS：三張圖引用與日光／日落／夜光權重；手動時刻沿用同一時鐘。\n- PASS：前端無直接資料庫 CRUD、REST 或 GraphQL；無新後端或權限變更。\n- PASS：第一方前端與可用 Git 歷史秘密格式掃描；沒有追蹤正式 config.js。\n- PASS：首頁及修改的小屋版本 V0.051，app／PhotoView／scene／world-shell 快取版本更新；未修改場所維持 V0.045。\n- N/A：資料庫、RLS、RPC、密碼與海報 QA，本次純前端圖片及場景互動。\n- 瀏覽器：桌機門把進入、樓梯返回已實際操作；手機僅座標測試，尚未實機驗證。\n- 舊 check-solar.mjs 仍硬編碼 V0.042／reading v0.032；數值驗證執行後會在舊版介面斷言失敗，並非新光景計算錯誤。\n`);
console.log(`PASS: ${checks} passage mappings, three plate paths and light weights, cache/version and SDS static audit.`);
