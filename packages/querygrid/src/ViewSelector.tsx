/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'reactn'
import { DropdownButton, MenuItem } from 'react-bootstrap'
import { List } from 'immutable'

import { ViewInfo } from './query/model'
import { generateId, naturalSort } from './util/util'

import { QueryGridModel } from './model'

const emptyList = List<React.ReactNode>();

interface Props {
    model: QueryGridModel
}

/**
 * Produces a menu that displays the different custom views that are available for the given QueryGridModel.
 * The views are organized such that the default view is at the top, followed by a section of the user's private
 * views, if any, followed by a section of the public, shared views.
 *
 * If the model has only one associated view (the default view), the selector will be disabled.
 */
export class ViewSelector extends React.Component<Props, any> {

    dropId: string;

    constructor(props: Props) {
        super(props);

        this.dropId = generateId('viewselector-');
    }

    createItem(view: ViewInfo, key: string): React.ReactNode {
        const { model } = this.props;
        const activeViewName = model.view ? model.view : ViewInfo.DEFAULT_NAME;

        return (
            <MenuItem
                active={activeViewName === view.name}
                key={key}
                onSelect={this.onSelectView.bind(this, view)}>
                {view.label}
            </MenuItem>
        )
    }

    createMenuItems(): List<React.ReactNode> {
        const { model } = this.props;

        if (model.queryInfo) {
            const items = List<React.ReactNode>().asMutable();

            const valid = model.queryInfo.views
                .filter((view) => view && !view.isDefault && view.name.indexOf('~~') !== 0);

            const publicViews = valid
                .filter((view) => view.shared)
                .sortBy(v => v.label, naturalSort);

            const privateViews = valid
                .filter((view) => !view.shared)
                .sortBy(v => v.label, naturalSort);

            const defaultView = model.queryInfo.views.find((view) => view.isDefault);

            if (defaultView) {
                items.push(this.createItem(defaultView, 'default-view'));
            }

            if (privateViews.size) {
                items.push(<MenuItem header key="private-header">My Saved Views</MenuItem>);

                privateViews.valueSeq().forEach((view, i) => {
                    items.push(this.createItem(view, `private-${i}`));
                })
            }

            if (publicViews.size) {
                items.push(<MenuItem header key="public-header">All Saved Views</MenuItem>);

                publicViews.valueSeq().forEach((view, i) => {
                    items.push(this.createItem(view, `public-${i}`));
                })
            }

            return items.asImmutable();
        }

        return emptyList;
    }

    onSelectView(view: ViewInfo) {
        this.props.model.selectView(view);
    }

    render() {
        const viewItems = this.createMenuItems();

        return (
            <DropdownButton
                disabled={viewItems.size <= 1}
                id={this.dropId}
                pullRight
                title="Grid Views">
                {viewItems.toArray()}
            </DropdownButton>
        )
    }
}