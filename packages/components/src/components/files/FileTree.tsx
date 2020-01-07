
import * as React from 'react';
import {useState} from "react";
import Tree, { TreeNode } from 'rc-tree';
import * as PropTypes from 'prop-types';
// import 'rc-tree/assets/index';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faFolder, faFolderOpen, faFileAlt} from '@fortawesome/free-solid-svg-icons';
import {List} from "immutable";

// interface FileTreeProps {
//     data: any
// }

const treeData = [
    { key: '0-0', title: 'parent 1', children:
            [
                { key: '0-0-0', title: 'parent 1-1', children:
                        [
                            { key: '0-0-0-0', title: 'parent 1-1-0' },
                        ],
                },
                { key: '0-0-1', title: 'parent 1-2', children:
                        [
                            { key: '0-0-1-0', title: 'parent 1-2-0', disableCheckbox: true },
                            { key: '0-0-1-1', title: 'parent 1-2-1' },
                        ],
                },
            ],
    },
];

export class FileTree extends React.Component {
    static propTypes = {
        keys: PropTypes.array,
    };
    static defaultProps = {
        keys: ['0-0-0-0'],
    };
    constructor(props) {
        super(props);
        const keys = props.keys;
        this.state = {
            defaultExpandedKeys: keys,
            defaultSelectedKeys: keys,
            defaultCheckedKeys: keys,
        };
    }
    onExpand = (...args) => {
        console.log('onExpand', ...args);
    };
    onSelect = (selectedKeys, info) => {
        console.log('selected', selectedKeys, info);
        this.selKey = info.node.props.eventKey;

        if (this.tree) {
            console.log(
                'Selected DOM node:',
                selectedKeys.map(key => ReactDOM.findDOMNode(this.tree.domTreeNodes[key])),
            );
        }
    };
    onCheck = (checkedKeys, info) => {
        console.log('onCheck', checkedKeys, info);
    };
    onEdit = () => {
        setTimeout(() => {
            console.log('current key: ', this.selKey);
        }, 0);
    };
    onDel = (e) => {
        if (!window.confirm('sure to delete?')) {
            return;
        }
        e.stopPropagation();
    };
    setTreeRef = (tree) => {
        this.tree = tree;
    };
    render() {
        const customLabel = (
            <span className="cus-label">
        <span>operations: </span>
        <span style={{ color: 'blue' }} onClick={this.onEdit}>Edit</span>&nbsp;
                <label onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" /> checked
        </label>
                &nbsp;
                <span className='filetree-red-test' onClick={this.onDel}>Delete</span>
      </span>
        );

        return (
            <div style={{ margin: '0 20px' }}>
                <h2>simple</h2>
                <Tree
                    ref={this.setTreeRef}
                    className="myCls" showLine checkable defaultExpandAll
                    defaultExpandedKeys={this.state.defaultExpandedKeys}
                    onExpand={this.onExpand}
                    defaultSelectedKeys={this.state.defaultSelectedKeys}
                    defaultCheckedKeys={this.state.defaultCheckedKeys}
                    onSelect={this.onSelect} onCheck={this.onCheck}
                >
                    <TreeNode title="parent 1" key="0-0">
                        <TreeNode title={customLabel} key="0-0-0">
                            <TreeNode title="leaf" key="0-0-0-0" style={{ background: 'rgba(255, 0, 0, 0.1)' }} />
                            <TreeNode title="leaf" key="0-0-0-1" />
                        </TreeNode>
                        <TreeNode title="parent 1-1" key="0-0-1">
                            <TreeNode title="parent 1-1-0" key="0-0-1-0" disableCheckbox />
                            <TreeNode title="parent 1-1-1" key="0-0-1-1" />
                        </TreeNode>
                        <TreeNode title="parent 1-2" key="0-0-2" disabled>
                            <TreeNode title="parent 1-2-0" key="0-0-2-0" checkable={false} />
                            <TreeNode title="parent 1-2-1" key="0-0-2-1" />
                        </TreeNode>
                    </TreeNode>
                </Tree>

                <h2>Check on Click TreeNode</h2>
                <Tree
                    className="myCls"
                    showLine
                    checkable
                    selectable={ false }
                    defaultExpandAll
                    onExpand={this.onExpand}
                    defaultSelectedKeys={this.state.defaultSelectedKeys}
                    defaultCheckedKeys={this.state.defaultCheckedKeys}
                    onSelect={this.onSelect}
                    onCheck={this.onCheck}
                    treeData={treeData}
                />
            </div>
        );
    }
}

// export function FileTree(props) {

    // const { data } = props;
    // const [checkedKeys, setCheckedKeys] = useState(List<number>());
    // // const [cursor, setCursor] = useState(false);
    //
    // const onSelect = (info) => {
    //     console.log('selected', info);
    // };
    //
    // const onExpand = (info) => {
    //     console.log('expanded', info);
    // };
    //
    // const onCheck = (checkedKeys) => {
    //     console.log(checkedKeys);
    //     setCheckedKeys(List<number>(checkedKeys));
    // };
    //
    // const closedDirectoryIcon = () => {
    //     return (
    //         <FontAwesomeIcon icon={faFolder}/>
    //     )
    // };
    //
    // const openDirectoryIcon = () => {
    //     return (
    //         <FontAwesomeIcon icon={faFolderOpen}/>
    //     )
    // };
    //
    // const fileIcon = () => {
    //     return (
    //         <FontAwesomeIcon icon={faFileAlt}/>
    //     )
    // };
    //
    // const loop = (data) => {
    //     return data.map((item) => {
    //         if (item.children) {
    //             // return <TreeNode></TreeNode>
    //             return <TreeNode active={true} title={item.title} key={item.key} switcherIcon={openDirectoryIcon}>{loop(item.children)}</TreeNode>;
    //         }
    //         return (
    //             <TreeNode active={false} title={item.title} key={item.key} isLeaf={true} icon={fileIcon}
    //                       disabled={item.key === '0-0-0'}
    //             />
    //         );
    //     });
    // };
    //
    // const treeNodes = loop(data);
    //
    // return (
    //     <div>
    //         <Tree
    //             onSelect={onSelect}
    //             checkable
    //             onCheck={onCheck}
    //             checkedKeys={checkedKeys.toArray()}
    //             defaultExpandAll
    //             onExpand={onExpand}
    //         >
    //             {treeNodes}
    //         </Tree>
    //     </div>
    // )
// }
