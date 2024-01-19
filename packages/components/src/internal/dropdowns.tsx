import React, {
    FC,
    forwardRef,
    memo,
    MouseEvent,
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

export type BSStyle = 'success' | 'danger' | 'default' | 'primary';

// TODO: DropdownAnchor (needed for ELN menus to replace Dropdown, Dropdown.Toggle, etc.)

// TODO: SplitButton

// TODO: factor out generic Dropdown or maybe a hook for the state and callbacks?

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
function preventDocumentHandler(event: SyntheticEvent): void {
    event.nativeEvent.stopImmediatePropagation();
}

interface DropdownButtonProps {
    bsStyle?: BSStyle;
    children: ReactNode;
    className?: string;
    disabled?: boolean;
    dropup?: boolean;
    noCaret?: boolean;
    onMouseEnter?: () => void;
    onMouseOut?: () => void;
    pullRight?: boolean;
    title: ReactNode;
}

export const DropdownButton = forwardRef<HTMLDivElement, DropdownButtonProps>((props, ref) => {
    const {
        bsStyle = 'default',
        disabled = false,
        dropup = false,
        children,
        noCaret = false,
        onMouseEnter,
        onMouseOut,
        pullRight = false,
        title,
    } = props;
    const id = useMemo(() => generateId('dropdown-button-'), []);
    const menuRef = useRef<HTMLUListElement>();
    const toggleRef = useRef<HTMLButtonElement>();
    const [open, setOpen] = useState<boolean>(false);
    const onClick = useCallback(event => {
        preventDocumentHandler(event);
        setOpen(o => !o);
    }, []);
    const className = classNames('lk-dropdown', 'btn-group', { open, dropdown: !dropup, dropup });
    const buttonClassName = classNames('btn', 'btn-' + bsStyle, 'dropdown-toggle', props.className);
    const menuClassName = classNames('dropdown-menu', { 'dropdown-menu-right': pullRight });
    // onDocumentClick closes the menu if the user clicks on a MenuItem or outside the menu, we prevent closing the menu
    // when the user clicks headers, dividers, or the <ul> element by using preventDocumentHandler. See note in
    // preventDocumentHandler for more details on the nuances of our document click handler.
    const onDocumentClick = useCallback(() => setOpen(false), []);

    useEffect(() => {
        // We only want to listen for clicks on the document if the menu is open
        if (open) {
            document.addEventListener('click', onDocumentClick);
        }

        return () => {
            document.removeEventListener('click', onDocumentClick);
        };
    }, [open, onDocumentClick]);

    return (
        <div className={className} ref={ref} onMouseEnter={onMouseEnter} onMouseOut={onMouseOut}>
            <button
                aria-haspopup="true"
                aria-expanded={open ? 'true' : 'false'}
                className={buttonClassName}
                disabled={disabled}
                id={id}
                onClick={onClick}
                ref={toggleRef}
                role="button"
                type="button"
            >
                {title}&nbsp;
                {!noCaret && <span className="caret" />}
            </button>
            <ul className={menuClassName} ref={menuRef} aria-labelledby={id} onClick={preventDocumentHandler}>
                {children}
            </ul>
        </div>
    );
});

interface SplitButtonProps extends Omit<DropdownButtonProps, 'noCaret'> {
    buttonClassName?: string;
    buttonDisabled?: boolean;
    href?: string;
    menuDisabled?: boolean;
    onClick?: () => any;
}

export const SplitButton: FC<SplitButtonProps> = memo(props => {
    const {
        buttonClassName,
        buttonDisabled = false,
        bsStyle = 'default',
        children,
        className,
        href,
        menuDisabled = false,
        title,
        onClick,
        ...buttonProps
    } = props;

    const wrapperClassName = classNames('btn-group', className);
    const buttonClassName_ = classNames('btn', 'btn-' + bsStyle, buttonClassName);

    if (!href && !onClick) {
        console.warn('SplitButton is missing href and onClick, did you forget to add one of these props?');
    }

    let button;

    if (href !== undefined) {
        button = (
            <a href={href} className={buttonClassName_}>
                {title}
            </a>
        );
    } else {
        button = (
            <button className={buttonClassName_} onClick={onClick} disabled={buttonDisabled} type="button">
                {title}
            </button>
        );
    }

    return (
        <div className={wrapperClassName}>
            {button}
            <DropdownButton {...buttonProps} bsStyle={bsStyle} title="" disabled={menuDisabled}>
                {children}
            </DropdownButton>
        </div>
    );
});

SplitButton.displayName = 'SplitButton';

interface MenuHeaderProps {
    className?: string;
    text: string;
}
export const MenuHeader: FC<MenuHeaderProps> = ({ className, text }) => (
    <li className={classNames('dropdown-header', className)} role="heading" onClick={preventDocumentHandler}>
        {text}
    </li>
);

export const MenuDivider = (): ReactElement => (
    <li className="divider" role="separator" onClick={preventDocumentHandler} />
);

interface MenuItemProps {
    active?: boolean;
    className?: string;
    disabled?: boolean;
    href?: string;
    onClick?: () => void;
    target?: string;
    title?: string;
}

export const MenuItem: FC<MenuItemProps> = props => {
    const { active = false, children, disabled, href = '#', onClick, target, title } = props;
    const className = classNames('lk-menu-item', props.className, { active, disabled });
    const onClick_ = useCallback(
        (e: MouseEvent<HTMLAnchorElement>) => {
            // If the user didn't override the href, then we prevent default in order to prevent the browser from
            // navigating us to the home page
            if (disabled || href === '#') {
                e.preventDefault();
            }

            e.stopPropagation();

            // We have to prevent the document handler from executing in the disabled case because by the time it
            // executes React will have already updated the DOM, so it cannot tell that you clicked on a disabled item
            if (disabled) preventDocumentHandler(e);

            if (!disabled && onClick) onClick();
        },
        [disabled, href, onClick]
    );
    return (
        <li className={className} role="presentation">
            <a onClick={onClick_} href={href} role="menuitem" target={target} title={title}>
                {children}
            </a>
        </li>
    );
};
