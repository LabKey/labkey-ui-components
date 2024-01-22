import React, { FC, useCallback, useEffect, useState } from 'react';

import { PermissionTypes } from '@labkey/api';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { RequiresPermission } from '../base/Permissions';
import { LabelHelpTip } from '../base/LabelHelpTip';
import { isDataChangeCommentRequirementFeatureEnabled } from '../../app/utils';
import { useServerContext } from '../base/ServerContext';

interface AuditSettingProps {
    api?: ComponentsAPIWrapper;
}

export const AuditSettings: FC<AuditSettingProps> = props => {
    const { api } = props;
    const { container, moduleContext } = useServerContext();
    const [isRequired, setIsRequired] = useState<string>();

    useEffect(() => {
        (async () => {
            const settings = await api.folder.getAuditSettings(container.path);
            setIsRequired(settings.requireUserComments + '');
        })();
    }, []);

    const onDisableRequirement = useCallback(() => {
        setIsRequired('false');
        api.folder.setAuditCommentsRequired(false);
    }, [api]);

    const onEnableRequired = useCallback(() => {
        setIsRequired('true');
        api.folder.setAuditCommentsRequired(true);
    }, [api]);

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
                        Some actions allow users to enter a reason for the action, which will be recorded in the audit
                        log. CFR part 11 and Annex 11 compliance both require that users enter reasons for the following
                        actions:
                        <ul>
                            <li>Delete any data</li>
                            <li>Update sample amount or freeze/thaw count</li>
                            <li>Check samples in or out of storage</li>
                            <li>Discard samples from storage</li>
                            <li>Move data between projects</li>
                        </ul>
                    </LabelHelpTip>
                    <div className="framed-input__container top-spacing">
                        <div
                            className={'framed-input ' + (isRequired === 'false' ? 'active' : '')}
                            onClick={onDisableRequirement}
                        >
                            <label>
                                <input
                                    name="requireComments"
                                    type="radio"
                                    onChange={onDisableRequirement}
                                    value="false"
                                    checked={isRequired === 'false'}
                                />{' '}
                                <span className="label-text">No, reasons are optional.</span>
                            </label>
                            <div className="description">Users will see the reasons field but can leave it blank.</div>
                        </div>
                        <div
                            className={'framed-input margin-left ' + (isRequired === 'true' ? 'active' : '')}
                            onClick={onEnableRequired}
                        >
                            <label>
                                <input
                                    name="requireComments"
                                    type="radio"
                                    onChange={onEnableRequired}
                                    value="true"
                                    checked={isRequired === 'true'}
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

AuditSettings.defaultProps = {
    api: getDefaultAPIWrapper(),
};
