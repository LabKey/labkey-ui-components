import React, { FC, useCallback, useEffect, useState } from 'react';

import { getServerContext } from '@labkey/api';

import { withRouter, WithRouterProps } from 'react-router';

import { HelpLink } from '../../util/helpLinks';
import { getPrimaryAppProperties } from '../../app/utils';

const DISMISSED_STORAGE_PREFIX = '__release_notes_dismissed__';

export const ReleaseNoteImpl: FC<WithRouterProps> = props => {
    const { location } = props;
    const { releaseNoteLink, name } = getPrimaryAppProperties();
    const { versionString } = getServerContext();

    const releaseNoteDismissKey = DISMISSED_STORAGE_PREFIX + name + versionString;

    const [releaseNoteDismissed, setReleaseNoteDismissed] = useState<boolean>(
        location.query.showReleaseNote?.toLowerCase() !== 'true' &&
            localStorage.getItem(releaseNoteDismissKey)?.toLowerCase() === 'true'
    );

    useEffect(() => {
        localStorage.setItem(releaseNoteDismissKey, JSON.stringify(releaseNoteDismissed));
    }, [releaseNoteDismissed]);

    const onDismiss = useCallback(() => {
        setReleaseNoteDismissed(true);
    }, []);

    if (releaseNoteDismissed) return null;

    return (
        <>
            <div className="notification-container alert alert-success release-note-container">
                <div className="input-group-align release-note-new">NEW</div>
                <div className="notification-item input-group-align">
                    {name} {versionString} is here.&nbsp;
                    <HelpLink topic={releaseNoteLink}>See what's new.</HelpLink>
                    <i style={{ float: 'right' }} className="fa fa-times-circle pointer" onClick={onDismiss} />
                </div>
            </div>
        </>
    );
};

export const ReleaseNote = withRouter(ReleaseNoteImpl);
