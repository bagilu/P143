"""Build a local plain reader edition from the preserved Wikisource revisions.
Development-only dependency: pip install mwparserfromhell (never loaded by website).
"""
from pathlib import Path
import re,json,hashlib,gzip,html
import mwparserfromhell as mw
from mwparserfromhell import nodes
root=Path(__file__).resolve().parent
snap=json.loads(gzip.decompress((root/'hongloumeng-wikisource.json.gz').read_bytes()))
license_url='https://creativecommons.org/licenses/by-sa/4.0/'
notice='本書古典原著已屬公共領域。數位文本取自維基文庫《紅樓夢》120回匯校文本，貢獻者名單見各回歷史連結；數位整理層依 Creative Commons 姓名標示—相同方式分享 4.0（CC BY-SA 4.0）提供。本次移除導覽、格式標記與現代註釋，分離回目及段落，未以AI改寫正文。此授權僅適用本書數位文字及整理，不延伸至 P143 程式或其他圖片。'
def render(code):
    out=[]
    for n in code.nodes:
        if isinstance(n,nodes.Text):out.append(str(n))
        elif isinstance(n,nodes.Template):
            name=str(n.name).strip()
            if name in ['样式:古典小說','清朝作品','未校訂']:continue
            if name=='gap':out.append('　');continue
            if name in ['center','ppoem','~~','僻字']:
                val=render(n.get(1).value) if n.has(1) else ''
                out.append(('\n'+val+'\n') if name!='僻字' else val)
            else:raise ValueError('Unknown template '+name)
        elif isinstance(n,nodes.Tag):
            name=str(n.tag).lower()
            if name in ['ref','references','section']:continue
            text=render(n.contents) if n.contents else ''
            out.append(('\n'+text+'\n') if name in ['poem','center','li'] else text)
        elif isinstance(n,nodes.Wikilink):out.append(render(n.text if n.text is not None else n.title))
        elif isinstance(n,nodes.HTMLEntity):out.append(n.normalize())
        elif isinstance(n,nodes.Comment):continue
        elif isinstance(n,nodes.Heading):out.append('\n'+render(n.title)+'\n')
        elif isinstance(n,nodes.ExternalLink):out.append(render(n.title) if n.title is not None else '')
        else:raise ValueError(type(n).__name__)
    return ''.join(out)
chapters=[]
for page in sorted(snap['pages'],key=lambda x:x['title']):
    num=int(re.search(r'第(\d+)回',page['title'])[1]);rev=page['revisions'][0];s=rev['slots']['main']['content']
    s=re.split(r'\n==\s*註釋\s*==',s)[0]
    s=re.sub(r'<ref\b[^>]*>.*?</ref\s*>','',s,flags=re.S|re.I)
    s=re.sub(r'<ref\b[^>]*/\s*>','',s,flags=re.I)
    s=re.sub(r'^\[\[.*(?:回目录|下一回|上一回).*$', '',s,flags=re.M)
    s=re.sub(r'-\{(.*?)\}-',r'\1',s,flags=re.S)
    plain=render(mw.parse(s))
    # One source poem has a stray closing span; remove surviving presentation tags only.
    plain=re.sub(r'</?(?:poem|span|center|onlyinclude|section)\b[^>]*>', '', plain, flags=re.I)
    lines=[x.strip().replace("'''",'').replace("''",'') for x in plain.splitlines() if x.strip() and not re.fullmatch(r'[-\s]+',x)]
    assert lines[0].startswith('第') and '回' in lines[0],(num,lines[:2])
    title=re.sub(r'\s+','　',lines.pop(0))
    assert len(lines)>3,(num,lines)
    purl='https://zh.wikisource.org/wiki/'+page['title']
    chapters.append({'id':num,'title':title,'sourceTitle':title,'paragraphs':lines,'sourceURL':purl,'sourceRevision':rev['revid'],'sourceRevisionURL':'https://zh.wikisource.org/w/index.php?oldid='+str(rev['revid']),'sourceHistoryURL':'https://zh.wikisource.org/w/index.php?title='+page['title']+'&action=history','sourceTimestamp':rev['timestamp']})
assert [c['id'] for c in chapters]==list(range(1,121))
text='紅樓夢｜一百二十回數位匯校文本\n\n'+notice+'\n授權全文：'+license_url+'\n來源：https://zh.wikisource.org/wiki/紅樓夢\n取得日期：2026-11-03（台灣時間）\n原著：曹雪芹；後四十回作者有爭議\n版本定位：維基文庫標示前80回以庚辰本為底本，後40回以程甲本為底本。本檔非學術校勘本；原始維基頁可能仍有文字異體及校對問題。\n\n'
for c in chapters:
    text+=c['title']+'\n來源修訂：'+c['sourceRevisionURL']+'\n貢獻者歷史：'+c['sourceHistoryURL']+'\n\n'+'\n\n'.join(c['paragraphs'])+'\n\n'
raw=(text.rstrip()+'\n').encode('utf-8');(root/'hongloumeng-source.txt').write_bytes(raw)
book={'id':'hongloumeng','title':'紅樓夢','author':'曹雪芹；後四十回作者有爭議','edition':'120回匯校數位本','sourceName':'維基文庫《紅樓夢》','sourceURL':'https://zh.wikisource.org/wiki/紅樓夢','sourceCredit':'維基文庫貢獻者（各回歷史連結保留作者名單）','sourceNotice':notice,'licenseURL':'books/hongloumeng-source.txt','textLicenseURL':license_url,'textLicense':'CC BY-SA 4.0（數位整理層）；古典原著公共領域','sourceSHA256':hashlib.sha256(raw).hexdigest(),'rawSourceSHA256':hashlib.sha256((root/'hongloumeng-wikisource.json.gz').read_bytes()).hexdigest(),'textNote':'維基文庫120回匯校數位本：來源標示前80回以庚辰本為底本，後40回以程甲本為底本，不包括批語。本次移除導覽、現代註釋及格式標記，正文未經AI改寫。以繁體為主，保留來源異體及部分簡體用字，可能有少量校對問題；非學術校勘本。各回修訂與貢獻者歷史連結見完整來源檔。','chapters':chapters}
(root/'hongloumeng.json').write_text(json.dumps(book,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
print(json.dumps({'chapters':len(chapters),'paragraphs':sum(len(c['paragraphs']) for c in chapters),'textChars':sum(len(p) for c in chapters for p in c['paragraphs']),'sourceBytes':len(raw),'jsonBytes':(root/'hongloumeng.json').stat().st_size,'sourceSHA256':book['sourceSHA256']},indent=2))
