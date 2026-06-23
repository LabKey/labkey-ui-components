/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, PureComponent, ReactNode } from 'react';
import { List, Map } from 'immutable';

import { Filter } from '@labkey/api';
import { SetURLSearchParams, useSearchParams } from 'react-router-dom';

import { getSelected } from '../../actions';

import { QueryModel, SavedSettings } from '../../../public/QueryModel/QueryModel';
import { removeParameters } from '../../util/URL';

import { UserLimitSettings } from '../permissions/actions';

import { User } from '../base/models/User';
import { SecurityPolicy, SecurityRole } from '../permissions/models';
import { SCHEMAS } from '../../schemas';
import { isLoading, LoadingState } from '../../../public/LoadingState';
import { DisableableButton } from '../buttons/DisableableButton';
import { ManageDropdownButton } from '../buttons/ManageDropdownButton';
import { SelectionMenuItem } from '../menus/SelectionMenuItem';
import { GridPanel } from '../../../public/QueryModel/GridPanel';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { ChangeType, InjectedQueryModels, withQueryModels } from '../../../public/QueryModel/withQueryModels';

import { MenuDivider, MenuItem } from '../../dropdowns';

import { Container } from '../base/models/Container';

import { isAppHomeFolder } from '../../app/utils';

import { CreateUsersModal } from './CreateUsersModal';
import { UserDetailsPanel } from './UserDetailsPanel';
import { UserActivateChangeConfirmModal } from './UserActivateChangeConfirmModal';
import { UserDeleteConfirmModal } from './UserDeleteConfirmModal';

const OMITTED_COLUMNS = [
    'phone',
    'im',
    'mobile',
    'pager',
    'groups',
];

export enum UsersView {
    ALL = 'all',
    INACTIVE = 'inactive',
    SITE = 'site',
}

interface OwnProps {
    // option to disable the reset password UI pieces for this component
    allowResetPassword?: boolean;
    container: Container;
    // optional array of role options, objects with id and label values (i.e. [{id: "org.labkey.api.security.roles.ReaderRole", label: "Reader (default)"}])
    // note that the createNewUser action will not use this value but it will be passed back to the onCreateComplete
    newUserRoleOptions?: any[];
    onCreateComplete: (response: any, roles: string[]) => void;
    onUsersStateChangeComplete: (response: any) => void;
    policy: SecurityPolicy;
    rolesByUniqueName?: Map<string, SecurityRole>;
    // searchParams/setSearchParams can be removed as props if we convert to an FC and use the useSearchParams hook
    searchParams: URLSearchParams;
    setSearchParams: SetURLSearchParams;
    showDetailsPanel?: boolean;
    user: User;
    userLimitSettings?: Partial<UserLimitSettings>;
}

type Props = OwnProps & InjectedQueryModels;

interface State {
    selectedUserId: number;
    // valid options are 'create', 'deactivate', 'reactivate', 'delete', undefined
    showDialog: string;
    usersView: UsersView;
}

export class UsersGridPanelImpl extends PureComponent<Props, State> {
    static defaultProps = {
        showDetailsPanel: true,
        allowResetPassword: true,
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            // location is really only undefined when running in jest tests because the react-router context isn't
            // properly setup.
            usersView: this.getUsersView(this.props.searchParams.get('usersView')),
            showDialog: undefined,
            selectedUserId: undefined,
        };
    }

    componentDidMount(): void {
        this.setLastSelectedId();
        this.initQueryModel(this.state.usersView);
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>): void {
        this.setLastSelectedId();
        if (this.state.usersView !== prevState.usersView) {
            this.initQueryModel(this.state.usersView);
        } else if (prevProps.policy !== undefined && this.props.policy !== prevProps.policy) {
            // if we had a policy and it changed (ex. user was deactivated or deleted from detail panel), then load model
            this.reloadUsersModel();
        }

        const curUsersView = this.props.searchParams.get('usersView');

        if (curUsersView !== null) {
            this.setState({ usersView: this.getUsersView(curUsersView) });
            removeParameters(this.props.setSearchParams, 'usersView');
        }
    }

    initQueryModel = (usersView: UsersView): void => {
        const { actions, container, user } = this.props;
        // GitHub Issue 847: if user has manageUsersPermission allow them to select / view all site users
        // GitHub Issue 1234: use site users view for the inactive users grid view
        const schemaQuery =
            (usersView === UsersView.SITE || usersView === UsersView.INACTIVE) && user.hasManageUsersPermission()
                ? SCHEMAS.CORE_TABLES.SITE_USERS
                : SCHEMAS.CORE_TABLES.USERS;
        const baseFilters = usersView === UsersView.INACTIVE ? [Filter.create('active', false)] : [];

        actions.addModel(
            {
                id: this.getUsersModelId(),
                containerPath: container.path,
                schemaQuery,
                baseFilters,
                omittedColumns: OMITTED_COLUMNS,
                bindURL: true,
                urlPrefix: usersView, // each model needs to have its own urlPrefix for paging to work across models
                includeTotalCount: true,
                useSavedSettings: SavedSettings.all,
            },
            true,
            true
        );
    };

    getUsersView(paramVal: string): UsersView {
        // only allow 'site' view for user.hasManageUsersPermission()
        if (this.props.user.hasManageUsersPermission()) {
            if (paramVal === UsersView.SITE) {
                return UsersView.SITE;
            } else if (paramVal === UsersView.INACTIVE) {
                return UsersView.INACTIVE;
            }
        }
        return UsersView.ALL; // default to view application users
    }

    getUsersModelId(): string {
        return 'user-management-users-' + this.state.usersView;
    }

    getUsersModel(): QueryModel {
        return this.props.queryModels[this.getUsersModelId()];
    }

    toggleViewActive = (viewName: UsersView): void => {
        this.setState({ usersView: viewName });
    };

    closeDialog = (): void => {
        this.toggleDialog(undefined);
    };

    toggleDialog = (name: string, requiresSelection = false): void => {
        if (requiresSelection && !this.getUsersModel().hasSelections) {
            this.setState({ showDialog: undefined });
        } else {
            this.setState({ showDialog: name });
        }
    };

    onCreateComplete = (response: any, roles: string[]): void => {
        this.closeDialog();
        this.onRowSelectionChange(this.getUsersModel(), undefined, false); // clear selected user details
        this.props.onCreateComplete(response, roles);
        this.props.actions.onModelChange(this.getUsersModelId(), { changeType: ChangeType.add });
    };

    reloadUsersModel(): void {
        this.props.actions.loadModel(this.getUsersModelId(), true, true);
    }

    onUsersStateChangeComplete = (response: any): void => {
        this.closeDialog();
        this.updateSelectedUserId(undefined); // clear selected user details
        this.props.onUsersStateChangeComplete(response);
        this.props.actions.onModelChange(this.getUsersModelId(), {
            changeType: ChangeType.delete, // treat all as delete since row count changes with activate/inactivate actions
        });
    };

    onUserDelete = (response: any): void => {
        this.onUsersStateChangeComplete(response);
    };

    onRowSelectionChange = (model: QueryModel, row: any, checked: boolean): void => {
        let selectedUserId;

        if (checked) {
            // if a specific row has been selected, use that rows UserId value
            // else use the last userId in the selected array
            if (row) {
                selectedUserId = row.getIn(['UserId', 'value']);
            } else if (model.hasSelections) {
                selectedUserId = this.getLastSelectedId();
            }
        }

        this.updateSelectedUserId(selectedUserId);
    };

    updateSelectedUserId(selectedUserId: number): void {
        if (this.state.selectedUserId !== selectedUserId) {
            this.setState(() => ({ selectedUserId }));
        }
    }

    getLastSelectedId(): number {
        const selectedIds = this.getUsersModel().selections;
        return selectedIds.size > 0 ? parseInt(Array.from(selectedIds).pop()) : undefined;
    }

    setLastSelectedId(): void {
        const model = this.getUsersModel();
        if (!model || isLoading(model.selectionsLoadingState)) return;

        // if the model has already loaded selections, we can use that to reselect the last user
        // otherwise, query the server for the selection key for this model and use that response (issue 39374)
        if (model.selectionsLoadingState === LoadingState.LOADED) {
            this.updateSelectedUserId(this.getLastSelectedId());
        } else {
            // TODO: This seems wrong, we should just do nothing, eventually the selections will load and we'll be able
            //  to set the user id. If we don't automatically load selections we can manually call loadSelections via
            //  model actions.
            getSelected(
                model.id,
                false,
                model.schemaQuery,
                model.filters,
                model.containerPath,
                model.queryParameters,
                model.containerFilter
            ).then(response => {
                const selectedUserId =
                    response.selected.length > 0 ? parseInt(List.of(...response.selected).last()) : undefined;
                this.updateSelectedUserId(selectedUserId);
            });
        }
    }

    getUserLimitRemainingUsers(): number {
        const { userLimitSettings } = this.props;
        return userLimitSettings?.userLimit ? userLimitSettings.remainingUsers : undefined;
    }

    renderButtons = () => {
        const { user } = this.props;
        const { usersView } = this.state;
        const model = this.getUsersModel();

        return (
            <div className="btn-group">
                {user.hasAddUsersPermission() && (
                    <DisableableButton
                        bsStyle="success"
                        onClick={() => this.toggleDialog('create')}
                        disabledMsg={
                            this.getUserLimitRemainingUsers() === 0 ? 'User limit has been reached' : undefined
                        }
                    >
                        Create
                    </DisableableButton>
                )}
                {user.hasManageUsersPermission() && (
                    <ManageDropdownButton showIcon={false} pullRight={false}>
                        {usersView === UsersView.ALL && (
                            <SelectionMenuItem
                                text="Deactivate Users"
                                onClick={() => this.toggleDialog('deactivate', true)}
                                queryModel={model}
                                nounPlural="users"
                            />
                        )}
                        <SelectionMenuItem
                            text="Delete Users"
                            onClick={() => this.toggleDialog('delete', true)}
                            queryModel={model}
                            nounPlural="users"
                        />
                        {usersView === UsersView.INACTIVE && (
                            <SelectionMenuItem
                                text="Reactivate Users"
                                maxSelection={this.getUserLimitRemainingUsers()}
                                maxSelectionDisabledMsg={
                                    this.getUserLimitRemainingUsers() === 0 ? 'User limit has been reached' : undefined
                                }
                                onClick={() => this.toggleDialog('reactivate', true)}
                                queryModel={model}
                                nounPlural="users"
                            />
                        )}
                        <MenuDivider />
                        {usersView !== UsersView.ALL && (
                            <MenuItem onClick={() => this.toggleViewActive(UsersView.ALL)}>View All Application Users</MenuItem>
                        )}
                        {usersView !== UsersView.SITE && (
                            <MenuItem onClick={() => this.toggleViewActive(UsersView.SITE)}>View All Site Users</MenuItem>
                        )}
                        {usersView !== UsersView.INACTIVE && (
                            <MenuItem onClick={() => this.toggleViewActive(UsersView.INACTIVE)}>View Inactive Site Users</MenuItem>
                        )}
                    </ManageDropdownButton>
                )}
            </div>
        );
    };

    render(): ReactNode {
        const { newUserRoleOptions, user, showDetailsPanel, actions, userLimitSettings, container } = this.props;
        const { selectedUserId, showDialog, usersView } = this.state;
        const model = this.getUsersModel();

        // don't pass container from this.props as we want to check serverContext.container
        const isAppHome = isAppHomeFolder();

        let title = 'Application Users';
        if (user.hasManageUsersPermission() && usersView === UsersView.SITE) {
            title = 'Site Users';
        } else if (user.hasManageUsersPermission() && usersView === UsersView.INACTIVE) {
            title = 'Inactive Site Users';
        }

        return (
            <>
                <div className="row">
                    <div className={`col-xs-12 col-md-${showDetailsPanel ? 8 : 12}`}>
                        {!model && <LoadingSpinner />}
                        {model && (
                            <GridPanel
                                actions={actions}
                                model={model}
                                loadOnMount={false}
                                title={title}
                                ButtonsComponent={() => this.renderButtons()}
                                highlightLastSelectedRow
                                showChartMenu={false}
                            />
                        )}
                    </div>
                    {showDetailsPanel && (
                        <div className="col-xs-12 col-md-4">
                            <UserDetailsPanel
                                {...this.props}
                                currentUser={user}
                                userId={selectedUserId}
                                onUsersStateChangeComplete={this.onUsersStateChangeComplete}
                                showPermissionListLinks={isAppHome}
                            />
                        </div>
                    )}
                </div>
                {user.hasAddUsersPermission() && showDialog === 'create' && (
                    <CreateUsersModal
                        container={container}
                        userLimitSettings={userLimitSettings}
                        roleOptions={newUserRoleOptions}
                        onComplete={this.onCreateComplete}
                        onCancel={this.closeDialog}
                    />
                )}
                {user.hasManageUsersPermission() && (showDialog === 'reactivate' || showDialog === 'deactivate') && (
                    <UserActivateChangeConfirmModal
                        userIds={model.intSelections}
                        reactivate={showDialog === 'reactivate'}
                        onComplete={this.onUsersStateChangeComplete}
                        onCancel={this.closeDialog}
                    />
                )}
                {user.hasManageUsersPermission() && showDialog === 'delete' && (
                    <UserDeleteConfirmModal
                        userIds={model.intSelections}
                        onComplete={this.onUserDelete}
                        onCancel={this.closeDialog}
                    />
                )}
            </>
        );
    }
}

const UsersGridPanelWithModels = withQueryModels<OwnProps>(UsersGridPanelImpl);

type PanelProps = Omit<OwnProps, 'searchParams' | 'setSearchParams'>;

export const UsersGridPanel: FC<PanelProps> = memo(props => {
    const [searchParams, setSearchParams] = useSearchParams();
    return <UsersGridPanelWithModels {...props} searchParams={searchParams} setSearchParams={setSearchParams} />;
});
