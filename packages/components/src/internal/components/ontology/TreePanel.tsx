import React, { FC, ReactElement, useCallback, useEffect, useState } from 'react';
import { Panel } from 'react-bootstrap';
import { Treebeard, decorators } from 'react-treebeard';
import { LoadingPage } from '../base/LoadingPage';

declare type TreeNodeClickHandler = (node: object, expanded: boolean) => void;

export interface TreeProps {
    data: TreeNode; //TODO for now
    onToggle?: TreeNodeClickHandler;
    customDecorators?: [any]; // TODO for now
    style?: object;
}

const fileTree_color = '#777';
const customStyle = {
    tree: {
        base: {
            listStyle: 'none',
            backgroundColor: 'white',
            margin: 0,
            padding: 0,
            color: fileTree_color,
            fontFamily: 'lucida grande ,tahoma,verdana,arial,sans-serif',
            fontSize: '14px',
        },
        node: {
            base: {
                position: 'relative',
            },
            link: {
                cursor: 'pointer',
                position: 'relative',
                padding: '0px 5px',
                display: 'flex',
            },
            activeLink: {
                borderRadius: '5px',
            },
            toggle: {
                base: {
                    position: 'relative',
                    display: 'inline-block',
                    verticalAlign: 'top',
                    marginLeft: '-5px',
                    height: '24px',
                    width: '24px',
                },
                wrapper: {
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    margin: '-10px 0 0 -5px',
                    height: '10px',
                },
                height: 10,
                width: 10,
                arrow: {
                    fill: fileTree_color,
                    strokeWidth: 0,
                },
            },
            header: {
                base: {
                    display: 'inline-block',
                    verticalAlign: 'top',
                    color: fileTree_color,
                },
                connector: {
                    width: '2px',
                    height: '12px',
                    borderLeft: 'solid 2px black',
                    borderBottom: 'solid 2px black',
                    position: 'absolute',
                    top: '0px',
                    left: '-21px',
                },
                title: {
                    lineHeight: '24px',
                    verticalAlign: 'middle',
                },
            },
            subtree: {
                listStyle: 'none',
                paddingLeft: '19px',
            },
            loading: {
                color: fileTree_color,
            },
        },
    },
};

export interface TreeNode {
    toggled: boolean;
    expanded: boolean;
    loading: boolean;
    active: boolean;
    name: string;
    children: [TreeNode];
    data?: object;
}

export function useTreeData(initialData: TreeNode, onNodeClick: (object, boolean) => void): [TreeNode, TreeNodeClickHandler] {
    const [treeData, setTreeData] = useState<TreeNode>(initialData);
    // const [clickHandler, setClickHandler] = useState<TreeNodeClickHandler>();

    const clickHandler = useCallback(
        (node: TreeNode, expansion: boolean): void => {
            if (node) {
                node.toggled = expansion;
                node.expanded = expansion;
                onNodeClick?.(node, expansion);

                setTreeData({ ...treeData });
            }

    // useEffect(() => {
    //     function handleDataChange(node, expansion): void {
    //         if (node) {
    //             node.toggled = expansion;
    //             node.expanded = expansion;
    //             const updatedNode = onNodeClick?.(node.data, expansion) || { ...node };
    //
    //             setTreeData(updatedNode);
    //         }
    //     }
    //
    //     // Subscribe to click handler
    //     setClickHandler(handleDataChange);
    //
    //     return () => {
    //         // Unsubscribe
    //         setClickHandler(null);
    //     };
    }, [treeData, setTreeData, onNodeClick]);

    return [treeData, clickHandler];
}

export const TreePanel: FC<TreeProps> = (props): ReactElement => {
    const { data, onToggle, customDecorators = decorators, style = customStyle } = props;
    const [treeData, onClick] = useTreeData(data, onToggle);

    if (!treeData) {
        return <LoadingPage />;
    }

    return (
        <Panel className="ontology-browser-tree-container padding-right">
            <Treebeard
                data={treeData}
                onToggle={onClick}
                decorators={customDecorators}
                style={style}
            />
        </Panel>
    );
};
