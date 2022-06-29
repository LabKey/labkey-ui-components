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
import React, { Component, ReactNode } from 'react';
import { List, Record } from 'immutable';
import classNames from 'classnames';

import { AppURL, naturalSort, createProductUrlFromParts } from '../../..';

import { MenuItemModel, MenuSectionModel } from './model';

function getHref(url: AppURL | string): string {
    return typeof url === 'string' ? url : url.toHref();
}

export class MenuSectionConfig extends Record({
    activeJobIconCls: 'fa-spinner fa-pulse',
    emptyText: undefined,
    emptyURL: undefined,
    emptyURLText: 'Get started...',
    headerURL: undefined,
    headerText: undefined,
    iconCls: undefined,
    iconURL: undefined,
    maxColumns: 1,
    maxItemsPerColumn: 12,
    seeAllURL: undefined,
    showActiveJobIcon: true,
}) {
    declare activeJobIconCls?: string;
    declare emptyText?: string;
    declare emptyURL?: AppURL | string;
    declare emptyURLText: string;
    declare headerURL: AppURL | string;
    declare headerText?: string;
    declare iconCls?: string;
    declare iconURL?: string;
    declare maxColumns: number;
    declare maxItemsPerColumn: number;
    declare seeAllURL?: AppURL | string;
    declare showActiveJobIcon?: boolean;
}

interface MenuSectionProps {
    section: MenuSectionModel;
    config: MenuSectionConfig;
    currentProductId: string;
}

export class ProductMenuSection extends Component<MenuSectionProps> {
    static defaultProps = {
        maxColumns: 1,
    };

    renderMenuItemsList = (items: List<MenuItemModel>, columnNumber = 1, totalColumns = 1): ReactNode => {
        const { config, section } = this.props;
        const { activeJobIconCls, showActiveJobIcon } = config;

        return (
            <ul className={'col-' + totalColumns} key={section.key + 'col-' + columnNumber}>
                {items.isEmpty() ? (
                    <>
                        {config.emptyText && (
                            <li key="empty" className="empty-section">
                                {config.emptyText}
                            </li>
                        )}
                        {config.emptyURL && (
                            <li key="emptyUrl" className="empty-section-link">
                                <a href={getHref(config.emptyURL)}>{config.emptyURLText}</a>
                            </li>
                        )}
                    </>
                ) : (
                    items
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
                                    <li key={item.label}>
                                        <a href={item.getUrlString()} target={item.key === 'docs' ? '_blank' : '_self'}>
                                            {labelDisplay}
                                        </a>
                                    </li>
                                );
                            }
                            return <li key={item.label}>{labelDisplay}</li>;
                        })
                )}
            </ul>
        );
    };

    render(): ReactNode {
        const { config, section } = this.props;
        let icon;
        if (!section) {
            return null;
        }

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
                {icon}&nbsp;{headerText}
            </>
        ) : (
            headerText
        );
        let { headerURL } = config;
        if (headerURL === undefined) {
            if (section.url) {
                headerURL = createProductUrlFromParts(
                    section.productId,
                    this.props.currentProductId,
                    undefined,
                    section.key
                );
            }
        }

        const allItems = section.items;
        const haveOverflow =
            section.totalCount > Math.min(section.items.size, config.maxColumns * config.maxItemsPerColumn); // totalCount may be larger than allItems.size
        let columnNum = 1;
        let startIndex = 0;
        let endIndex = Math.min(config.maxItemsPerColumn, allItems.size);
        const numColumns = Math.min(config.maxColumns, Math.ceil(allItems.size / config.maxItemsPerColumn));
        const columns = [
            this.renderMenuItemsList(allItems.slice(startIndex, endIndex).toList(), columnNum, numColumns),
        ];
        while (endIndex < allItems.size && columnNum < config.maxColumns) {
            startIndex = endIndex;
            endIndex = Math.min(endIndex + config.maxItemsPerColumn, allItems.size);
            columnNum++;
            columns.push(
                this.renderMenuItemsList(allItems.slice(startIndex, endIndex).toList(), columnNum, numColumns)
            );
        }
        if (haveOverflow) {
            columns.push(
                <span className="overflow-link" key="overflow">
                    <a href={getHref(config.seeAllURL ?? AppURL.create(section.key))}>See all {section.totalCount}</a>
                </span>
            );
        }

        return (
            <>
                <span className="menu-section-header">
                    {headerURL ? <a href={getHref(headerURL)}>{label}</a> : <>{label}</>}
                </span>
                <hr />
                {columns}
            </>
        );
    }
}
