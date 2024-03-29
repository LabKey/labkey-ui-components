import React, { FC, memo, useMemo } from 'react';
import classNames from 'classnames';

import { AppURL } from '../../url/AppURL';

import { Alert } from './Alert';
import { hasAllPermissions, User } from './models/User';

interface EmptyAlertProps {
    actionURL?: AppURL;
    allowAction?: boolean;
    className?: string;
    message: string;
    messageSuffix?: string;
}

export const EmptyAlert: FC<EmptyAlertProps> = memo(({ actionURL, allowAction, className, message, messageSuffix }) => {
    const showActionUrl = allowAction && !!actionURL;
    return (
        <Alert bsStyle="warning" className={classNames('empty-alert', className)}>
            {showActionUrl && (
                <>
                    {message} Click <a href={actionURL.toHref()}>here</a> {messageSuffix ?? 'to get started.'}
                </>
            )}
            {!showActionUrl && message}
        </Alert>
    );
});

EmptyAlert.displayName = 'EmptyAlert';

interface WithPermissionsProps extends EmptyAlertProps {
    permission: string;
    user?: User;
}

export const EmptyAlertWithPermissions: FC<WithPermissionsProps> = memo(props => {
    const { allowAction, permission, user, ...baseProps } = props;
    const _allowAction = useMemo(() => {
        return allowAction !== false && !!user && hasAllPermissions(user, [permission]);
    }, [allowAction, permission, user]);

    return <EmptyAlert {...baseProps} allowAction={_allowAction} />;
});

EmptyAlertWithPermissions.displayName = 'EmptyAlertWithPermissions';

export type EmptyAlertWithPermissionsProps = Omit<WithPermissionsProps, 'message' | 'permission'>;
