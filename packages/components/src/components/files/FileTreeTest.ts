const data = {
    name: 'root',
    children: [
        {
            name: 'parent1',
            children: [
                {
                    name: 'child1.xlsx',
                    data: { iconFontCls: 'fa fa-file-excel-o' },
                },
                {
                    name: 'child2.pdf',
                    data: { iconFontCls: 'fa fa-file-pdf-o' },
                },
            ],
        },
        {
            name: 'loading parent',
            children: [{ name: 'slow-child1' }, { name: 'slow-child2' }],
        },
        {
            name: 'parent2',
            children: [
                {
                    name: 'nested parent',
                    children: [{ name: 'nested child 1' }, { name: 'nested child 2' }],
                },
            ],
        },
        {
            name: 'empty directory',
            children: [],
        },
    ],
};

const getFileFromPath = (path: string): string => {
    const pathParts = path.split('/');

    return pathParts[pathParts.length - 1];
};

const getDirectoryNode = (name: string, root: any): any => {
    if (root.name === name) {
        return root;
    }

    let node;

    if (root.children) {
        root.children.forEach(child => {
            const found = getDirectoryNode(getFileFromPath(name), child);
            if (found) {
                node = { ...found };
            }
        });
    }

    return node;
};

const wait = ms => new Promise(resolve => window.setTimeout(resolve, ms));

export const fetchFileTestTree = (directory?: string): Promise<any> => {
    return new Promise(resolve => {
        let node = { ...data }; // Make a copy

        if (directory) {
            node = getDirectoryNode(directory, node);

            if (node.children) {
                const newChildren = node.children.map(child => {
                    const newChild = { ...child };
                    if (newChild.children) {
                        newChild.children = []; // empty this out to replicate data coming from webdav
                    }
                    return newChild;
                });

                resolve(
                    node.name === 'loading parent'
                        ? wait(3000).then(() => {
                              return newChildren;
                          })
                        : newChildren
                );
            }
        }

        node.children = [];
        resolve(node);
    });
};
