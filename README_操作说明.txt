# 翰墨智读网页原型包

把本文件夹内所有内容复制到：

`E:\GitHubDesktop\GitHub\SphinxL97.github.io`

如果提示覆盖 `index.html`，先把你原来的 index.html 备份一份，再覆盖。

## 图片放置规则

当前包内只放了第 5 页和第 20 页示例图。完整图片请放到：

`assets/beitie/001_daoyin/images/`

命名建议保持下载脚本生成的格式：

`0005_五.jpg`
`0006_六.jpg`
`0020_二十.jpg`

网页会按照 `data/beitie_pages.json` 里的路径读取图片。

## 本地预览

在仓库根目录打开命令行：

```bash
python -m http.server 8000
```

浏览器访问：

`http://localhost:8000`

不要直接双击 html 文件预览，因为浏览器可能禁止本地 JSON 读取。

## 上传 GitHub Pages

在 GitHub Desktop 里：

1. 回到 Changes
2. Summary 写：add beitie demo pages
3. Commit to main
4. Push origin
5. 等几十秒访问 https://sphinxl97.github.io/
