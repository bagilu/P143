# P143 V0.031 驗證記錄

日期：2026-11-03（台灣時間）。穩定基線：`919320de7ae9eca050e5aed0d16fef8cb6bf1fd9`。

## 範圍

五場所新增共用Screen Wake Lock API控制器及設定，進入場所後預設開啟，偏好保存在本瀏覽器的p143-screen-awake-v1。回到地圖不持有；切換分頁、離開及頁面快取返回依最新意圖釋放／重新請求。靜坐隱藏操作與閱讀不會解除常亮。保持畫面可見時可繼續看景、播放原有循環音樂；沒有修改既有聲音播放、背景暫停、照片、黑貓或光景程式。

控制器只持有一個鎖；關閉或隱藏之後才收到的授權會立即釋放，避免非同步結果重新打開已關閉的功能。系統解除或拒絕後顯示實際狀態與手動重試，不以輪詢重複請求。

## 自動驗證

通過screen-awake.js與screen-awake-controller.js語法、check-screen-awake.mjs、check-reading.mjs、check-light-clock.mjs及git diff --check。SBI-P-SDS v3.6報告另見qa-v0031.md。

check-screen-awake.mjs以可控制的假API驗證：尚未進入時不請求；進入後取得一個鎖；一般HUD變更不重複請求；隱藏時釋放、返回後重新取得；系統解除不重試迴圈；關閉釋放；BFCache返回；關閉／隱藏之後晚到的授權；拒絕、手動重試、不支援、解除失敗提示；五場所匯入同一模組且地圖不請求。這些是控制器單元驗證，不代表已量測實機閒置或作業系統省電行為。

## Chrome預覽檢查

- 海邊小屋與松風庭園的操作說明均顯示常亮設定、真實狀態及限制說明。
- 在海邊關閉後，庭園承接相同關閉偏好；再開啟可以保存。
- HTTP預覽環境不提供這項安全網頁API；實際顯示不支援訊息，沒有假稱已啟用。原場所進入、景色與操作保留。
- 正式HTTPS網站已核對原生API：進入海邊小屋後，實際顯示「已保持螢幕開啟，可以安心看景、聽音樂。」；用鍵盤關閉後顯示已關閉，再開啟後經請求中返回已啟用。
- 線上驗證畫面見screenshots/screen-awake-v0031.jpg；GitHub Pages功能部署工作41627753141成功。
- 尚未實測Windows螢幕保護逾時、低電量、機構政策或實機手機；背景釋放及重入的競態由控制器單元測試覆蓋。

## 來源與限制

- MDN Screen Wake Lock API：https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API
- MDN Navigator.wakeLock：https://developer.mozilla.org/en-US/docs/Web/API/Navigator/wakeLock

API只在可見且活躍的安全網頁中申請；省電、權限、平台設定或手動鎖定可解除常亮。瀏覽器回報成功不等於可以凌駕作業系統或機構管理規則。
