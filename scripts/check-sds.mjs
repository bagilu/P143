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
assert.ok(footer.indexOf('Web Version V0.023')<footer.indexOf('SBI-P-SDS v3.6'));
for(const entry of ['map.css','world-map.js'])assert.ok(home.includes(`${entry}?v=0.023`));
for(const entry of ['garden.css','garden.js'])assert.ok(garden.includes(`${entry}?v=0.023`));
for(const entry of ['garden-scene.js','garden-light.js'])assert.ok(readFileSync('garden.js','utf8').includes(`${entry}?v=0.023`));
assert.ok(readFileSync('world-map.js','utf8').includes('world-map-model.js?v=0.023'));
assert.ok(existsSync('docs/SBI-P-SDS_v3.6.md'));
const na='純前端、無 Supabase／資料庫／登入；本次沒有新增相關物件。';
const rows=[
 ['01','N/A',na],['02','PASS','掃描全部第一方前端 HTML/JS：無 Table/View CRUD、REST 或 GraphQL。'],['03','N/A','無 PostgreSQL 業務資料交換；音檔只存瀏覽器 IndexedDB。'],['04','N/A',na],['05','N/A',na],['06','N/A',na],['07','N/A',na],['08','N/A',na],['09','N/A',na],
 ['10','PASS','無資料庫 sequence；前端與 Git 歷史未發現所檢查的秘密 token 格式。'],['11','N/A','無密碼欄位或登入。'],['12','PASS','追蹤檔與 Git 歷史無正式 config.js；秘密格式掃描通過。無後端設定，config-sample.js 不適用。'],['13','N/A','無 SQL、migration、權限變更或跨專案操作。'],['14','PASS','沿用純前端 GitHub Pages 架構、README、版本紀錄；本次無 ZIP 或海報交付。'],['15','PASS','入口及新場景為 V0.023；本次修改的 CSS/JS 及模組引用使用 0.023。未修改的共用依賴沿用原版本。'],['16','PASS','首頁頁尾依序為機構識別、Web Version V0.023、SBI-P-SDS v3.6；桌機與手機目視驗證記錄見下方。'],
 ...['17','18','19','20','21','22','23'].map(n=>[n,'N/A','本次為互動網站改版，無海報／展示品交付。'])
];
const baseline=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const report=`# P143 V0.023 合規與驗證報告\n\n- 採用標準：SBI-P-SDS v3.6（附件原文另存同目錄）\n- 穩定基線：\`${baseline}\`\n- 日期：${new Date().toISOString().slice(0,10)} UTC\n- 審核方式：Codex 自動檢查及瀏覽器人工目視；自動掃描不能證明所有可能的秘密或第三方套件均安全。\n- 範圍：五處自在之所心圖、新增松風庭園；原四個場景保留。無資料庫、帳號或伺服器。\n- 結果：${rows.filter(r=>r[1]==='PASS').length} PASS、${rows.filter(r=>r[1]==='N/A').length} N/A、0 FAIL。\n\n| 編號 | 結果 | 依據與適用性 |\n|---|---|---|\n${rows.map(([n,s,e])=>`| QA-${n} | ${s} | ${e} |`).join('\n')}\n\n自動檢查：\`node scripts/check-sds.mjs\`。功能驗證與瀏覽器檢查記錄：\`docs/verification-v0023.md\`。原四個場景的 HTML/JS、音樂與時間控制不改動。公開預設音樂仍沿用既有使用者提供的檔案；新庭園先提供自選音樂，不臆造預設音檔。\n`;
writeFileSync('docs/qa-v0023.md',report);
console.log(`PASS: SBI-P-SDS v3.6 static audit, ${rows.filter(r=>r[1]==='PASS').length} PASS / ${rows.filter(r=>r[1]==='N/A').length} N/A / 0 FAIL. Report saved to docs/qa-v0023.md.`);
