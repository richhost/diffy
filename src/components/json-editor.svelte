<script lang="ts">
  import { untrack } from "svelte";
  import { EditorView, basicSetup } from "codemirror";
  import { EditorState } from "@codemirror/state";
  import { json } from "@codemirror/lang-json";
  import { oneDark } from "@codemirror/theme-one-dark";

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
        oneDark,
        EditorState.tabSize.of(2),
        EditorView.theme({
          "&": {
            flex: "1",
            minHeight: "0",
            display: "flex",
            flexDirection: "column",
            background: "transparent !important",
            fontSize: "14px !important",
          },
          ".cm-scroller": { overflow: "auto", flex: "1", minHeight: "0" },
          ".cm-gutters": {
            background: "transparent !important",
            borderRight: "1px solid rgba(255, 255, 255, 0.08) !important",
            color: "#6b7280 !important",
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

              // Check if it looks like a stringified JSON (wrapped in quotes)
              if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
                const unquoted = JSON.parse(trimmed);
                if (typeof unquoted === "string") {
                  parsed = JSON.parse(unquoted);
                }
              }
              // Otherwise, just see if it's standard JSON that needs formatting
              else if (
                (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
                (trimmed.startsWith("[") && trimmed.endsWith("]"))
              ) {
                parsed = JSON.parse(trimmed);
              }

              // If we successfully parsed into an object/array, format and insert
              if (typeof parsed === "object" && parsed !== null) {
                const formatted = JSON.stringify(parsed, null, 2);

                const { from, to } = view.state.selection.main;
                view.dispatch({
                  changes: { from, to, insert: formatted },
                  selection: { anchor: from + formatted.length },
                  scrollIntoView: true,
                });

                return true; // Prevent default paste
              }
            } catch (e) {
              // Not a valid JSON payload, allow default paste behavior
            }

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
