# Overlays, Popovers, and Tooltips

We have an internal set of components for creating Overlays, Popovers, and Tooltips. This set of comoponents is similar
to the react-bootstrap components, but differs in a few critical ways.

## OverlayTrigger

Our implementation of `OverlayTrigger` works similarly to the react-boostrap version, with a few key differences:

- `OverlayTrigger` wraps your components in a div with a className `overlay-trigger`, you can optionally provide
an additional className via the `className` prop
  - We wrap your component, so we can intercept the appropriate events (click, hover, etc.)
    - react-bootstrap didn't wrap your component, instead it used cloneElement and injected event handlers; while this
    worked it had several drawbacks (notably some components simply did not work with OverlayTrigger)
- The child component passed to `OverlayTrigger` _must_ have a `ref` prop, the easiest way to accomplish this is to
use a native browser tag like `div` or `span`, however if you want to use a React Component you can wrap your
component with [forwardRef](https://react.dev/reference/react/forwardRef).
- `OverlayTrigger` does not have a `placement` prop, that prop is on `Tooltip` and `Popover`


## useOverlayTriggerState

OverlayTrigger is suitable for most cases where you'll need to render a Tooltip, however there are some cases where it
is undesirable to have your component wrapped in a `div`. To avoid having your component wrapped by `OverlayTrigger` you
can use the underlying hook that powers it, `useOverlayTriggerState`. Using the hook is only slightly more effort than
using the `OverlayTrigger` component; you'll need to wire up some additional callbacks to trigger the `Overlay`.

Here is an example using `useOverlayTriggerState` to render a tooltip over a button:

```typescript jsx
interface Props {
    onClick: () => void;
    tooltipPlacement: Placement;
    tooltipText: string;
}

const TooltipButton: FC<Props> = ({ children, onClick, tooltipPlacement = 'top', tooltipText }) => {
    // Note: useOverlayTriggerState also returns an onClick handler if you want to toggle the overlay when the user
    // clicks, however for a button that would not be appropriate.
    const { onMouseEnter, onMouseLeave, portalEl, show, targetRef } = useOverlayTriggerState<HTMLButtonElement>(
        'tooltip-button-portal', // The id used for the underlying React portal
        true, // enable/disable hover events
        false // enable/disable click events, we disable click here because we already have a click handler
    );
    const tooltip = useMemo(() => (
        <Tooltip id="tooltip-button" targetRef={targetRef} placement={tooltipPlacement}>{tooltipText}</Tooltip>
    ));

    return (
        <button className="btn btn-default" onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
            {children}
            {show && createPortal(popover, portalEl)}
        </button>
    );
};
```


## Tooltip & Popover

These components are not particularly complicated, but they are unusual in that they do require you to pass a
`targetRef` prop to them. This prop is a ref to an underlying DOM element, and is needed so we can position the
`Tooltip` or `Popover` relative to the target. Confusingly this prop is typed as optional, which is only technically
true. It is optionally typed so that you can easily create a `Tooltip` or `Popover` and pass it to the `OverlayTrigger`
component, which will inject the `targetRef` prop for you. If you are not using `OverlayTrigger` you will need to pass
the `targetRef` prop yourself, as shown in the example above.
