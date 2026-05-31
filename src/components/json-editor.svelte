<script lang="ts">
  import { untrack } from "svelte";
  import { EditorView, basicSetup } from "codemirror";
  import { EditorState } from "@codemirror/state";
  import { json } from "@codemirror/lang-json";
  import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
  import { tags as t } from "@lezer/highlight";

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
        json(),
        syntaxHighlighting(pierreLightHighlightStyle),
        EditorState.tabSize.of(2),
        EditorView.theme({
          "&": {
            flex: "1",
            minHeight: "0",
            display: "flex",
            flexDirection: "column",
            background: "transparent !important",
            fontSize: "13px !important",
            fontFamily:
              "'JetBrains Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace",
          },
          ".cm-scroller": { overflow: "auto", flex: "1", minHeight: "0" },
          ".cm-gutters": {
            background: "transparent !important",
            borderRight: "1px solid rgba(0,0,0,0.08) !important",
            color: "#aeaeb2 !important",
            paddingRight: "8px",
          },
          ".cm-activeLineGutter": { background: "transparent !important" },
          ".cm-activeLine": { background: "rgba(0,0,0,0.025) !important" },
          ".cm-cursor": { borderLeftColor: "#0071e3 !important" },
          ".cm-selectionBackground": {
            background: "rgba(0,113,227,0.12) !important",
          },
        }),
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
