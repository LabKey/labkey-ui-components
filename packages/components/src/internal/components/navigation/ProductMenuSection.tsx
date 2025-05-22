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
import React, { FC, memo } from 'react';
import classNames from 'classnames';

import { AppURL } from '../../url/AppURL';
import { naturalSort } from '../../../public/sort';

import { AppLink } from '../../url/AppLink';

import { MenuSectionModel, MenuSectionConfig, MenuItemModel } from './model';

interface MenuSectionLinkProps {
    config: MenuSectionConfig;
    item: MenuItemModel;
}

const MenuSectionItemLabel: FC<MenuSectionLinkProps> = memo(({ config, item }) => {
    if (item.hasActiveJob && config.showActiveJobIcon) {
        return (
            <>
                <i className={classNames('fa', config.activeJobIconCls)} />
                <span className="spacer-left product-menu-item">{item.label}</span>
            </>
        );
    }

    return <>{item.label}</>;
});

MenuSectionItemLabel.displayName = 'MenuSectionItemLabel';

const MenuSectionLink: FC<MenuSectionLinkProps> = ({ config, item }) => (
    <AppLink to={item.url ?? item.originalUrl} className="menu-section-link">
        <MenuSectionItemLabel config={config} item={item} />
    </AppLink>
);
MenuSectionLink.displayName = 'MenuSectionLink';

const MenuSectionItem: FC<MenuSectionLinkProps> = ({ item, config }) => {
    const isUrl = !!(item.url || item.originalUrl);
    const className = isUrl ? 'clickable-item' : '';
    return (
        <li className={className}>
            {isUrl && <MenuSectionLink config={config} item={item} />}
            {!isUrl && <MenuSectionItemLabel config={config} item={item} />}
        </li>
    );
};
MenuSectionItem.displayName = 'MenuSectionItem';

interface MenuSectionProps {
    config: MenuSectionConfig;
    containerPath: string;
    section: MenuSectionModel;
}

export const ProductMenuSection: FC<MenuSectionProps> = memo(props => {
    const { config, section, containerPath } = props;
    const headerText = config.headerText ?? section.label;
    const headerURL = config.useOriginalURL
        ? section.url
        : AppURL.create(config.headerURLPart ?? section.key)
              .addParams(config.headerURLParams)
              .setContainerPath(containerPath)
              .setProductId(section.productId);

    const headerLinkClassName = headerURL instanceof AppURL ? 'menu-section-link' : undefined;
    const visibleItems = section.items
        .filter(item => !item.hidden)
        .sortBy(item => item.label, naturalSort)
        .toArray();
    const isEmpty = visibleItems.length === 0;
    const emptyText = section.items.isEmpty() ? config.emptyText : config.filteredEmptyText;
    const emptyAppUrl = config.emptyAppURL?.setContainerPath(containerPath);

    return (
        <>
            <div className="product-menu-section-header">
                <ul>
                    <li className="menu-section-header clickable-item">
                        <AppLink to={headerURL} className={headerLinkClassName}>
                            <img
                                alt={section.label + ' icon'}
                                className="menu-section-image"
                                src={config.iconURL}
                                height="24px"
                                width="24px"
                            />
                            <span className="menu-section-header__text">{headerText}</span>
                        </AppLink>
                    </li>
                    <li>
                        <hr />
                    </li>
                </ul>
            </div>
            <div className={classNames('product-menu-section', { 'menu-section-static': config.staticContent })}>
                <ul>
                    {isEmpty && emptyText && <li className="empty-section">{emptyText}</li>}
                    {isEmpty && emptyAppUrl && (
                        <li className="empty-section-link">
                            <AppLink to={emptyAppUrl} className="menu-section-link">
                                {config.emptyURLText}
                            </AppLink>
                        </li>
                    )}
                    {visibleItems.map(item => (
                        <MenuSectionItem key={item.label} config={config} item={item} />
                    ))}
                </ul>
            </div>
        </>
    );
});

ProductMenuSection.displayName = 'ProductMenuSection';
