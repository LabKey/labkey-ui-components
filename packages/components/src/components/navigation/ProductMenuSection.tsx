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
import { Record } from 'immutable';

import { AppURL } from '../../url/AppURL';
import { naturalSort } from '../../util/utils';

import { MenuSectionModel } from './model';
import { createProductUrlFromParts, getHref } from './utils';

export class MenuSectionConfig extends Record({
    emptyText: undefined,
    iconURL: undefined,
    iconCls: undefined,
    maxItemsPerColumn: 12,
    maxColumns: 1,
    seeAllURL: undefined,
    emptyURL: undefined,
    emptyURLText: 'Get started...',
    headerURL: undefined,
    headerText: undefined,
}) {
    emptyText?: string;
    iconURL?: string;
    iconCls?: string;
    maxItemsPerColumn: number;
    maxColumns: number;
    seeAllURL?: AppURL | string;
    emptyURL?: AppURL | string;
    emptyURLText: string;
    headerURL: AppURL | string;
    headerText?: string;
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

    renderEmpty = (): ReactNode => {
        const { config } = this.props;
        return (
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
        );
    };

    renderMenuItemsList = (items, columnNumber = 1, totalColumns = 1, withOverflow = false): ReactNode => {
        const { section } = this.props;

        return (
            <ul className={'col-' + totalColumns} key={section.key + 'col-' + columnNumber}>
                {items.isEmpty()
                    ? this.renderEmpty()
                    : items
                          .sortBy(item => item.label, naturalSort)
                          .map(item => {
                              if (item.url) {
                                  const url = item.url instanceof AppURL ? item.url.toHref() : item.url;
                                  return (
                                      <li key={item.label}>
                                          <a href={url} target={item.key === 'docs' ? '_blank' : '_self'}>
                                              {item.label}
                                          </a>
                                      </li>
                                  );
                              }
                              return <li key={item.label}>{item.label}</li>;
                          })}
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
        const headerText = config.headerText ? config.headerText : section.label;
        const label = icon ? (
            <>
                {icon}&nbsp;{headerText}
            </>
        ) : (
            headerText
        );
        let headerURL = config.headerURL;
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
        const header = (
            <>
                <span className="menu-section-header">
                    {headerURL ? <a href={getHref(headerURL)}>{label}</a> : <>{label}</>}
                </span>
                <hr />
            </>
        );

        const allItems = section.items;
        const haveOverflow =
            section.totalCount > Math.min(section.items.size, config.maxColumns * config.maxItemsPerColumn); // totalCount may be larger than allItems.size
        let columnNum = 1;
        let startIndex = 0;
        let endIndex = Math.min(config.maxItemsPerColumn, allItems.size);
        const numColumns = Math.min(config.maxColumns, Math.ceil(allItems.size / config.maxItemsPerColumn));
        const columns = [
            this.renderMenuItemsList(allItems.slice(startIndex, endIndex), columnNum, numColumns, haveOverflow),
        ];
        while (endIndex < allItems.size && columnNum < config.maxColumns) {
            startIndex = endIndex;
            endIndex = Math.min(endIndex + config.maxItemsPerColumn, allItems.size);
            columnNum++;
            columns.push(this.renderMenuItemsList(allItems.slice(startIndex, endIndex), columnNum, numColumns, false));
        }
        if (haveOverflow) {
            const seeAllUrl = config.seeAllURL || AppURL.create(section.key);
            columns.push(
                <span className="overflow-link" key="overflow">
                    <a href={getHref(seeAllUrl)}>See all {section.totalCount}</a>
                </span>
            );
        }

        return (
            <>
                {header}
                {columns}
            </>
        );
    }
}
