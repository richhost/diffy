<script lang="ts">
  import { untrack } from "svelte";
  import { EditorView, basicSetup } from "codemirror";
  import { EditorState, Compartment, EditorSelection, Prec } from "@codemirror/state";
  import { keymap, placeholder } from "@codemirror/view";
  import { indentWithTab } from "@codemirror/commands";
  import { json } from "@codemirror/lang-json";
  import { HighlightStyle, syntaxHighlighting, syntaxTree } from "@codemirror/language";
  import { linter, type Diagnostic } from "@codemirror/lint";
  import { tags as t } from "@lezer/highlight";
  import { themeStore } from "~/stores/theme.svelte";
  import { parseLooseJSON } from "~/utils/json";

  const geistLightHighlightStyle = HighlightStyle.define([
    { tag: t.propertyName, color: "#d5512f" },
    { tag: t.string, color: "#199f43" },
    { tag: t.number, color: "#1ca1c7" },
    { tag: t.bool, color: "#1ca1c7" },
    { tag: t.null, color: "#1ca1c7" },
    { tag: t.separator, color: "#71717a" },
    { tag: t.brace, color: "#71717a" },
    { tag: t.bracket, color: "#71717a" },
    { tag: t.punctuation, color: "#71717a" },
  ]);

  const geistDarkHighlightStyle = HighlightStyle.define([
    { tag: t.propertyName, color: "#ff855e" },
    { tag: t.string, color: "#5ecc71" },
    { tag: t.number, color: "#68cdf2" },
    { tag: t.bool, color: "#68cdf2" },
    { tag: t.null, color: "#68cdf2" },
    { tag: t.separator, color: "#71717a" },
    { tag: t.brace, color: "#71717a" },
    { tag: t.bracket, color: "#71717a" },
    { tag: t.punctuation, color: "#71717a" },
  ]);

  import {
    search,
    openSearchPanel,
    getSearchQuery,
    setSearchQuery,
    findNext,
    findPrevious,
    replaceNext,
    replaceAll,
    selectMatches,
    closeSearchPanel,
    SearchQuery,
  } from "@codemirror/search";

  function createCustomSearchPanel(view: EditorView) {
    const query = getSearchQuery(view.state);

    const dom = document.createElement("div");
    dom.className = "cm-search";

    // Row 1: Find Row
    const row1 = document.createElement("div");
    row1.className = "cm-search-row";

    const searchInput = document.createElement("input");
    searchInput.className = "cm-textfield cm-search-field";
    searchInput.placeholder = "Find...";
    searchInput.value = query.search;
    searchInput.name = "search";

    function makeBtn(html: string, onclick: () => void, title?: string, className = "cm-button cm-icon-btn") {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = className;
      btn.innerHTML = html;
      if (title) btn.title = title;
      btn.onclick = (e) => {
        e.preventDefault();
        onclick();
      };
      return btn;
    }

    const prevBtn = makeBtn(
      `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>`,
      () => findPrevious(view),
      "Previous match (Shift+Enter)"
    );
    const nextBtn = makeBtn(
      `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`,
      () => findNext(view),
      "Next match (Enter)"
    );
    const allBtn = makeBtn("All", () => selectMatches(view), "Select all matches", "cm-button");

    function makeToggleBtn(text: string, checked: boolean, title: string, onchange: (val: boolean) => void) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cm-search-toggle-btn" + (checked ? " active" : "");
      btn.textContent = text;
      btn.title = title;
      let isChecked = checked;
      btn.onclick = (e) => {
        e.preventDefault();
        isChecked = !isChecked;
        btn.classList.toggle("active", isChecked);
        onchange(isChecked);
      };
      return {
        btn,
        setChecked(val: boolean) {
          isChecked = val;
          btn.classList.toggle("active", val);
        },
        get checked() {
          return isChecked;
        },
      };
    }

    const caseToggle = makeToggleBtn("Aa", query.caseSensitive, "Match Case", () => commit());
    const regexToggle = makeToggleBtn(".*", query.regexp, "Use Regular Expression", () => commit());
    const wordToggle = makeToggleBtn("\\b", query.wholeWord, "Match Whole Word", () => commit());

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "cm-search-close-btn";
    closeBtn.innerHTML = "×";
    closeBtn.title = "Close (Escape)";
    closeBtn.onclick = (e) => {
      e.preventDefault();
      closeSearchPanel(view);
      view.focus();
    };

    row1.appendChild(searchInput);
    row1.appendChild(prevBtn);
    row1.appendChild(nextBtn);
    row1.appendChild(allBtn);
    row1.appendChild(caseToggle.btn);
    row1.appendChild(regexToggle.btn);
    row1.appendChild(wordToggle.btn);
    row1.appendChild(closeBtn);

    // Row 2: Replace Row
    const row2 = document.createElement("div");
    row2.className = "cm-search-row";

    const replaceInput = document.createElement("input");
    replaceInput.className = "cm-textfield cm-search-field";
    replaceInput.placeholder = "Replace with...";
    replaceInput.value = query.replace;
    replaceInput.name = "replace";

    const replaceBtn = makeBtn("Replace", () => replaceNext(view), "Replace current match", "cm-button");
    const replaceAllBtn = makeBtn("Replace All", () => replaceAll(view), "Replace all matches", "cm-button");

    row2.appendChild(replaceInput);
    row2.appendChild(replaceBtn);
    row2.appendChild(replaceAllBtn);

    dom.appendChild(row1);
    dom.appendChild(row2);

    function commit(scroll = false) {
      const nextQuery = new SearchQuery({
        search: searchInput.value,
        replace: replaceInput.value,
        caseSensitive: caseToggle.checked,
        regexp: regexToggle.checked,
        wholeWord: wordToggle.checked,
      });

      if (!nextQuery.valid || !searchInput.value) {
        view.dispatch({ effects: setSearchQuery.of(nextQuery) });
        return;
      }

      if (scroll) {
        try {
          const cursor = nextQuery.getCursor(view.state, view.state.selection.main.from);
          const match = cursor.next().value;
          if (match) {
            const selection = EditorSelection.single(match.from, match.to);
            view.dispatch({
              selection,
              effects: [
                setSearchQuery.of(nextQuery),
                EditorView.scrollIntoView(selection.main, { y: "center" }),
              ],
              userEvent: "select.search",
            });
            return;
          }
        } catch (err) {
          console.error("Search error:", err);
        }
      }
      view.dispatch({ effects: setSearchQuery.of(nextQuery) });
    }

    searchInput.oninput = () => commit(true);
    replaceInput.oninput = () => commit(false);

    dom.onkeydown = (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        const key = e.key.toLowerCase();
        if (key === "f") {
          e.preventDefault();
          e.stopPropagation();
          searchInput.focus();
          searchInput.select();
          return;
        }
        if (key === "g") {
          e.preventDefault();
          e.stopPropagation();
          if (e.shiftKey) findPrevious(view);
          else findNext(view);
          return;
        }
      }

      if (e.key === "Enter") {
        e.preventDefault();
        if (e.target === searchInput) {
          if (e.shiftKey) findPrevious(view);
          else findNext(view);
        } else if (e.target === replaceInput) {
          replaceNext(view);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        closeSearchPanel(view);
        view.focus();
      }
    };

    return {
      dom,
      top: false,
      mount() {
        searchInput.select();
      },
      update(update: any) {
        for (const tr of update.transactions) {
          for (const effect of tr.effects) {
            if (effect.is(setSearchQuery)) {
              const q = effect.value;
              if (searchInput.value !== q.search) searchInput.value = q.search;
              if (replaceInput.value !== q.replace) replaceInput.value = q.replace;
              if (caseToggle.checked !== q.caseSensitive)
                caseToggle.setChecked(q.caseSensitive);
              if (regexToggle.checked !== q.regexp)
                regexToggle.setChecked(q.regexp);
              if (wordToggle.checked !== q.wholeWord)
                wordToggle.setChecked(q.wholeWord);
            }
          }
        }
      },
    };
  }

  const themeCompartment = new Compartment();

  function getThemeExtensions(isDark: boolean) {
    if (isDark) {
      return [
        syntaxHighlighting(geistDarkHighlightStyle),
        EditorView.theme({
          "&": {
            flex: "1",
            minHeight: "0",
            display: "flex",
            flexDirection: "column",
            background: "transparent !important",
            fontSize: "13px !important",
            fontFamily: '"Google Sans Code Variable", var(--font-mono), monospace !important',
            color: "var(--ink) !important",
          },
          ".cm-content": {
            fontFamily: '"Google Sans Code Variable", var(--font-mono), monospace !important',
            padding: "10px 0 !important",
          },
          ".cm-line": {
            fontFamily: '"Google Sans Code Variable", var(--font-mono), monospace !important',
          },
          ".cm-scroller": { overflow: "auto", flex: "1", minHeight: "0" },
          ".cm-gutters": {
            background: "transparent !important",
            borderRight: "none !important",
            color: "var(--ink-quaternary) !important",
            fontFamily: '"Google Sans Code Variable", var(--font-mono), monospace !important',
            paddingLeft: "8px",
            paddingRight: "8px",
            position: "sticky !important",
            left: "0 !important",
            zIndex: "10 !important",
          },
          ".cm-panels": {
            position: "static !important",
            flexShrink: "0 !important",
          },
          ".cm-panels-bottom": {
            position: "static !important",
            bottom: "auto !important",
            borderTop: "1px solid var(--line) !important",
          },
          ".cm-activeLineGutter": { background: "transparent !important" },
          ".cm-activeLine": { background: "rgba(255, 255, 255, 0.035) !important" },
          ".cm-cursor": { borderLeftColor: "var(--ink) !important" },
          ".cm-selectionBackground": {
            background: "var(--hover) !important",
          },
          "&.cm-focused .cm-selectionBackground": {
            background: "var(--active) !important",
          },
        }),
      ];
    }

    return [
      syntaxHighlighting(geistLightHighlightStyle),
      EditorView.theme({
        "&": {
          flex: "1",
          minHeight: "0",
          display: "flex",
          flexDirection: "column",
          background: "transparent !important",
          fontSize: "13px !important",
          fontFamily: '"Google Sans Code Variable", var(--font-mono), monospace !important',
          color: "var(--ink) !important",
        },
        ".cm-content": {
          fontFamily: '"Google Sans Code Variable", var(--font-mono), monospace !important',
          padding: "10px 0 !important",
        },
        ".cm-line": {
          fontFamily: '"Google Sans Code Variable", var(--font-mono), monospace !important',
        },
        ".cm-scroller": { overflow: "auto", flex: "1", minHeight: "0" },
        ".cm-gutters": {
          background: "transparent !important",
          borderRight: "none !important",
          color: "var(--ink-quaternary) !important",
          fontFamily: '"Google Sans Code Variable", var(--font-mono), monospace !important',
          paddingLeft: "8px",
          paddingRight: "8px",
          position: "sticky !important",
          left: "0 !important",
          zIndex: "10 !important",
        },
        ".cm-panels": {
          position: "static !important",
          flexShrink: "0 !important",
        },
        ".cm-panels-bottom": {
          position: "static !important",
          bottom: "auto !important",
          borderTop: "1px solid var(--line) !important",
        },
        ".cm-activeLineGutter": { background: "transparent !important" },
        ".cm-activeLine": { background: "rgba(9, 9, 11, 0.028) !important" },
        ".cm-cursor": { borderLeftColor: "var(--ink) !important" },
        ".cm-selectionBackground": {
          background: "var(--hover) !important",
        },
        "&.cm-focused .cm-selectionBackground": {
          background: "var(--active) !important",
        },
      }),
    ];
  }

  type Props = {
    value?: string;
    wordWrap?: boolean;
    placeholderText?: string;
    onChange?: (value: string) => void;
    onSave?: () => void;
    onFormat?: () => void;
  };

  let {
    value = $bindable(),
    wordWrap = true,
    placeholderText = "",
    onChange,
    onSave,
    onFormat,
  }: Props = $props();

  let container: HTMLDivElement;
  let view = $state.raw<EditorView | undefined>(undefined);

  const wrapCompartment = new Compartment();
  const placeholderCompartment = new Compartment();

  function findFirstSyntaxError(state: EditorState): number | null {
    const cursor = syntaxTree(state).cursor();
    do {
      if (cursor.type.isError) {
        return cursor.from;
      }
    } while (cursor.next());
    return null;
  }

  const jsonLinter = linter(
    (editorView): Diagnostic[] => {
      const raw = editorView.state.doc.toString();
      if (!raw.trim()) return [];

      try {
        JSON.parse(raw);
        return [];
      } catch (e) {
        if (!(e instanceof SyntaxError)) return [];

        let pos: number | null = null;
        const posMatch = e.message.match(/at position (\d+)/);
        const lineColMatch = e.message.match(/at line (\d+) column (\d+)/);

        if (posMatch) {
          pos = Number(posMatch[1]);
        } else if (lineColMatch) {
          const lineNum = Math.max(1, Math.min(Number(lineColMatch[1]), editorView.state.doc.lines));
          pos = editorView.state.doc.line(lineNum).from + Number(lineColMatch[2]) - 1;
        } else {
          pos = findFirstSyntaxError(editorView.state);
        }

        const from = Math.max(0, Math.min(pos ?? 0, editorView.state.doc.length));
        const to = Math.min(from + 1, editorView.state.doc.length);
        return [
          {
            from,
            to,
            severity: "error",
            message: e.message,
          },
        ];
      }
    },
    { delay: 220 },
  );

  export function focus() {
    view?.focus();
  }

  export function openSearch() {
    if (!view) return;
    openSearchPanel(view);
    const input = view.dom.querySelector<HTMLInputElement>(".cm-search-field");
    if (input) {
      input.focus();
      input.select();
    }
  }

  export function jumpToPosition(pos?: number | null) {
    if (!view) return;
    const target = typeof pos === "number" ? pos : findFirstSyntaxError(view.state);
    const clamped = Math.max(0, Math.min(target ?? 0, view.state.doc.length));
    view.dispatch({
      selection: EditorSelection.single(clamped),
      effects: EditorView.scrollIntoView(clamped, { y: "center" }),
    });
    view.focus();
  }

  $effect(() => {
    if (!container) return;

    const initialView = new EditorView({
      parent: container,
      doc: untrack(() => value ?? ""),
      extensions: [
        Prec.high(
          keymap.of([
            {
              key: "Mod-s",
              run: () => {
                onSave?.();
                return true;
              },
            },
            {
              key: "Mod-Enter",
              run: () => {
                onSave?.();
                return true;
              },
            },
            {
              key: "Shift-Alt-f",
              run: () => {
                onFormat?.();
                return true;
              },
            },
            {
              key: "Mod-Shift-f",
              run: () => {
                onFormat?.();
                return true;
              },
            },
          ]),
        ),
        keymap.of([indentWithTab]),
        basicSetup,
        search({
          createPanel: (v) => createCustomSearchPanel(v),
          top: false,
          scrollToMatch: (range) => EditorView.scrollIntoView(range, { y: "center" }),
        }),
        EditorView.cursorScrollMargin.of({ x: 0, y: 40 }),
        json(),
        jsonLinter,
        themeCompartment.of(getThemeExtensions(untrack(() => themeStore.isDark))),
        wrapCompartment.of(untrack(() => (wordWrap ? EditorView.lineWrapping : []))),
        placeholderCompartment.of(untrack(() => (placeholderText ? placeholder(placeholderText) : []))),
        EditorState.tabSize.of(2),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const next = update.state.doc.toString();
            untrack(() => {
              value = next;
              onChange?.(next);
            });
          }
        }),
        EditorView.domEventHandlers({
          paste(event, editorView) {
            const clipboardData = event.clipboardData;
            if (!clipboardData) return false;

            const pastedText = clipboardData.getData("text/plain");
            if (!pastedText) return false;

            try {
              const parsed = parseLooseJSON(pastedText);
              if (typeof parsed === "object" && parsed !== null) {
                let formatted = JSON.stringify(parsed, null, 2);
                const { from, to } = editorView.state.selection.main;
                const line = editorView.state.doc.lineAt(from);

                if (from > line.from) {
                  const baseIndent = line.text.match(/^\s*/)?.[0] ?? "";
                  if (baseIndent) {
                    const lines = formatted.split("\n");
                    formatted = [lines[0], ...lines.slice(1).map((l) => baseIndent + l)].join("\n");
                  }
                }

                editorView.dispatch({
                  changes: { from, to, insert: formatted },
                  selection: { anchor: from + formatted.length },
                  scrollIntoView: true,
                });

                return true;
              }
            } catch {}

            return false;
          },
        }),
      ],
    });

    view = initialView;

    return () => {
      initialView.destroy();
      view = undefined;
    };
  });

  $effect(() => {
    const isDark = themeStore.isDark;
    if (view) {
      view.dispatch({
        effects: themeCompartment.reconfigure(getThemeExtensions(isDark)),
      });
    }
  });

  $effect(() => {
    const wrap = wordWrap;
    if (view) {
      view.dispatch({
        effects: wrapCompartment.reconfigure(wrap ? EditorView.lineWrapping : []),
      });
    }
  });

  $effect(() => {
    const text = placeholderText;
    if (view) {
      view.dispatch({
        effects: placeholderCompartment.reconfigure(text ? placeholder(text) : []),
      });
    }
  });

  $effect(() => {
    if (view && value !== undefined && value !== view.state.doc.toString()) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
      });
    }
  });
</script>

<div bind:this={container} class="flex-1 min-h-0 flex flex-col"></div>

<style>
  :global(.cm-editor) {
    position: relative !important;
    flex: 1 !important;
    min-height: 0 !important;
    display: flex !important;
    flex-direction: column !important;
  }
  :global(.cm-panels) {
    position: static !important;
    flex-shrink: 0 !important;
    z-index: 10 !important;
    width: 100% !important;
    background: var(--surface) !important;
  }
  :global(.cm-panels-bottom) {
    position: static !important;
    bottom: auto !important;
    border-top: 1px solid var(--border-color) !important;
  }
  :global(.cm-scroller) {
    overflow: auto !important;
    flex: 1 !important;
    min-height: 0 !important;
  }
</style>
