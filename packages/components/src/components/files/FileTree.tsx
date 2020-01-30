
import * as React from 'react';
import { Treebeard, decorators } from 'react-treebeard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder, faFileAlt } from '@fortawesome/free-solid-svg-icons';
import { Checkbox, Alert } from "react-bootstrap";
import { List } from "immutable";

const customStyle = {
    tree: {
        base: {
            listStyle: 'none',
            backgroundColor: 'white',
            margin: 0,
            padding: 0,
            color: '#777',
            fontFamily: 'lucida grande ,tahoma,verdana,arial,sans-serif',
            fontSize: '14px'
        },
        node: {
            base: {
                position: 'relative'
            },
            link: {
                cursor: 'pointer',
                position: 'relative',
                padding: '0px 5px',
                display: 'block'
            },
            activeLink: {
                background: 'white'
            },
            toggle: {
                base: {
                    position: 'relative',
                    display: 'inline-block',
                    verticalAlign: 'top',
                    marginLeft: '-5px',
                    height: '24px',
                    width: '24px'
                },
                wrapper: {
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    margin: '-7px 0 0 -7px',
                    height: '14px'
                },
                height: 14,
                width: 14,
                arrow: {
                    fill: '#777',
                    strokeWidth: 0
                }
            },
            header: {
                base: {
                    display: 'inline-block',
                    verticalAlign: 'top',
                    color: '#777'
                },
                connector: {
                    width: '2px',
                    height: '12px',
                    borderLeft: 'solid 2px black',
                    borderBottom: 'solid 2px black',
                    position: 'absolute',
                    top: '0px',
                    left: '-21px'
                },
                title: {
                    lineHeight: '24px',
                    verticalAlign: 'middle'
                }
            },
            subtree: {
                listStyle: 'none',
                paddingLeft: '19px'
            },
            loading: {
                color: '#777'
            }
        }
    }
};

interface FileTreeProps {
    loadData: any,
    onFileSelect?: (name: string, path: string, checked: boolean, isDirectory: boolean) => any
}

interface FileTreeState {
    cursor: any,
    checked: List<string>
    data: any
    loading: boolean
    error?: string
}

export class FileTree extends React.Component<FileTreeProps, FileTreeState> {

    constructor(props) {
        super(props);

        this.state = {
            cursor: undefined,
            checked: List<string>(),
            data: [],
            loading: false,
            error: undefined
        }
    }

    CHECK_ID_PREFIX = 'filetree-check-';
    DEFAULT_ROOT_PREFIX = '|root';
    EMPTY_FILE_NAME = '*empty';

    componentDidMount(): void {
        const { loadData } = this.props;
        const { loading } = this.state;

        this.setState((state) => ({loading: true}));
        loadData().then((data) => {
            let loadedData = data;

            // treebeard has bugs when there is not a single root node
            if (Array.isArray(data)) {

                if (data.length < 1) {
                    data = [{id: this.DEFAULT_ROOT_PREFIX + "|" + this.EMPTY_FILE_NAME, active: false, name: "empty"}]
                }

                loadedData = {
                    name: 'root',
                    id: this.DEFAULT_ROOT_PREFIX,  // Special id
                    children: data,
                    toggled: true
                }
            }

            if (!loadedData.id) {
                loadedData.id = loadedData.name;
            }

            this.setState(() => ({data: loadedData, loading: false}))
        }).catch((reason: any) => {
            this.setState(() => ({error: reason}));
        })
    }

    Header = (props) => {
        const { style, onSelect, node, customStyles } = props;
        const { checked } = this.state;
        const iconType = node.children ? 'folder' : 'file-text';

        return (
            <>
                {node.id.endsWith('|' + this.EMPTY_FILE_NAME) ?
                    <div className='filetree-empty-directory'>No Files Found</div>
                    :
                    <span
                        className={'filetree-checkbox-container' + (iconType === 'folder' ? '' : ' filetree-leaf-node')}>
                        <Checkbox id={this.CHECK_ID_PREFIX + node.id} checked={checked.contains(node.id)}
                                  onChange={this.handleCheckbox} onClick={this.checkClick}/>
                        <div style={style.base} onClick={onSelect}>
                            <div style={node.selected ? {...style.title, ...customStyles.header.title} : style.title}>
                                {iconType === 'folder' ?
                                    <FontAwesomeIcon icon={faFolder} className='filetree-folder-icon'/>
                                    : <FontAwesomeIcon icon={faFileAlt} className='filetree-folder-icon'/>
                                }
                                {node.name}
                            </div>
                        </div>
                    </span>
                }
            </>
        );
    };

    Loading = () => {
        return (
            <div className='filetree-empty-directory'>Loading...</div>
        )
    };

    // Do not always want to toggle directories when clicking a check box
    checkClick = (evt) => {
        evt.stopPropagation();
    };

    getNodeIdFromId = (id: string) : string => {
        const parts = id.split(this.CHECK_ID_PREFIX);
        if (parts.length === 2) {
            return parts[1];
        }

        return undefined;
    };

    getDataNode = (id: string, node: any) => {
        if (node.id === id)
            return node;

        if (node.children) {

            // First get which child is the correct descendant path
            let childPath = node.children.filter((child) => {
                return id.startsWith(child.id);
            });

            if (childPath && childPath.length > 0)
                return this.getDataNode(id, childPath[0])
        }

        return undefined;
    };

    getPathFromId = (id: string): string => {
        let path = id;

        // strip off default root id if exists
        if (path.startsWith(this.DEFAULT_ROOT_PREFIX)) {
            path = path.substring(this.DEFAULT_ROOT_PREFIX.length);
        }

        return path.replace(/\|/g, '/');
    };

    getNameFromId = (id: string): string => {
        let parts = id.split('|');
        return parts[parts.length - 1];
    }

    // Callback to parent with actual path of selected file
    onFileSelect = (id: string, checked: boolean, isDirectory: boolean) => {
        const { onFileSelect } = this.props;

        const fileName = this.getNameFromId(id);

        if (fileName !== this.EMPTY_FILE_NAME && onFileSelect) {
            onFileSelect(this.getNameFromId(id), this.getPathFromId(id), checked, isDirectory);
        }
    }

    setCheckedValue = (node: any, checked: boolean): void => {

        // Recurse through children if directory
        if (node.children) {
            node.children.forEach((child) => {
                this.setCheckedValue(child, checked);
            });
        }

        // Add or remove checked value from state
        if (checked) {
            this.setState((state) => ({checked: state.checked.push(node.id)}), () => this.onFileSelect(node.id, checked, !!node.children))
        } else {
            this.setState((state) => (
                    {
                        checked: state.checked.filter((check) => {
                            return check !== node.id;
                        }) as List<string>
                    }
                ), () => this.onFileSelect(node.id, checked, !!node.children)
            )
        }
    };

    // recursively toggle all child files.  callback used to check selection of each subfile
    cascadeToggle = ( node, callback: (any) => any ) => {

        const afterToggle = () => {
            callback(node);
            if (node.children) {
                node.children.forEach(child => {
                    this.cascadeToggle(child, callback)
                })
            }
        };

        this.onToggle(node, true, afterToggle)
    };

    handleCheckbox = (evt) => {
        const { data } = this.state;
        const { checked } = evt.target;
        const id = this.getNodeIdFromId(evt.target.id);

        const node = this.getDataNode(id, data);
        if (node.children && checked) {
            // Toggle open selected directory and check the children
            const callback = (checkNode) => {
                this.setCheckedValue(checkNode, checked);
            };

            this.cascadeToggle(node, callback)
        }
        this.setCheckedValue(node, checked);
    };

    onToggle = (node: any, toggled: boolean, callback?: () => any) => {
        const { cursor, data, checked } = this.state;
        const { loadData } = this.props;

        if (cursor) {
            node.active = false;
        }
        node.active = true;
        node.toggled = toggled;

        if (node.children) {

            // load data if not already loaded
            if (node.children.length === 0) {
                this.setState((state) => ({loading: true}));

                loadData(this.getPathFromId(node.id)).then((children) => {
                    children = children.map((child) => {
                        child.id = (node.id + "|" + child.name); // generate Id from path
                        return child;
                    });

                    if (children.length < 1) {
                        children = [{id: node.id + "|" + this.EMPTY_FILE_NAME, active: false, name: "empty"}]
                    }

                    node.children = children;  // This is not immutable so this is updating the data object
                    this.setState(() => ({cursor: node, data: Object.assign({}, data), error: undefined, loading: false}), (callback ? callback() : undefined));
                }).catch((reason: any) => {
                        this.setState(() => ({error: (reason.message ? reason.message : 'Unable to fetch data')}));
                })
            }
            else {
                this.setState(() => ({cursor: node, data: Object.assign({}, data), error: undefined}), (callback ? callback() : undefined));
            }
        }
    };

    render = () => {
        const { data, error } = this.state;
        const Header = this.Header;
        const Loading = this.Loading;

        return (
            <div className='filetree-container'>
                {!!error ?
                    <Alert bsStyle='danger'>{error}</Alert>
                    :
                    <Treebeard data={data}
                               onToggle={this.onToggle}
                               decorators={{...decorators, Header, Loading}}
                               style={customStyle}
                    />
                }
            </div>
        )
    }

}
