<script lang="ts">
  import { Handle, Position, useSvelteFlow } from "@xyflow/svelte";
  import Trash from "@tabler/icons-svelte-runes/icons/trash";
  import Code from "@tabler/icons-svelte-runes/icons/code";
  import type { NodeProps } from "@xyflow/svelte";
  import type { JasonNode } from "~/stores/graph.svelte";
  import JsonViewer from "./json-viewer.svelte";

  let { data, id }: NodeProps<JasonNode> = $props();

  interface Preview {
    error: boolean;
    rootType: "object" | "array" | "primitive" | "error";
    badge: string;
  }

  let preview = $state<Preview>({
    error: false,
    rootType: "object",
    badge: "{ }",
  });

  $inspect(data, id);
</script>

<div
  tabindex="0"
  role="button"
  class="flex flex-col w-60 border border-neutral-700 rounded-md overflow-hidden bg-neutral-900 group transition outline-0 hover:border-neutral-500 hover:shadow shadow-neutral-500/60"
>
  <Handle type="target" position={Position.Left} />
  <Handle type="source" position={Position.Right} />

  <div
    class="px-4 py-2 flex items-center justify-between border-b border-neutral-700"
  >
    <span class="font-semibold">{data.label}</span>
    <div
      class="text-neutral-400 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <button
        class="w-6 h-6 place-items-center grid text-center rounded-sm hover:text-neutral-200 transition-colors"
        ><Code class="size-4" /></button
      >
      <button
        class="w-6 h-6 place-items-center grid bg-red-800/30 rounded-sm hover:text-red-700 transition-colors"
      >
        <Trash class="size-4" />
      </button>
    </div>
  </div>

  <JsonViewer code={data.json} />
</div>
