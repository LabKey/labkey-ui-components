/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { MouseEvent, FC, memo, useCallback, useState, useEffect } from 'react';
import classNames from 'classnames';
import { List, Map } from 'immutable';
import { DropdownButton } from 'react-bootstrap';

import { ActionURL } from '@labkey/api';

import { blurActiveElement } from '../../util/utils';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { useServerContext } from '../base/ServerContext';
import { AppProperties } from '../../app/models';
import { getAppProductIds, getCurrentAppProperties, getPrimaryAppProperties } from '../../app/utils';

import { Alert } from '../base/Alert';

import { isLoading, LoadingState } from '../../../public/LoadingState';
import { naturalSortByProperty } from '../../../public/sort';
import { resolveErrorMessage } from '../../util/messaging';
import { AppContext, useAppContext } from '../../AppContext';
import { Container } from '../base/models/Container';
import { buildURL } from '../../url/AppURL';

import { FolderMenu, FolderMenuItem } from './FolderMenu';
import { ProductMenuSection } from './ProductMenuSection';
import { MenuSectionConfig, MenuSectionModel, ProductMenuModel } from './model';

interface ProductMenuButtonProps {
    appProperties?: AppProperties;
    sectionConfigs: List<Map<string, MenuSectionConfig>>;
    showFolderMenu: boolean;
}

export const ProductMenuButton: FC<ProductMenuButtonProps> = memo(props => {
    const { appProperties = getCurrentAppProperties() } = props;
    const [menuOpen, setMenuOpen] = useState(false);
    const [error, setError] = useState<string>();
    const [loading, setLoading] = useState<LoadingState>(LoadingState.INITIALIZED);
    const [folderItems, setFolderItems] = useState<FolderMenuItem[]>([]);
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
                setFolderItems(
                    items_.concat(folders.map(folder => createFolderItem(folder, appProperties.controllerName, false)))
                );
            } catch (e) {
                setError(`Error: ${resolveErrorMessage(e)}`);
            }

            setLoading(LoadingState.LOADED);
        })();
    }, [api, container, appProperties?.controllerName]);

    const toggleMenu = useCallback(() => {
        setMenuOpen(!menuOpen);
        blurActiveElement();
    }, [menuOpen, setMenuOpen]);

    // Only toggle the menu closing if a menu section link has been clicked.
    // Clicking anywhere else inside the menu will not toggle the menu, including side panel folder clicks.
    const onClick = useCallback(
        (evt: MouseEvent<HTMLDivElement>) => {
            const { nodeName, className } = evt.target as any;
            if (!nodeName || (nodeName.toLowerCase() === 'a' && className !== 'menu-folder-item')) {
                toggleMenu();
            }
        },
        [toggleMenu]
    );

    if (!isLoaded && !hasError) return null;
    const showFolders = folderItems?.length > 1;
    const title = showFolders ? container.title : 'Menu';

    return (
        <DropdownButton
            className="product-menu-button"
            id="product-menu"
            onToggle={toggleMenu}
            open={menuOpen}
            title={title}
        >
            {menuOpen && (
                <ProductMenu
                    {...props}
                    className={classNames({ 'with-col-folders': showFolders })}
                    onClick={onClick}
                    error={error}
                    folderItems={folderItems}
                />
            )}
        </DropdownButton>
    );
});

interface ProductMenuProps extends ProductMenuButtonProps {
    className: string;
    error: string;
    folderItems: FolderMenuItem[];
    onClick: (evt: MouseEvent<HTMLDivElement>) => void;
}

const ProductMenu: FC<ProductMenuProps> = memo(props => {
    const {
        className,
        onClick,
        error,
        folderItems,
        sectionConfigs,
        showFolderMenu,
        appProperties = getCurrentAppProperties(),
    } = props;
    const { container } = useServerContext();
    const [menuModel, setMenuModel] = useState<ProductMenuModel>(new ProductMenuModel({ containerId: container.id }));

    useEffect(() => {
        (async () => {
            // no try/catch as the initMenuModel will catch errors and put them in the model isError/message
            const menuModel_ = await initMenuModel(appProperties, getPrimaryAppProperties().productId, container.id);
            setMenuModel(menuModel_);
        })();
    }, [appProperties, container.id]);

    const onFolderItemClick = useCallback(
        async (folderItem: FolderMenuItem) => {
            setMenuModel(new ProductMenuModel({ containerId: folderItem.id })); // loading state, reset error

            // no try/catch as the initMenuModel will catch errors and put them in the model isError/message
            const containerPath = folderItem.id === container.id ? undefined : folderItem.path;
            const menuModel_ = await initMenuModel(
                appProperties,
                getPrimaryAppProperties().productId,
                folderItem.id,
                containerPath
            );
            setMenuModel(menuModel_);
        },
        [appProperties, container.id]
    );

    const getSectionModel = useCallback(
        (key: string): MenuSectionModel => menuModel.sections.find(section => section.key === key),
        [menuModel]
    );

    return (
        <div
            className={classNames('product-menu-content', className, { error: !!menuModel.isError })}
            onClick={onClick}
        >
            <div className="navbar-connector" />
            {error && <Alert>{error}</Alert>}
            {showFolderMenu && (
                <FolderMenu activeContainerId={menuModel.containerId} items={folderItems} onClick={onFolderItemClick} />
            )}
            {!menuModel.isLoaded && (
                <div className="menu-section">
                    <LoadingSpinner />
                </div>
            )}
            {menuModel.isError && (
                <div className="menu-section">
                    <Alert>{menuModel.message}</Alert>
                </div>
            )}
            {menuModel.isLoaded &&
                sectionConfigs.map((sectionConfig, i) => (
                    <div key={i} className="menu-section col-product-section">
                        {sectionConfig.entrySeq().map(([key, menuConfig]) => (
                            <ProductMenuSection
                                key={key}
                                section={getSectionModel(key)}
                                config={menuConfig}
                                containerPath={menuModel.containerPath}
                                currentProductId={menuModel.currentProductId}
                            />
                        ))}
                    </div>
                ))}
        </div>
    );
});

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

async function initMenuModel(
    appProperties: AppProperties,
    userMenuProductId: string,
    containerId: string,
    containerPath?: string
): Promise<ProductMenuModel> {
    const primaryProductId = getPrimaryAppProperties().productId;
    const menuModel = new ProductMenuModel({
        containerId,
        containerPath,
        currentProductId: appProperties.productId,
        userMenuProductId: primaryProductId,
        productIds: getAppProductIds(primaryProductId),
    });

    try {
        const sections = await menuModel.getMenuSections();
        return menuModel.setLoadedSections(sections);
    } catch (e) {
        console.error('Problem retrieving product menu data.', e);
        return menuModel.setError('Error in retrieving product menu data. Please contact your site administrator.');
    }
}
