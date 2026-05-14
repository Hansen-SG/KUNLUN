# 昆仑小智每日问答自动化

这个目录提供两段 Playwright 自动化：

- `npm run auth`: 第一次手动完成昆仑智联授权，并保存浏览器登录态。
- `npm run ask`: 使用已保存的登录态访问昆仑小智，输入并发送“今天是星期几。”

## 本地第一次授权

```bash
cd kunlun-xiaozhi-automation
npm install
npx playwright install chromium
npm run auth
```

授权完成后会生成 `auth/storage-state.json`。这个文件包含登录态，不要提交到 Git。

## 本地测试发送

```bash
npm run ask
```

如果想看浏览器过程：

```bash
HEADLESS=false npm run ask
```

Windows PowerShell 可以这样写：

```powershell
$env:HEADLESS="false"; npm run ask
```

## 云端运行

电脑关机也能运行，需要把这个目录部署到云端，例如 GitHub Actions、云服务器、Render Cron Job 或其他定时任务平台。

云端推荐用 Secret 保存登录态：

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("auth/storage-state.json"))
```

把输出保存为云端 Secret：`KUNLUN_STORAGE_STATE_B64`。

云端执行命令：

```bash
npm ci
npx playwright install --with-deps chromium
npm run ask
```

可选环境变量：

- `KUNLUN_BOT_URL`: 覆盖访问地址。
- `KUNLUN_QUESTION`: 覆盖发送内容，默认是 `今天是星期几。`
- `KUNLUN_STORAGE_STATE_B64`: 云端登录态，base64 编码的 `auth/storage-state.json`。
- `HEADLESS`: 默认 `true`，设为 `false` 时显示浏览器。
