<script lang="ts">
  import {
    Dialog,
    DialogBackdrop,
    DialogContent,
    DialogTitle,
    DialogClose,
  } from "@ui-sdk/svelte/dialog";
  import { helpStore } from "~/stores/help.svelte";
  import X from "@tabler/icons-svelte-runes/icons/x";
  import ChevronLeft from "@tabler/icons-svelte-runes/icons/chevron-left";
  import ChevronRight from "@tabler/icons-svelte-runes/icons/chevron-right";
  import { i18n } from "~/stores/i18n.svelte";

  let currentStep = $state(0);
  const totalSteps = 4;

  $effect(() => {
    if (helpStore.open) {
      currentStep = 0;
    }
  });

  function handleNext() {
    if (currentStep < totalSteps - 1) {
      currentStep++;
    } else {
      helpStore.close();
    }
  }

  function handlePrev() {
    if (currentStep > 0) {
      currentStep--;
    }
  }

  function handleSkip() {
    helpStore.close();
  }
</script>

<Dialog
  open={helpStore.open}
  presentation="dialog"
  onOpenChange={(open) => {
    if (!open) helpStore.close();
  }}
>
  <DialogBackdrop class="ui-dialog-backdrop" />

  <DialogContent
    class="ui-dialog-content w-[calc(100vw-2rem)] max-w-[440px] max-h-[85vh] overflow-hidden flex flex-col text-[var(--ink)]"
  >
    <!-- Header -->
    <div class="px-5 pt-4 pb-3 flex justify-between items-center flex-none">
      <DialogTitle class="text-[12px] font-medium text-[var(--ink-tertiary)] tracking-tight">
        {i18n.t("guideTitle")} · {currentStep + 1} / {totalSteps}
      </DialogTitle>

      <DialogClose
        class="w-7 h-7 grid place-items-center rounded-[6px] text-[var(--ink-secondary)] hover:text-[var(--ink)] hover:bg-[var(--hover)] transition-colors cursor-pointer -mr-1 outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-active)]"
        aria-label="Close"
      >
        <X class="size-4" />
      </DialogClose>
    </div>

    <!-- Body / Content -->
    <div class="px-5 pb-5 flex-1 flex flex-col gap-5 items-center text-center">
      <!-- Step Illustration Frame -->
      <div
        class="w-full h-44 rounded-[8px] flex items-center justify-center overflow-hidden border border-[var(--border-color)] relative select-none"
        style="background-color: var(--ground); background-image: radial-gradient(var(--canvas-dot) 1px, transparent 1px); background-size: 16px 16px;"
      >
        {#if currentStep === 0}
          <!-- Step 0 Illustration: Add & Edit Nodes -->
          <div class="flex items-center gap-3 animate-in fade-in duration-200">
            <div
              class="w-30 h-22 bg-[var(--surface)] border border-[var(--border-strong)] shadow-[var(--shadow-card)] rounded-[8px] flex flex-col overflow-hidden relative"
            >
              <div class="px-2.5 py-1.5 border-b border-[var(--line)] flex items-center justify-between">
                <span class="text-[8.5px] font-medium text-[var(--ink)]">
                  {i18n.t("jsonNode")}
                </span>
                <span class="w-1.5 h-1.5 rounded-full bg-[var(--ink)]"></span>
              </div>
              <div
                class="p-2 flex-1 bg-[var(--surface-subtle)] flex flex-col gap-1 font-mono text-[7px] text-[var(--ink-tertiary)] text-left"
              >
                <span class="text-[var(--ink-secondary)]">"id": "usr_9k2m"</span>
                <span>"name": "Ada"</span>
              </div>
            </div>
            <!-- Add Button graphic -->
            <div
              class="flex flex-col items-center gap-1 bg-[var(--surface)] border border-[var(--border-color)] shadow-[var(--shadow-xs)] p-2.5 rounded-[8px]"
            >
              <span
                class="w-6 h-6 rounded-[6px] bg-[var(--ink)] text-[var(--on-ink)] flex items-center justify-center font-medium text-xs"
              >
                +
              </span>
              <span class="text-[9px] font-medium text-[var(--ink-secondary)]">
                {i18n.t("addNode")}
              </span>
            </div>
          </div>
        {:else if currentStep === 1}
          <!-- Step 1 Illustration: Drag to Connect -->
          <div
            class="flex items-center justify-between w-full px-11 relative animate-in fade-in duration-200"
          >
            <!-- Source Node -->
            <div
              class="w-22 h-15 bg-[var(--surface)] border border-[var(--border-color)] shadow-[var(--shadow-card)] rounded-[8px] flex flex-col overflow-hidden relative z-10"
            >
              <div class="px-2 py-1 border-b border-[var(--line)] flex items-center">
                <span class="text-[8px] font-medium text-[var(--ink)]">
                  {i18n.t("before")}
                </span>
              </div>
              <div class="flex-1 bg-[var(--surface-subtle)]"></div>
              <div
                class="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[var(--ink)]"
              ></div>
            </div>

            <!-- Animated Connection Line -->
            <svg class="absolute inset-0 w-full h-full pointer-events-none z-0">
              <path
                d="M 130 88 Q 196 88 262 88"
                fill="none"
                stroke="var(--edge-stroke-active)"
                stroke-width="1.5"
                stroke-dasharray="4"
                class="animate-[dash_1s_linear_infinite]"
              />
            </svg>

            <!-- Target Node -->
            <div
              class="w-22 h-15 bg-[var(--surface)] border border-[var(--border-strong)] shadow-[var(--shadow-card)] rounded-[8px] flex flex-col overflow-hidden relative z-10"
            >
              <div class="px-2 py-1 border-b border-[var(--line)] flex items-center">
                <span class="text-[8px] font-medium text-[var(--ink)]">
                  {i18n.t("after")}
                </span>
              </div>
              <div class="flex-1 bg-[var(--surface-subtle)]"></div>
              <div
                class="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[var(--surface)] border-[1.5px] border-[var(--edge-stroke-active)]"
              ></div>
            </div>
          </div>
        {:else if currentStep === 2}
          <!-- Step 2 Illustration: Compare Diff -->
          <div class="flex flex-col items-center gap-3 relative w-full animate-in fade-in duration-200">
            <div class="flex items-center gap-14 relative">
              <div class="w-16 h-11 bg-[var(--surface)] border border-[var(--border-color)] shadow-[var(--shadow-xs)] rounded-[8px]"></div>
              <div class="w-16 h-11 bg-[var(--surface)] border border-[var(--border-strong)] shadow-[var(--shadow-xs)] rounded-[8px]"></div>

              <!-- Connection line with Compare badge -->
              <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="w-[120px] h-px bg-[var(--edge-stroke-active)] relative flex items-center justify-center">
                  <span
                    class="bg-[var(--surface)] border border-[var(--border-strong)] shadow-[var(--shadow-xs)] text-[var(--ink)] text-[8px] font-medium px-2 py-0.5 rounded-[6px]"
                  >
                    {i18n.t("compare")}
                  </span>
                </div>
              </div>
            </div>

            <!-- Mini side-by-side diff preview -->
            <div
              class="w-56 h-12 bg-[var(--surface)] border border-[var(--border-color)] shadow-[var(--shadow-card)] rounded-[8px] overflow-hidden flex font-mono text-[6.5px] text-left"
            >
              <div
                class="flex-1 p-1.5 bg-[var(--danger-bg)] border-r border-[var(--line)] flex flex-col justify-center"
              >
                <span class="text-[var(--danger)] font-medium">- "role": "viewer"</span>
              </div>
              <div class="flex-1 p-1.5 bg-[var(--success-bg)] flex flex-col justify-center">
                <span class="text-[var(--success)] font-medium">+ "role": "admin"</span>
              </div>
            </div>
          </div>
        {:else}
          <!-- Step 3 Illustration: Export/Import -->
          <div class="flex items-center gap-5 animate-in fade-in duration-200">
            <div class="flex flex-col items-center gap-1.5">
              <div
                class="w-9 h-9 rounded-[8px] bg-[var(--surface)] border border-[var(--border-color)] shadow-[var(--shadow-xs)] flex items-center justify-center text-[var(--ink-secondary)] text-xs"
              >
                ↑
              </div>
              <span class="text-[8.5px] font-medium text-[var(--ink-tertiary)]">
                {i18n.t("import")}
              </span>
            </div>
            <div
              class="w-16 h-19 bg-[var(--surface)] border border-[var(--border-strong)] shadow-[var(--shadow-card)] rounded-[8px] flex flex-col items-center justify-center gap-1.5"
            >
              <span class="text-[10.5px] font-medium font-mono text-[var(--ink)]">JSON</span>
              <div class="w-8 h-1 bg-[var(--surface-subtle)] rounded-full"></div>
              <div class="w-6 h-1 bg-[var(--surface-subtle)] rounded-full"></div>
            </div>
            <div class="flex flex-col items-center gap-1.5">
              <div
                class="w-9 h-9 rounded-[8px] bg-[var(--surface)] border border-[var(--border-color)] shadow-[var(--shadow-xs)] flex items-center justify-center text-[var(--ink)] font-medium text-xs"
              >
                ↓
              </div>
              <span class="text-[8.5px] font-medium text-[var(--ink-secondary)]">
                {i18n.t("export")}
              </span>
            </div>
          </div>
        {/if}
      </div>

      <!-- Step Description -->
      <div class="flex flex-col gap-1.5">
        {#if currentStep === 0}
          <h2 class="text-[15px] font-medium text-[var(--ink)] tracking-tight">
            {i18n.t("step0Title")}
          </h2>
          <p class="text-[12.5px] text-[var(--ink-secondary)] leading-relaxed max-w-xs">
            {i18n.t("step0Desc")}
          </p>
        {:else if currentStep === 1}
          <h2 class="text-[15px] font-medium text-[var(--ink)] tracking-tight">
            {i18n.t("step1Title")}
          </h2>
          <p class="text-[12.5px] text-[var(--ink-secondary)] leading-relaxed max-w-xs">
            {i18n.t("step1Desc")}
          </p>
        {:else if currentStep === 2}
          <h2 class="text-[15px] font-medium text-[var(--ink)] tracking-tight">
            {i18n.t("step2Title")}
          </h2>
          <p class="text-[12.5px] text-[var(--ink-secondary)] leading-relaxed max-w-xs">
            {i18n.t("step2Desc")}
          </p>
        {:else}
          <h2 class="text-[15px] font-medium text-[var(--ink)] tracking-tight">
            {i18n.t("step3Title")}
          </h2>
          <p class="text-[12.5px] text-[var(--ink-secondary)] leading-relaxed max-w-xs">
            {i18n.t("step3Desc")}
          </p>
        {/if}
      </div>

      <!-- Progress dot indicators -->
      <div class="flex items-center gap-1.5 flex-none">
        {#each Array(totalSteps) as _, i}
          <button
            type="button"
            onclick={() => (currentStep = i)}
            class="h-1 rounded-full transition-all duration-200 cursor-pointer {currentStep === i
              ? 'w-4 bg-[var(--ink)]'
              : 'w-1.5 bg-[var(--border-strong)] hover:bg-[var(--ink-tertiary)]'}"
            aria-label="Go to slide {i + 1}"
          ></button>
        {/each}
      </div>
    </div>

    <!-- Footer / Navigation -->
    <div class="px-5 py-3.5 flex items-center justify-between border-t border-[var(--line)] flex-none">
      <button
        type="button"
        onclick={handleSkip}
        class="text-[12px] font-medium text-[var(--ink-tertiary)] hover:text-[var(--ink)] transition-colors cursor-pointer"
      >
        {i18n.t("skip")}
      </button>

      <div class="flex items-center gap-2">
        {#if currentStep > 0}
          <button
            type="button"
            onclick={handlePrev}
            class="w-7 h-7 rounded-[8px] bg-[var(--surface)] border border-[var(--border-color)] shadow-[var(--shadow-xs)] hover:border-[var(--border-strong)] hover:bg-[var(--hover)] text-[var(--ink)] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Previous step"
          >
            <ChevronLeft class="size-3.5" />
          </button>
        {/if}
        <button
          type="button"
          onclick={handleNext}
          class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] border border-transparent text-[12px] font-medium bg-[var(--ink)] text-[var(--on-ink)] shadow-[var(--shadow-xs)] hover:opacity-88 transition-opacity cursor-pointer"
        >
          {#if currentStep === totalSteps - 1}
            {i18n.t("getStarted")}
          {:else}
            {i18n.t("next")}
            <ChevronRight class="size-3.5" />
          {/if}
        </button>
      </div>
    </div>
  </DialogContent>
</Dialog>

<style>
  @keyframes dash {
    to {
      stroke-dashoffset: -8;
    }
  }
</style>
