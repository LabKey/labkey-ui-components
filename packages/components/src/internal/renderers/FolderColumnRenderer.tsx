import React, { FC, memo } from 'react';
import { Iterable, Map } from 'immutable';

import { useServerContext } from '../components/base/ServerContext';
import { getArchivedFolders } from '../app/utils';
import { Alert } from '../components/base/Alert';

export interface FolderColumnRendererProps {
    data: Map<any, any> | { [key: string]: any };
    className?: string;
}

export const FolderColumnRenderer: FC<FolderColumnRendererProps> = memo(
    ({ data, className = 'ws-pre-wrap' }) => {
        const { moduleContext } = useServerContext();
        const archivedFolders = getArchivedFolders(moduleContext);
        let archived = false;
        let displayValue = null;
        let value = null;
        if (data) {
            if (Iterable.isIterable(data)) {
                value = data.get('value');
                displayValue = data.get('displayValue');
            } else if (data['value']) {
                value = data['value'];
                displayValue = data['displayValue'];
            } else if (typeof data === 'string') {
                value = data;
            }

            displayValue = displayValue ?? value;
        }

        if (value)
            archived = archivedFolders?.indexOf(value) > -1;

        return (
            <span className={className}>
                {displayValue}
                {archived && (
                    <Alert className="folder-field_archived-tag">Archived</Alert>
                )}
            </span>
        );
    }
);

FolderColumnRenderer.displayName = 'FolderColumnRenderer';
