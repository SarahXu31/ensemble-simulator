# 风莫村 · 设计系统主文件

> **来源**: `ui-ux-pro-max` skill 输出 + 本地定制
> **适用**: `~/ai-town` 前端全站。除非在 `pages/` 目录下有页面级覆盖，否则一律遵守此文件。

---

## 1. 设计定位

**古风卷轴 × E-Ink Paper × 文字剧场**

- 用户看到的不是一张地图，而是一卷正在被人徐徐展开的**宣纸**。
- UI 主体是一条**竖向滚动的事件流**（narration / dialogue / encounter / relationship / system），像章回小说一样往下续。
- 视觉基调：**宣纸温白 + 墨黑 + 淡棕框线 + 朱砂点缀**，最少的动效、最重的排版层次。
- 反面清单（严禁）：像素/游戏 UI、彩色渐变按钮、拟物化按钮阴影、emoji 图标、彩色 blob 动画。

## 2. 色板 (Chapter · Ink · Vermilion)

| 变量 | HEX | 用途 |
|------|-----|------|
| `--paper-bg` | `#FDFBF7` | 主背景（宣纸底） |
| `--paper-warm` | `#F5F0E1` | 卡片/侧栏底色（陈年宣纸） |
| `--paper-fold` | `#EAE2CE` | 分隔线、卷轴折痕、hover 底 |
| `--ink-900` | `#1A1A1A` | 主文本、标题 |
| `--ink-700` | `#3A3A3A` | 副文本 |
| `--ink-500` | `#6B6B6B` | 时间戳、metadata |
| `--kraft-brown` | `#C4A77D` | 描边、次级分隔 |
| `--kraft-dark` | `#8B6F47` | 章节标题、次级按钮 |
| `--vermilion` | `#B83A3A` | 印章红：重大事件标签、当前对话人色标、CTA |
| `--vermilion-soft` | `#D96666` | 悬停态 |
| `--jade` | `#2E5E4E` | 良性关系变化 |
| `--umber` | `#5C3B2E` | 恶性关系变化 |

对比度：所有正文 `--ink-900` on `--paper-bg` = 15:1（AAA）。

## 3. 字体

```css
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700&family=Noto+Sans+SC:wght@300;400;500&family=Ma+Shan+Zheng&family=ZCOOL+XiaoWei&display=swap');

--font-title:  'Ma Shan Zheng', 'ZCOOL XiaoWei', 'Noto Serif SC', serif;   /* 章回大标题、村名 */
--font-body:   'Noto Serif SC', Georgia, serif;                            /* 事件正文 */
--font-caption:'Noto Sans SC', system-ui, sans-serif;                      /* metadata / 按钮 */
```

- 大标题（村名/章节）：`Ma Shan Zheng` 45–72px，字距 0.05em。
- 事件叙述：`Noto Serif SC` 16–17px，行高 1.9，段间距 1em。
- 对话正文：`Noto Serif SC` 16px，说话人名前置以「」引号。
- Metadata：`Noto Sans SC` 12–13px，`--ink-500`。

## 4. 版式（Layout）

顶部 · **世界状态条** (World Status Bar) · 高 56px，粘顶

```
[风莫村 · 建元三年 · 春末]      [第 47 时辰 · 开局 12h]      [时序: ▶  ▮▮  ⏭]
```

中间双栏（≥lg 断点）：

```
┌──────────── 主栏 · 事件卷轴 ────────────┬──── 右栏 · 人物簿 ────┐
│ max-w-[720px]                           │ w-[320px]            │
│ 竖向滚动，无限往下续                       │ 粘顶，可切换角色       │
│  · 章节页眉（第 X 幕）                      │  · 头像/名字/性别      │
│  · 旁白块                                  │  · 性格/怪癖/爱好      │
│  · 对话块                                  │  · 关系网 (mini list)  │
│  · 事件牌签（重大事件 sealed card）           │  · 秘密（模糊化）      │
│  · 关系变化提示                             │                       │
└──────────────────────────────────────────┴───────────────────────┘
```

- 移动端（<lg）：右栏折叠为顶部抽屉，主栏全宽。
- 主容器最大宽度：`max-w-[1200px]`，居中。
- 全站 padding：桌面 `px-8 py-6`，移动 `px-4 py-4`。

## 5. 组件规范

### 5.1 事件流通用块

```ts
type StoryEvent = {
  id: string;
  ts: number;              // 世界时辰
  type: 'narration' | 'dialogue' | 'encounter' | 'system' | 'relationship' | 'chapter';
  actors: string[];
  text: string;
  mood?: 'calm' | 'tense' | 'joyful' | 'grim' | 'mystery';
  importance?: 1 | 2 | 3;  // 3 = 大事件牌签
};
```

| type | 视觉 |
|------|------|
| `chapter` | 居中大字 `Ma Shan Zheng`，左右两条 `--kraft-brown` 分割线 |
| `narration` | 段首缩进两字，`--ink-700`，无边框 |
| `dialogue` | 说话人名 `--vermilion` 加粗，正文缩进 |
| `encounter` | 卡片：`--paper-warm` 底、`1px solid --kraft-brown` |
| `relationship` | 单行图标 + 短句，`--jade` / `--umber` 左边线 |
| `system` | 左侧朱砂条 4px + 小字，`--ink-500` |
| `importance=3` | 顶部一个「牌签」（下 5.2） |

### 5.2 牌签（Sealed Card）

用于开局大事件：老皇驾崩 / 新皇登基 / 江湖动荡等。

- 底色 `--paper-warm`；描边 `2px solid --kraft-dark`。
- 顶部条：小字 `--kraft-dark` 显示章节序号 + 事件名，附一个 12x12 `--vermilion` 方形印章图形（SVG）。
- 正文：`Noto Serif SC` 17px，`--ink-900`，行高 1.9。
- 底部右对齐：世界时辰。
- 入场：`opacity 0 → 1 + translateY(8px)`，200ms `ease-out`。

### 5.3 人物簿（右栏）

- 头像：SVG/线稿，圆形描边 `1px --kraft-brown`。
- 人设条目：纵向 label-value 表，label 用 `--kraft-dark` 小字。
- 关系网：mini list，每项 `姓名 · 好感度 · 一句速写`。
- "秘密"字段：`filter: blur(3px)` + hover 展开。

### 5.4 角色创建（首启动）

- 入口：世界为空 或 用户点「新建角色」。
- 竖向滚动的一张宣纸，字段依次：
  1. 名字（可点「随机取名」）
  2. 性别（男/女/不明）
  3. 性格（多选 3–5 tag）
  4. 怪癖（单行 + 「随机」）
  5. 爱好（多选 tag）
  6. 渴望（单行 + 「随机」）
  7. 秘密（多行 + 「随机」）
- 支持 3–6 个角色，进度条为顶部一排小方块。
- 底部 CTA：`保存并入村`（vermilion 底）、`保留空缺`（outline）。

### 5.5 顶部世界状态条

- 高 56px，`--paper-bg` 底色，底部 `1px solid --kraft-brown`。
- 左：村名 + 纪年 + 节气（`Ma Shan Zheng` 大字）。
- 中：世界时辰 + 开局距今。
- 右：三个按钮 `暂停 / 播放 / 快进`，24×24 SVG 图标（Lucide 风格，无 emoji）。

### 5.6 交互 & 动效

- 所有可点击：`cursor-pointer`。
- Hover：仅换底色/字色；**禁止 scale / translate 抖动**。
- 新事件到达：`translateY(6→0) + opacity 0→1` 200ms。
- `prefers-reduced-motion`：所有过渡禁用。

### 5.7 图标

- 只用 SVG（Lucide 优先）。
- 印章：SVG 放 `assets/seals/*.svg`。
- **严禁 emoji 作 UI 图标**。

## 6. 反模式

- ❌ 保留 Pixi Stage / 任何游戏地图渲染
- ❌ `Upheaval Pro` / 像素游戏字体
- ❌ 大面积渐变
- ❌ 拟物化投影
- ❌ 亮色霓虹 / 玻璃拟态 / 3D
- ❌ 全屏 modal 遮罩（改用抽屉）
- ❌ emoji 图标

## 7. 交付前 Checklist

- [ ] `Pixi.js` 从 UI 层移除
- [ ] `index.css` 只保留 paper/ink 变量 + `@font-face`
- [ ] 全站文字对比度 ≥ AA
- [ ] `prefers-reduced-motion` 下动效禁用
- [ ] 断点 375 / 768 / 1024 / 1440 通过
- [ ] 无 emoji 图标
- [ ] 事件流可无限往下滚动 & 关键事件用牌签
