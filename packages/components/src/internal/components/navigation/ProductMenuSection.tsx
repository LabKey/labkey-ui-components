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
import React, { PureComponent, ReactNode, FC, memo } from 'react';
import classNames from 'classnames';

import { AppURL, createProductUrl, createProductUrlFromPartsWithContainer } from '../../url/AppURL';
import { naturalSort } from '../../../public/sort';
import { getHref } from '../../url/utils';
import { getPrimaryAppProperties } from '../../app/utils';

import { useServerContext } from '../base/ServerContext';

import { MenuSectionModel, MenuSectionConfig } from './model';

interface MenuSectionProps {
    config: MenuSectionConfig;
    containerPath: string;
    currentProductId: string;
    dashboardImgURL?: string;
    section: MenuSectionModel;
    hideEmptyUrl?: boolean;
}

export class ProductMenuSection extends PureComponent<MenuSectionProps> {
    render(): ReactNode {
        const { config, section, currentProductId, containerPath, hideEmptyUrl, dashboardImgURL } = this.props;
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

        let emptyURL;
        if (config.emptyAppURL) {
            emptyURL = createProductUrl(section.productId, currentProductId, config.emptyAppURL, containerPath);
        }

        return (
            <ul>
                <li className="menu-section-header clickable-item">
                    {headerURL ? <a href={getHref(headerURL)}>{label}</a> : <>{label}</>}
                </li>
                <li>
                    <hr />
                </li>
                {section.items.isEmpty() ? (
                    <>
                        {config.emptyText && <li className="empty-section">{config.emptyText}</li>}
                        {emptyURL && !hideEmptyUrl && (
                            <li className="empty-section-link">
                                <a href={getHref(emptyURL)}>{config.emptyURLText}</a>
                            </li>
                        )}
                    </>
                ) : (
                    section.items
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
                                        <a href={item.getUrlString(config.useOriginalURL)} target="_self">
                                            {labelDisplay}
                                        </a>
                                    </li>
                                );
                            }
                            return <li key={item.label}>{labelDisplay}</li>;
                        })
                )}
                {dashboardImgURL && (
                    <DashboardSectionHeader
                        currentProductId={currentProductId}
                        containerPath={containerPath}
                        src={dashboardImgURL}
                    />
                )}
            </ul>
        );
    }
}

interface DashboardSectionHeaderProps {
    containerPath: string;
    currentProductId: string;
    src: string;
}

const DashboardSectionHeader: FC<DashboardSectionHeaderProps> = memo(props => {
    const { src, currentProductId, containerPath } = props;
    const { moduleContext } = useServerContext();

    return (
        <li className="menu-section-header clickable-item">
            <a
                href={getHref(
                    createProductUrl(
                        getPrimaryAppProperties(moduleContext).productId,
                        currentProductId,
                        AppURL.create('home'),
                        containerPath
                    )
                )}
            >
                <img alt="Dashboard icon" className="menu-section-image" src={src} height="24px" width="24px" />{' '}
                Dashboard
            </a>
        </li>
    );
});
