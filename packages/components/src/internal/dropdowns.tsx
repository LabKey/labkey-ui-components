import React, {
    FC,
    forwardRef,
    memo,
    MouseEvent,
    MutableRefObject,
    PropsWithChildren,
    ReactElement,
    ReactNode,
    SyntheticEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import classNames from 'classnames';

import { generateId } from './util/utils';
import { cancelEvent } from './events';

export type BSStyle = 'success' | 'danger' | 'default' | 'primary';

/**
 * Use this when you want to prevent the document click handler from handling a click event.
 *
 * This method exists because React 16 uses an event listener on the document for almost all events:
 *      https://github.com/facebook/react/issues/4335#issuecomment-120269153
 *
 * This gives us an advantage: if an element has an onClick handler, and it calls event.stopPropagation, it won't
 * actually stop our document click handler from firing, so we are essentially guaranteed to be able to close the menu
 * when the user clicks outside of it.
 *
 * This behavior also gives us a disadvantage: by the time our document click handler executes React has already fired
 * its own click handlers and updated the DOM. This means it's impossible for us to properly determine if the user
 * clicked on a disabled element because it may be disabled now, but was not when they clicked (this is an issue for our
 * PageMenu component).
 *
 * The solution is to use event.nativeEvent.stopImmediatePropagation which prevents the root handler from ever being
 * called.
 *
 * According to Dan Abromov this was "fixed" in React 17, but he didn't specify how they fixed the issue, or what the
 * new behavior is, so this may stop working when we upgrade react:
 *      https://github.com/facebook/react/issues/4335#issuecomment-671487964
 */
export function preventDocumentHandler(event: SyntheticEvent): void {
    // Note: nativeEvent is always available, except when running tests
    event.nativeEvent?.stopImmediatePropagation?.();
}

interface ToggleState<T> {
    onClick: (event: MouseEvent<T>) => void;
    open: boolean;
    setOpen: (show: boolean) => void;
    toggleRef: MutableRefObject<T>;
}

function useToggleState<T extends HTMLElement>(): ToggleState<T> {
    const toggleRef = useRef<T>();
    const [open, setOpen] = useState<boolean>(false);
    const onClick = useCallback(event => {
        event.preventDefault(); // Needed so DropdownAnchor doesn't navigate to home page on click
        setOpen(o => !o);
    }, []);

    // onDocumentClick closes the menu if the user clicks on a MenuItem or outside the menu, we prevent closing the menu
    // when the user clicks headers, dividers, or the <ul> element by using preventDocumentHandler. See note in
    // preventDocumentHandler for more details on the nuances of our document click handler.
    const onDocumentClick = useCallback(event => {
        // Don't take action if we're clicking the toggle, as that handles open/close on its own, and we can't use
        // preventDocumentHandler in the toggle onClick, or we'll keep the menu open if the user clicks another menu.
        const isToggle = event.target === toggleRef.current;
        const insideToggle = toggleRef.current?.contains(event.target);
        if (isToggle || insideToggle) return;
        setOpen(false);
    }, []);

    useEffect(() => {
        // We only want to listen for clicks on the document if the menu is open
        if (open) {
            // Note: capture: true is very important here. It's needed so that we always handle the event
            document.addEventListener('click', onDocumentClick, { capture : true });
        }

        return () => {
            document.removeEventListener('click', onDocumentClick);
        };
    }, [open, onDocumentClick]);

    return { onClick, open, setOpen, toggleRef };
}

interface DropdownAnchorProps extends PropsWithChildren {
    className?: string;
    label?: string;
    pullRight?: boolean;
    title: ReactNode;
}

/**
 * See docs in docs/dropdowns.md
 */
export const DropdownAnchor: FC<DropdownAnchorProps> = props => {
    const { children, label, pullRight, title } = props;
    const id = useMemo(() => generateId('dropdown-anchor-'), []);
    const { onClick, open, toggleRef } = useToggleState<HTMLAnchorElement>();
    const className = classNames('lk-dropdown', 'dropdown', props.className, { open });
    const menuClassName = classNames('dropdown-menu', { 'dropdown-menu-right': pullRight });

    return (
        <div className={className}>
            <a
                aria-haspopup="true"
                aria-expanded={open}
                className="dropdown-toggle"
                href="#"
                id={id}
                onClick={onClick}
                ref={toggleRef}
                role="button"
                title={label}
            >
                {title}
                <span className="caret" />
            </a>

            <ul className={menuClassName}>{children}</ul>
        </div>
    );
};
DropdownAnchor.displayName = 'DropdownAnchor';

interface DropdownButtonProps {
    bsStyle?: BSStyle;
    buttonClassName?: string;
    children: ReactNode;
    className?: string;
    disabled?: boolean;
    dropup?: boolean;
    noCaret?: boolean;
    onClick?: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    pullRight?: boolean;
    title: ReactNode;
}

/**
 * See docs in docs/dropdowns.md
 */
export const DropdownButton = forwardRef<HTMLDivElement, DropdownButtonProps>((props, ref) => {
    const {
        bsStyle = 'default',
        children,
        disabled = false,
        dropup = false,
        noCaret = false,
        onClick,
        onMouseEnter,
        onMouseLeave,
        pullRight = false,
        title,
    } = props;
    const id = useMemo(() => generateId('dropdown-button-'), []);
    const { onClick: onToggleClick, open, toggleRef } = useToggleState<HTMLButtonElement>();
    const className = classNames('lk-dropdown', 'btn-group', props.className, { open, dropdown: !dropup, dropup });
    const buttonClassName = classNames('btn', 'btn-' + bsStyle, 'dropdown-toggle', props.buttonClassName);
    const menuClassName = classNames('dropdown-menu', { 'dropdown-menu-right': pullRight });
    const caretClassName = classNames('caret', { 'no-margin': !title });
    const onClick_ = useCallback(
        event => {
            onToggleClick(event);
            onClick?.();
        },
        [onToggleClick, onClick]
    );

    return (
        <div className={className} ref={ref} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
            <button
                aria-haspopup="true"
                aria-expanded={open}
                className={buttonClassName}
                disabled={disabled}
                id={id}
                onClick={onClick_}
                ref={toggleRef}
                role="button"
                type="button"
            >
                {title}
                {!noCaret && <span className={caretClassName} />}
            </button>
            <ul className={menuClassName} aria-labelledby={id} onClick={preventDocumentHandler} role="menu">
                {children}
            </ul>
        </div>
    );
});
DropdownButton.displayName = 'DropdownButton';

interface SplitButtonProps extends Omit<DropdownButtonProps, 'noCaret' | 'onMouseEnter' | 'onMouseLeave'> {
    buttonDisabled?: boolean;
    // Used to disable the main button
    href?: string;
    menuDisabled?: boolean;
    toggleClassName?: string; // Used to disable the menu toggle button
}

/**
 * See docs in docs/dropdowns.md
 */
export const SplitButton: FC<SplitButtonProps> = memo(props => {
    const {
        bsStyle = 'default',
        buttonDisabled = false,
        children,
        disabled = false, // Used to disable the main button and menu toggle at the same time
        dropup = false,
        href,
        menuDisabled = false,
        onClick,
        pullRight,
        title,
    } = props;
    const { onClick: onToggleClick, open, toggleRef } = useToggleState<HTMLButtonElement>();
    const wrapperClassName = classNames('split-button-dropdown', 'btn-group', props.className, {
        open,
        dropdown: !dropup,
        dropup,
    });
    const buttonClassName = classNames('split-button-dropdown__button', 'btn', 'btn-' + bsStyle, props.buttonClassName);
    const toggleClassName = classNames('btn', 'btn-' + bsStyle, 'dropdown-toggle', props.toggleClassName);
    const menuClassName = classNames('dropdown-menu', { 'dropdown-menu-right': pullRight });
    const id = useMemo(() => generateId('dropdown-button-'), []);

    if (!href && !onClick) {
        console.warn('SplitButton is missing href and onClick, did you forget to add one of these props?');
    }

    let button: ReactElement;

    if (href !== undefined) {
        button = (
            <a href={href} className={buttonClassName}>
                {title}
            </a>
        );
    } else {
        button = (
            <button className={buttonClassName} onClick={onClick} disabled={disabled || buttonDisabled} type="button">
                {title}
            </button>
        );
    }

    return (
        <div className={wrapperClassName}>
            {button}
            <button
                aria-haspopup="true"
                aria-expanded={open}
                className={toggleClassName}
                disabled={disabled || menuDisabled}
                id={id}
                onClick={onToggleClick}
                ref={toggleRef}
                role="button"
                type="button"
            >
                <span className="caret no-margin" />
            </button>
            <ul className={menuClassName} aria-labelledby={id} onClick={preventDocumentHandler} role="menu">
                {children}
            </ul>
        </div>
    );
});
SplitButton.displayName = 'SplitButton';

interface MenuHeaderProps {
    className?: string;
    text: string;
}

/**
 * See docs in docs/dropdowns.md
 */
export const MenuHeader: FC<MenuHeaderProps> = ({ className, text }) => (
    <li
        className={classNames('lk-dropdown-header', 'dropdown-header', className)}
        role="heading"
        onClick={preventDocumentHandler}
    >
        {text}
    </li>
);
MenuHeader.displayName = 'MenuHeader';

/**
 * See docs in docs/dropdowns.md
 */
export const MenuDivider = (): ReactElement => (
    <li className="divider" role="separator" onClick={preventDocumentHandler} />
);

export interface MenuItemProps {
    active?: boolean;
    children: ReactNode;
    className?: string;
    disabled?: boolean;
    href?: string;
    onClick?: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    rel?: string;
    target?: string;
    title?: string;
}

/**
 * See docs in docs/dropdowns.md
 */
export const MenuItem = forwardRef<HTMLLIElement, MenuItemProps>((props, ref) => {
    const {
        active = false,
        children,
        disabled,
        href = '#',
        onClick,
        onMouseEnter,
        onMouseLeave,
        rel,
        target,
        title,
    } = props;
    const className = classNames('lk-menu-item', props.className, { active, disabled });
    const onClick_ = useCallback(
        (e: MouseEvent<HTMLAnchorElement>) => {
            // If the user didn't override the href, then we prevent default in order to prevent the browser from
            // navigating us to the home page
            if (disabled || href === '#') {
                e.preventDefault();
            }

            // e.stopPropagation();

            // We have to prevent the document handler from executing in the disabled case because by the time it
            // executes React will have already updated the DOM, so it cannot tell that you clicked on a disabled item
            if (disabled) preventDocumentHandler(e);

            if (!disabled && onClick) onClick();
        },
        [disabled, href, onClick]
    );
    return (
        <li className={className} role="presentation" ref={ref} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
            <a onClick={onClick_} href={href} rel={rel} role="menuitem" target={target} title={title}>
                {children}
            </a>
        </li>
    );
});
MenuItem.displayName = 'MenuItem';
