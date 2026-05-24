<script lang="ts">
  import { Dialog } from "@ark-ui/svelte/dialog";
  import { Portal } from "@ark-ui/svelte/portal";
  import { editorStore } from "~/stores/editor.svelte";
  import { graphStore } from "~/stores/graph.svelte";
  import JsonEditor from "./json-editor.svelte";
  import X from "@tabler/icons-svelte-runes/icons/x";
  import Check from "@tabler/icons-svelte-runes/icons/check";

  let labelValue = $state("");
  let jsonValue = $state("");
  let jsonError = $state<string | null>(null);

  $effect(() => {
    if (editorStore.open && editorStore.target) {
      labelValue = editorStore.target.label;
      jsonValue = editorStore.target.json;
      jsonError = null;
    }
  });

  function handleSave() {
    try {
      // Validate that the edited string is valid JSON
      const parsed = JSON.parse(jsonValue);
      const formatted = JSON.stringify(parsed, null, 2);

      if (editorStore.target) {
        graphStore.updateNodeData(editorStore.target.nodeId, {
          label: labelValue.trim() || "Untitled Node",
          json: formatted,
        });
      }
      editorStore.close();
    } catch (e: any) {
      jsonError = e.message || "Invalid JSON";
    }
  }

  function handleCancel() {
    editorStore.close();
  }
</script>

<Dialog.Root
  open={editorStore.open}
  onOpenChange={(e) => {
    if (!e.open) editorStore.close();
  }}
>
  <Portal>
    <Dialog.Backdrop
      class="fixed inset-0 z-40 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
    />
    <Dialog.Positioner
      class="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <Dialog.Content
        class="w-full max-w-xl bg-neutral-900/95 border border-white/[0.08] rounded-xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[85vh] text-neutral-100 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200"
      >
        <!-- Header -->
        <div
          class="px-6 py-4 border-b border-white/[0.06] flex justify-between items-center bg-neutral-900/40"
        >
          <Dialog.Title
            class="text-sm font-semibold text-neutral-200 tracking-tight"
            >Edit Node</Dialog.Title
          >
          <Dialog.CloseTrigger
            onclick={handleCancel}
            class="text-neutral-400 hover:text-neutral-200 transition-all cursor-pointer p-1 rounded-md hover:bg-white/[0.06]"
            aria-label="Close"
          >
            <X class="size-4" />
          </Dialog.CloseTrigger>
        </div>

        <!-- Body -->
        <div
          class="p-6 flex-1 overflow-hidden space-y-5 bg-transparent flex flex-col"
        >
          <!-- Node Label -->
          <div class="space-y-1.5 flex-none">
            <label
              for="node-label"
              class="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block"
            >
              Label
            </label>
            <input
              id="node-label"
              type="text"
              bind:value={labelValue}
              placeholder="Node Label"
              class="w-full bg-neutral-950/40 border border-white/8 rounded-md px-3.5 py-2.5 text-neutral-200 focus:outline-none focus:border-neutral-400 focus:ring-2 focus:ring-white/4 text-sm font-medium transition-all"
            />
          </div>

          <!-- JSON Content -->
          <div class="space-y-1.5 flex flex-col flex-1 min-h-0">
            <span
              class="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block"
            >
              JSON Content
            </span>
            <div
              class="flex-1 border border-white/8 rounded-md overflow-hidden bg-neutral-950/40 flex flex-col min-h-0"
            >
              <JsonEditor bind:value={jsonValue} />
            </div>
            {#if jsonError}
              <div
                class="text-xs text-red-400 font-mono bg-red-950/20 border border-red-900/40 rounded-md px-3 py-2 mt-2 flex-none"
              >
                <strong>JSON Error:</strong>
                {jsonError}
              </div>
            {/if}
          </div>
        </div>

        <!-- Footer -->
        <div
          class="px-6 py-4 border-t border-white/6 bg-neutral-950/40 flex justify-end gap-3"
        >
          <button
            onclick={handleCancel}
            class="px-4.5 py-2.5 border border-white/8 rounded-md hover:bg-white/6 text-neutral-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onclick={handleSave}
            class="group px-4.5 py-2.5 bg-[#0b0c0e]/95 hover:bg-[#121316]/95 border border-transparent rounded-md text-neutral-200 hover:text-white text-xs font-semibold transition-all duration-300 ease-out cursor-pointer shadow-md shadow-cyan-950/10 hover:shadow-lg hover:shadow-cyan-500/10 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5 gradient-border gradient-border-to-r gradient-border-from-neutral-700/40 gradient-border-via-cyan-500/50 gradient-border-to-neutral-700/40 hover:gradient-border-from-neutral-500 hover:gradient-border-via-cyan-400 hover:gradient-border-to-neutral-500 active:gradient-border-from-neutral-800 active:gradient-border-via-cyan-600 active:gradient-border-to-neutral-800"
          >
            <Check
              class="size-3.5 text-neutral-400 group-hover:text-cyan-300 transition-colors duration-300"
            />
            Save Changes
          </button>
        </div>
      </Dialog.Content>
    </Dialog.Positioner>
  </Portal>
</Dialog.Root>
