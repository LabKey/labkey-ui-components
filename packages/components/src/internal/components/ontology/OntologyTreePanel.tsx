import React, { FC, useCallback, RefObject, useRef, useEffect } from 'react';
import { TreeNode } from 'react-treebeard';

import { naturalSortByProperty, FileTree } from '../../..';

import { PathModel } from './models';
import { fetchChildPaths, fetchParentPaths } from './actions';
import { DEFAULT_ROOT_PREFIX } from '../files/FileTree';

export class OntologyPath {
    id: string;
    name: string;
    children: undefined | PathNode[];
    conceptCode?: string;
    data?: PathModel;
}

type PathNode = OntologyPath & TreeNode;

interface OntologyTreeProps {
    root: PathModel;
    onNodeSelection: (path: PathModel) => void;
    alternatePath?: PathModel;
}

export const OntologyTreePanel: FC<OntologyTreeProps> = props => {
    const { root, onNodeSelection, alternatePath } = props;
    const fileTreeRef: RefObject<FileTree> = useRef();

    // watch for changes to alternatePath so that we can make sure the tree data down to that node is loaded
    useEffect(() => {
        if (alternatePath?.path) {
            fetchParentPaths(alternatePath.path).then(parentPaths => {
                toggleParentPaths(fileTreeRef.current, alternatePath, parentPaths, true);
            });
        }
    }, [alternatePath]);

    const loadData = useCallback(
        async (ontologyPath: string = root.path): Promise<PathNode[]> => {
            const ontPath = await fetchChildPaths(ontologyPath);
            return ontPath?.children?.sort(naturalSortByProperty<PathModel>('label')).map(
                (child: PathModel): PathNode => {
                    return {
                        id: child.path,
                        name: child.label,
                        children: child.hasChildren ? [] : undefined,
                        conceptCode: child.code,
                        data: child,
                    };
                }
            );
        },
        [root]
    );

    const onSelect = (name: string, path: string, checked: boolean, isDirectory: boolean, node: PathNode): boolean => {
        if (node.active) onNodeSelection(node?.data);
        return true;
    };

    return (
        <FileTree
            loadData={loadData}
            onFileSelect={onSelect}
            allowMultiSelect={false}
            showNodeIcon={false}
            defaultRootName={root.label}
            ref={fileTreeRef}
        />
    );
};

const getTreeNodeForPath = function (fileTree, path: string): any {
    return fileTree.getDataNode(path, fileTree.state.data);
};

const toggleParentPaths = function (fileTree, alternatePath: PathModel, parentPaths: PathModel[], isRoot = false): void {
    const parentPath = isRoot ? DEFAULT_ROOT_PREFIX : parentPaths[0].path;
    parentPaths.shift();

    const node = getTreeNodeForPath(fileTree, parentPath);
    if (node) {
        fileTree.onToggle(node, true, alternatePath.path === node.id, () => {
            if (parentPaths.length > 0) toggleParentPaths(fileTree, alternatePath, parentPaths);
        });
    } else if (parentPaths.length > 0) {
        toggleParentPaths(fileTree, alternatePath, parentPaths);
    }
};
