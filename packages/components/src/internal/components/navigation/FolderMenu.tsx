import React, { FC, Fragment, memo } from 'react';
import classNames from 'classnames';

import { getPrimaryAppProperties } from '../../app/utils';
import { useServerContext } from '../base/ServerContext';
import { AppURL, createProductUrl } from '../../url/AppURL';
import { getHref } from '../../url/utils';
import { Tip } from '../base/Tip';

export interface FolderMenuItem {
    href: string;
    id: string;
    isTopLevel: boolean;
    label: string;
    path: string;
}

export interface FolderMenuProps {
    activeContainerId: string;
    currentProductId: string;
    items: FolderMenuItem[];
    onClick: (item: FolderMenuItem) => void;
}

export const FolderMenu: FC<FolderMenuProps> = memo(props => {
    const { items, onClick, activeContainerId, currentProductId } = props;
    const { moduleContext, user } = useServerContext();
    const primaryProductId = getPrimaryAppProperties(moduleContext).productId;

    // TODO: the "user" object here is for the current container, so all of the user.isAdmin checks below are incorrect
    // TBD if we want to includeEffectivePermissions in the getProjects() call in ProductMenu.tsx or use the
    // useContainerUser() hook here (need to consider performance implications)

    return (
        <div className="menu-section col-folders">
            <ul>
                {items.map(item => {
                    const dashboardURL = createProductUrl(
                        primaryProductId,
                        currentProductId,
                        AppURL.create('home'),
                        item.path
                    );
                    const adminURL = createProductUrl(
                        primaryProductId,
                        currentProductId,
                        AppURL.create('admin', 'projects'),
                        item.path
                    );

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
                                        <a href={getHref(dashboardURL)}>
                                            <Tip caption="Dashboard">
                                                <i className="fa fa-home" />
                                            </Tip>
                                        </a>
                                        {user.isAdmin && (
                                            <a href={getHref(adminURL)}>
                                                <Tip caption="Administration">
                                                    <i className="fa fa-gear" />
                                                </Tip>
                                            </a>
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
            </ul>
        </div>
    );
});

FolderMenu.displayName = 'FolderMenu';
