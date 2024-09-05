import React, { AnchorHTMLAttributes, FC, MouseEventHandler, PropsWithChildren, useCallback } from 'react';
import classNames from 'classnames';

export interface DisableableAnchorProps extends AnchorHTMLAttributes<HTMLAnchorElement>, PropsWithChildren {
    disabled?: boolean;
}

/**
 * An <a> tag which supports the "disabled" attribute.
 * The "disabled" CSS class is also applied to allow for customization of disabled anchor styling.
 */
export const DisableableAnchor: FC<DisableableAnchorProps> = props => {
    const { disabled, ...anchorProps } = props;
    const { children, className } = anchorProps;

    const onClick = useCallback<MouseEventHandler<HTMLAnchorElement>>(
        event => {
            if (!disabled) return;
            event.preventDefault();
        },
        [disabled]
    );

    if (disabled) {
        return (
            <a
                tabIndex={-1}
                {...anchorProps}
                className={classNames(className, 'disabled')}
                onClick={onClick}
                style={{ pointerEvents: 'none', ...anchorProps.style }}
            >
                {children}
            </a>
        );
    }

    return <a {...anchorProps}>{children}</a>;
};

DisableableAnchor.displayName = 'DisableableAnchor';
