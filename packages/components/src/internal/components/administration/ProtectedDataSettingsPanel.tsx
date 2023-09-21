import React, { FC, memo } from 'react';
import { ActionURL, PermissionTypes } from '@labkey/api';
import {RequiresPermission} from "../base/Permissions";
import {Setting} from "../base/Setting";

interface Props {
    containerPath?: string;
}

export const ProtectedDataSettingsPanel: FC<Props> = memo((props) => {
    const { containerPath } = props;

    return (
        <RequiresPermission perms={PermissionTypes.Admin}>
            <div className="panel panel-default">
                <div className="panel-heading">Protected Data Settings</div>
                <div className="panel-body">
                    <Setting
                        getUrl={ActionURL.buildURL('biologics', 'getProtectedDataSettings.api', containerPath)}
                        label="Require 'Restricted PHI' permission to view nucleotide and protein sequences."
                        name="protectedSequences"
                        setUrl={ActionURL.buildURL('biologics', 'setProtectedDataSettings.api', containerPath)}
                    />
                </div>
            </div>
        </RequiresPermission>
    );
});
