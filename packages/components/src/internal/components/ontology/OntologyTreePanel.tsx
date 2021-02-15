import React, { FC, useCallback, useEffect, useState, } from 'react';
import { TreeNode, TreePanel } from './TreePanel';
import { ConceptModel } from './models';

export class OntologyBrowserModel {
    title: string;
}

export interface OntologyTreeProps {
    model: OntologyBrowserModel;
}

class OntologyTreeNode implements TreeNode {
    toggled: boolean = false;
    expanded: boolean = false;
    loading: boolean = false;
    active: boolean = false;
    name: string;
    children: [TreeNode];
    data?: ConceptModel;

    constructor(values?: {[key:string]: any}) {
        this.active = false;
        this.loading = false;
        this.expanded = false;
        this.children = undefined;
        Object.assign(this, values);
    }
}

type PathNode = OntologyPath & TreeNode;

interface OntologyTreeProps {
    root?: PathModel;
    onNodeSelection?: (conceptCode: string) => void;
}

export const OntologyTreePanel: FC<OntologyTreeProps> = props => {
    // const { model, treeData, onNodeToggle } = props;
    const { model, } = props;
    const [toggleHandler, setToggleHandler] = useState();
    const [treeData, setTreeData] = useState(testData);
    // const treeData = useTreeData(testData, setToggleHandler);

    // const onToggle = useCallback((node:any, expanded: boolean, callback?: () => any):void => {
    //         node.toggled = expanded;
    //         node.expanded = expanded;
    //         setTreeData(node);
    //     },
    //     [setTreeData]
    // );
    //
    const nodeClickHandler = useCallback(
        (node:any, expanded:boolean, callback?:() => any): void => {
            node.toggled = expanded;
            setTreeData({ ...treeData });

            if (callback) {
                callback();
            }
        },
        [treeData, setTreeData]
    );

    // useEffect(() => {
    // }, [treeData, setTreeData]);

    return (
        <div className="ontology-browser-tree-container padding-right">
            <TreePanel data={treeData} onToggle={nodeClickHandler} />
            {/*<Treebeard*/}
            {/*    data={treeData}*/}
            {/*    onToggle={toggleHandler}*/}
            {/*    // decorators={{ ...decorators, Header: this.headerDecorator }}*/}
            {/*    style={customStyle}*/}
            {/*/>*/}
        </div>
    );
};
