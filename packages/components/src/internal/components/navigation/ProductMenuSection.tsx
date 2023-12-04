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
import React, { FC, PureComponent, ReactNode } from 'react';
import classNames from 'classnames';
import { Link } from 'react-router-dom';

import { AppURL, createProductUrl, createProductUrlFromPartsWithContainer } from '../../url/AppURL';
import { naturalSort } from '../../../public/sort';
import { getHref } from '../../url/utils';

import { MenuSectionModel, MenuSectionConfig, MenuItemModel } from './model';

interface MenuSectionLinkProps {
    config: MenuSectionConfig;
    item: MenuItemModel;
}

const MenuSectionLink: FC<MenuSectionLinkProps> = ({ config, item }) => {
    const { activeJobIconCls, showActiveJobIcon, useOriginalURL } = config;
    const isAppUrl = (item.url instanceof AppURL || item.url.indexOf('#') === 0) && !useOriginalURL;
    const body =
        item.hasActiveJob && showActiveJobIcon ? (
            <>
                <i className={classNames('fa', activeJobIconCls)} />
                <span className="spacer-left product-menu-item">{item.label}</span>
            </>
        ) : (
            item.label
        );

    if (isAppUrl) {
        // Hack: sometimes our server returns strings that are actually proper AppURLs (workflow, eln, and more). We can
        // detect this by checking if the URL is prefixed with "#".
        const url = item.url instanceof AppURL ? item.url.toString() : item.url.replace('#', '');
        return <Link to={url}>{body}</Link>;
    }

    return <a href={item.url.toString()}>{body}</a>;
};

interface MenuSectionProps {
    config: MenuSectionConfig;
    containerPath: string;
    currentProductId: string;
    section: MenuSectionModel;
}

export class ProductMenuSection extends PureComponent<MenuSectionProps> {
    render(): ReactNode {
        const { config, section, currentProductId, containerPath } = this.props;
        const { activeJobIconCls, showActiveJobIcon } = config;

        if (!section) return null;

        let icon;
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
        const headerURL = config.useOriginalURL
            ? section.url
            : createProductUrlFromPartsWithContainer(
                  section.productId,
                  currentProductId,
                  containerPath,
                  undefined,
                  config.headerURLPart ?? section.key
              );
        const headerURLIsAppURL = headerURL instanceof AppURL;
        let headerEl = label;

        // In order to make sure we don't break useRouteLeave we need to use <Link> for AppURLs and <a> for non-app URLs
        if (headerURL && headerURLIsAppURL) {
            headerEl = <Link to={headerURL.toString()}>{label}</Link>;
        } else if (headerURL && !headerURLIsAppURL) {
            headerEl = <a href={getHref(headerURL)}>{label}</a>;
        }

        let emptyURL;
        if (config.emptyAppURL) {
            emptyURL = createProductUrl(section.productId, currentProductId, config.emptyAppURL, containerPath);
        }

        const visibleItems = section.items.filter(item => !item.hidden);

        return (
            <ul>
                <li className="menu-section-header clickable-item">
                    {headerEl}
                </li>
                <li>
                    <hr />
                </li>
                {section.items.isEmpty() || visibleItems.isEmpty() ? (
                    <>
                        {(config.emptyText || config.filteredEmptyText) && (
                            <li className="empty-section">
                                {section.items.isEmpty() ? config.emptyText : config.filteredEmptyText}
                            </li>
                        )}
                        {emptyURL && (
                            <li className="empty-section-link">
                                <a href={getHref(emptyURL)}>{config.emptyURLText}</a>
                            </li>
                        )}
                    </>
                ) : (
                    visibleItems
                        .sortBy(item => item.label, naturalSort)
                        .map(item => {
                            const labelDisplay =
                                item.hasActiveJob && showActiveJobIcon ? (
                                    <>
                                        <i className={classNames('fa', activeJobIconCls)} />
                                        <span className="spacer-left product-menu-item">{item.label}</span>
                                    </>
                                ) : (
                                    item.label
                                );

                            if (item.url) {
                                return (
                                    <li key={item.label} className="clickable-item">
                                        <MenuSectionLink config={config} item={item} />
                                    </li>
                                );
                            }
                            return <li key={item.label}>{labelDisplay}</li>;
                        })
                )}
            </ul>
        );
    }
}
