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
import React, { FC, memo, ReactNode } from 'react';
import classNames from 'classnames';
import { Link } from 'react-router-dom';

import { AppURL, createProductUrl, createProductUrlFromPartsWithContainer } from '../../url/AppURL';
import { naturalSort } from '../../../public/sort';
import { getHref } from '../../url/utils';

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

const MenuSectionLink: FC<MenuSectionLinkProps> = ({ config, item }) => {
    // const isAppUrl = (item.url instanceof AppURL || item.url.indexOf('#') === 0) && !config.useOriginalURL;
    return (
        <AppLink to={item.url} className="menu-section-link">
            <MenuSectionItemLabel config={config} item={item} />
        </AppLink>
    );
};
MenuSectionLink.displayName = 'MenuSectionLink';

interface MenuSectionProps {
    config: MenuSectionConfig;
    containerPath: string;
    currentProductId: string;
    section: MenuSectionModel;
}

export const ProductMenuSection: FC<MenuSectionProps> = memo(props => {
    const { config, section, currentProductId, containerPath } = props;

    if (!section) return null;

    let icon: ReactNode;
    if (config.iconURL) {
        icon = (
            <img
                alt={section.label + ' icon'}
                className={'menu-section-image ' + (config.iconCls || '')}
                src={config.iconURL}
                height="24px"
                width="24px"
            />
        );
    } else if (config.iconCls) {
        icon = <span className={(config.iconCls || '') + ' menu-section-icon'} />;
    }
    const headerText = config.headerText ?? section.label;
    const label = icon ? (
        <>
            {icon} {headerText}
        </>
    ) : (
        headerText
    );

    let headerEl: ReactNode;
    if (label) {
        const headerURL = config.useOriginalURL
            ? section.url
            : createProductUrlFromPartsWithContainer(
                  section.productId,
                  currentProductId,
                  containerPath,
                  config.headerURLParams,
                  config.headerURLPart ?? section.key
              );

        const className = headerURL instanceof AppURL ? 'menu-section-link' : undefined;
        headerEl = (
            <AppLink to={headerURL} className={className}>
                {label}
            </AppLink>
        );
    }

    let emptyLink: ReactNode;
    if (config.emptyAppURL) {
        const emptyURL = createProductUrl(section.productId, currentProductId, config.emptyAppURL, containerPath);
        emptyLink = (
            <AppLink to={emptyURL} className="menu-section-link">
                {config.emptyURLText}
            </AppLink>
        );
    }

    const visibleItems = section.items.filter(item => !item.hidden).sortBy(item => item.label, naturalSort);
    const isEmpty = section.items.isEmpty() || visibleItems.isEmpty();

    return (
        <>
            <div className="product-menu-section-header">
                <ul>
                    <li className="menu-section-header clickable-item">{headerEl}</li>
                    <li>
                        <hr />
                    </li>
                </ul>
            </div>
            <div className={classNames('product-menu-section', { 'menu-section-static': config.staticContent })}>
                <ul>
                    {isEmpty && (
                        <>
                            {(config.emptyText || config.filteredEmptyText) && (
                                <li className="empty-section">
                                    {section.items.isEmpty() ? config.emptyText : config.filteredEmptyText}
                                </li>
                            )}
                            {emptyLink && <li className="empty-section-link">{emptyLink}</li>}
                        </>
                    )}
                    {!isEmpty &&
                        visibleItems
                            .map(item => {
                                if (item.url) {
                                    return (
                                        <li key={item.label} className="clickable-item">
                                            <MenuSectionLink config={config} item={item} />
                                        </li>
                                    );
                                }

                                return (
                                    <li key={item.label}>
                                        <MenuSectionItemLabel config={config} item={item} />
                                    </li>
                                );
                            })
                            .toArray()}
                </ul>
            </div>
        </>
    );
});

ProductMenuSection.displayName = 'ProductMenuSection';
