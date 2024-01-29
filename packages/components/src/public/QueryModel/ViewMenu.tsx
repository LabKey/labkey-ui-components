import React, { FC, PureComponent, ReactNode, useCallback } from 'react';

import { getServerContext } from '@labkey/api';

import { getQueryMetadata } from '../../internal/global';

import { ViewInfo } from '../../internal/ViewInfo';

import { DropdownButton, MenuItem, MenuDivider, MenuHeader } from '../../internal/dropdowns';

import { QueryModel } from './QueryModel';

interface ViewMenuItemProps {
    activeViewName: string;
    onViewSelect: (view: string) => void;
    viewInfo: ViewInfo;
}

const ViewMenuItem: FC<ViewMenuItemProps> = ({ activeViewName, onViewSelect, viewInfo }) => {
    const { name, isDefault, saved, shared } = viewInfo;
    const label = isDefault && saved && !shared ? 'Your Default' : viewInfo.label;
    const view = isDefault ? undefined : name;
    const onClick = useCallback((): void => {
        onViewSelect(view);
    }, [onViewSelect, view]);
    return (
        <MenuItem active={name === activeViewName} key={name} onClick={onClick}>
            {label}
        </MenuItem>
    );
};

interface ViewMenuProps {
    allowViewCustomization: boolean;
    hideEmptyViewMenu: boolean;
    model: QueryModel;
    onCustomizeView?: () => void;
    onManageViews: () => void;
    onSaveView: () => void;
    onViewSelect: (viewName: string) => void;
}

export class ViewMenu extends PureComponent<ViewMenuProps> {
    render(): ReactNode {
        const {
            allowViewCustomization,
            model,
            hideEmptyViewMenu,
            onCustomizeView,
            onManageViews,
            onViewSelect,
            onSaveView,
        } = this.props;
        const { isLoading, views, viewName, visibleViews } = model;
        const { user } = getServerContext();
        const activeViewName = viewName ?? ViewInfo.DEFAULT_NAME;
        const defaultView = views.find(view => view.isDefault);
        const hasViewsToManage =
            defaultView?.isSaved || views.filter(view => !view.hidden && !view.isSystemView).length > 0;
        const publicViews = visibleViews.filter(view => view.shared);
        const privateViews = visibleViews.filter(view => !view.shared);
        const noViews = publicViews.length === 0 && privateViews.length === 0;
        const _hideEmptyViewMenu = getQueryMetadata().get('hideEmptyViewMenu', hideEmptyViewMenu);
        const hidden = _hideEmptyViewMenu && noViews && !allowViewCustomization;
        const disabled = isLoading || (noViews && !allowViewCustomization);

        const viewMapper = (viewInfo: ViewInfo): ReactNode => (
            <ViewMenuItem
                key={viewInfo.name}
                activeViewName={activeViewName}
                onViewSelect={onViewSelect}
                viewInfo={viewInfo}
            />
        );

        if (hidden) return null;

        return (
            <div className="view-menu">
                <DropdownButton
                    disabled={disabled}
                    pullRight
                    title={
                        <span>
                            <i className="fa fa-table" />
                            <span> Views</span>
                        </span>
                    }
                >
                    {defaultView && viewMapper(defaultView)}
                    {privateViews.length > 0 && <MenuDivider />}
                    {privateViews.length > 0 && <MenuHeader text="Your Saved Views" />}
                    {privateViews.length > 0 && privateViews.map(viewMapper)}
                    {publicViews.length > 0 && <MenuDivider />}
                    {publicViews.length > 0 && <MenuHeader text="Shared Saved Views" />}
                    {publicViews.length > 0 && publicViews.map(viewMapper)}
                    {allowViewCustomization && !user.isGuest && (
                        <>
                            <MenuDivider />
                            <MenuItem onClick={onCustomizeView}>Customize Grid View</MenuItem>
                            <MenuItem onClick={onManageViews} disabled={!hasViewsToManage}>
                                Manage Saved Views
                            </MenuItem>
                            <MenuItem onClick={onSaveView}>Save Grid View</MenuItem>
                        </>
                    )}
                </DropdownButton>
            </div>
        );
    }
}
