import React, { PureComponent } from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';

import { QueryModel, ViewInfo } from '..';
import { blurActiveElement } from '../util/utils';

interface ViewMenuProps {
    hideEmptyViewMenu: boolean;
    model: QueryModel;
    onViewSelect: (viewName) => void;
}

export class ViewMenu extends PureComponent<ViewMenuProps> {
    render() {
        const { model, hideEmptyViewMenu, onViewSelect } = this.props;
        const { isLoading, views, viewName } = model;
        const activeViewName = viewName ?? ViewInfo.DEFAULT_NAME;
        const defaultView = views.find(view => view.isDefault);
        const validViews = views.filter(viewInfo => viewInfo.name.indexOf('~~') !== 0);
        const publicViews = validViews.filter(view => !view.isDefault && view.shared);
        const privateViews = validViews.filter(view => !view.isDefault && !view.shared);
        const noViews = publicViews.length === 0 && privateViews.length === 0;
        const hidden = hideEmptyViewMenu && noViews;
        const disabled = isLoading || noViews;

        const viewMapper = view => {
            const { name, label, isDefault } = view;
            const viewName = isDefault ? undefined : name;
            const onSelect = () => {
                onViewSelect(viewName);
                blurActiveElement();
            };

            return (
                <MenuItem active={name === activeViewName} key={name} onSelect={onSelect}>
                    {label}
                </MenuItem>
            );
        };

        return (
            !hidden && (
                <div className="view-menu">
                    <DropdownButton disabled={disabled} id={`view-menu-drop-${model.id}`} pullRight title="Grid Views">
                        {defaultView && viewMapper(defaultView)}
                        {privateViews.length > 0 && <MenuItem header>My Saved Views</MenuItem>}
                        {privateViews.length > 0 && privateViews.map(viewMapper)}
                        {publicViews.length > 0 && <MenuItem header>All Saved Views</MenuItem>}
                        {publicViews.length > 0 && publicViews.map(viewMapper)}
                    </DropdownButton>
                </div>
            )
        );
    }
}
