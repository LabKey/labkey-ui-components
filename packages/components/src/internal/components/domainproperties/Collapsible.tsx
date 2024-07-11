import React, { FC, memo } from 'react';
import classNames from 'classnames';

interface Props {
    className?: string;
    expanded: boolean;
}

export const Collapsible: FC<Props> = memo(({ children, className, expanded }) => (
    <div className={classNames('collapse', className, { in: expanded })}>{children}</div>
));
