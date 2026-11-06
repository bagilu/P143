# P143 V0.044 音樂牌卡改版驗證

日期：2026-11-06（台灣時間）

## 改版範圍

- 寂靜寺院三首：梵音入靜 P143-21、清心誦語 P143-22、山寺悠然 P143-23；使用 Music/。
- 第一、二首沿用 chant / sutra IndexedDB key，保留既有自選音檔；第三首 mountain。
- HEAD 檢查預設檔案；缺檔、HTML 回應或網路失敗時顯示準備中，可自選音檔並重新檢查。
- 五處共十五張牌卡，寬高 1:1.6；整張按鈕可播放或暫停，選項獨立。
- 海邊三張恢復 assets/albums.png 原始封面；其他十二張為依曲目生成的新封面，存於 assets/music-covers/。
- 沿用共用播放器、地圖持續播放、進入別處停止、環境聲控制、閱讀、光景與陽台拖曳。
- 沿用 V0.043 播放提示 bottom:auto 修正。

## 瀏覽器檢查

Chrome 桌機 1363×936，檢視五處聲音面板均有三張唱片牌卡與獨立選單。

- 寺院三首預設顯示可用；實際點選梵音入靜播放成功。
- 寺院音樂播放 20.2 秒，回到地圖時 26.1 秒仍播放，雪山歡迎頁 30.8 秒仍播放；正式進入雪山後淡出並清除音源。
- 海邊 390×844 iframe：三張牌卡均為 300×480，無橫向溢出；點整張牌卡播放成功，展開選單仍在播放。
- 陽台 320×844 iframe：三張牌卡約 243×388.8，長英文曲名、意境文案均無文字溢出。
- 陽台窄螢幕播放提示高 55.8px、top 80px，未被拉成全高。
- 寺院在本機尚無預設檔時，三張顯示準備中；加入使用者已上傳的三首後，檢查變為可播放。

未進行手機實機測試；手機檢查使用真實場景頁面置於指定大小的瀏覽器 iframe，讓 CSS media queries 依該 viewport 運作。

## 自動檢查

通過：check-temple-music、check-sound-panel、check-music-bridge、check-sds、check-reading、check-screen-awake、check-balcony-edge、check-temple、check-garden、check-balcony、check-snow。

新增測試涵蓋寺院預設檔名、缺檔與 HTML／網路錯誤、重新檢查可找到新檔、自選音檔不被非同步預設檢查覆寫。

截圖：screenshots/temple-v0044.jpg。
