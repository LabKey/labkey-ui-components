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
import { ActionURL, Ajax, Utils, QueryKey } from '@labkey/api';

import { AppURL } from '../../url/AppURL';
import { buildURL } from '../../url/ActionURL';
import { createApplicationUrl, createApplicationUrlFromParts } from './utils';

export class MenuSectionModel extends Record({
    label: undefined,
    url: undefined,
    items: List<MenuItemModel>(),
    totalCount: 0,
    itemLimit: undefined,
    key: undefined,
    productId: undefined,
}) {
    label: string;
    url: string;
    items: List<MenuItemModel>;
    totalCount: number;
    itemLimit: number;
    key: string;
    productId: string;

    constructor(values?: { [key: string]: any }) {
        super(values);
    }

    static create(rawData: any, currentProductId?: string): MenuSectionModel {
        if (rawData) {
            let items;

            if (rawData.items) {
                items = rawData.items.map(i => MenuItemModel.create(i, rawData.key, currentProductId));
            }

            return new MenuSectionModel(
                Object.assign({}, rawData, {
                    items: List(items),
                })
            );
        }

        return new MenuSectionModel();
    }
}

export class MenuItemModel extends Record({
    id: undefined,
    key: undefined,
    label: undefined,
    url: undefined,
    orderNum: undefined,
    requiresLogin: false,
}) {
    id: number;
    key: string;
    label: string;
    url: string | AppURL;
    orderNum: number;
    requiresLogin: boolean;

    constructor(values?: { [key: string]: any }) {
        super(values);
    }

    static create(rawData, sectionKey: string, currentProductId?: string): MenuItemModel {
        if (rawData) {
            const dataProductId = rawData.productId ? rawData.productId.toLowerCase() : undefined;

            if (rawData.key && sectionKey !== 'user') {
                const parts = rawData.key.split('?');

                // for assay name that contains slash, full raw key (protocol/assayname: general/a/b) is encoded using QueryKey.encodePart as general/a$Sb on server side
                // use QueryKey.decodePart to decode the assay name so url can be correctly called by encodeURIComponent and key be used to display decoded assay name
                const subParts = parts[0]
                    .split('/')
                    .filter(val => val !== '')
                    .map(val => QueryKey.decodePart(val));

                const decodedPart = subParts.join('/');
                const decodedKey = rawData.key.replace(parts[0], decodedPart);

                let params;
                if (parts.length > 1 && parts[1]) {
                    params = ActionURL.getParameters(rawData.key);
                }

                return new MenuItemModel(
                    Object.assign({}, rawData, {
                        url: createApplicationUrlFromParts(dataProductId, currentProductId, params, sectionKey, ...subParts),
                        key: decodedKey,
                    })
                );
            } else {
                return new MenuItemModel(
                    Object.assign({}, rawData, {
                        url: createApplicationUrl(dataProductId, currentProductId, rawData.url),
                    })
                );
            }
        }
        return new MenuItemModel();
    }

    getUrlString(): string {
        return typeof this.url === 'string' ? this.url : this.url.toHref();
    }
}

export class ProductMenuModel extends Record({
    isError: false,
    isLoaded: false,
    isLoading: false,
    sections: List<MenuSectionModel>(),
    message: undefined,
    currentProductId: undefined,
    userMenuProductId: undefined,
    productIds: undefined,
}) {
    isError: boolean;
    isLoaded: boolean;
    isLoading: boolean;
    message: string;
    sections: List<MenuSectionModel>;
    currentProductId: string; // the current product's id
    userMenuProductId: string; // the product's id for the user menu items
    productIds: List<string>; // the list of all product ids to be included in the menu; leave undefined for all products in the container

    constructor(values?: { [key: string]: any }) {
        super(values);
    }

    init() {
        if (!this.isLoaded && !this.isLoading) {
            this.getMenuSections()
                .then(sections => {
                    return this.setLoadedSections(sections.asImmutable());
                })
                .catch(reason => {
                    console.error('Problem retrieving product menu data.', reason);
                    return this.setError(
                        'Error in retrieving product menu data. Please contact your site administrator.'
                    );
                });
        }
    }

    /**
     * Retrieve the product menu sections for this productId
     */
    getMenuSections(): Promise<List<MenuSectionModel>> {
        return new Promise((resolve, reject) => {
            return Ajax.request({
                url: buildURL('product', 'menuSections.api'),
                method: 'GET',
                params: Object.assign({
                    currentProductId: this.currentProductId,
                    userMenuProductId: this.userMenuProductId,
                    productIds: List.isList(this.productIds) ? this.productIds.toArray().join(',') : this.productIds,
                }),
                success: Utils.getCallbackWrapper(response => {
                    const sections = List<MenuSectionModel>().asMutable();
                    response.forEach(sectionData => {
                        sections.push(MenuSectionModel.create(sectionData, this.currentProductId));
                    });
                    resolve(sections.asImmutable());
                }),
                failure: Utils.getCallbackWrapper(response => {
                    reject(response);
                }),
            });
        });
    }

    setLoadedSections(sections: List<MenuSectionModel>): ProductMenuModel {
        return this.merge({
            isLoaded: true,
            isLoading: false,
            sections,
        }) as ProductMenuModel;
    }

    setError(message: string): ProductMenuModel {
        return this.merge({
            isLoading: false,
            isLoaded: true,
            isError: true,
            message,
        }) as ProductMenuModel;
    }

    getSection(key: string): MenuSectionModel {
        if (this.sections.size > 0) {
            return this.sections.filter(section => section.key.toLowerCase() === key.toLowerCase()).first();
        }
    }

    hasSectionItems(key: string): boolean {
        const section = this.getSection(key);
        return this.isLoaded && section && section.totalCount > 0;
    }
}
