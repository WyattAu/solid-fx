import type { Component, JSX } from 'solid-js';
import { Dynamic, For } from 'solid-js/web';
import type { IconSvgObject } from '@hugeicons/core-free-icons';

/**
 * Solid replacement for @hugeicons/react's HugeiconsIcon.
 * Renders the framework-agnostic icon data from @hugeicons/core-free-icons:
 * an IconSvgObject is a list of [tagName, attributes] tuples.
 * Same props as the React original: icon, size, color, strokeWidth, altText
 * (plus class/style instead of className/style objects).
 */
export type HugeiconsIconProps = {
  icon: IconSvgObject;
  size?: number | string;
  color?: string;
  strokeWidth?: number | string;
  class?: string;
  style?: JSX.CSSProperties;
  altText?: string;
};

const HugeiconsIcon: Component<HugeiconsIconProps> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={props.size ?? 24}
    height={props.size ?? 24}
    viewBox="0 0 24 24"
    fill={props.color ?? 'none'}
    stroke={props.color ?? 'currentColor'}
    stroke-width={props.strokeWidth ?? 1.5}
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
    style={props.style}
    role="img"
    aria-label={props.altText ?? 'icon'}
  >
    <For each={props.icon}>
      {([tag, attrs]) => <Dynamic component={tag} {...attrs} />}
    </For>
  </svg>
);

export default HugeiconsIcon;
