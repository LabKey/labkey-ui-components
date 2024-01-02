import React, { AnchorHTMLAttributes, FC } from 'react';
import classNames from 'classnames';

export interface DisableableAnchorProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
    disabled?: boolean;
}

export const DisableableAnchor: FC<DisableableAnchorProps> = props => {
    const { disabled, ...anchorProps } = props;
    const { children, className } = anchorProps;

    if (disabled) {
        // TODO: Consider an alternative class in addition to 'disabled' that takes away the active link coloring
        // TODO: Need to override onClick to ensure it doesn't navigate (like SafeAnchor does)
        return (
            <a
                style={{ pointerEvents: 'none', ...(anchorProps.style ?? {}) }}
                tabIndex={-1}
                {...anchorProps}
                className={classNames(className, 'disabled')}
            >
                {children}
            </a>
        );
    }

    return <a {...anchorProps}>{children}</a>;
};

DisableableAnchor.displayName = 'DisableableAnchor';
