import React, { FC, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { HelpLink } from '../../util/helpLinks';
import { biologicsIsPrimaryApp, getPrimaryAppProperties } from '../../app/utils';
import { useServerContext } from '../base/ServerContext';
import { useAppContext } from '../../AppContext';
import { RELEASE_NOTES_METRIC } from '../productnavigation/constants';

export const DISMISSED_STORAGE_PREFIX = '__release_notes_dismissed__';

export const ReleaseNote: FC = props => {
    const [searchParams] = useSearchParams();
    const { api } = useAppContext();
    const { versionString, moduleContext } = useServerContext();
    const { releaseNoteLink, name } = getPrimaryAppProperties(moduleContext);

    const releaseNoteDismissKey = DISMISSED_STORAGE_PREFIX + name + versionString;

    const [releaseNoteDismissed, setReleaseNoteDismissed] = useState<boolean>(
        (searchParams.get('showReleaseNote') ?? '').toLowerCase() !== 'true' &&
            localStorage.getItem(releaseNoteDismissKey)?.toLowerCase() === 'true'
    );

    useEffect(() => {
        localStorage.setItem(releaseNoteDismissKey, JSON.stringify(releaseNoteDismissed));
    }, [releaseNoteDismissed, releaseNoteDismissKey]);

    const onDismiss = useCallback(() => {
        setReleaseNoteDismissed(true);
    }, []);

    const onLinkClick = useCallback(() => {
        api.query.incrementClientSideMetricCount(RELEASE_NOTES_METRIC, "FromBanner");
    }, []);

    if (releaseNoteDismissed || !releaseNoteLink) return null;

    return (
        <div className="notification-container alert alert-success release-note-container">
            <div className="input-group-align release-note-new">NEW</div>
            <div className="notification-item input-group-align">
                {name} {versionString} is here!&nbsp;
                <span onClick={onLinkClick}>
                    <HelpLink
                        topic={releaseNoteLink}
                        useDefaultUrl={biologicsIsPrimaryApp() /* needed for FM in Biologics*/}
                    >
                    See what's new.
                    </HelpLink>
                </span>
                <i style={{ float: 'right' }} className="fa fa-times-circle pointer" onClick={onDismiss} />
            </div>
        </div>
    );
};
