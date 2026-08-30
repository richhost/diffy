<script lang="ts">
  import { untrack } from "svelte";
  import { EditorView, basicSetup } from "codemirror";
  import { EditorState, Compartment } from "@codemirror/state";
  import { json } from "@codemirror/lang-json";
  import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
  import { tags as t } from "@lezer/highlight";
  import { oneDark } from "@codemirror/theme-one-dark";
  import { themeStore } from "~/stores/theme.svelte";

  const pierreLightHighlightStyle = HighlightStyle.define([
    { tag: t.propertyName, color: "#d73a49" },
    { tag: t.string, color: "#22863a" },
    { tag: t.number, color: "#005cc5" },
    { tag: t.bool, color: "#005cc5" },
    { tag: t.null, color: "#005cc5" },
    { tag: t.separator, color: "#1d1d1f" },
    { tag: t.brace, color: "#1d1d1f" },
    { tag: t.bracket, color: "#1d1d1f" },
  ]);

  import {
    search,
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

    function commit() {
      const nextQuery = new SearchQuery({
        search: searchInput.value,
        replace: replaceInput.value,
        caseSensitive: caseToggle.checked,
        regexp: regexToggle.checked,
        wholeWord: wordToggle.checked,
      });
      view.dispatch({ effects: setSearchQuery.of(nextQuery) });
    }

    searchInput.oninput = commit;
    replaceInput.oninput = commit;

    dom.onkeydown = (e) => {
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
        oneDark,
        EditorView.theme({
          "&": {
            flex: "1",
            minHeight: "0",
            display: "flex",
            flexDirection: "column",
            background: "transparent !important",
            fontSize: "13px !important",
            fontFamily: '"Google Sans Code Variable", var(--font-mono), monospace !important',
          },
          ".cm-content": {
            fontFamily: '"Google Sans Code Variable", var(--font-mono), monospace !important',
          },
          ".cm-line": {
            fontFamily: '"Google Sans Code Variable", var(--font-mono), monospace !important',
          },
          ".cm-scroller": { overflow: "auto", flex: "1", minHeight: "0" },
          ".cm-gutters": {
            background: "var(--color-neutral-bg) !important",
            borderRight: "1px solid var(--color-border) !important",
            color: "var(--color-text-quaternary) !important",
            fontFamily: '"Google Sans Code Variable", var(--font-mono), monospace !important',
            paddingRight: "8px",
            position: "sticky !important",
            left: "0 !important",
            zIndex: "10 !important",
          },
          ".cm-activeLineGutter": { background: "transparent !important" },
          ".cm-activeLine": { background: "rgba(255, 255, 255, 0.035) !important" },
          ".cm-cursor": { borderLeftColor: "var(--color-primary) !important" },
          ".cm-selectionBackground": {
            background: "var(--color-primary-light) !important",
          },
        }),
      ];
    }

    return [
      syntaxHighlighting(pierreLightHighlightStyle),
      EditorView.theme({
        "&": {
          flex: "1",
          minHeight: "0",
          display: "flex",
          flexDirection: "column",
          background: "transparent !important",
          fontSize: "13px !important",
          fontFamily: '"Google Sans Code Variable", var(--font-mono), monospace !important',
        },
        ".cm-content": {
          fontFamily: '"Google Sans Code Variable", var(--font-mono), monospace !important',
        },
        ".cm-line": {
          fontFamily: '"Google Sans Code Variable", var(--font-mono), monospace !important',
        },
        ".cm-scroller": { overflow: "auto", flex: "1", minHeight: "0" },
        ".cm-gutters": {
          background: "var(--color-neutral-bg) !important",
          borderRight: "1px solid var(--color-border) !important",
          color: "var(--color-text-quaternary) !important",
          fontFamily: '"Google Sans Code Variable", var(--font-mono), monospace !important',
          paddingRight: "8px",
          position: "sticky !important",
          left: "0 !important",
          zIndex: "10 !important",
        },
        ".cm-activeLineGutter": { background: "transparent !important" },
        ".cm-activeLine": { background: "rgba(0,0,0,0.025) !important" },
        ".cm-cursor": { borderLeftColor: "var(--color-primary) !important" },
        ".cm-selectionBackground": {
          background: "var(--color-primary-light) !important",
        },
      }),
    ];
  }

  type Props = { value?: string; onChange?: (value: string) => void };

  let { value = $bindable(), onChange }: Props = $props();

  let container: HTMLDivElement;
  let view = $state.raw<EditorView | undefined>(undefined);

  $effect(() => {
    if (!container) return;

    view = new EditorView({
      parent: container,
      doc: untrack(() => value),
      extensions: [
        basicSetup,
        search({ createPanel: (view) => createCustomSearchPanel(view), top: true }),
        json(),
        themeCompartment.of(getThemeExtensions(untrack(() => themeStore.isDark))),
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
          paste(event, view) {
            const clipboardData = event.clipboardData;
            if (!clipboardData) return false;

            const pastedText = clipboardData.getData("text/plain");
            if (!pastedText) return false;

            try {
              const trimmed = pastedText.trim();
              let parsed: any = null;

              if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
                const unescaped = JSON.parse(trimmed);
                if (typeof unescaped === "string") {
                  parsed = JSON.parse(unescaped);
                } else {
                  parsed = unescaped;
                }
              } else {
                try {
                  parsed = JSON.parse(trimmed);
                } catch (innerErr) {
                  const replaced = trimmed.replace(/\\"/g, '"');
                  parsed = JSON.parse(replaced);
                }
              }

              if (typeof parsed === "string") {
                parsed = JSON.parse(parsed);
              }

              if (typeof parsed === "object" && parsed !== null) {
                const formatted = JSON.stringify(parsed, null, 2);

                const { from, to } = view.state.selection.main;
                view.dispatch({
                  changes: { from, to, insert: formatted },
                  selection: { anchor: from + formatted.length },
                  scrollIntoView: true,
                });

                return true;
              }
            } catch (e) {}

            return false;
          },
        }),
      ],
    });

    return () => {
      view?.destroy();
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
    if (view && value !== view.state.doc.toString()) {
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
  :global(.cm-scroller) {
    overflow: auto !important;
    flex: 1 !important;
    min-height: 0 !important;
  }
</style>
