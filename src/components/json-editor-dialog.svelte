<script lang="ts">
  import { Dialog } from "@ark-ui/svelte/dialog";
  import { Portal } from "@ark-ui/svelte/portal";
  import { editorStore } from "~/stores/editor.svelte";
  import { graphStore } from "~/stores/graph.svelte";
  import JsonEditor from "./json-editor.svelte";
  import X from "@tabler/icons-svelte-runes/icons/x";
  import Check from "@tabler/icons-svelte-runes/icons/check";
  import { sortJSONKeys } from "~/utils/json";

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

  function deepParseJSON(val: any): any {
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (
        (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
        (trimmed.startsWith("[") && trimmed.endsWith("]"))
      ) {
        try {
          const parsed = JSON.parse(trimmed);
          return deepParseJSON(parsed);
        } catch (e) {
          return val;
        }
      }
      
      if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        try {
          const unescaped = JSON.parse(trimmed);
          return deepParseJSON(unescaped);
        } catch (e) {
          return val;
        }
      }
      
      return val;
    }
    
    if (Array.isArray(val)) {
      return val.map(item => deepParseJSON(item));
    }
    
    if (typeof val === "object" && val !== null) {
      const copy: any = {};
      for (const key in val) {
        if (Object.prototype.hasOwnProperty.call(val, key)) {
          copy[key] = deepParseJSON(val[key]);
        }
      }
      return copy;
    }
    
    return val;
  }

  function handleDeepParse() {
    let raw = jsonValue.trim();
    if (!raw) return;

    try {
      let parsed: any;
      
      if (raw.startsWith('"') && raw.endsWith('"')) {
        const unescaped = JSON.parse(raw);
        if (typeof unescaped === "string") {
          parsed = JSON.parse(unescaped);
        } else {
          parsed = unescaped;
        }
      } else {
        try {
          parsed = JSON.parse(raw);
        } catch (innerErr) {
          const replaced = raw.replace(/\\"/g, '"');
          parsed = JSON.parse(replaced);
        }
      }

      if (typeof parsed === "string") {
        parsed = JSON.parse(parsed);
      }

      const deepParsed = deepParseJSON(parsed);

      if (typeof deepParsed === "object" && deepParsed !== null) {
        jsonValue = JSON.stringify(deepParsed, null, 2);
        jsonError = null;
      } else {
        jsonError = "Parsed value is not a valid JSON object or array.";
      }
    } catch (e: any) {
      jsonError = "Failed to parse: " + (e.message || "Invalid JSON");
    }
  }

  function handleSortKeys() {
    let raw = jsonValue.trim();
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      const sorted = sortJSONKeys(parsed);
      jsonValue = JSON.stringify(sorted, null, 2);
      jsonError = null;
    } catch (e: any) {
      jsonError = "Failed to sort: " + (e.message || "Invalid JSON");
    }
  }

  function checkCanDeepParse(val: any): boolean {
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (
        (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
        (trimmed.startsWith("[") && trimmed.endsWith("]"))
      ) {
        try {
          const parsed = JSON.parse(trimmed);
          if (typeof parsed === "object" && parsed !== null) {
            return true;
          }
        } catch (e) {}
      }
      return false;
    }
    
    if (Array.isArray(val)) {
      return val.some(item => checkCanDeepParse(item));
    }
    
    if (typeof val === "object" && val !== null) {
      for (const key in val) {
        if (Object.prototype.hasOwnProperty.call(val, key)) {
          if (checkCanDeepParse(val[key])) {
            return true;
          }
        }
      }
    }
    
    return false;
  }

  const showDeepParseButton = $derived.by(() => {
    const raw = jsonValue.trim();
    if (!raw) return false;
    try {
      let parsed: any;
      if (raw.startsWith('"') && raw.endsWith('"')) {
        const unescaped = JSON.parse(raw);
        parsed = (typeof unescaped === "string") ? JSON.parse(unescaped) : unescaped;
      } else {
        try {
          parsed = JSON.parse(raw);
        } catch (innerErr) {
          const replaced = raw.replace(/\\"/g, '"');
          parsed = JSON.parse(replaced);
        }
      }
      
      if (typeof parsed === "string") {
        parsed = JSON.parse(parsed);
      }
      
      return checkCanDeepParse(parsed);
    } catch (e) {
      return false;
    }
  });
</script>

<Dialog.Root
  open={editorStore.open}
  onOpenChange={(e) => {
    if (!e.open) editorStore.close();
  }}
>
  <Portal>
    <!-- Backdrop -->
    <Dialog.Backdrop
      class="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] animate-in fade-in duration-200"
    />

    <Dialog.Positioner
      class="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <Dialog.Content
        class="w-full max-w-lg bg-surface rounded-lg overflow-hidden flex flex-col max-h-[85vh] text-text-primary animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200"
        style="box-shadow: 0 20px 60px var(--color-shadow), 0 4px 16px rgba(0,0,0,0.06), 0 0 0 0.5px var(--color-border);"
      >
        <!-- Header -->
        <div class="px-6 pt-5 pb-4 flex justify-between items-start">
          <Dialog.Title class="text-[15px] font-semibold text-text-primary tracking-tight">
            Edit Node
          </Dialog.Title>
          <Dialog.CloseTrigger
            onclick={handleCancel}
            class="w-7 h-7 grid place-items-center rounded-full text-text-secondary hover:text-text-primary hover:bg-neutral-bg transition-all cursor-pointer -mr-1 -mt-0.5"
            aria-label="Close"
          >
            <X class="size-4" />
          </Dialog.CloseTrigger>
        </div>

        <!-- Body -->
        <div class="px-6 pb-4 flex-1 overflow-hidden flex flex-col gap-4 min-h-0">
          <!-- Label field -->
          <div class="flex flex-col gap-1.5">
            <label
              for="node-label"
              class="text-[11px] font-semibold text-text-secondary tracking-tight"
            >
              Label
            </label>
            <input
              id="node-label"
              type="text"
              bind:value={labelValue}
              placeholder="Node Label"
              class="w-full bg-neutral-bg rounded-md px-3.5 py-2.5 text-[13px] text-text-primary placeholder-text-quaternary font-medium outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>

          <!-- JSON editor -->
          <div class="flex flex-col gap-1.5 flex-1 min-h-0">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-semibold text-text-secondary tracking-tight select-none">
                JSON Content
              </span>
              <div class="flex items-center gap-2">
                {#if showDeepParseButton}
                  <button
                    onclick={handleDeepParse}
                    class="px-2 py-0.5 rounded text-[11px] font-semibold text-primary hover:bg-primary-light transition-colors duration-150 cursor-pointer tracking-tight animate-in fade-in"
                    title="Deeply parse any nested stringified JSON fields recursively"
                  >
                    Deep Parse
                  </button>
                {/if}
                <button
                  onclick={handleSortKeys}
                  class="px-2 py-0.5 rounded text-[11px] font-semibold text-primary hover:bg-primary-light transition-colors duration-150 cursor-pointer tracking-tight"
                  title="Sort JSON keys alphabetically"
                >
                  Sort Keys
                </button>
              </div>
            </div>
            <div class="flex-1 bg-neutral-bg rounded-md overflow-hidden flex flex-col min-h-60">
              <JsonEditor bind:value={jsonValue} />
            </div>
            {#if jsonError}
              <div class="text-[11px] text-danger font-mono bg-danger-bg rounded-md px-3 py-2 flex-none">
                {jsonError}
              </div>
            {/if}
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 pb-5 flex justify-end gap-2">
          <button
            onclick={handleCancel}
            class="px-4 py-2 rounded-md text-[13px] text-text-secondary hover:text-text-primary hover:bg-neutral-bg font-medium transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onclick={handleSave}
            class="flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-medium text-white transition-all cursor-pointer hover:opacity-90 active:scale-[0.98]"
            style="background: var(--color-primary);"
          >
            <Check class="size-3.5" />
            Save
          </button>
        </div>
      </Dialog.Content>
    </Dialog.Positioner>
  </Portal>
</Dialog.Root>
