import React, {FC, useEffect, useState,} from 'react';
import { Panel } from 'react-bootstrap';
import { Treebeard, decorators } from 'react-treebeard';

export class OntologyBrowserModel {
    title: string;
}

export interface OntologyTreeProps {
    model: OntologyBrowserModel
}

const testData = {
    name: "Breakfast",
    children: [{name:"crepes"}, {name:"pancakes"}, {name:"waffles"}],
    expanded: true,
    toggled: true,
};

function useTreeData(data, subscribe) {
    const [treeData, setTreeData] = useState(data);

    useEffect(() => {
        function handleDataChange(node, expansion, callback): void {
            if (node) {
                node.toggled = expansion;
                node.expanded = expansion;
                setTreeData({ ...node });
            }
        }

        subscribe(handleDataChange);

        return () => {
            subscribe(null);
        };
    });

    return treeData;
}

export const OntologyTreePanel: FC<OntologyTreeProps> = props => {
    // const { model, treeData, onNodeToggle } = props;
    const { model, } = props;
    const [toggleHandler, setToggleHandler] = useState();
    const treeData = useTreeData(testData, setToggleHandler);

    // const onToggle = useCallback((node:any, expanded: boolean, callback?: () => any):void => {
    //         node.toggled = expanded;
    //         node.expanded = expanded;
    //         setTreeData(node);
    //     },
    //     [setTreeData]
    // );
    //
    // useEffect(() => {
    //     function handleNodeClick(node:any, expanded:boolean, callback?:() => any): void {
    //         node.toggled = expanded;
    //         setTreeData(node);
    //     }
    //
    //     return () => {
    //
    //     };
    //
    // }, [treeData, setTreeData]);

    return (
        <Panel className="ontology-browser-tree-container padding-right">
            <Treebeard
                data={treeData}
                onToggle={toggleHandler}
                // decorators={{ ...decorators, Header: this.headerDecorator }}
                // style={customStyle}
            />
        </Panel>
    );
};
