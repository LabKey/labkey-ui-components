import React, { PureComponent, ReactNode } from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';

import { getServerContext } from '@labkey/api';

import { blurActiveElement } from '../../internal/util/utils';
import { getQueryMetadata } from '../../internal/global';

import { ViewInfo } from '../../internal/ViewInfo';

import { QueryModel } from './QueryModel';

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

        const viewMapper = (viewInfo): ReactNode => {
            const { name, isDefault, saved, shared } = viewInfo;
            const label = isDefault && saved && !shared ? 'Your Default' : viewInfo.label;
            const view = isDefault ? undefined : name;
            const onSelect = (): void => {
                onViewSelect(view);
                blurActiveElement();
            };

            return (
                <MenuItem active={name === activeViewName} key={name} onSelect={onSelect}>
                    {label}
                </MenuItem>
            );
        };

        if (hidden) return null;

        return (
            <div className="view-menu">
                <DropdownButton
                    disabled={disabled}
                    id={`view-menu-drop-${model.id}`}
                    pullRight
                    title={
                        <span>
                            <i className="fa fa-table" />
                            <span> Views</span>
                        </span>
                    }
                >
                    {defaultView && viewMapper(defaultView)}
                    {privateViews.length > 0 && <MenuItem divider />}
                    {privateViews.length > 0 && <MenuItem header>Your Saved Views</MenuItem>}
                    {privateViews.length > 0 && privateViews.map(viewMapper)}
                    {publicViews.length > 0 && <MenuItem divider />}
                    {publicViews.length > 0 && <MenuItem header>Shared Saved Views</MenuItem>}
                    {publicViews.length > 0 && publicViews.map(viewMapper)}
                    {allowViewCustomization && !user.isGuest && (
                        <>
                            <MenuItem divider />
                            <MenuItem onSelect={onCustomizeView}>Customize Grid View</MenuItem>
                            <MenuItem onSelect={onManageViews} disabled={!hasViewsToManage}>
                                Manage Saved Views
                            </MenuItem>
                            <MenuItem onSelect={onSaveView}>Save Grid View</MenuItem>
                        </>
                    )}
                </DropdownButton>
            </div>
        );
    }
}
