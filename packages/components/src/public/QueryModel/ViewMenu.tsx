import React, { PureComponent, ReactNode } from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';

import { QueryModel, ViewInfo } from '../..';
import { blurActiveElement } from '../../internal/util/utils';
import { getQueryMetadata } from '../../internal/global';

interface ViewMenuProps {
    hideEmptyViewMenu: boolean;
    model: QueryModel;
    onViewSelect: (viewName: string) => void;
}

export class ViewMenu extends PureComponent<ViewMenuProps> {
    render(): ReactNode {
        const { model, hideEmptyViewMenu, onViewSelect } = this.props;
        const { isLoading, views, viewName, visibleViews } = model;
        const activeViewName = viewName ?? ViewInfo.DEFAULT_NAME;
        const defaultView = views.find(view => view.isDefault);

        const publicViews = visibleViews.filter(view => view.shared);
        const privateViews = visibleViews.filter(view => !view.shared);
        const noViews = publicViews.length === 0 && privateViews.length === 0;
        const _hideEmptyViewMenu = getQueryMetadata().get('hideEmptyViewMenu', hideEmptyViewMenu);
        const hidden = _hideEmptyViewMenu && noViews;
        const disabled = isLoading || noViews;

        const viewMapper = (viewInfo): ReactNode => {
            const { name, label, isDefault } = viewInfo;
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
                    title={<span className="fa fa-table" />}
                >
                    {defaultView && viewMapper(defaultView)}
                    {privateViews.length > 0 && <MenuItem header>My Saved Views</MenuItem>}
                    {privateViews.length > 0 && privateViews.map(viewMapper)}
                    {publicViews.length > 0 && <MenuItem header>All Saved Views</MenuItem>}
                    {publicViews.length > 0 && publicViews.map(viewMapper)}
                </DropdownButton>
            </div>
        );
    }
}
