<script lang="ts">
  import { Handle, Position, useSvelteFlow } from "@xyflow/svelte";
  import type { NodeProps } from "@xyflow/svelte";

  let {}: NodeProps = $props();
</script>

<div tabindex="0" role="button" class="flex flex-col w-60">
  <Handle type="target" position={Position.Left} />
  <Handle type="source" position={Position.Right} />
</div>
