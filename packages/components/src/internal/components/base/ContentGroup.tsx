import React, { FC, PropsWithChildren, ReactNode } from 'react';
import classNames from 'classnames';

interface ContentGroupLabelProps extends PropsWithChildren {
    withoutBottomMargin?: boolean;
}

export const ContentGroupLabel: FC<ContentGroupLabelProps> = ({ withoutBottomMargin, children }) => {
    return (
        <div className={classNames('content-group-label', { 'content-group': !withoutBottomMargin })}>{children}</div>
    );
};

interface ContentGroupProps extends PropsWithChildren {
    label?: ReactNode;
}

export const ContentGroup: FC<ContentGroupProps> = ({ children, label }) => {
    return (
        <div className="content-group">
            {label && <ContentGroupLabel>{label}</ContentGroupLabel>}
            {children}
        </div>
    );
};
