import React, { FC, memo } from 'react';

import { PermissionTypes } from '@labkey/api';

import { User } from '../../internal/components/base/models/User';
import { RequiresPermission } from '../../internal/components/base/Permissions';

interface Props {
    className?: string;
    onClick?: () => void;
    templateUrl?: string;
    text?: string;
    user?: User;
}

export const TemplateDownloadButton: FC<Props> = memo(props => {
    const { className, onClick, templateUrl, text = 'Template', user } = props;

    if (!onClick && !templateUrl?.length) return null;

    return (
        <RequiresPermission perms={[PermissionTypes.Insert, PermissionTypes.Update]} permissionCheck="any" user={user}>
            <a
                className={'btn btn-info ' + className}
                title="Download Template"
                onClick={onClick}
                href={templateUrl}
                rel="noopener noreferrer"
                target="_blank"
            >
                <span className="fa fa-download" /> {text}
            </a>
        </RequiresPermission>
    );
});

TemplateDownloadButton.displayName = 'TemplateDownloadButton';
