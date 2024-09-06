import React, { FC, memo, PropsWithChildren } from 'react';
import classNames from 'classnames';

interface Props extends PropsWithChildren {
    className?: string;
    expanded: boolean;
}

export const Collapsible: FC<Props> = memo(({ children, className, expanded }) => (
    <div className={classNames('collapse', className, { in: expanded })}>{children}</div>
));
