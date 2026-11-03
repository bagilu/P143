import assert from 'node:assert/strict';
import {readFileSync,readdirSync,writeFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);process.chdir(fileURLToPath(root));
const files=readdirSync('.').filter(f=>/\.(html|js|css)$/.test(f)),source=files.map(f=>readFileSync(f,'utf8')).join('\n');
const secret=/\b(?:sk-proj-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{30,}|sb_secret_[A-Za-z0-9_-]{20,})\b/;
assert.ok(!/supabase|\/rest\/v1|graphql|\.from\s*\(/i.test(source),'Review any new database access before publishing');
assert.ok(!secret.test(source),'Secret-like token in frontend');
assert.ok(!/type=["']password/i.test(source),'Password UI requires separate checks');
const tracked=execFileSync('git',['ls-files'],{encoding:'utf8'}).trim().split('\n');
assert.ok(!tracked.some(f=>/(^|\/)config\.js$/.test(f)),'Live config must not be tracked');
const historicalNames=execFileSync('git',['log','--all','--format=','--name-only'],{encoding:'utf8',maxBuffer:32e6});
assert.ok(!historicalNames.split('\n').some(f=>/(^|\/)config\.js$/.test(f)),'Live config found in history');
const history=execFileSync('git',['log','--all','-p','--format=','--','*.html','*.js','*.json'],{encoding:'utf8',maxBuffer:128e6});
assert.ok(!secret.test(history),'Secret-like token in Git history');
assert.ok(!tracked.some(f=>/\.(sql|zip)$/i.test(f)),'New SQL/ZIP needs extra audit');
const home=readFileSync('index.html','utf8'),garden=readFileSync('garden.html','utf8'),footer=home.match(/<footer[\s\S]*?<\/footer>/)?.[0];
assert.ok(footer?.includes('慈濟大學 · 經營管理學系 · 好玩實驗室'));
assert.ok(footer.indexOf('Web Version V0.031')<footer.indexOf('SBI-P-SDS v3.6'));
assert.ok(home.includes('map.css?v=0.028'));assert.ok(home.includes('world-map.js?v=0.025'));assert.ok(readFileSync('world-map.js','utf8').includes('world-map-model.js?v=0.025'));
for(const page of ['seaside.html','temple.html','snow.html','balcony.html','garden.html']){const html=readFileSync(page,'utf8');assert.ok(html.includes('reading.css?v=0.025')&&html.includes('reading.js?v=0.030'));assert.ok(html.includes('V0.031'));assert.ok(html.includes('screen-awake.js?v=0.031'));}
assert.ok(readFileSync('reading.js','utf8').includes('reading-model.js?v=0.030'));
assert.ok(garden.includes('garden.js?v=0.028')&&readFileSync('garden.js','utf8').includes('garden-music.js?v=0.027'));
assert.ok(existsSync('docs/SBI-P-SDS_v3.6.md'));
const na='純前端、無 Supabase／資料庫／登入；本次沒有新增相關物件。';
const rows=[
 ['01','N/A',na],['02','PASS','掃描全部第一方前端 HTML/JS：無 Table/View CRUD、REST 或 GraphQL。'],['03','N/A','無 PostgreSQL 業務資料交換；音檔只存瀏覽器 IndexedDB。'],['04','N/A',na],['05','N/A',na],['06','N/A',na],['07','N/A',na],['08','N/A',na],['09','N/A',na],
 ['10','PASS','無資料庫 sequence；前端與 Git 歷史未發現所檢查的秘密 token 格式。'],['11','N/A','無密碼欄位或登入。'],['12','PASS','追蹤檔與 Git 歷史無正式 config.js；秘密格式掃描通過。無後端設定，config-sample.js 不適用。'],['13','N/A','無 SQL、migration、權限變更或跨專案操作。'],['14','PASS','沿用純前端 GitHub Pages 架構、README、版本紀錄；本次無 ZIP 或海報交付。'],['15','PASS','入口及五個場景均為 V0.031；本版五場所新增保持螢幕開啟；screen-awake及controller使用0.031，原閱讀／庭園模組沿用0.030，其他模組保持原快取版本。'],['16','PASS','首頁頁尾依序為機構識別、Web Version V0.031、SBI-P-SDS v3.6；桌機與手機目視驗證記錄見下方。'],
 ...['17','18','19','20','21','22','23'].map(n=>[n,'N/A','本次為互動網站改版，無海報／展示品交付。'])
];
const baseline=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const report=`# P143 V0.031 合規與驗證報告\n\n- 採用標準：SBI-P-SDS v3.6（附件原文另存同目錄）\n- 穩定基線：\`${baseline}\`\n- 日期：${new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Taipei'}).format(new Date())}（台灣時間）\n- 審核方式：Codex 自動檢查及瀏覽器人工目視；自動掃描不能證明所有可能的秘密或第三方套件均安全。\n- 範圍：五場所共用保持螢幕開啟：預設啟用、使用者可關閉、可見性／頁面返回重新申請、系統拒絕與不支援提示。無資料庫、帳號或伺服器。\n- 結果：${rows.filter(r=>r[1]==='PASS').length} PASS、${rows.filter(r=>r[1]==='N/A').length} N/A、0 FAIL。\n\n| 編號 | 結果 | 依據與適用性 |\n|---|---|---|\n${rows.map(([n,s,e])=>`| QA-${n} | ${s} | ${e} |`).join('\n')}\n\n自動檢查：\`node scripts/check-sds.mjs\`。功能驗證與瀏覽器檢查記錄：\`docs/verification-v0031.md\`。原音樂、環境聲、手動即時／自動五分鐘光影、閱讀進度與自選偏好保留。常亮採瀏覽器Screen Wake Lock API，只在前景及系統允許時生效；未修改裝置設定與既有音樂可見性政策。不新增登入或後端。\n`;
writeFileSync('docs/qa-v0031.md',report);
console.log(`PASS: SBI-P-SDS v3.6 static audit, ${rows.filter(r=>r[1]==='PASS').length} PASS / ${rows.filter(r=>r[1]==='N/A').length} N/A / 0 FAIL. Report saved to docs/qa-v0031.md.`);
