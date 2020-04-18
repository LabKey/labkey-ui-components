import { Filter } from '@labkey/api';

import { URLResolver } from '../..';

import { LineageOptions, LineageURLResolvers } from './types';
import { LineageNode, LineageResult } from './models';

interface LineageURLResolver {
    resolveNodes: (result: LineageResult, acceptedTypes?: string[]) => LineageResult;
    resolveGroupedNodes: (nodes: LineageNode[]) => string;
}

export class AppLineageURLResolver implements LineageURLResolver {
    private static resolver = new URLResolver();

    resolveNodes = (result: LineageResult, acceptedTypes: string[] = ['Sample', 'Data']): LineageResult => {
        const updated = AppLineageURLResolver.resolver.resolveLineageNodes(result, acceptedTypes);

        return AppLineageURLResolver.resolver.resolveLineageNodes(result, acceptedTypes).set(
            'nodes',
            updated.nodes.map(node => {
                if (node && acceptedTypes.indexOf(node.type) >= 0 && node.cpasType) {
                    return node.set('links', {
                        overview: node.url,
                        lineage: node.url + '/lineage',
                        list: node.listURL,
                    });
                }

                return node;
            })
        ) as LineageResult;
    };

    resolveGroupedNodes = (nodes: LineageNode[]): string => {
        let listURL: string;

        if (nodes && nodes.length) {
            // arbitrarily choose the first node as the baseURL
            const baseURL = nodes[0].listURL;

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
    resolveNodes = (result: LineageResult): LineageResult => {
        return result.set(
            'nodes',
            result.nodes.map(node =>
                node.set('links', {
                    overview: node.url,
                    // does not currently have a corollary view in LKS
                    lineage: undefined,
                    list: undefined,
                })
            )
        ) as LineageResult;
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
