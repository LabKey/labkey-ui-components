import React, { FC, useCallback, RefObject, useRef, useEffect, useState, } from 'react';
import { TreeNode } from 'react-treebeard';

import { naturalSortByProperty, FileTree, } from '../../..';

import { DEFAULT_ROOT_PREFIX } from '../files/FileTree';

import { Header } from '../files/FileTreeHeader';
import { PathModel } from './models';
import { fetchChildPaths, fetchParentPaths } from './actions';
import classNames from 'classnames';

export class OntologyPath {
    id: string;
    name: string;
    children: undefined | PathNode[];
    conceptCode?: string;
    data?: PathModel;
}

type PathNode = OntologyPath & TreeNode;

// exported for jest testing
export const FilterIcon = props => {
    const { node, onClick, filters = new Map<string, PathModel>() } = props;

    const clickHandler = useCallback(
        evt => {
            evt.stopPropagation();
            onClick?.(node.data);
        },
        [node, onClick]
    );

    return (
        <i className={classNames('fa fa-filter', { selected: filters.has(node?.data?.code) })} onClick={clickHandler} />
    );
};

interface OntologyTreeProps {
    root: PathModel;
    onNodeSelection: (path: PathModel) => void;
    alternatePath?: PathModel;
    showFilterIcon?: boolean;
    filters?: Map<string, PathModel>;
    onFilterChange?: (changedNode: PathModel) => void;
}

export const OntologyTreePanel: FC<OntologyTreeProps> = props => {
    const { root, onNodeSelection, alternatePath, showFilterIcon = false, filters = new Map(), onFilterChange } = props;
    const [showLoading, setShowLoading] = useState<boolean>(false);
    const fileTreeRef: RefObject<FileTree> = useRef();

    // watch for changes to alternatePath so that we can make sure the tree data down to that node is loaded
    useEffect(() => {
        if (alternatePath?.path) {
            // Get the predecessors for the path, this provides the depth and nodes to potentially load
            fetchParentPaths(alternatePath.path).then(parentPaths => {
                // if this is a deeply nested path, let's mask the tree with a loading message while we toggle parents
                if (parentPaths.length > 5) setShowLoading(true);

                // Create callback in the event tree hasn't fully loaded
                const toggleParents = () => {
                    toggleParentPaths(fileTreeRef.current, alternatePath, parentPaths, true, () => {
                        scrollToActive(toggleParents);
                    });
                };

                toggleParentPaths(fileTreeRef.current, alternatePath, parentPaths, true, () => {
                    setShowLoading(false);
                    scrollToActive(toggleParents);
                });
            });
        }
    }, [alternatePath, setShowLoading]);

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
                        toggled: child.path === alternatePath?.path,
                        data: child,
                    };
                }
            );
        },
        //Needs to trigger for filters to ensure PathModels are loaded and update the FilterDialog values.
        [root, filters]
    );

    const onSelect = (name: string, path: string, checked: boolean, isDirectory: boolean, node: PathNode): boolean => {
        if (node.active) onNodeSelection(node?.data);
        return true;
    };

    const renderNodeHeader = props => {
        return (
        <Header {...props}>
            {showFilterIcon && <FilterIcon {...props} filters={filters} onClick={onFilterChange} />}
        </Header>);
    };

    return (
        <FileTree
            loadData={loadData}
            onFileSelect={onSelect}
            allowMultiSelect={false}
            showNodeIcon={false}
            defaultRootName={root.label}
            showLoading={showLoading}
            showAnimations={false}
            ref={fileTreeRef}
            headerDecorator={renderNodeHeader}
        />
    );
};

const getTreeNodeForPath = function (fileTree, path: string): any {
    return fileTree?.getDataNode(path, fileTree.state.data);
};

const toggleParentPaths = function (
    fileTree,
    alternatePath: PathModel,
    parentPaths: PathModel[],
    isRoot: boolean,
    callback: () => void
): void {
    const clone = [...parentPaths];
    const parentPath = isRoot ? DEFAULT_ROOT_PREFIX : clone[0].path;
    clone.shift();

    const node = getTreeNodeForPath(fileTree, parentPath);
    if (node) {
        fileTree.onToggle(node, true, alternatePath.path === node.id, () => {
            if (clone.length > 0) {
                toggleParentPaths(fileTree, alternatePath, clone, false, callback);
            } else {
                callback();
            }
        });
    } else if (clone.length > 0) {
        toggleParentPaths(fileTree, alternatePath, clone, false, callback);
    } else {
        callback();
    }
};

const scrollToActive = function (notReadyCallback?: () => void ): void {
    const activeEl = document.getElementsByClassName('filetree-node-active');
    if (activeEl.length > 0) {
        activeEl[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        setTimeout(notReadyCallback, 500);
    }
};
