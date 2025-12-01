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
import { Map } from 'immutable';
import { Filter } from '@labkey/api';

import { SCHEMAS } from '../schemas';

import { selectRows } from '../query/selectRows';
import { caseInsensitive } from '../util/utils';
import { WORKFLOW_KEY } from '../app/constants';

import { AppRouteResolver } from './models';
import { decodeListResolverPath } from './utils';
import { AppURL, spliceURL } from './AppURL';

/**
 * Resolves list routes dynamically
 * /q/lists/$CPS<container_path>$CPE/22/14/... -> /q/lists/listByName/14/...
 */
export class ListResolver implements AppRouteResolver {
    fetched: boolean;
    lists: Map<string, string>; // Map<containerPath|listId, listName>

    constructor(lists?: Map<string, string>) {
        this.fetched = false;
        this.lists = lists !== undefined ? lists : Map<string, string>();
    }

    matches(route: string): boolean {
        return /\/q\/lists\/(\$CPS.+\$CPE)\/(\d+$|\d+)\/*/.test(decodeURIComponent(route));
    }

    async fetch(parts: any[]): Promise<AppURL> {
        // ["q", "lists", "/container/path", "44", ...]
        const containerPathIndex = 2;
        const listIdIndex = 3;
        const listIdNum = parseInt(parts[listIdIndex], 10);
        const containerPath = decodeListResolverPath(decodeURIComponent(parts[containerPathIndex]))?.toLowerCase();
        const key = [containerPath, listIdNum].join('|');

        if (isNaN(listIdNum) || !containerPath) {
            // skip it
            return;
        } else if (this.lists.has(key)) {
            // resolve it
            const newParts = [this.lists.get(key)];
            return spliceURL(parts, newParts, containerPathIndex, 2);
        } else if (this.fetched) {
            // skip it
            return undefined;
        }

        // fetch it
        try {
            const result = await selectRows({
                schemaQuery: SCHEMAS.LIST_METADATA_TABLES.LIST_MANAGER,
                columns: 'ListId,Name,Container/Path',
            });

            this.fetched = true;

            // fulfill local cache
            this.lists = result.rows
                .reduce<Map<string, string>>((map, list) => {
                    const _containerPath = caseInsensitive(list, 'Container/Path').value.toLowerCase();
                    const _listId = caseInsensitive(list, 'ListId').value;
                    const _name = caseInsensitive(list, 'Name').value.toLowerCase();

                    const _key = [_containerPath, _listId].join('|');
                    return map.set(_key, _name);
                }, Map<string, string>().asMutable())
                .asImmutable();

            // respond
            if (this.lists.has(key)) {
                // resolve it
                const newParts = [this.lists.get(key)];
                return spliceURL(parts, newParts, containerPathIndex, 2);
            }
        } catch (e) {
            // skip it
        }

        // skip it
        return undefined;
    }
}
