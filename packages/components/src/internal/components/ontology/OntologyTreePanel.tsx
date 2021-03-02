import React, { FC, useCallback } from 'react';
import { TreeNode } from 'react-treebeard';

import { naturalSortByProperty, FileTree } from '../../..';

import { PathModel } from './models';
import { fetchChildPaths } from './actions';

export class OntologyPath {
    id: string;
    name: string;
    children: undefined | PathNode[];
    conceptCode?: string;
}

type PathNode = OntologyPath & TreeNode;

interface OntologyTreeProps {
    root: PathModel;
    onNodeSelection: (conceptCode: string) => void;
}

export const OntologyTreePanel: FC<OntologyTreeProps> = props => {
    const { root, onNodeSelection } = props;
    const loadData = useCallback(
        async (ontologyPath: string = root.path): Promise<PathNode[]> => {
            const ontPath = await fetchChildPaths(ontologyPath);
            return ontPath?.children?.sort(naturalSortByProperty<PathModel>('label')).map(
                (child: PathModel): PathNode => {
                    return {
                        id: child.path,
                        name: child.label, // TODO this should really be calculated from concept...
                        children: child.hasChildren ? [] : undefined,
                        conceptCode: child.code,
                    };
                }
            );
        },
        [root]
    );

    const onSelect = (a: string, b: string, c: boolean, d: boolean, node: PathNode): boolean => {
        onNodeSelection(node?.conceptCode);
        return true;
    };

    return (
        <FileTree
            loadData={loadData}
            onFileSelect={onSelect}
            allowMultiSelect={false}
            showNodeIcon={false}
            defaultRootName={root.label}
        />
    );
};
