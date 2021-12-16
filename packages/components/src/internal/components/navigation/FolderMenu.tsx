import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { ActionURL } from '@labkey/api';
import { Dropdown, MenuItem } from 'react-bootstrap';

import {
    Alert,
    buildURL,
    isLoading,
    LoadingSpinner,
    LoadingState,
    resolveErrorMessage,
    useServerContext,
} from '../../..';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';
import { getCurrentAppProperties } from '../../app/utils';
import { AppProperties } from '../../app/models';
import { blurActiveElement } from '../../util/utils';

interface FolderMenuItem {
    href: string;
    id: string;
    label: string;
}

interface Props {
    api?: ComponentsAPIWrapper;
    appProperties?: AppProperties;
}

export const FolderMenu: FC<Props> = memo(({ api, appProperties }) => {
    const { controllerName } = appProperties;
    const [error, setError] = useState<string>();
    const [loading, setLoading] = useState<LoadingState>(LoadingState.INITIALIZED);
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<FolderMenuItem[]>([]);
    const hasError = !!error;
    const isLoaded = !isLoading(loading);
    const { container } = useServerContext();

    useEffect(() => {
        setLoading(LoadingState.LOADING);
        setError(undefined);

        (async () => {
            try {
                const folders = await api.security.fetchContainers({
                    containerPath: container.type === 'project' ? container.path : container.parentPath,
                });

                const items_: FolderMenuItem[] = folders.map(folder => ({
                    href: buildURL(controllerName, `${ActionURL.getAction()}.view`, undefined, {
                        container: folder.path,
                        returnUrl: false,
                    }),
                    id: folder.id,
                    label: folder.name,
                }));

                setItems(items_);
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
            <Dropdown.Toggle className="nav-folder-menu__button">{container.name}</Dropdown.Toggle>
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

FolderMenu.defaultProps = {
    api: getDefaultAPIWrapper(),
    appProperties: getCurrentAppProperties(),
};

FolderMenu.displayName = 'FolderMenu';
