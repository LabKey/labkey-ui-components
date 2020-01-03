/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { List, Map } from "immutable";
import { Button, Row, Col, MenuItem } from "react-bootstrap";
import { Filter, ActionURL } from "@labkey/api";
import { CreateUsersModal } from "./CreateUsersModal";
import { QueryGridModel } from "../base/models/model";
import { SCHEMAS } from "../base/models/schemas";
import { getStateQueryGridModel } from "../../models";
import { getQueryGridModel } from "../../global";
import { ManageDropdownButton } from "../buttons/ManageDropdownButton";
import { SelectionMenuItem } from "../menus/SelectionMenuItem";
import { QueryGridPanel } from "../QueryGridPanel";
import { UserDetailsPanel } from "./UserDetailsPanel";
import { SecurityPolicy, SecurityRole } from "../permissions/models";
import { UserActivateChangeConfirmModal } from "./UserActivateChangeConfirmModal";
import { capitalizeFirstChar } from "../../util/utils"
import { getLocation, getRouteFromLocationHash, replaceParameter } from "../../util/URL";
import { getBrowserHistory } from "../../util/global";
import { UserDeleteConfirmModal } from "./UserDeleteConfirmModal";

const OMITTED_COLUMNS = List(['phone', 'im', 'mobile', 'pager', 'groups', 'active', 'hasPassword', 'firstName', 'lastName', 'description', 'expirationDate']);

interface Props {
    onCreateComplete: (response: any, role: string) => any
    onUsersStateChangeComplete: (response: any) => any

    policy: SecurityPolicy
    rolesByUniqueName: Map<string, SecurityRole>

    // optional array of role options, objects with id and label values
    // note that the createNewUser action will not use this value but it will be passed back to the onCreateComplete
    newUserRoleOptions?: Array<any>
}

interface State {
    usersView: string
    showDialog: string // valid options are 'create', 'deactivate', 'reactivate', 'delete', undefined
    selectedUserId: number
    unlisten: any
}

export class SiteUsersGridPanel extends React.PureComponent<Props, State> {

    constructor(props: Props) {
        super(props);

        const unlisten = getBrowserHistory().listen((location, action) => {
            if (getRouteFromLocationHash(location.hash) === '#/admin/users') {
                // if the usersView param has changed, set state to trigger re-render with proper QueryGridModel
                const usersView = this.getUsersView(ActionURL.getParameters(location.hash).usersView);
                if (this.state.usersView !== usersView) {
                    this.setState((state) => ({
                        usersView,
                        selectedUserId: undefined // clear selected user anytime we change views
                    }));
                }
            }
        });

        this.state = {
            usersView: this.getUsersView(getLocation().query.get('usersView')),
            showDialog: undefined,
            selectedUserId: undefined,
            unlisten
        }
    }

    componentWillUnmount() {
        const { unlisten } = this.state;
        if (unlisten) {
            unlisten();
        }
    }

    getUsersView(paramVal: string): string {
        return paramVal === 'inactive' ? paramVal : 'active'; // default to view active users
    }

    getUsersModel(): QueryGridModel {
        const { usersView } = this.state;
        const gridId = 'user-management-users-' + usersView;
        const model = getStateQueryGridModel(gridId, SCHEMAS.CORE_TABLES.USERS, {
            containerPath: '/',
            omittedColumns: OMITTED_COLUMNS,
            baseFilters: List<Filter.IFilter>([Filter.create('active', usersView === 'active')]),
            bindURL: true,
            isPaged: true
        });

        return getQueryGridModel(model.getId()) || model;
    }

    toggleViewActive = () => {
        const currentView = this.state.usersView;
        const newView = currentView === 'active' ? 'inactive' : 'active';
        replaceParameter(getLocation(), 'usersView', newView);
    };

    toggleDialog = (name: string, requiresSelection = false) => {
        if (requiresSelection && this.getUsersModel().selectedIds.size === 0) {
            this.setState(() => ({showDialog: undefined}));
        }
        else {
            this.setState(() => ({showDialog: name}));
        }
    };

    onCreateComplete = (response: any, role: string) => {
        this.toggleDialog(undefined); // close dialog
        this.props.onCreateComplete(response, role);
    };

    onUsersStateChangeComplete = (response: any) => {
        this.toggleDialog(undefined); // close dialog
        this.props.onUsersStateChangeComplete(response);
    };

    onRowSelectionChange = (model, row, checked) => {
        if (checked && row) {
            this.setState(() => ({selectedUserId: row.getIn(['UserId', 'value'])}));
        }
        else {
            this.setState(() => ({selectedUserId: undefined}));
        }
    };

    renderButtons = () => {
        const viewActive = this.state.usersView === 'active';

        return (
            <>
                <Button bsStyle={'success'} onClick={() => this.toggleDialog('create')}>
                    Create
                </Button>
                <ManageDropdownButton id={'users-manage-btn'}>
                    {viewActive &&
                        <SelectionMenuItem
                            id={'deactivate-users-menu-item'}
                            text={'Deactivate Users'}
                            onClick={() => this.toggleDialog('deactivate', true)}
                            model={this.getUsersModel()}
                            nounPlural={"users"}
                        />
                    }
                    <SelectionMenuItem
                        id={'delete-users-menu-item'}
                        text={'Delete Users'}
                        onClick={() => this.toggleDialog('delete', true)}
                        model={this.getUsersModel()}
                        nounPlural={"users"}
                    />
                    {!viewActive &&
                        <SelectionMenuItem
                            id={'reactivate-users-menu-item'}
                            text={'Reactivate Users'}
                            onClick={() => this.toggleDialog('reactivate', true)}
                            model={this.getUsersModel()}
                            nounPlural={"users"}
                        />
                    }
                    <MenuItem
                        id={'viewactive-users-menu-item'}
                        onClick={this.toggleViewActive}
                    >
                        View {(viewActive ? 'Inactive' : 'Active') + ' Users'}
                    </MenuItem>
                </ManageDropdownButton>
            </>
        )
    };

    render() {
        const { newUserRoleOptions } = this.props;
        const { selectedUserId, showDialog, usersView } = this.state;

        return (
            <>
                <Row>
                    <Col xs={12} md={8}>
                        <QueryGridPanel
                            header={capitalizeFirstChar(usersView) + ' Users'}
                            buttons={this.renderButtons}
                            onSelectionChange={this.onRowSelectionChange}
                            model={this.getUsersModel()}
                        />
                    </Col>
                    <Col xs={12} md={4}>
                        <UserDetailsPanel
                            {...this.props}
                            userId={selectedUserId}
                        />
                    </Col>
                </Row>
                <CreateUsersModal
                    show={showDialog === 'create'}
                    roleOptions={newUserRoleOptions}
                    onComplete={this.onCreateComplete}
                    onCancel={() => this.toggleDialog(undefined)}
                />
                {(showDialog === 'reactivate' || showDialog === 'deactivate') &&
                    <UserActivateChangeConfirmModal
                        model={this.getUsersModel()}
                        reactivate={showDialog === 'reactivate'}
                        onComplete={this.onUsersStateChangeComplete}
                        onCancel={() => this.toggleDialog(undefined)}
                    />
                }
                {showDialog === 'delete' &&
                    <UserDeleteConfirmModal
                        model={this.getUsersModel()}
                        onComplete={this.onUsersStateChangeComplete}
                        onCancel={() => this.toggleDialog(undefined)}
                    />
                }
            </>
        )
    }
}
