# V0.045 古老教堂驗證

新增第六處，入口位於使用者指定的右側山谷；新增白日與夜間地圖建物。三張核准臥房圖轉為 JPEG，保留暖燈、庭院草地與單樹。新增日光、暮光、夜光與局部微動，沿用花蓮太陽時間、共享音樂、閱讀與螢幕喚醒。

音樂：晨光聖詠 P143-61.mp3、迴廊和聲 P143-62.mp3、晚禱餘音 P143-63.mp3，待使用者上傳 Music/。缺檔顯示準備中，可另選本機音檔。封面使用核准的三張生成圖。

通過 check-church、check-site-fullscreen、check-world-map、check-sound-panel、check-sds、check-reading、check-screen-awake、check-music-bridge。瀏覽器確認地圖入口、歡迎畫面、光景選取、閱讀與三張音樂牌卡；390px 視窗牌卡 300×480，無橫向溢出。

全螢幕統一改由外層地圖文件承接，避免全螢幕綁定單一場景 iframe。模擬文件測試通過；雲端 Chrome 拒絕 Fullscreen API（not granted），因此真實全螢幕進出仍需實機確認；失敗回饋與一般操作已確認。未增加閒置自動全螢幕。
