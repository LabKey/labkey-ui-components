import React, { FC, memo, useEffect, useState } from 'react';
import classNames from 'classnames';
import { ActionURL } from '@labkey/api';

import { getCurrentAppProperties } from '../../app/utils';
import { AppProperties } from '../../app/models';
import { isLoading, LoadingState } from '../../../public/LoadingState';
import { AppContext, useAppContext } from '../../AppContext';
import { useServerContext } from '../base/ServerContext';
import { resolveErrorMessage } from '../../util/messaging';
import { Alert } from '../base/Alert';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { naturalSortByProperty } from '../../../public/sort';
import { Container } from '../base/models/Container';
import { buildURL } from '../../url/AppURL';

export interface FolderMenuItem {
    href: string;
    id: string;
    isTopLevel: boolean;
    label: string;
    path: string;
}

function createFolderItem(folder: Container, controllerName: string, isTopLevel: boolean): FolderMenuItem {
    return {
        href: buildURL(controllerName, `${ActionURL.getAction()}.view`, undefined, {
            container: folder.path,
            returnUrl: false,
        }),
        id: folder.id,
        isTopLevel,
        label: folder.title,
        path: folder.path,
    };
}

export interface FolderMenuProps {
    appProperties?: AppProperties;
    onClick: (item: FolderMenuItem) => void;
}

export const FolderMenu: FC<FolderMenuProps> = memo(({ appProperties = getCurrentAppProperties(), onClick }) => {
    const [error, setError] = useState<string>();
    const [loading, setLoading] = useState<LoadingState>(LoadingState.INITIALIZED);
    const [items, setItems] = useState<FolderMenuItem[]>([]);
    const hasError = !!error;
    const isLoaded = !isLoading(loading);
    const { api } = useAppContext<AppContext>();
    const { container } = useServerContext();

    useEffect(() => {
        setLoading(LoadingState.LOADING);
        setError(undefined);

        (async () => {
            try {
                const folders = await api.security.fetchContainers({
                    // Container metadata does not always provide "type" so inspecting the
                    // "parentPath" to determine top-level folder vs subfolder.
                    containerPath: container.parentPath === '/' ? container.path : container.parentPath,
                });

                const items_: FolderMenuItem[] = [];
                const topLevelFolderIdx = folders.findIndex(f => f.parentPath === '/');
                if (topLevelFolderIdx > -1) {
                    // Remove top-level folder from array as it is always displayed as the first menu item
                    const topLevelFolder = folders.splice(topLevelFolderIdx, 1)[0];
                    items_.push(createFolderItem(topLevelFolder, appProperties.controllerName, true));
                }

                // Issue 45805: sort folders by title as server-side sorting is insufficient
                folders.sort(naturalSortByProperty('title'));
                setItems(items_.concat(folders.map(folder => createFolderItem(folder, appProperties.controllerName, false))));
            } catch (e) {
                setError(`Error: ${resolveErrorMessage(e)}`);
            }

            setLoading(LoadingState.LOADED);
        })();
    }, [api, container, appProperties?.controllerName]);

    if (isLoaded && !hasError && items.length === 1) return null;

    return (
        <div className="menu-section col-folders">
            {hasError && <Alert>{error}</Alert>}
            {!isLoaded && !hasError && <LoadingSpinner />}
            {isLoaded && !hasError && (
                <ul>
                    {items.map(item => {
                        return (
                            <>
                                <li
                                    key={item.id}
                                    className={classNames({
                                        active: item.id === container.id,
                                        'menu-section-header': item.isTopLevel,
                                    })}
                                >
                                    <a className="menu-folder-item" onClick={() => onClick(item)}>{item.label}</a>
                                </li>
                                {item.isTopLevel && <hr />}
                            </>
                        );
                    })}
                </ul>
            )}
        </div>
    );
});

FolderMenu.displayName = 'FolderMenu';
