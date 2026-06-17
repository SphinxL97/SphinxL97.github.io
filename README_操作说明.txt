碑帖智能读析平台 v3（名称待定）
==================================================

本版本按你的最新要求调整了网站结构：

导航栏目：
首页 / 碑帖总览 / 001 道因法师碑 / 人物关系（待定） / AI配图（待定） / 帮助说明（待定）

已删除“全文检索”导航入口。

主要页面：
1. index.html：首页，正式网站首屏。
2. gallery.html：碑帖总览，45件封面入口。只有001可以进入完整页面。
3. detail.html?id=001：001《道因法师碑》完整样板页。
4. reader.html?id=001&page=5：图文校读页，逐页图片与逐页释文同步。第5页有字框样例。
5. people.html：人物关系（待定），支持搜索人物，显示动态漂浮关系图，中心人物会放大。
6. ai-gallery.html：AI配图（待定），45件碑帖封面先作为AI图片/视频占位。
7. help.html：帮助说明（待定），内容暂时占位。

使用方法：
复制本包所有文件到：
E:\GitHubDesktop\GitHub\SphinxL97.github.io

本地预览：
cd /d E:\GitHubDesktop\GitHub\SphinxL97.github.io
python -m http.server 8000

打开：
http://127.0.0.1:8000/

说明：
001《道因法师碑》的完整图片需要你把对应页图放到：
assets/beitie/001_daoyin/images

命名要与 data/beitie_pages.json 里的 image 字段一致。没有放图片的页，会显示缺图提示，但释文仍可显示。
