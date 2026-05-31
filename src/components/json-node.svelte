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

  $inspect(data, id);
</script>

<!--
  根容器不能加 overflow-hidden，否则 Handle 会被裁剪导致无法连线。
  圆角视觉由 node-card 的 border-radius + 子元素各自处理。
-->
<div
  tabindex="0"
  role="button"
  class="node-card flex flex-col w-64 rounded-xl bg-white group outline-none transition-shadow duration-200"
>
  <Handle type="target" position={Position.Left} />
  <Handle type="source" position={Position.Right} />

  <!-- Header（顶部圆角跟随父元素，无需额外设置）-->
  <div class="px-4 py-3 flex items-center justify-between min-h-[44px] rounded-t-xl">
    <span class="text-[13px] font-semibold text-[#1d1d1f] tracking-[-0.01em] select-none">
      {data.label}
    </span>
    <div
      class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none group-hover:pointer-events-auto"
    >
      <button
        onclick={() => editorStore.openEditor(id, data.label, data.json)}
        class="w-6 h-6 grid place-items-center rounded-md text-[#8e8e93] hover:text-[#1d1d1f] hover:bg-black/5 transition-all duration-100 cursor-pointer"
        aria-label="Edit JSON"
      >
        <Code class="size-3.5" />
      </button>
      <button
        onclick={() => graphStore.deleteNode(id)}
        class="w-6 h-6 grid place-items-center rounded-md text-[#8e8e93] hover:text-[#ff3b30] hover:bg-black/5 transition-all duration-100 cursor-pointer"
        aria-label="Delete Node"
      >
        <Trash class="size-3.5" />
      </button>
    </div>
  </div>

  <!-- Hairline divider -->
  <div class="h-px bg-black/5"></div>

  <div class="rounded-b-xl overflow-hidden">
    <JsonViewer code={data.json} />
  </div>
</div>

<style>
  .node-card {
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.07),
      0 1px 2px rgba(0, 0, 0, 0.04),
      0 0 0 0.5px rgba(0, 0, 0, 0.06);
  }

  .node-card:hover {
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.08),
      0 1px 3px rgba(0, 0, 0, 0.05),
      0 0 0 0.5px rgba(0, 0, 0, 0.07);
  }
</style>
