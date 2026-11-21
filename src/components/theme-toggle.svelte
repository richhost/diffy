<script lang="ts">
  interface Props {
    toggled: boolean;
    class?: string;
  }

  let { toggled, class: className = "" }: Props = $props();

  const clipId = $props.id();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  aria-hidden="true"
  width="1em"
  height="1em"
  fill="currentColor"
  stroke-linecap="round"
  viewBox="0 0 32 32"
  class="theme-toggle {className}"
  class:toggled
>
  <clipPath id={clipId}>
    <path d="M0-5h30a1 1 0 0 0 9 13v24H0Z" />
  </clipPath>
  <g clip-path="url(#{clipId})">
    <circle cx="16" cy="16" r="8.4" />
    <g stroke="currentColor" stroke-width="1.8">
      <path d="M16 5.5v-4" />
      <path d="M16 30.5v-4" />
      <path d="M1.5 16h4" />
      <path d="M26.5 16h4" />
      <path d="m23.4 8.6 2.8-2.8" />
      <path d="m5.7 26.3 2.9-2.9" />
      <path d="m5.8 5.8 2.8 2.8" />
      <path d="m23.4 23.4 2.9 2.9" />
    </g>
  </g>
</svg>

<style>
  .theme-toggle clipPath path {
    transition: transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  .theme-toggle.toggled clipPath path {
    transform: translate3d(-12px, 10px, 0);
  }

  .theme-toggle circle {
    transform-origin: center;
    transition: transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  .theme-toggle.toggled circle {
    transform: scale(1.38);
  }

  .theme-toggle g > g {
    transform-origin: center;
    transition:
      transform 380ms cubic-bezier(0.22, 1, 0.36, 1),
      opacity 220ms ease;
  }

  .theme-toggle.toggled g > g {
    transform: rotate(45deg) scale(0.5);
    opacity: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .theme-toggle clipPath path,
    .theme-toggle circle,
    .theme-toggle g > g {
      transition: none;
    }
  }
</style>
