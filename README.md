# 会话收藏 (Session Favorites)

DSH Web 界面的会话收藏插件：右键侧边栏里的会话即可打开操作菜单，收藏后在侧边栏「收藏」面板里集中浏览。

> 标准 DSH bundle 插件，装完刷新页面即生效。

## 特性

- **右键会话 → 操作菜单**：在侧边栏任意会话行上按下右键（`mousedown`）就立即弹出菜单，不等松开；
  - 收藏 / 取消收藏
  - 打开会话
  - 复制会话 ID（复制成功后菜单项短暂显示「已复制会话 ID」并自动关闭）
  - 支持 `Esc`、点击菜单外、窗口尺寸变化时关闭；右键释放时的原生右键菜单会被抑制，不会闪一下或重开
- **会话行内星标**：在会话行的操作区（`sidebar.workspaces.session.row.action`）注册一个星标按钮，单击即可收藏 / 取消收藏。
- **侧边栏「收藏」图标**：侧边栏图标区新增星形图标（`sidebar.panellist`），带收藏数量角标（超过 99 显示 `99+`），点击打开收藏面板。
- **收藏面板**：列出全部收藏会话，显示「运行中 / 空闲」状态，点击可直接打开会话，右侧实心星可移出收藏；
  会话被归档或删除后仍保留在列表里，并标注「不在当前会话列表中」。空列表和加载中都有对应提示。
- **本地持久化**：收藏数据存在浏览器 `localStorage`（键 `dsh.session-favorites.v1`），刷新或重启后仍在；
  自动去重、按收藏时间倒序，最多保留 **200 条**；隐私模式等无法写入存储时退化为仅内存保存。
- **中英文案**：通过 `locale.register` 注册 `zh` / `en` 字典，跟随界面语言切换。

## 安装

```powershell
dsh plugin add github:cypher-yht/dsh-plugins-session-favorites
```

本地开发用软链：

```powershell
dsh plugin add link:D:\path\to\session-favorites
```

> 桌面客户端（Electron）读的是 `desktop` profile，请让桌面端会话里的 `plugin_manager` 安装本插件。

装完**重启宿主**，浏览器 `Ctrl+F5` 硬刷新。

## 目录结构

```text
dsh-plugins-session-favorites/
├── index.js            # 宿主半区：空实现，UI 全在 client.js
├── client.js           # 前端：会话行星标 + 右键菜单 + 侧边栏图标 + 收藏面板
├── cordis.patch.yml    # 挂载声明
├── locale/             # 中英文案（zh.json / en.json）
├── icon.svg            # 插件列表图标
└── package.json
```

## 实现要点

- 只用浏览器 `localStorage` 存收藏，不依赖宿主后端，因此卸载插件不会动数据（键名带版本 `v1`）。
- 右键菜单挂在 `shell.overlay`（`order: 900`），按鼠标坐标定位并做视口边界收敛。
- 打开会话走 `uiWorkspace.openSession(sessionId)`，会话刚好消失时异常被吞掉，不打断界面。

## 许可证

MIT，见 [LICENSE](LICENSE)。
