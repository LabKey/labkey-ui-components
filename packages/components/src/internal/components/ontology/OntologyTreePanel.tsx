import React, { FC, useCallback } from 'react';

import { TreeNode } from 'react-treebeard';

import { naturalSortByProperty } from '../../../public/sort';

import { FileTree } from '../files/FileTree';

import { ConceptModel, PathModel } from './models';
import { fetchOntologyPathsAndConcepts } from './actions';

// class OntologyTreeNode implements TreeNode {
//     toggled: boolean = false;
//     expanded: boolean = false;
//     loading: boolean = false;
//     active: boolean = false;
//     name: string;
//     children: [TreeNode];
//     data?: ConceptModel;
//
//     constructor(values?: {[key:string]: any}) {
//         this.active = false;
//         this.loading = false;
//         this.expanded = false;
//         this.children = undefined;
//         Object.assign(this, values);
//     }
// }

// const testData = new OntologyTreeNode({
//     id: 'Breakfast',
//     name: 'Breakfast',
//     children: [
//         new OntologyTreeNode({
//             id: 'crepes',
//             name: 'crepes',
//         }),
//         new OntologyTreeNode({
//             id: 'pancakes',
//             name: 'pancakes',
//             children: [
//                 new OntologyTreeNode({ id: 'swedish', name: 'swedish' }),
//                 new OntologyTreeNode({ id: 'buttermilk', name: 'buttermilk' })
//             ],
//         }),
//         new OntologyTreeNode({ id: 'waffles', name: 'waffles' }),
//     ],
//     expanded: true,
//     toggled: true,
//     active: false,
//     loading: false,
// });

// class OntologyBrowserModel {
//     title: string;
//     data?: OntologyTreeNode = testData; //TODO for now.
// }

// interface OntologyTreeProps {
//     model: OntologyBrowserModel;
// }

export class OntologyPath {
    id: string;
    name: string;
    children: undefined | PathNode[];
    conceptCode?: string;
}

type PathNode = OntologyPath & TreeNode;

interface OntologyTreeProps {
    root?: PathModel;
    onNodeSelection?: (conceptCode: string) => void;
    loadConcepts?: (concepts: ConceptModel[]) => void;
}

export const OntologyTreePanel: FC<OntologyTreeProps> = props => {
    // const { model, treeData, onNodeToggle } = props;
    const { root, onNodeSelection, loadConcepts } = props;
    const loadData = useCallback(
        async (ontologyPath: string = root.path): Promise<PathNode[]> => {
            const [ontPath, concepts] = await fetchOntologyPathsAndConcepts(ontologyPath);
            loadConcepts(concepts);
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
        [loadConcepts, root]
    );

    const onSelect = (a: string, b: string, c: boolean, d: boolean, node: PathNode): boolean => {
        console.log([a, b, c, d, node]);
        onNodeSelection(node?.conceptCode);
        return true;
    };

    return (
        <div className="ontology-browser-tree-container padding-right">
            <FileTree
                loadData={loadData}
                onFileSelect={onSelect}
                allowMultiSelect={false}
                showNodeIcon={false}
                defaultRootName={root.label}
            />
        </div>
    );
};
