import React, { FC, memo } from 'react'
import { Link } from 'react-router'
import { PermissionTypes } from '@labkey/api';
import { Alert, hasAllPermissions, User, App } from '../../..';

interface Props {
    user: User
    message?: string
    className?: string
}

export const SampleEmptyAlert: FC<Props> = memo(props => {
    const {user, message, className} = props;
    const prefix = message || 'No samples have been created.';

    if (hasAllPermissions(user, [PermissionTypes.Insert])) {
        return <Alert bsStyle={'warning'} className={className}>{prefix} Click <Link
            to={App.NEW_SAMPLES_HREF.toString()}>here</Link> to create samples.</Alert>
    }

    return <Alert bsStyle={'warning'} className={className}>{prefix}</Alert>
});