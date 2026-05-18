<script lang="ts">
  import { untrack } from "svelte";
  import { EditorView, basicSetup } from "codemirror";
  import { json } from "@codemirror/lang-json";

  type Props = { value?: string; onChange?: (value: string) => void };

  let { value, onChange }: Props = $props();

  let container: HTMLDivElement;
  let view: EditorView | undefined = $state();

  $effect(() => {
    if (!container) return;

    view = new EditorView({
      doc: untrack(() => value),
      extensions: [
        basicSetup,
        json(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            untrack(() => onChange?.(update.state.doc.toString()));
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

<div bind:this={container}></div>
