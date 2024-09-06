import React, { ChangeEvent, FC, PropsWithChildren } from 'react';

import classNames from 'classnames';

import { LoadingSpinner } from '../base/LoadingSpinner';
import { CheckboxLK } from '../../Checkbox';

interface FileNodeIconProps {
    isDirectory: boolean;
    useFileIconCls?: boolean;
    node: any;
}

// exported for jest testing
// Not using Pure/memo as node property is mutable
export const FileNodeIcon: FC<FileNodeIconProps> = props => {
    const { isDirectory, useFileIconCls, node } = props;
    const iconClass = classNames('filetree-folder-icon', 'fa', {
        'fa-folder-open': isDirectory && node.toggled,
        'fa-folder': isDirectory && !node.toggled,
        'fa-file-alt': !isDirectory,
    });

    return (
        <>
            {!isDirectory && useFileIconCls && node.data && node.data.iconFontCls ? (
                <i className={node.data.iconFontCls + ' filetree-folder-icon'} />
            ) : (
                <span className={iconClass} />
            )}
        </>
    );
};

export interface TreeNodeProps extends PropsWithChildren {
    NodeIcon?: (props: unknown) => React.ReactElement; // Function Component method to render icon element
    allowMultiSelect?: boolean; // Flag to enable multi-selection of nodes
    checkboxId?: string; // Id to apply to the checkbox
    checked?: boolean; // Is check box checked
    customStyles?: any; // Custom styling object that is applied in addition to the base
    emptyDirectoryText?: string; // Text to show if node is a container, but has no contents
    handleCheckbox?: (event: ChangeEvent<HTMLInputElement>) => void; // Callback for checkbox changes
    isEmpty: boolean; // Flag indicating if flag is an empty container
    isLoading: boolean; // Flag indicating child data is being loaded for node
    node: any; // Data Object model for this node
    onSelect?: () => void; // Callback for selection
    showNodeIcon: boolean; // Flag to indicate whether an Icon should be shown for the node
    style: any; // Base Style object describing the base css styling
    useFileIconCls?: boolean; // Class to apply to the Icon
}

// Note not using Pure/memo as the node property is mutable
export const Header: FC<TreeNodeProps> = props => {
    const {
        style,
        onSelect,
        node,
        customStyles,
        checked,
        handleCheckbox,
        checkboxId,
        emptyDirectoryText,
        allowMultiSelect,
        showNodeIcon = true,
        isEmpty,
        isLoading,
        NodeIcon = FileNodeIcon,
    } = props;
    const isDirectory = node.children !== undefined;
    const activeColor = node.active && !allowMultiSelect ? 'lk-text-theme-dark filetree-node-active' : undefined; // $brand-primary and $gray-light

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

    // Do not always want to toggle directories when clicking a check box
    const checkClick = (evt): void => {
        evt.stopPropagation();
    };

    return (
        <span
            className={
                'filetree-checkbox-container' +
                (isDirectory ? '' : ' filetree-leaf-node') +
                (node.active ? ' active' : '')
            }
        >
            {handleCheckbox && (
                <CheckboxLK id={checkboxId} checked={checked} name={node.id} onChange={handleCheckbox} onClick={checkClick} />
            )}
            <div style={style.base} onClick={onSelect}>
                <div className={activeColor}>
                    <div
                        className="filetree-resource-row"
                        style={node.selected ? { ...style.title, ...customStyles.header.title } : style.title}
                        title={node.name}
                    >
                        {showNodeIcon && <NodeIcon {...props} isDirectory={isDirectory} />}
                        <div
                            className={classNames({
                                'filetree-file-name': !isDirectory,
                                'filetree-directory-name': isDirectory,
                            })}
                        >
                            {node.name}
                        </div>
                        {props.children}
                    </div>
                </div>
            </div>
        </span>
    );
};

