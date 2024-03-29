import React, { FC, memo, useEffect, useState } from 'react';
import { Utils } from '@labkey/api';

import { resolveErrorMessage } from '../../util/messaging';
import { AppContext, useAppContext } from '../../AppContext';
import { Alert } from '../base/Alert';
import { UserLimitSettings } from '../permissions/actions';
import { User } from '../base/models/User';
import { Container } from '../base/models/Container';

interface ActiveUserLimitMessageProps {
    settings?: Partial<UserLimitSettings>;
}

export const ActiveUserLimitMessage: FC<ActiveUserLimitMessageProps> = memo(({ settings }) => {
    if (!settings?.messageHtml) return null;

    return (
        <Alert bsStyle="warning">
            {/* eslint-disable-next-line react/no-danger */}
            <div dangerouslySetInnerHTML={{ __html: settings.messageHtml }} />
        </Alert>
    );
});

interface Props {
    container: Container;
    user: User;
}

export const ActiveUserLimit: FC<Props> = memo(props => {
    const { user, container } = props;
    const [error, setError] = useState<string>();
    const [settings, setSettings] = useState<UserLimitSettings>();
    const { api } = useAppContext<AppContext>();

    useEffect(() => {
        if (!user.hasAddUsersPermission()) return;

        setError(undefined);
        (async () => {
            try {
                const limitSettings = await api.security.getUserLimitSettings(container.path);
                setSettings(limitSettings);
            } catch (e) {
                setError(`Error: ${resolveErrorMessage(e)}`);
            }
        })();
    }, [api, user, container.path]);

    if (!user.hasAddUsersPermission()) return null;
    if (!error && !settings?.userLimit) return null;

    return (
        <div className="active-user-limit-panel panel panel-default">
            <div className="panel-heading">Active Users</div>
            <div className="panel-body">
                <Alert>{error}</Alert>
                {settings && (
                    <>
                        <ActiveUserLimitMessage settings={settings} />
                        <div className="active-user-limit-message">
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
