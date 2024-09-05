import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { UserWithPermissions } from '@labkey/api';

import { resolveErrorMessage } from '../util/messaging';

import { AnnouncementsAPIWrapper, getDefaultAnnouncementsAPIWrapper } from './APIWrapper';
import { AnnouncementModel } from './model';
import { Thread } from './Thread';
import { ThreadEditor } from './ThreadEditor';

// Prevent auto-load in test environments in lieu of mocking APIWrapper in all test locations
const DEFAULT_AUTO_LOAD = process.env.NODE_ENV !== 'test';

interface Props {
    api?: AnnouncementsAPIWrapper;
    autoLoad?: boolean;
    containerPath?: string;
    discussionSrcEntityType?: string;
    discussionSrcIdentifier: string;
    nounPlural?: string;
    nounSingular?: string;
    readOnly?: boolean;
    setHasPendingChanges?: (hasPendingChanges: boolean) => void;
    user: UserWithPermissions;
}

export const Discussions: FC<Props> = memo(props => {
    const {
        api = getDefaultAnnouncementsAPIWrapper(),
        autoLoad = DEFAULT_AUTO_LOAD,
        containerPath,
        discussionSrcIdentifier,
        discussionSrcEntityType,
        nounPlural = 'comments',
        nounSingular = 'comment',
        readOnly,
        user,
        setHasPendingChanges,
    } = props;
    const { canInsert } = user;
    const [error, setError] = useState<string>(undefined);
    const [discussions, setDiscussions] = useState<AnnouncementModel[]>([]);
    const [showEditor, setShowEditor] = useState(false);
    const [pendingChanges, setPendingChanges] = useState<Set<number>>(new Set());

    const allowCreateThread = !readOnly && canInsert;
    const hasError = error !== undefined;
    const hasDiscussions = discussions.length > 0;

    const loadDiscussions = useCallback(async () => {
        try {
            setDiscussions(await api.getDiscussions(discussionSrcIdentifier, containerPath));
        } catch (err) {
            setError(resolveErrorMessage(err, 'discussion', 'discussions', 'load'));
        }
    }, [api, containerPath, discussionSrcIdentifier]);

    const onCancel = useCallback(() => {
        setShowEditor(false);
    }, []);

    const onCreate = useCallback(() => {
        setShowEditor(false);
        loadDiscussions();
    }, [loadDiscussions]);

    const onShow = useCallback(() => {
        setShowEditor(true);
    }, []);

    const updatePendingThread = useCallback(
        (threadId: number, hasPendingChange: boolean) => {
            const updatedPendingChanges = new Set(pendingChanges);
            if (hasPendingChange) updatedPendingChanges.add(threadId);
            else updatedPendingChanges.delete(threadId);
            setPendingChanges(updatedPendingChanges);
            setHasPendingChanges?.(updatedPendingChanges.size > 0);
        },
        [pendingChanges]
    );

    useEffect(() => {
        if (autoLoad) loadDiscussions();
    }, [autoLoad, loadDiscussions]);

    // Empty read only state
    if (readOnly && !hasDiscussions) {
        // Returning non-null element as the tests do not like returning null
        return <div />;
    }

    return (
        <div className="discussions-container">
            <hr />

            <div className="discussions-container__title">{nounPlural}</div>

            {hasError && <div className="alert alert-danger">{error}</div>}

            {discussions.map(thread => (
                <Thread
                    api={api}
                    containerPath={containerPath}
                    discussionSrcIdentifier={discussionSrcIdentifier}
                    discussionSrcEntityType={discussionSrcEntityType}
                    key={thread.rowId}
                    nounPlural={nounPlural}
                    nounSingular={nounSingular}
                    onCreate={loadDiscussions}
                    onDelete={loadDiscussions}
                    onUpdate={loadDiscussions}
                    readOnly={readOnly}
                    thread={thread}
                    user={user}
                    setPendingChange={updatePendingThread}
                />
            ))}

            {allowCreateThread && !showEditor && (
                <span className="clickable-text" onClick={onShow}>
                    <i className="fa fa-comments" />
                    Start a thread
                </span>
            )}

            {allowCreateThread && showEditor && (
                <ThreadEditor
                    api={api}
                    containerPath={containerPath}
                    discussionSrcIdentifier={discussionSrcIdentifier}
                    discussionSrcEntityType={discussionSrcEntityType}
                    nounPlural={nounPlural}
                    nounSingular={nounSingular}
                    onCancel={onCancel}
                    onCreate={onCreate}
                    setPendingChange={updatePendingThread}
                />
            )}
        </div>
    );
});

Discussions.displayName = 'Discussions';
