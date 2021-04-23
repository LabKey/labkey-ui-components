import React, { FC, useCallback, RefObject, useRef, useEffect, useState, memo } from 'react';
import { TreeNode } from 'react-treebeard';

import { naturalSortByProperty, FileTree, LoadingSpinner } from '../../..';

import { DEFAULT_ROOT_PREFIX } from '../files/FileTree';

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

    // TODO should we tag the parent nodes that have children with filters on them, which path if we are working from a concept code
    // const [childSelected, setChildSelected] = useState<boolean>([...filters].some(filter => filter?.path?.startsWith(node?.data?.path)));
    // useEffect(() => {
    //     setChildSelected(
    //         [...filters.values()].some(filter => {
    //             if (!node?.data || !filter?.path) return false;
    //
    //             return filter.path.startsWith(node.data.path) && filter.path !== node.data.path;
    //         })
    //     );
    // },[node, filters]);

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

interface OntologyTreeHeaderProps {
    node: any; // Data Object model for this node
    style: any; // Base Style object describing the base css styling
    onSelect?: () => void; // Callback for selection
    customStyles?: any; // Custom styling object that is applied in addition to the base
    checked?: boolean; // Is check box checked
    emptyDirectoryText?: string; // Text to show if node is a container, but has no contents

    allowMultiSelect?: boolean; // Flag to enable multi-selection of nodes
    isEmpty: boolean; // Flag indicating if flag is an empty container
    isLoading: boolean; // Flag indicating child data is being loaded for node

    showNodeIcon: boolean; // Flag to indicate whether an Icon should be shown for the node
    useFileIconCls?: boolean; // Class to apply to the Icon
    RenderIcon?: (props: unknown) => React.ReactElement; // Function Component method to render icon element
    filters: Map<string, PathModel>;
    onFilterClick: (node: PathModel) => void;
}

export const OntologyTreeHeader: FC<OntologyTreeHeaderProps> = memo( props => {
    const {
        style,
        onSelect,
        node,
        customStyles,
        emptyDirectoryText,
        allowMultiSelect,
        showNodeIcon = true,
        isEmpty,
        isLoading,
        filters,
        onFilterClick,
    } = props;

    if (isEmpty) {
        return <div className="filetree-empty-directory">{emptyDirectoryText}</div>;
    }

    if (isLoading) {
        return (
            <div className="filetree-empty-directory">
                <LoadingSpinner />
            </div>
        );
    }

    const isDirectory = node?.children !== undefined;
    const activeColor = node?.active && !allowMultiSelect ? 'lk-text-theme-dark filetree-node-active' : undefined; // $brand-primary and $gray-light

    // Do not always want to toggle directories when clicking a check box
    // const checkClick = (evt): void => {
    //     evt.stopPropagation();
    // };

    return (
        <span
            className={
                'filetree-checkbox-container' +
                (isDirectory ? '' : ' filetree-leaf-node') +
                (node.active ? ' active' : '')
            }
        >
            <div style={style.base} onClick={onSelect}>
                <div className={activeColor}>
                    <div
                        className="filetree-resource-row"
                        style={node.selected ? { ...style.title, ...customStyles.header.title } : style.title}
                        title={node.name}
                    >
                        <div
                            className={classNames({
                                'filetree-file-name': !isDirectory,
                                'filetree-directory-name': isDirectory,
                            })}
                        >
                            {node.name}
                        </div>
                    </div>
                </div>
            </div>
            {showNodeIcon && <FilterIcon node={node} filters={filters} onClick={onFilterClick} />}
        </span>
    );
});

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

                toggleParentPaths(fileTreeRef.current, alternatePath, parentPaths, true, () => {
                    setShowLoading(false);
                    scrollToActive();
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
                        data: child,
                    };
                }
            );
        },
        [root, filters]
    );

    const onSelect = (name: string, path: string, checked: boolean, isDirectory: boolean, node: PathNode): boolean => {
        if (node.active) onNodeSelection(node?.data);
        return true;
    };

    const renderNodeHeader = props => {
        return (
            <>
                <OntologyTreeHeader {...props} filters={filters} onFilterClick={onFilterChange} />
            </>
        );
    };

    return (
        <FileTree
            loadData={loadData}
            onFileSelect={onSelect}
            allowMultiSelect={false}
            showNodeIcon={showFilterIcon}
            defaultRootName={root.label}
            showLoading={showLoading}
            showAnimations={false}
            ref={fileTreeRef}
            headerDecorator={renderNodeHeader}
        />
    );
};

const getTreeNodeForPath = function (fileTree, path: string): any {
    return fileTree.getDataNode(path, fileTree.state.data);
};

const toggleParentPaths = function (
    fileTree,
    alternatePath: PathModel,
    parentPaths: PathModel[],
    isRoot: boolean,
    callback: () => void
): void {
    const parentPath = isRoot ? DEFAULT_ROOT_PREFIX : parentPaths[0].path;
    parentPaths.shift();

    const node = getTreeNodeForPath(fileTree, parentPath);
    if (node) {
        fileTree.onToggle(node, true, alternatePath.path === node.id, () => {
            if (parentPaths.length > 0) {
                toggleParentPaths(fileTree, alternatePath, parentPaths, false, callback);
            } else {
                callback();
            }
        });
    } else if (parentPaths.length > 0) {
        toggleParentPaths(fileTree, alternatePath, parentPaths, false, callback);
    } else {
        callback();
    }
};

const scrollToActive = function (): void {
    const activeEl = document.getElementsByClassName('filetree-node-active');
    if (activeEl.length > 0) {
        activeEl[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        setTimeout(scrollToActive, 500);
    }
};
