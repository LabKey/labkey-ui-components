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

import { blurActiveElement } from '../../util/utils';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { useServerContext } from '../base/ServerContext';
import { AppProperties } from '../../app/models';
import { getAppProductIds, getCurrentAppProperties, getPrimaryAppProperties } from '../../app/utils';

import { Alert } from '../base/Alert';

import { useFolderMenuContext } from './hooks';

import { ProductMenuSection } from './ProductMenuSection';
import { MenuSectionConfig, MenuSectionModel, ProductMenuModel } from './model';
import { FolderMenu, FolderMenuItem } from './FolderMenu';

interface ProductMenuButtonProps {
    appProperties?: AppProperties;
    sectionConfigs: List<Map<string, MenuSectionConfig>>;
    showFolderMenu: boolean;
}

export const ProductMenuButton: FC<ProductMenuButtonProps> = memo(props => {
    const [menuOpen, setMenuOpen] = useState(false);

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

    return (
        <DropdownButton
            className="product-menu-button"
            id="product-menu"
            onToggle={toggleMenu}
            open={menuOpen}
            title="Menu"
        >
            {menuOpen && <ProductMenu {...props} onClick={onClick} />}
        </DropdownButton>
    );
});

async function initMenuModel(
    appProperties: AppProperties,
    userMenuProductId: string,
    containerPath?: string
): Promise<ProductMenuModel> {
    const primaryProductId = getPrimaryAppProperties().productId;
    const menuModel = new ProductMenuModel({
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

interface ProductMenuProps extends ProductMenuButtonProps {
    onClick: (evt: MouseEvent<HTMLDivElement>) => void;
}

const ProductMenu: FC<ProductMenuProps> = memo(props => {
    const { onClick, sectionConfigs, showFolderMenu, appProperties = getCurrentAppProperties() } = props;
    const [menuModel, setMenuModel] = useState<ProductMenuModel>(new ProductMenuModel());
    const { container } = useServerContext();
    const folderMenuContext = useFolderMenuContext();

    useEffect(() => {
        (async () => {
            // no try/catch as the initMenuModel will catch errors and put them in the model isError/message
            const menuModel_ = await initMenuModel(appProperties, getPrimaryAppProperties().productId);
            setMenuModel(menuModel_);
        })();
    }, [appProperties, container.id]);

    const onFolderItemClick = useCallback(
        async (folderItem: FolderMenuItem) => {
            setMenuModel(new ProductMenuModel()); // loading state, reset error

            // no try/catch as the initMenuModel will catch errors and put them in the model isError/message
            const containerPath = folderItem.id === container.id ? undefined : folderItem.path;
            const menuModel_ = await initMenuModel(appProperties, getPrimaryAppProperties().productId, containerPath);
            setMenuModel(menuModel_);
        },
        [appProperties, container.id]
    );

    const getSectionModel = useCallback(
        (key: string): MenuSectionModel => menuModel.sections.find(section => section.key === key),
        [menuModel]
    );

    return (
        <div className={classNames('product-menu-content', { error: !!menuModel.isError })} onClick={onClick}>
            <div className="navbar-connector" />
            {showFolderMenu && <FolderMenu key={folderMenuContext.key} onClick={onFolderItemClick} />}
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
