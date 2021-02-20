import React, { FC, memo, useMemo } from 'react';
import classNames from 'classnames';

import { Alert, User, App } from '../../..';

interface Props {
    className?: string;
    message?: string;
    user: User;
}

export const AssayDesignEmptyAlert: FC<Props> = memo(({ className, message, user }) => {
    const prefix = message ?? 'No assays have been created.';
    const hasPermission = useMemo(() => user.hasDesignAssaysPermission(), [user]);

    return (
        <Alert bsStyle="warning" className={classNames('assay-design-empty', className)}>
            {hasPermission && (
                <>
                    {prefix} Click <a href={App.NEW_ASSAY_DESIGN_HREF.toHref()}>here</a> to get started.
                </>
            )}
            {!hasPermission && prefix}
        </Alert>
    );
});
