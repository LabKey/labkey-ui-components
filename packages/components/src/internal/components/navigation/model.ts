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
import { List, Record } from 'immutable';
import { Ajax, Utils, QueryKey } from '@labkey/api';

import { buildURL, createProductUrl, AppURL, createProductUrlFromPartsWithContainer } from '../../url/AppURL';

export class MenuSectionModel extends Record({
    label: undefined,
    url: undefined,
    items: List<MenuItemModel>(),
    totalCount: 0,
    key: undefined,
    productId: undefined,
    sectionKey: undefined,
}) {
    declare label: string;
    declare url: string;
    declare items: List<MenuItemModel>;
    declare totalCount: number;
    declare key: string;
    declare productId: string;
    declare sectionKey: string;

    static create(rawData: any, currentProductId?: string, containerPath?: string): MenuSectionModel {
        if (rawData) {
            let items;

            if (rawData.items) {
                items = rawData.items.map(i =>
                    MenuItemModel.create(i, rawData.sectionKey, currentProductId, containerPath)
                );
            }

            return new MenuSectionModel(
                Object.assign({}, rawData, {
                    items: List(items),
                })
            );
        }

        return new MenuSectionModel();
    }

    getVisibleItems(): MenuItemModel[] {
        return this.items.filter(item => !item.hidden).toArray();
    }

    hasVisibleItems(): boolean {
        return this.getVisibleItems().length > 0;
    }
}

export class MenuItemModel extends Record({
    id: undefined,
    key: undefined,
    label: undefined,
    url: undefined,
    hidden: false,
    orderNum: undefined,
    originalUrl: undefined,
    requiresLogin: false,
    hasActiveJob: false,
    fromSharedContainer: false,
}) {
    declare id: number;
    declare key: string;
    declare label: string;
    declare url: string | AppURL;
    declare hidden: boolean;
    declare orderNum: number;
    declare originalUrl: string;
    declare requiresLogin: boolean;
    declare hasActiveJob: boolean;
    declare fromSharedContainer: boolean;

    static create(rawData, sectionKey: string, currentProductId?: string, containerPath?: string): MenuItemModel {
        if (rawData) {
            const dataProductId = rawData.productId ? rawData.productId.toLowerCase() : undefined;

            if (rawData.key && sectionKey !== 'user') {
                // for assay names and freezer names that contain slashes, full raw key (protocol/assayname: general/a/b) is encoded using QueryKey.encodePart as general/a$Sb on server side
                // use QueryKey.decodePart to decode the name so url can be correctly called by encodeURIComponent and key be used to display decoded assay name
                const subParts = rawData.key
                    .split('/')
                    .filter(val => val !== '')
                    .map(QueryKey.decodePart);

                const decoded = subParts.join('/');
                const decodedKey = rawData.key.replace(rawData.key, () => decoded); // use the functional version to skip any additional pattern substitutions https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_string_as_the_replacement

                return new MenuItemModel(
                    Object.assign({}, rawData, {
                        originalUrl: rawData.url,
                        url: createProductUrlFromPartsWithContainer(
                            dataProductId,
                            currentProductId,
                            containerPath,
                            undefined,
                            sectionKey,
                            ...subParts
                        ),
                        key: decodedKey,
                    })
                );
            } else {
                return new MenuItemModel(
                    Object.assign({}, rawData, {
                        originalUrl: rawData.url,
                        url: createProductUrl(dataProductId, currentProductId, rawData.url, containerPath),
                    })
                );
            }
        }
        return new MenuItemModel();
    }

    getUrlString(useOriginalUrl?: boolean): string {
        if (useOriginalUrl && this.originalUrl) return this.originalUrl;
        return typeof this.url === 'string' ? this.url : this.url?.toHref();
    }
}

export class ProductMenuModel extends Record({
    isError: false,
    isLoaded: false,
    isLoading: false,
    sections: List<MenuSectionModel>(),
    message: undefined,
    containerId: undefined,
    containerPath: undefined,
    currentProductId: undefined,
    productIds: undefined,
    needsReload: false,
}) {
    declare isError: boolean;
    declare isLoaded: boolean;
    declare isLoading: boolean;
    declare message: string;
    declare sections: List<MenuSectionModel>;
    declare containerId: string;
    declare containerPath: string;
    declare currentProductId: string; // the current product's id
    declare productIds: List<string>; // the list of all product ids to be included in the menu; leave undefined for all products in the container
    declare needsReload: boolean;

    /**
     * Retrieve the product menu sections for this productId
     */
    getMenuSections(): Promise<List<MenuSectionModel>> {
        return new Promise((resolve, reject) => {
            return Ajax.request({
                url: buildURL('product', 'menuSections.api', undefined, {
                    container: this.containerPath,
                }),
                params: Object.assign({
                    currentProductId: this.currentProductId,
                    productIds: List.isList(this.productIds) ? this.productIds.toArray().join(',') : this.productIds,
                }),
                success: Utils.getCallbackWrapper(response => {
                    let sections = List<MenuSectionModel>();
                    if (response) {
                        response.forEach(sectionData => {
                            sections = sections.push(
                                MenuSectionModel.create(sectionData, this.currentProductId, this.containerPath)
                            );
                        });
                    }
                    resolve(sections);
                }),
                failure: Utils.getCallbackWrapper(response => {
                    console.error(response);
                    reject(response);
                }),
            });
        });
    }

    setLoadedSections(sections: List<MenuSectionModel>): ProductMenuModel {
        return this.merge({
            isLoaded: true,
            isLoading: false,
            needsReload: false,
            sections,
        }) as ProductMenuModel;
    }

    setError(message: string): ProductMenuModel {
        return this.merge({
            isLoaded: true,
            isLoading: false,
            needsReload: false,
            isError: true,
            message,
        }) as ProductMenuModel;
    }

    getSection(key: string): MenuSectionModel {
        return this.sections.find(section => section.key.toLowerCase() === key.toLowerCase());
    }

    hasSectionItems(key: string): boolean {
        return this.isLoaded && this.getSection(key)?.totalCount > 0;
    }

    setNeedsReload(): ProductMenuModel {
        return this.merge({
            needsReload: true,
        }) as ProductMenuModel;
    }
}

export class MenuSectionConfig extends Record({
    activeJobIconCls: 'fa-spinner fa-pulse',
    emptyText: undefined,
    filteredEmptyText: undefined,
    emptyAppURL: undefined,
    emptyURLText: 'Get started...',
    headerURLPart: undefined,
    headerText: undefined,
    iconCls: undefined,
    iconURL: undefined,
    showActiveJobIcon: true,
    staticContent: false,
    useOriginalURL: false,
}) {
    declare activeJobIconCls?: string;
    declare emptyText?: string;
    declare filteredEmptyText?: string;
    declare emptyAppURL?: AppURL;
    declare emptyURLText: string;
    declare headerURLPart: string;
    declare headerText?: string;
    declare iconCls?: string;
    declare iconURL?: string;
    declare showActiveJobIcon?: boolean;
    // Inform the display that this section's content is static (unchanging).
    // This helps inform the layout when these sections are laid out alongside sections with dynamic content.
    declare staticContent?: boolean;
    declare useOriginalURL?: boolean;
}
