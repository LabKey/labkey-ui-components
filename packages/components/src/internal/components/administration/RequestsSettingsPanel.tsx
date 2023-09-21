import React, { FC, memo, useCallback, useState } from 'react';
import { Checkbox } from 'react-bootstrap';
import { ActionURL, Ajax, PermissionTypes, Utils } from '@labkey/api';
import {useServerContext} from "../base/ServerContext";
import {EXPERIMENTAL_REQUESTS_MENU} from "../../app/constants";
import {RequiresPermission} from "../base/Permissions";
import {Alert} from "../base/Alert";

interface Props {
    containerPath?: string;
}

export const RequestsSettingsPanel: FC<Props> = memo((props) => {
    const { containerPath } = props;
    const { moduleContext } = useServerContext();
    const [ error, setError ] =  useState<string>(undefined);
    const [ saving, setSaving ] = useState<boolean>(false);
    const [ enabled, setEnabled ] = useState<boolean>(moduleContext.biologics[EXPERIMENTAL_REQUESTS_MENU]);

    const onChange = useCallback(() => {
        setError(undefined);
        setSaving(true);
        Ajax.request({
            url: ActionURL.buildURL('admin', 'experimentalFeature.api', containerPath),
            method: 'POST',
            jsonData: { feature: EXPERIMENTAL_REQUESTS_MENU, enabled: !enabled },
            success: Utils.getCallbackWrapper((response) => {
                setEnabled(response.enabled);
                setSaving(false);
            }),
            failure: Utils.getCallbackWrapper((error) => {
                console.error(error);
                setError(error?.exception ?? 'Error saving request menu settings');
                setSaving(false);
            })
        });
    }, [enabled, containerPath]);

    return (
        <RequiresPermission perms={PermissionTypes.AdminOperationsPermission} checkIsAdmin={false}>
            <div className="panel panel-default">
                <div className="panel-heading">Requests Settings</div>
                <div className="panel-body">
                    <Alert>{error}</Alert>
                    <form>
                        <Checkbox checked={enabled} onChange={onChange} disabled={saving}>
                            Display "Requests" section in menu to all Biologics users. Refresh page to see effect.
                        </Checkbox>
                    </form>
                </div>
            </div>
        </RequiresPermission>
    );
});
