<script lang="ts">
  import { Handle, Position } from "@xyflow/svelte";
  import Trash from "@tabler/icons-svelte-runes/icons/trash";
  import Code from "@tabler/icons-svelte-runes/icons/code";
  import type { NodeProps } from "@xyflow/svelte";
  import type { JasonNode } from "~/stores/graph.svelte";
  import JsonViewer from "./json-viewer.svelte";
  import { editorStore } from "~/stores/editor.svelte";
  import { graphStore } from "~/stores/graph.svelte";

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
  class="flex flex-col w-60 border border-white/[0.08] rounded-md overflow-hidden bg-[#0d0e10] group transition-all duration-200 outline-none hover:border-neutral-500"
>
  <Handle type="target" position={Position.Left} />
  <Handle type="source" position={Position.Right} />

  <div
    class="px-4 py-2 flex items-center justify-between border-b border-white/[0.08] transition-colors duration-200"
  >
    <span class="font-semibold">{data.label}</span>
    <div
      class="text-neutral-400 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
    >
      <button
        onclick={() => editorStore.openEditor(id, data.label, data.json)}
        class="w-6 h-6 place-items-center grid text-center rounded-sm hover:text-neutral-200 transition-colors cursor-pointer"
        aria-label="Edit JSON"
      >
        <Code class="size-4" />
      </button>
      <button
        onclick={() => graphStore.deleteNode(id)}
        class="w-6 h-6 place-items-center grid bg-red-800/30 rounded-sm hover:text-red-700 transition-colors cursor-pointer"
        aria-label="Delete Node"
      >
        <Trash class="size-4" />
      </button>
    </div>
  </div>

  <JsonViewer code={data.json} />
</div>
