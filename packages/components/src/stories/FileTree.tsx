import {storiesOf} from "@storybook/react";
import {withKnobs} from "@storybook/addon-knobs";
import {FileTree} from "../components/files/FileTree";
import React from "react";

const data = {
    name: 'root',
    children: [
        {
            name: 'parent1',
            children: [
                { name: 'child1' },
                { name: 'child2' }
            ]
        },
        {
            name: 'loading parent',
            loading: true,
            children: []
        },
        {
            name: 'parent2',
            children: [
                {
                    name: 'nested parent',
                    children: [
                        { name: 'nested child 1' },
                        { name: 'nested child 2' }
                    ]
                }
            ]
        }
    ]
};

const getDirectoryNode = (name: string, root: any) => {
    if (root.name === name) {
        return root;
    }

    let node = undefined;

    if (root.children) {
        root.children.forEach((child) => {
            let found = getDirectoryNode(name, child);
            if (found) {
                node = {...found};
            }
        })
    }

    return node;
};

const fetchFileTree = (directory?: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        let node = {...data};  // Make a copy

        if (directory)
        {
            node = getDirectoryNode(directory, node);

            if (node.children)
            {
                resolve(node.children.map(child => {
                    let newChild = {...child};
                    if (newChild.children) {
                        newChild.children = [];  // empty this out to replicate data coming from webdav
                    }
                    return newChild;
                }))
            }
        }

        node.children = [];

        resolve(node);
    })
};

const fetchBadTree = (): Promise<any> => {
    return new Promise((resolve, reject) => {
        reject('Unable to load file tree. Verify the root directory exists.')
    })
}

storiesOf('FileTree', module)
    .addDecorator(withKnobs)
    .add('With basic data', () =>
        <div>
            <FileTree loadData={fetchFileTree}/>
        </div>
    )

    .add('With error', () =>
        <div>
            <FileTree loadData={fetchBadTree}/>
        </div>
    )
