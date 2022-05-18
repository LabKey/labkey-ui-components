import React, { FC, memo, useEffect, useState } from 'react';
import { Utils } from '@labkey/api';

import { resolveErrorMessage } from '../../util/messaging';
import { AppContext, useAppContext } from '../../AppContext';
import { Alert } from '../base/Alert';
import { useServerContext } from '../base/ServerContext';
import { UserLimitSettings } from '../permissions/actions';

const TITLE = 'Active Users';

interface Props {
    titleCls?: string;
}

export const ActiveUserLimit: FC<Props> = memo(props => {
    const { titleCls } = props;
    const [error, setError] = useState<string>();
    const [settings, setSettings] = useState<UserLimitSettings>();
    const { user } = useServerContext();
    const { api } = useAppContext<AppContext>();

    useEffect(() => {
        if (!user.hasAddUsersPermission()) return;

        setError(undefined);
        (async () => {
            try {
                const limitSettings = await api.security.getUserLimitSettings();
                setSettings(limitSettings);
            } catch (e) {
                setError(`Error: ${resolveErrorMessage(e)}`);
            }
        })();
    }, [api, user]);

    if (!user.hasAddUsersPermission()) return null;
    if (!error && (!settings || !settings.userLimit)) return null;

    return (
        <div className="active-user-limit-panel panel panel-default">
            {!titleCls && <div className="panel-heading">{TITLE}</div>}
            <div className="panel-body">
                {titleCls && <h4 className={titleCls}>{TITLE}</h4>}
                <Alert>{error}</Alert>
                {settings && (
                    <>
                        <ActiveUserLimitMessage settings={settings} />
                        <div>
                            Active user limit is {settings.userLimitLevel}. You can add or reactivate{' '}
                            {Utils.pluralBasic(settings.remainingUsers, 'more user')}.
                        </div>
                        <br />
                        <div>Contact your LabKey Account Manager to upgrade the number of allowed users.</div>
                    </>
                )}
            </div>
        </div>
    );
});

interface ActiveUserLimitMessageProps {
    settings: UserLimitSettings;
}

export const ActiveUserLimitMessage: FC<ActiveUserLimitMessageProps> = memo(({ settings }) => {
    return (
        <>
            {settings?.messageHtml && (
                <Alert bsStyle="warning">
                    <div dangerouslySetInnerHTML={{ __html: settings.messageHtml }} />
                </Alert>
            )}
        </>
    );
});
