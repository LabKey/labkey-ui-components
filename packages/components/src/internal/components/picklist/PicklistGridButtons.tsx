import React, { ComponentType, FC, memo } from 'react';
import { PermissionTypes } from '@labkey/api';

import { RequiresModelAndActions } from '../../../public/QueryModel/withQueryModels';
import { User } from '../base/models/User';
import { RequiresPermission } from '../base/Permissions';
import { Picklist } from './models';

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
                    <div className="btn-group gridbar-buttons">
                        <AdditionalGridButtons {...buttonProps} />
                    </div>
                </RequiresPermission>
            )}
        </>
    );
});
