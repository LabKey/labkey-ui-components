import React, { FC, memo } from 'react';
import classNames from 'classnames';

export interface FolderMenuItem {
    href: string;
    id: string;
    isTopLevel: boolean;
    label: string;
    path: string;
}

export interface FolderMenuProps {
    activeContainerId: string;
    items: FolderMenuItem[];
    onClick: (item: FolderMenuItem) => void;
}

export const FolderMenu: FC<FolderMenuProps> = memo(props => {
    const { items, onClick, activeContainerId } = props;

    return (
        <div className="menu-section col-folders">
            <ul>
                {items.map(item => (
                    <>
                        <li
                            key={item.id}
                            className={classNames({
                                active: item.id === activeContainerId,
                                'menu-section-header': item.isTopLevel,
                                'menu-section-item': !item.isTopLevel,
                            })}
                        >
                            <a className="menu-folder-item" onClick={() => onClick(item)}>
                                {item.label}
                            </a>
                        </li>
                        {item.isTopLevel && (
                            <li>
                                <hr />
                            </li>
                        )}
                    </>
                ))}
            </ul>
        </div>
    );
});

FolderMenu.displayName = 'FolderMenu';
