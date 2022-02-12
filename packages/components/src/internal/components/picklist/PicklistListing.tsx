import React, { ComponentType, FC, memo, useCallback, useMemo, useState } from 'react';

import { Filter, PermissionTypes, Query } from '@labkey/api';

import {
    Actions,
    App,
    createNotification,
    getLocation,
    Page,
    QuerySort,
    replaceParameter,
    RequiresPermission,
    SCHEMAS,
    Section,
    TabbedGridPanel,
    User,
} from '../../..';

// These need to be direct imports from files to avoid circular dependencies in index.ts
import {
    InjectedQueryModels,
    RequiresModelAndActions,
    withQueryModels,
} from '../../../public/QueryModel/withQueryModels';

import { PUBLIC_PICKLIST_CATEGORY } from '../domainproperties/list/constants';

import { deletePicklists } from './actions';
import { Picklist } from './models';
import { PicklistDeleteConfirm } from './PicklistDeleteConfirm';

const MY_PICKLISTS_GRID_ID = 'my-picklists';
const TEAM_PICKLISTS_GRID_ID = 'team-picklists';

interface OwnProps {
    user: User;
    initTab?: string;
    CreateButton?: ComponentType<PicklistCreateButtonProps>;
}

interface PicklistGridProps {
    user: User;
    CreateButton?: ComponentType<PicklistCreateButtonProps>;
    activeTab?: string;
}

interface PicklistCreateButtonProps {
    actions?: Actions;
    currentSubMenuKey?: string;
    pullRight?: boolean;
}

const PICKLISTS_CAPTION = 'Manage sample groups for storage and export';

interface ButtonProps {
    onDelete: () => void;
    activeId: string;
}

const PicklistGridButtons: FC<ButtonProps & RequiresModelAndActions> = memo(props => {
    const { onDelete, model } = props;

    const onClickDelete = useCallback(() => {
        onDelete();
    }, [onDelete]);

    return (
        <RequiresPermission perms={PermissionTypes.ManagePicklists}>
            <button className="btn btn-default" type="button" onClick={onClickDelete} disabled={!model.hasSelections}>
                <span className="fa fa-trash" />
                <span>&nbsp;Delete</span>
            </button>
        </RequiresPermission>
    );
});

const PicklistGridImpl: FC<PicklistGridProps & InjectedQueryModels> = memo(props => {
    const { actions, queryModels, user, activeTab, CreateButton } = props;

    const tabOrder = useMemo(() => {
        return Object.keys(queryModels);
    }, [queryModels]);

    const [activeTabId, setActiveTabId] = useState(activeTab || tabOrder[0]);
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

    const onChangeTab = useCallback((tab: string) => {
        replaceParameter(getLocation(), 'tab', tab);
        setActiveTabId(tab);
    }, []);

    const showDeleteConfirm = () => {
        setShowDeleteModal(true);
    };

    const hideDeleteConfirm = () => {
        setShowDeleteModal(false);
    };

    const onPicklistDelete = (listsToDelete: Picklist[]) => {
        const noun = listsToDelete.length === 1 ? 'list' : 'lists';
        deletePicklists(listsToDelete)
            .then(() => {
                setShowDeleteModal(false);
                actions.loadModel(queryModels[activeTabId].id, true);
                createNotification('Successfully deleted ' + listsToDelete.length + ' pick' + noun + '.');
            })
            .catch(reason => {
                setShowDeleteModal(false);
                createNotification({
                    message:
                        'There was a problem deleting the selected pick' +
                        noun +
                        '.  Be sure the ' +
                        (listsToDelete.length === 1
                            ? noun + ' is still valid and has'
                            : noun + ' are still valid and have') +
                        ' not been deleted by another user.',
                    alertClass: 'danger',
                });
            });
    };

    return (
        <Section
            title="Picklists"
            caption={PICKLISTS_CAPTION}
            context={
                CreateButton !== undefined && (
                    <CreateButton currentSubMenuKey={App.PICKLIST_KEY} pullRight actions={actions} />
                )
            }
        >
            <TabbedGridPanel
                actions={actions}
                alwaysShowTabs={true}
                queryModels={queryModels}
                tabOrder={tabOrder}
                activeModelId={activeTabId}
                onTabSelect={onChangeTab}
                showChartMenu={false}
                asPanel={false}
                ButtonsComponent={PicklistGridButtons}
                buttonsComponentProps={{
                    onDelete: showDeleteConfirm,
                    activeId: activeTabId,
                    queryModel: queryModels[activeTabId],
                }}
            />
            {showDeleteModal && (
                <PicklistDeleteConfirm
                    model={queryModels[activeTabId]}
                    onConfirm={onPicklistDelete}
                    onCancel={hideDeleteConfirm}
                    user={user}
                />
            )}
        </Section>
    );
});

const PicklistGridWithModels = withQueryModels<PicklistGridProps>(PicklistGridImpl);

export const PicklistListing: FC<OwnProps> = memo(props => {
    const { user, initTab } = props;

    const queryConfigs = {
        [MY_PICKLISTS_GRID_ID]: {
            baseFilters: [Filter.create('CreatedBy', user.id)],
            containerFilter: Query.ContainerFilter.current,
            sorts: [new QuerySort({ fieldKey: 'Name' })],
            id: MY_PICKLISTS_GRID_ID,
            title: 'My Picklists',
            omittedColumns: ['CreatedBy'],
            schemaQuery: SCHEMAS.LIST_METADATA_TABLES.PICKLISTS,
        },
        [TEAM_PICKLISTS_GRID_ID]: {
            baseFilters: [Filter.create('Category', PUBLIC_PICKLIST_CATEGORY)],
            containerFilter: Query.ContainerFilter.current,
            sorts: [new QuerySort({ fieldKey: 'Name' })],
            id: TEAM_PICKLISTS_GRID_ID,
            title: 'Team Picklists',
            omittedColumns: ['Category', 'Sharing'],
            schemaQuery: SCHEMAS.LIST_METADATA_TABLES.PICKLISTS,
        },
    };

    return (
        <Page title="Picklists">
            <PicklistGridWithModels queryConfigs={queryConfigs} autoLoad={true} activeTab={initTab} {...props} />
        </Page>
    );
});
