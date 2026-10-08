import type { JSX } from "solid-js";

/** A toggle-style option button; blurs itself so typing keeps going to the copy input. */
export function Opt(props: { active: boolean; onClick: () => void; children: JSX.Element }) {
  return (
    <button
      type="button"
      class="opt"
      classList={{ active: props.active }}
      onClick={(e) => {
        props.onClick();
        e.currentTarget.blur();
      }}
    >
      {props.children}
    </button>
  );
}
