import { Filter } from '@labkey/api';

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
            // arbitrarily choose the first node as the baseURL
            const baseURL = nodes[0].links.list;

            const filter = Filter.create(
                'RowId',
                nodes.map(n => n.id),
                Filter.Types.IN
            );
            const suffix = '?' + filter.getURLParameterName() + '=' + filter.getURLParameterValue();

            listURL = baseURL + suffix;
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
        // NYI
        return undefined;
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
