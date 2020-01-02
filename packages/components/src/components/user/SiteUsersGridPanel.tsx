/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { List, Map } from "immutable";
import { Button, Row, Col, MenuItem } from "react-bootstrap";
import { Filter } from "@labkey/api";
import { CreateUsersModal } from "./CreateUsersModal";
import { QueryGridModel } from "../base/models/model";
import { SCHEMAS } from "../base/models/schemas";
import { getStateQueryGridModel } from "../../models";
import { getQueryGridModel } from "../../global";
import { ManageDropdownButton } from "../buttons/ManageDropdownButton";
import { SelectionMenuItem } from "../menus/SelectionMenuItem";
import { QueryGridPanel } from "../QueryGridPanel";
import { UserDetailsPanel } from "./UserDetailsPanel";
import { Principal, SecurityPolicy, SecurityRole } from "../permissions/models";
import { updateUserActiveState } from "./actions";
import { UserActivateChangeConfirmModal } from "./UserActivateChangeConfirmModal";
import { createNotification } from "../..";

const OMITTED_COLUMNS = List(['phone', 'im', 'mobile', 'pager', 'groups', 'active', 'hasPassword', 'firstName', 'lastName', 'description', 'expirationDate']);

interface Props {
    onCreateComplete: (response: any, role: string) => any
    onActivateChangeComplete: (response: any) => any

    policy: SecurityPolicy
    rolesByUniqueName: Map<string, SecurityRole>

    // optional array of role options, objects with id and label values
    // note that the createNewUser action will not use this value but it will be passed back to the onCreateComplete
    newUserRoleOptions?: Array<any>
}

interface State {
    viewActive: boolean
    showCreateUsers: boolean
    showDeactivate: boolean
    showReactivate: boolean
    selectedUserId: number
}

export class SiteUsersGridPanel extends React.PureComponent<Props, State> {

    constructor(props: Props) {
        super(props);

        this.state = {
            viewActive: true,
            showCreateUsers: false,
            showDeactivate: false,
            showReactivate: false,
            selectedUserId: undefined
        }
    }

    getUsersModel(): QueryGridModel {
        const { viewActive } = this.state;
        const gridId = 'user-management-users-' + (viewActive ? 'active' : 'inactive');
        const model = getStateQueryGridModel(gridId, SCHEMAS.CORE_TABLES.USERS, {
            containerPath: '/',
            omittedColumns: OMITTED_COLUMNS,
            baseFilters: List<Filter.IFilter>([Filter.create('active', viewActive)]),
            bindURL: true,
            isPaged: true
        });

        return getQueryGridModel(model.getId()) || model;
    }

    toggleViewActive = () => {
        this.setState((state) => ({
            viewActive: !state.viewActive,
            selectedUserId: undefined // clear selected user anytime we change viewsSampleSetDeleteConfirmModal.tsx
        }));
    };

    toggleCreateUsers = () => {
        this.setState((state) => ({showCreateUsers: !state.showCreateUsers}));
    };

    toggleActivateChange = (deactivate: boolean, reactivate: boolean) => {
        this.setState((state) => ({
            showDeactivate: deactivate,
            showReactivate: reactivate
        }));
    };

    onCreateComplete = (response: any, role: string) => {
        this.toggleCreateUsers();
        this.props.onCreateComplete(response, role);
    };

    onActivateChange(activate: boolean) {
        const model = this.getUsersModel();
        if (model.selectedIds.size > 0) {
            this.toggleActivateChange(!activate, activate);
        }
    }

    onActivateConfirm = (activate: boolean) => {
        const model = this.getUsersModel();
        if (model.selectedIds.size > 0) {
            // selectedIds will be strings, need to cast to integers
            const userIds = model.selectedIds.map(id => parseInt(id)).toList();

            updateUserActiveState(userIds, activate)
                .then(this.onActivateChangeComplete)
                .catch(error => {
                    console.error(error);
                    createNotification({
                        message: error.exception,
                        alertClass: 'danger'
                    });

                    this.toggleActivateChange(false, false);
                });
        }
    };

    onActivateChangeComplete = (response: any) => {
        this.toggleActivateChange(false, false);
        this.props.onActivateChangeComplete(response);
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
        const { viewActive } = this.state;

        return (
            <>
                <Button bsStyle={'success'} onClick={this.toggleCreateUsers}>
                    Create
                </Button>
                <ManageDropdownButton id={'users-manage-btn'}>
                    {viewActive &&
                        <SelectionMenuItem
                            id={'deactivate-users-menu-item'}
                            text={'Deactivate Users'}
                            onClick={() => this.onActivateChange(false)}
                            model={this.getUsersModel()}
                            nounPlural={"users"}
                        />
                    }
                    {!viewActive &&
                        <SelectionMenuItem
                            id={'reactivate-users-menu-item'}
                            text={'Reactivate Users'}
                            onClick={() => this.onActivateChange(true)}
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
        const { selectedUserId, showCreateUsers, viewActive, showDeactivate, showReactivate } = this.state;

        return (
            <>
                <Row>
                    <Col xs={12} md={8}>
                        <QueryGridPanel
                            header={(viewActive ? 'Active' : 'Inactive') + ' Users'}
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
                    show={showCreateUsers}
                    onCancel={this.toggleCreateUsers}
                    onComplete={this.onCreateComplete}
                    roleOptions={newUserRoleOptions}
                />
                {(showDeactivate || showReactivate) &&
                    <UserActivateChangeConfirmModal
                        userCount={this.getUsersModel().selectedIds.size}
                        activate={showReactivate}
                        onConfirm={this.onActivateConfirm}
                        onCancel={() => this.toggleActivateChange(false, false)}
                    />
                }
            </>
        )
    }
}
