import { browser } from "wxt/browser";
import { storage } from "@wxt-dev/storage";

const dictionaries = {
  en: {
    addNode: "Add Node",
    import: "Import",
    export: "Export",
    help: "Help",
    emptyState: "Click Add Node to get started. Connect two nodes to compare a JSON diff.",
    nodeDeleted: "Node deleted",
    undo: "Undo",
    editNode: "Edit Node",
    label: "Label",
    jsonContent: "JSON Content",
    deepParse: "Deep Parse",
    sortKeys: "Sort Keys",
    cancel: "Cancel",
    save: "Save",
    compare: "Compare",
    sideBySide: "Side by side",
    unified: "Unified",
    invalidJson: "Invalid JSON",
    guideTitle: "Guide",
    skip: "Skip",
    next: "Next",
    getStarted: "Get Started",
    step0Title: "Create & Edit JSON Nodes",
    step0Desc:
      "Click Add Node in the toolbar to create a JSON card. Hover any node and click the code icon to edit its label and JSON values.",
    step1Title: "Connect Nodes",
    step1Desc:
      "Link cards together by dragging a line from the right handle (source) of one card and dropping it onto the left handle (target) of another.",
    step2Title: "Compare JSON Differences",
    step2Desc:
      "Once connected, a Compare button will appear on the connection edge. Click it to open a side-by-side or unified diff comparison.",
    step3Title: "Import & Export Graphs",
    step3Desc:
      "Save your workspace structure and JSON details to a file by clicking Export. You can reload your saved file anytime using Import.",
    jsonNode: "JSON Node",
    before: "Before",
    after: "After",
    theme: "Theme",
    themeSystem: "System",
    themeLight: "Light",
    themeDark: "Dark",
  },
  "zh-CN": {
    addNode: "添加节点",
    import: "导入",
    export: "导出",
    help: "帮助",
    emptyState: "点击 添加节点 开始。连接两个节点以对比 JSON 差异。",
    nodeDeleted: "节点已删除",
    undo: "撤销",
    editNode: "编辑节点",
    label: "标签",
    jsonContent: "JSON 内容",
    deepParse: "深度解析",
    sortKeys: "键排序",
    cancel: "取消",
    save: "保存",
    compare: "对比",
    sideBySide: "双栏对比",
    unified: "单栏对比",
    invalidJson: "无效的 JSON",
    guideTitle: "指南",
    skip: "跳过",
    next: "下一步",
    getStarted: "开始使用",
    step0Title: "创建和编辑 JSON 节点",
    step0Desc:
      "点击工具栏中的“添加节点”来创建一个 JSON 卡片。将鼠标悬停在任何节点上并点击“代码图标”来编辑其标签和 JSON 值。",
    step1Title: "连接节点",
    step1Desc:
      "通过从一张卡片的右侧手柄（源）拖动一条线并将其放置到另一张卡片的左侧手柄（目标）上，将卡片连接在一起。",
    step2Title: "对比 JSON 差异",
    step2Desc: "连接后，连接线上会出现“对比”按钮。点击它以打开双栏对比或单栏对比视图。",
    step3Title: "导入和导出图表",
    step3Desc:
      "点击“导出”将您的工作区结构和 JSON 详情保存到文件中。您可以随时使用“导入”重新加载保存的文件。",
    jsonNode: "JSON 节点",
    before: "之前",
    after: "之后",
    theme: "主题",
    themeSystem: "跟随系统",
    themeLight: "明亮模式",
    themeDark: "暗色模式",
  },
  "zh-TW": {
    addNode: "新增節點",
    import: "匯入",
    export: "匯出",
    help: "說明",
    emptyState: "點擊 新增節點 開始。連接兩個節點以比對 JSON 差異。",
    nodeDeleted: "節點已刪除",
    undo: "復原",
    editNode: "編輯節點",
    label: "標籤",
    jsonContent: "JSON 內容",
    deepParse: "深度解析",
    sortKeys: "鍵排序",
    cancel: "取消",
    save: "儲存",
    compare: "比對",
    sideBySide: "左右比對",
    unified: "合併比對",
    invalidJson: "無效的 JSON",
    guideTitle: "說明指南",
    skip: "跳過",
    next: "下一步",
    getStarted: "開始使用",
    step0Title: "建立與編輯 JSON 節點",
    step0Desc:
      "點擊工具列中的「新增節點」建立 JSON 卡片。將滑鼠懸停在任何節點上，點擊「程式碼圖示」即可編輯其標籤與 JSON 值。",
    step1Title: "連接節點",
    step1Desc:
      "從一張卡片的右側接點（來源）拖曳出一條線，並將其連接到另一張卡片的左側接點（目標），即可將卡片連接在一起。",
    step2Title: "比對 JSON 差異",
    step2Desc: "連接後，連接線上會出現「比對」按鈕。點擊它可開啟左右比對或合併比對視圖。",
    step3Title: "匯入與匯出圖表",
    step3Desc:
      "點擊「匯出」將您的工作區結構和 JSON 詳情儲存到檔案中。您可以隨時使用「匯入」重新載入儲存的檔案。",
    jsonNode: "JSON 節點",
    before: "之前 (Before)",
    after: "之後 (After)",
    theme: "主題",
    themeSystem: "跟隨系統",
    themeLight: "明亮模式",
    themeDark: "暗色模式",
  },
  ja: {
    addNode: "ノードを追加",
    import: "インポート",
    export: "エクスポート",
    help: "ヘルプ",
    emptyState:
      "「ノードを追加」をクリックして開始します。2つのノードを接続してJSONの差分を比較します。",
    nodeDeleted: "ノードが削除されました",
    undo: "元に戻す",
    editNode: "ノードを編集",
    label: "ラベル",
    jsonContent: "JSON内容",
    deepParse: "ディープパース",
    sortKeys: "キーをソート",
    cancel: "キャンセル",
    save: "保存",
    compare: "比較",
    sideBySide: "左右並べて表示",
    unified: "インライン表示",
    invalidJson: "無効なJSON",
    guideTitle: "ガイド",
    skip: "スキップ",
    next: "次へ",
    getStarted: "使ってみる",
    step0Title: "JSONノードの作成と編集",
    step0Desc:
      "ツールバーの「ノードを追加」をクリックしてJSONカードを作成します。ノードをホバーして「コードアイコン」をクリックすると、ラベルとJSON値を編集できます。",
    step1Title: "ノードの接続",
    step1Desc:
      "一方のカードの右側のハンドル（ソース）からもう一方のカードの左側のハンドル（ターゲット）へ線をドラッグ＆ドロップして接続します。",
    step2Title: "JSONの差分比較",
    step2Desc:
      "接続すると、接続線上に「比較」ボタンが表示されます。それをクリックして、左右並べて表示またはインライン差分比較を開きます。",
    step3Title: "グラフのインポートとエクスポート",
    step3Desc:
      "「エクスポート」をクリックして、ワークスペースの構造とJSONの詳細をファイルに保存します。「インポート」を使用して、保存したファイルをいつでも再読み込みできます。",
    jsonNode: "JSONノード",
    before: "Before",
    after: "After",
    theme: "テーマ",
    themeSystem: "システム",
    themeLight: "ライト",
    themeDark: "ダーク",
  },
};

type Locale = keyof typeof dictionaries;

class I18nStore {
  locale = $state<Locale>("en");

  async init() {
    try {
      const saved = await storage.getItem<Locale>("local:diffy:locale:v1");
      if (saved) {
        this.locale = saved;
        return;
      }
    } catch (e) {
      console.error("Failed to load locale:", e);
    }

    const sysLang = browser.i18n.getUILanguage();
    if (sysLang.startsWith("zh-TW") || sysLang.startsWith("zh-HK")) {
      this.locale = "zh-TW";
    } else if (sysLang.startsWith("zh")) {
      this.locale = "zh-CN";
    } else if (sysLang.startsWith("ja")) {
      this.locale = "ja";
    } else {
      this.locale = "en";
    }
  }

  async setLocale(newLocale: Locale) {
    this.locale = newLocale;
    try {
      await storage.setItem("local:diffy:locale:v1", newLocale);
    } catch (e) {
      console.error("Failed to save locale:", e);
    }
  }

  t(key: keyof typeof dictionaries.en): string {
    return dictionaries[this.locale]?.[key] || dictionaries.en[key] || key;
  }
}

export const i18n = new I18nStore();
