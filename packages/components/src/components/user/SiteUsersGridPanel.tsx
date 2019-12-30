/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { List, Map } from "immutable";
import { Button, Row, Col } from "react-bootstrap";
import { Filter } from "@labkey/api";
import { CreateUsersModal } from "./CreateUsersModal";
import { ACTIVE_USER_GRID_ID, INACTIVE_USER_GRID_ID } from "./constants";
import { QueryGridModel } from "../base/models/model";
import { SCHEMAS } from "../base/models/schemas";
import { getStateQueryGridModel } from "../../models";
import { getQueryGridModel } from "../../global";
import { ManageDropdownButton } from "../buttons/ManageDropdownButton";
import { SelectionMenuItem } from "../menus/SelectionMenuItem";
import { QueryGridPanel } from "../QueryGridPanel";
import { UserDetailsPanel } from "./UserDetailsPanel";
import { Principal, SecurityPolicy, SecurityRole } from "../..";

const OMITTED_COLUMNS = List(['phone', 'im', 'mobile', 'pager', 'groups', 'active', 'hasPassword', 'firstName', 'lastName', 'description', 'expirationDate']);

interface Props {
    onCreateComplete: (response: any, role: string) => any
    policy: SecurityPolicy
    rolesByUniqueName: Map<string, SecurityRole>
    principalsById: Map<number, Principal>

    // optional array of role options, objects with id and label values
    // note that the createNewUser action will not use this value but it will be passed back to the onCreateComplete
    newUserRoleOptions?: Array<any>
}

interface State {
    showCreateUsers: boolean
    selectedUserId: number
}

export class SiteUsersGridPanel extends React.PureComponent<Props, State> {

    constructor(props: Props) {
        super(props);

        this.state = {
            showCreateUsers: false,
            selectedUserId: undefined
        }
    }

    getActiveUsersStateModel(): QueryGridModel {
        const model = getStateQueryGridModel('user-management-active', SCHEMAS.CORE_TABLES.USERS, {
            title: 'Active',
            containerPath: '/',
            omittedColumns: OMITTED_COLUMNS,
            baseFilters: List<Filter.IFilter>([Filter.create('active', true)]),
            urlPrefix: ACTIVE_USER_GRID_ID,
            bindURL: true,
            isPaged: true
        });

        return getQueryGridModel(model.getId()) || model;
    }

    getInactiveUsersStateModel(): QueryGridModel {
        const model = getStateQueryGridModel('user-management-inactive', SCHEMAS.CORE_TABLES.USERS, {
            title: 'Inactive',
            containerPath: '/',
            omittedColumns: OMITTED_COLUMNS,
            baseFilters: List<Filter.IFilter>([Filter.create('active', false)]),
            urlPrefix: INACTIVE_USER_GRID_ID,
            bindURL: true,
            isPaged: true
        });

        return getQueryGridModel(model.getId()) || model;
    }

    toggleCreateUsers = () => {
        this.setState((state) => ({showCreateUsers: !state.showCreateUsers}));
    };

    onCreateComplete = (response: any, role: string) => {
        this.toggleCreateUsers();
        this.props.onCreateComplete(response, role);
    };

    onDeactivate = () => {
        const model = this.getActiveUsersStateModel();
        if (model.selectedIds.size > 0) {
            console.log('deactivate', this.getActiveUsersStateModel().selectedIds.toJS());
            // TODO toggle state to show deactivate dialog
        }
    };

    onReactivate = () => {
        const model = this.getInactiveUsersStateModel();
        if (model.selectedIds.size > 0) {
            console.log('reactivate', this.getInactiveUsersStateModel().selectedIds.toJS());
            // TODO toggle state to show reactivate dialog
        }
    };

    onRowSelectionChange = (model, row, checked) => {
        if (checked && row) {
            this.setState(() => ({selectedUserId: row.getIn(['UserId', 'value'])}));
        }
        else {
            this.setState(() => ({selectedUserId: undefined}));
        }
    };

    renderButtons = (tabModel: QueryGridModel) => {
        const activeUserModel = this.getActiveUsersStateModel();
        const isActiveTab = tabModel && tabModel.getId() === activeUserModel.getId();
        const inactiveUserModel = this.getInactiveUsersStateModel();
        const isInactiveTab = tabModel && tabModel.getId() === inactiveUserModel.getId();

        return (
            <>
                {isActiveTab &&
                    <Button bsStyle={'success'} onClick={this.toggleCreateUsers}>
                        Create
                    </Button>
                }
                <ManageDropdownButton id={'users-manage-btn'}>
                    {isActiveTab &&
                        <SelectionMenuItem
                            id={'deactivate-users-menu-item'}
                            text={'Deactivate Users'}
                            onClick={this.onDeactivate}
                            model={activeUserModel}
                            nounPlural={"users"}
                        />
                    }
                    {isInactiveTab &&
                        <SelectionMenuItem
                            id={'reactivate-users-menu-item'}
                            text={'Reactivate Users'}
                            onClick={this.onReactivate}
                            model={inactiveUserModel}
                            nounPlural={"users"}
                        />
                    }
                </ManageDropdownButton>
            </>
        )
    };

    render() {
        const { newUserRoleOptions, principalsById } = this.props;
        const {  selectedUserId, showCreateUsers} = this.state;

        return (
            <>
                <Row>
                    <Col xs={12} md={8}>
                        <QueryGridPanel
                            header={'Users'}
                            showTabs={true}
                            model={List<QueryGridModel>([
                                this.getActiveUsersStateModel(),
                                this.getInactiveUsersStateModel()
                            ])}
                            buttons={this.renderButtons}
                            onSelectionChange={this.onRowSelectionChange}
                        />
                    </Col>
                    <Col xs={12} md={4}>
                        <UserDetailsPanel
                            {...this.props}
                            principal={principalsById.get(selectedUserId)}
                        />
                    </Col>
                </Row>
                <CreateUsersModal
                    show={showCreateUsers}
                    onCancel={this.toggleCreateUsers}
                    onComplete={this.onCreateComplete}
                    roleOptions={newUserRoleOptions}
                />
            </>
        )
    }
}
