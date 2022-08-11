import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { ActionURL } from '@labkey/api';
import { Dropdown, MenuItem } from 'react-bootstrap';

import {
    Alert,
    AppContext,
    buildURL,
    Container,
    isLoading,
    LoadingSpinner,
    LoadingState,
    naturalSortByProperty,
    resolveErrorMessage,
    useAppContext,
    useServerContext,
} from '../../..';

import { getCurrentAppProperties } from '../../app/utils';
import { blurActiveElement } from '../../util/utils';
import { AppProperties } from '../../app/models';

interface FolderMenuItem {
    href: string;
    id: string;
    label: string;
}

function createFolderItem(folder: Container, controllerName: string): FolderMenuItem {
    return {
        href: buildURL(controllerName, `${ActionURL.getAction()}.view`, undefined, {
            container: folder.path,
            returnUrl: false,
        }),
        id: folder.id,
        label: folder.title,
    };
}

interface Props {
    appProperties?: AppProperties;
}

export const FolderMenu: FC<Props> = memo(({ appProperties }) => {
    const { controllerName } = appProperties ?? getCurrentAppProperties();
    const [error, setError] = useState<string>();
    const [loading, setLoading] = useState<LoadingState>(LoadingState.INITIALIZED);
    const [open, setOpen] = useState(false);
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
                    items_.push(createFolderItem(topLevelFolder, controllerName));
                }

                // Issue 45805: sort folders by title as server-side sorting is insufficient
                folders.sort(naturalSortByProperty('title'));
                setItems(items_.concat(folders.map(folder => createFolderItem(folder, controllerName))));
            } catch (e) {
                setError(`Error: ${resolveErrorMessage(e)}`);
            }

            setLoading(LoadingState.LOADED);
        })();
    }, [api, container, controllerName]);

    const toggleMenu = useCallback(() => {
        setOpen(!open);
        blurActiveElement();
    }, [open]);

    return (
        <Dropdown className="nav-folder-menu" id="folder-menu" onToggle={toggleMenu} open={open}>
            <Dropdown.Toggle className="nav-folder-menu__button" title={container.title}>
                {container.title}
            </Dropdown.Toggle>
            <Dropdown.Menu>
                <div className="navbar-connector" />
                {hasError && <Alert>{error}</Alert>}
                {!isLoaded && !hasError && (
                    <MenuItem disabled>
                        <LoadingSpinner />
                    </MenuItem>
                )}
                {isLoaded &&
                    !hasError &&
                    items.map(item => (
                        <MenuItem active={item.id === container.id} href={item.href} key={item.id}>
                            {item.label}
                        </MenuItem>
                    ))}
            </Dropdown.Menu>
        </Dropdown>
    );
});

FolderMenu.displayName = 'FolderMenu';
