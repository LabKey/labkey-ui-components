import React, { FC, useCallback, useEffect, useState } from 'react';

import { PermissionTypes } from '@labkey/api';

import { RequiresPermission } from '../base/Permissions';
import { LabelHelpTip } from '../base/LabelHelpTip';
import {
    getAppHomeFolderPath,
    isAssayEnabled,
    isDataChangeCommentRequirementFeatureEnabled,
    isWorkflowEnabled,
} from '../../app/utils';
import { useServerContext } from '../base/ServerContext';
import { useAppContext } from '../../AppContext';

export const AuditSettings: FC = () => {
    const { api } = useAppContext();
    const { container, moduleContext } = useServerContext();
    const [isRequired, setIsRequired] = useState<boolean>(false);
    const appFolderPath = getAppHomeFolderPath(container, moduleContext);

    useEffect(() => {
        (async () => {
            const settings = await api.folder.getAuditSettings(appFolderPath);
            setIsRequired(settings.requireUserComments);
        })();
    }, [appFolderPath]);

    const onDisableRequirement = useCallback(() => {
        setIsRequired(false);
        api.folder.setAuditCommentsRequired(false, appFolderPath);
    }, [appFolderPath, api]);

    const onEnableRequired = useCallback(() => {
        setIsRequired(true);
        api.folder.setAuditCommentsRequired(true, appFolderPath);
    }, [appFolderPath, api]);

    if (!isDataChangeCommentRequirementFeatureEnabled(moduleContext)) {
        return null;
    }

    return (
        <RequiresPermission perms={PermissionTypes.Admin}>
            <div className="panel panel-default">
                <div className="panel-heading">Audit Logging</div>
                <div className="panel-body">
                    Would you like to require that users provide a reason before completing certain actions?
                    <LabelHelpTip>
                        The following actions allow users to enter a reason for the action, which will be recorded in
                        the audit log:
                        <ul>
                            <li>Deleting samples and sample types</li>
                            <li>Deleting sources and source types</li>
                            {isAssayEnabled(moduleContext) && <li>Deleting assay runs and assay designs</li>}
                            {isWorkflowEnabled(moduleContext) && <li>Deleting jobs</li>}
                            <li>Deleting storage</li>
                            <li>Updating sample amounts or freeze/thaw counts</li>
                            <li>Checking samples in or out of storage</li>
                            <li>Discarding samples from storage</li>
                            <li>Moving data between projects</li>
                        </ul>
                    </LabelHelpTip>
                    <div className="framed-input__container top-spacing">
                        <div className={'framed-input ' + (!isRequired ? 'active' : '')} onClick={onDisableRequirement}>
                            <label>
                                <input
                                    name="requireComments"
                                    type="radio"
                                    onChange={onDisableRequirement}
                                    value="false"
                                    checked={!isRequired}
                                />{' '}
                                <span className="label-text">No, reasons are optional.</span>
                            </label>
                            <div className="description">Users will see the reasons field but can leave it blank.</div>
                        </div>
                        <div
                            className={'framed-input margin-left ' + (isRequired ? 'active' : '')}
                            onClick={onEnableRequired}
                        >
                            <label>
                                <input
                                    name="requireComments"
                                    type="radio"
                                    onChange={onEnableRequired}
                                    value="true"
                                    checked={isRequired}
                                />{' '}
                                <span className="label-text">Yes, reasons are required.</span>
                            </label>
                            <div className="description">Users must enter a reason for any of these actions.</div>
                        </div>
                    </div>
                </div>
            </div>
        </RequiresPermission>
    );
};
