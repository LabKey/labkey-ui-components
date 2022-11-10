import { SchemaQuery } from '../public/SchemaQuery';

import { ProductMenuModel } from './components/navigation/model';
import { AppURL } from './url/AppURL';

export interface CommonPageProps {
    menu: ProductMenuModel;
    menuInit?: (invalidate?: boolean) => void;
    navigate: (url: string | AppURL, replace?: boolean) => void;
}

export function createGridModelId(gridId: string, schemaQuery: SchemaQuery, keyValue?: any): string {
    const parts = [gridId, schemaQuery.getKey()];

    if (schemaQuery && schemaQuery.viewName) {
        parts.push(schemaQuery.viewName);
    }
    if (keyValue !== undefined) {
        parts.push(keyValue);
    }

    return parts.join('|').toLowerCase();
}
