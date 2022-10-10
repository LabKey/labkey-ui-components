import React, { ComponentType, FC, memo } from 'react';
import { PermissionTypes } from '@labkey/api';

import { RequiresModelAndActions } from '../public/QueryModel/withQueryModels';
import { User } from '../internal/components/base/models/User';
import { RequiresPermission } from '../internal/components/base/Permissions';

import { Picklist } from '../internal/components/picklist/models';

interface GridButtonProps {
    user: User;
    AdditionalGridButtons?: ComponentType<RequiresModelAndActions>;
    picklist: Picklist;
    afterSampleActionComplete: () => void;
}

export const PicklistGridButtons: FC<GridButtonProps & RequiresModelAndActions> = memo(props => {
    const { AdditionalGridButtons, ...buttonProps } = props;

    return (
        <>
            {AdditionalGridButtons !== undefined && (
                <RequiresPermission
                    permissionCheck="any"
                    perms={[
                        PermissionTypes.Insert,
                        PermissionTypes.Update,
                        PermissionTypes.Delete,
                        PermissionTypes.ManageSampleWorkflows,
                        PermissionTypes.ManagePicklists,
                        PermissionTypes.EditStorageData,
                    ]}
                >
                    <div className="responsive-btn-group">
                        <AdditionalGridButtons {...buttonProps} />
                    </div>
                </RequiresPermission>
            )}
        </>
    );
});
