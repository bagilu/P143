import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
const read=p=>readFileSync(new URL('../'+p,import.meta.url));
const sourceBytes=read('books/hongloumeng-source.txt'),source=sourceBytes.toString('utf8');
const book=JSON.parse(read('books/hongloumeng.json'));
const snapshotBytes=read('books/hongloumeng-wikisource.json.gz'),snapshot=JSON.parse(gunzipSync(snapshotBytes));
const sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(sha(sourceBytes),book.sourceSHA256);assert.equal(sha(snapshotBytes),book.rawSourceSHA256);
assert.equal(book.chapters.length,120);assert.equal(snapshot.pages.length,120);
assert.deepEqual(book.chapters.map(c=>c.id),Array.from({length:120},(_,i)=>i+1));
assert.equal(book.sourceURL,'https://zh.wikisource.org/wiki/紅樓夢');
assert.equal(book.textLicenseURL,'https://creativecommons.org/licenses/by-sa/4.0/');
assert.equal(book.licenseURL,'books/hongloumeng-source.txt');
assert.ok(source.includes('維基文庫')&&source.includes('CC BY-SA 4.0')&&source.includes('僅適用本書數位文字'));
assert.ok(!source.includes('Project Gutenberg'));
for(const c of book.chapters){
 const page=snapshot.pages.find(p=>p.title.endsWith('/第'+String(c.id).padStart(3,'0')+'回'));
 assert.ok(page);assert.equal(c.sourceRevision,page.revisions[0].revid);
 assert.ok(c.sourceRevisionURL.endsWith('oldid='+c.sourceRevision));
 assert.ok(source.includes(c.sourceRevisionURL)&&source.includes(c.sourceHistoryURL));
 assert.ok(c.title.startsWith('第')&&c.title.includes('回'));
 assert.ok(c.paragraphs.length>0&&c.paragraphs.every(p=>typeof p==='string'&&p.length>0));
 for(const p of c.paragraphs){assert.ok(source.includes(p),'Source text must retain every published paragraph');assert.ok(!p.includes('{{')&&!p.includes('}}')&&!p.includes('<ref')&&!p.includes('<poem')&&!p.includes('[[../'));}
}
const first=book.chapters[0].paragraphs.join('');
assert.ok(first.includes('靜極思動')&&first.includes('待時飛'));
assert.ok(!first.includes('薑尹D')&&!first.includes('慫級*'));
assert.ok(book.chapters[61].title.includes('石榴裙')&&!book.chapters[61].title.includes('@'));
assert.ok(book.chapters[101].title.includes('驅妖孽')&&!book.chapters[101].title.includes('@'));
assert.ok(book.chapters.at(-1).paragraphs.join('').includes('由來同一夢'));
console.log(`PASS: 120 complete Wikisource chapters, ${book.chapters.reduce((n,c)=>n+c.paragraphs.length,0)} paragraphs, matching preserved revisions and SHA-256 provenance, no old-source mojibake, source/history credits and CC BY-SA 4.0 scoped to book text.`);
