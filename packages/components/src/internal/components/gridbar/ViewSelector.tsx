/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { Component, ReactNode } from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';
import { List } from 'immutable';

import { gridSelectView } from '../../actions';
import { QueryGridModel } from '../base/models/model';
import { generateId } from '../../util/utils';
import { naturalSort, ViewInfo } from '../../..';

const emptyList = List<ReactNode>();

interface Props {
    model: QueryGridModel;
}

/**
 * Produces a menu that displays the different custom views that are available for the given QueryGridModel.
 * The views are organized such that the default view is at the top, followed by a section of the user's private
 * views, if any, followed by a section of the public, shared views.
 *
 * If the model has only one associated view (the default view), the selector will be disabled.
 */
export class ViewSelector extends Component<Props> {
    dropId: string;

    constructor(props: Props) {
        super(props);

        this.dropId = generateId('viewselector-');
    }

    createItem(view: ViewInfo, key: string): ReactNode {
        const { model } = this.props;
        const activeViewName = model.view ? model.view : ViewInfo.DEFAULT_NAME;

        return (
            <MenuItem active={activeViewName === view.name} key={key} onSelect={this.onSelectView.bind(this, view)}>
                {view.label}
            </MenuItem>
        );
    }

    createMenuItems(): List<ReactNode> {
        const { model } = this.props;

        if (model.queryInfo) {
            const items = List<ReactNode>().asMutable();

            const valid = model.queryInfo.views.filter(
                view => view && !view.isDefault && view.name.indexOf('~~') !== 0
            );

            const publicViews = valid.filter(view => view.shared).sortBy(v => v.label, naturalSort);

            const privateViews = valid.filter(view => !view.shared).sortBy(v => v.label, naturalSort);

            const defaultView = model.queryInfo.views.find(view => view.isDefault);

            if (defaultView) {
                items.push(this.createItem(defaultView, 'default-view'));
            }

            if (privateViews.size) {
                items.push(
                    <MenuItem header key="private-header">
                        My Saved Views
                    </MenuItem>
                );

                privateViews.valueSeq().forEach((view, i) => {
                    items.push(this.createItem(view, `private-${i}`));
                });
            }

            if (publicViews.size) {
                items.push(
                    <MenuItem header key="public-header">
                        All Saved Views
                    </MenuItem>
                );

                publicViews.valueSeq().forEach((view, i) => {
                    items.push(this.createItem(view, `public-${i}`));
                });
            }

            return items.asImmutable();
        }

        return emptyList;
    }

    onSelectView = (view: ViewInfo): void => {
        gridSelectView(this.props.model, view);
    };

    render(): ReactNode {
        const { model } = this.props;
        const viewItems = this.createMenuItems();

        if (model.hideEmptyViewSelector && viewItems.size <= 1) {
            return null;
        }

        return (
            <span className="gridbar-button-spacer">
                <DropdownButton disabled={viewItems.size <= 1} id={this.dropId} pullRight title="Grid Views">
                    {viewItems.toArray()}
                </DropdownButton>
            </span>
        );
    }
}
