import React, { FC, Fragment, memo, useMemo } from 'react';
import classNames from 'classnames';

import { useServerContext } from '../base/ServerContext';
import { AppURL } from '../../url/AppURL';
import { Tip } from '../base/Tip';
import { ExpandableContainer } from '../ExpandableContainer';
import { AppLink } from '../../url/AppLink';
import { ADMIN_KEY } from '../../app/constants';
import { Icon } from '../../Icon';

export interface FolderMenuItem {
    archived: boolean;
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

export const FolderMenuItems: FC<FolderMenuProps> = memo(props => {
    const { items, onClick, activeContainerId } = props;
    const { user } = useServerContext();

    // TODO: the "user" object here is for the current container, so all of the user.isAdmin checks below are incorrect
    // TBD if we want to includeEffectivePermissions in the getContainers() call in ProductMenu.tsx or use the
    // useContainerUser() hook here (need to consider performance implications)

    return (
        <>
            {items.map(item => {
                const dashboardURL = AppURL.create('home').setContainerPath(item.path);
                const adminURL = AppURL.create(ADMIN_KEY, 'folders').setContainerPath(item.path);

                return (
                    <Fragment key={item.id}>
                        <li
                            className={classNames({
                                active: item.id === activeContainerId,
                                'menu-section-header': item.isTopLevel,
                                'menu-section-item': !item.isTopLevel,
                            })}
                        >
                            <div className="row">
                                <div
                                    className={classNames('col menu-folder-body', {
                                        'col-xs-9': user.isAdmin,
                                        'col-xs-10': !user.isAdmin,
                                    })}
                                >
                                    <a className="menu-folder-item" onClick={() => onClick(item)}>
                                        {item.label}
                                    </a>
                                </div>
                                <div
                                    className={classNames('col menu-folder-icons', {
                                        'col-xs-3': user.isAdmin,
                                        'col-xs-2': !user.isAdmin,
                                    })}
                                >
                                    <AppLink to={dashboardURL} className="dashboard-link">
                                        <Tip caption="Dashboard">
                                            <Icon iconClass="fa fa-home dashboard-icon" srText="Dashboard" />
                                        </Tip>
                                    </AppLink>
                                    {user.isAdmin && (
                                        <AppLink to={adminURL}>
                                            <Tip caption="Administration">
                                                <Icon iconClass="fa fa-gear" srText="Administration" />
                                            </Tip>
                                        </AppLink>
                                    )}
                                </div>
                            </div>
                        </li>
                        {item.isTopLevel && (
                            <li>
                                <hr />
                            </li>
                        )}
                    </Fragment>
                );
            })}
        </>
    );
});
FolderMenuItems.displayName = 'FolderMenuItems';

export const FolderMenu: FC<FolderMenuProps> = memo(props => {
    const { items, onClick, activeContainerId } = props;

    // TODO: the "user" object here is for the current container, so all of the user.isAdmin checks below are incorrect
    // TBD if we want to includeEffectivePermissions in the getContainers() call in ProductMenu.tsx or use the
    // useContainerUser() hook here (need to consider performance implications)
    const { activeItems, archivedItems } = useMemo(() => {
        const activeItems_ = [];
        const archivedItems_ = [];
        items?.forEach(item => {
            if (item.archived) archivedItems_.push(item);
            else activeItems_.push(item);
        });
        return { activeItems: activeItems_, archivedItems: archivedItems_ };
    }, [items]);

    const archiveSectionHeader = (
        <div>
            <span>Archived Folders</span>
        </div>
    );

    return (
        <div className="menu-section col-folders">
            <ul>
                <FolderMenuItems activeContainerId={activeContainerId} items={activeItems} onClick={onClick} />
                {archivedItems?.length > 0 && (
                    <div className="archived-product-menu">
                        <ExpandableContainer
                            isExpandable
                            clause={archiveSectionHeader}
                            links={null}
                            noIcon
                            useGreyTheme
                            rowCls=""
                        >
                            <FolderMenuItems
                                activeContainerId={activeContainerId}
                                items={archivedItems}
                                onClick={onClick}
                            />
                        </ExpandableContainer>
                    </div>
                )}
            </ul>
        </div>
    );
});

FolderMenu.displayName = 'FolderMenu';
