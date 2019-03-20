import { List, Record } from 'immutable';
import { AppURL } from '@glass/utils';

export class MenuSectionModel extends Record( {
    label: undefined,
    url: undefined,
    items: List<MenuItemModel>(),
    totalCount: 0,
    itemLimit: undefined,
    key: undefined
}) {
    label: string;
    url: string;
    items: List<MenuItemModel>;
    totalCount: number;
    itemLimit: number;
    key: string;

    constructor(values?: {[key:string]: any}) {
        super(values);
    }

    static create(rawData): MenuSectionModel {
        if (rawData) {
            let items;

            if (rawData.items) {
                items = rawData.items.map(i => MenuItemModel.create(i, rawData.key));
            }

            return new MenuSectionModel(Object.assign({}, rawData, {
                items: List(items)
            }));
        }

        return new MenuSectionModel();
    }
}

export class MenuItemModel extends Record ({
    id: undefined,
    key: undefined,
    label: undefined,
    url: undefined,
    orderNum: undefined,
    requiresLogin: false
}) {
    id: number;
    key: string;
    label: string;
    url: string | AppURL;
    orderNum: number;
    requiresLogin: boolean;

    constructor(values?: {[key:string]: any}) {
        super(values);
    }

    static create(rawData, sectionKey: string) : MenuItemModel {
        if (rawData) {
            if (rawData.key && sectionKey !== "user") {
                return new MenuItemModel(Object.assign({}, rawData, {
                    url: AppURL.create(sectionKey, ...rawData.key.split("/"))
                }));
            }
            else {
                return new MenuItemModel(rawData);
            }
        }
        return new MenuItemModel();
    }
}

export type IMenuSectionsResponse = List<MenuSectionModel>;

export class ProductMenuModel extends Record( {
    isError: false,
    isLoaded: false,
    isLoading: false,
    sections: List<MenuSectionModel>(),
    message: undefined,
    productId: undefined

}) {
    isError: boolean;
    isLoaded: boolean;
    isLoading: boolean;
    message: string;
    sections: List<MenuSectionModel>;
    productId: string;
    error: string;

    constructor(values?: {[key: string]: any}) {
        super(values);
    }

    getSection(key: string)
    {
        if (this.sections.size > 0) {
            return this.sections
                .filter((section) => section.key.toLowerCase() === key.toLowerCase())
                .first();
        }
    }
}