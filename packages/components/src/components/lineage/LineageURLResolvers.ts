import { ActionURL, Filter } from '@labkey/api';

import { URLResolver } from '../..';

import { LineageLinkMetadata, LineageOptions, LineageURLResolvers } from './types';
import { LineageBaseConfig, LineageNode } from './models';

export interface LineageURLResolver {
    resolveItem: (item: LineageBaseConfig) => LineageLinkMetadata;
    resolveGroupedNodes: (nodes: LineageNode[]) => string;
}

export class AppLineageURLResolver implements LineageURLResolver {
    private static resolver = new URLResolver();

    resolveItem = (item: LineageBaseConfig): LineageLinkMetadata => {
        return AppLineageURLResolver.resolver.resolveLineageItem(item);
    };

    resolveGroupedNodes = (nodes: LineageNode[]): string => {
        let listURL: string;

        if (nodes && nodes.length) {
            // all nodes are expected to share the same type/configuration
            const { links } = nodes[0];

            if (links.list) {
                const filter = createQueryFilterFromNodes(nodes);

                if (filter) {
                    // TODO: This is not how we should compose app URLs.
                    // This should use something like AppURL.fromString() (DNE). Imagine...
                    // listURL = AppURL.fromString(links.list).addFilters([filter]).toHref();
                    listURL = `${links.list}?${filter.getURLParameterName()}=${filter.getURLParameterValue()}`;
                }
            }
        }

        return listURL;
    };
}

export class ServerLineageURLResolver implements LineageURLResolver {
    resolveItem = (item: LineageBaseConfig): LineageLinkMetadata => {
        return {
            // does not currently have a corollary view in LKS
            lineage: undefined,
            list: undefined,
            overview: item.url,
        };
    };

    resolveGroupedNodes = (nodes: LineageNode[]): string => {
        let listURL: string;

        if (nodes && nodes.length) {
            // all nodes are expected to share the same type/configuration
            const { queryName, schemaName } = nodes[0];

            const filter = createQueryFilterFromNodes(nodes);

            if (filter) {
                listURL = ActionURL.buildURL('query', 'executeQuery.view', undefined, {
                    schemaName,
                    'query.queryName': queryName,
                    [filter.getURLParameterName()]: filter.getURLParameterValue(),
                });
            }
        }

        return listURL;
    };
}

const appResolver = new AppLineageURLResolver();
const serverResolver = new ServerLineageURLResolver();

export function getURLResolver(options?: LineageOptions): LineageURLResolver {
    if (options && options.urlResolver === LineageURLResolvers.Server) {
        return serverResolver;
    }

    return appResolver;
}

function createQueryFilterFromNodes(nodes: LineageNode[]): Filter.IFilter {
    if (nodes && nodes.length) {
        const { queryName, schemaName } = nodes[0];

        // ensure query configuration is consistent in the set
        if (nodes.every(n => n.schemaName === schemaName && n.queryName === queryName && n.pkFilters.length === 1)) {
            const { pkFilters } = nodes[0];

            if (pkFilters && pkFilters.length === 1) {
                const { fieldKey } = pkFilters[0];
                let filterType: Filter.IFilterType;
                let value: any;

                if (nodes.length === 1) {
                    filterType = Filter.Types.EQ;
                    value = pkFilters[0].value;
                } else {
                    filterType = Filter.Types.IN;
                    value = nodes.map(n => n.pkFilters[0].value);
                }

                return Filter.create(fieldKey, value, filterType);
            }
        }
    }

    return undefined;
}
