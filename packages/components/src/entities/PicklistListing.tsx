import React, { FC, memo, useCallback, useMemo, useState } from 'react';

import { Filter, PermissionTypes } from '@labkey/api';

import { DisableableButton } from '../internal/components/buttons/DisableableButton';

import { userCanManagePicklists } from '../internal/app/utils';

import { MY_PICKLISTS_HREF, TEAM_PICKLISTS_HREF } from '../internal/app/constants';

import { User } from '../internal/components/base/models/User';
import { RequiresPermission } from '../internal/components/base/Permissions';
import { useNotificationsContext } from '../internal/components/notifications/NotificationsContext';
import { Section } from '../internal/components/base/Section';
import { TabbedGridPanel } from '../public/QueryModel/TabbedGridPanel';
import { QuerySort } from '../public/QuerySort';
import { SCHEMAS } from '../internal/schemas';
import { Page } from '../internal/components/base/Page';

import { InjectedQueryModels, RequiresModelAndActions, withQueryModels } from '../public/QueryModel/withQueryModels';

import { Picklist } from '../internal/components/picklist/models';
import { deletePicklists, getPicklistListingContainerFilter } from '../internal/components/picklist/actions';
import { PUBLIC_PICKLIST_CATEGORY } from '../internal/components/picklist/constants';
import { PicklistCreationMenuItem } from '../internal/components/picklist/PicklistCreationMenuItem';

import { PicklistDeleteConfirm } from './PicklistDeleteConfirm';

const MY_PICKLISTS_GRID_ID = 'my-picklists';
const TEAM_PICKLISTS_GRID_ID = 'team-picklists';

interface OwnProps {
    initTab?: string;
    user: User;
}

interface PicklistGridProps {
    activeTab?: string;
    user: User;
}

const PICKLISTS_CAPTION = 'Manage sample groups for storage and export';

interface ButtonProps {
    activeId: string;
    onDelete: () => void;
}

const PicklistGridButtons: FC<ButtonProps & RequiresModelAndActions> = memo(props => {
    const { onDelete, model } = props;

    return (
        <RequiresPermission perms={PermissionTypes.ManagePicklists}>
            <DisableableButton
                disabledMsg={!model.hasSelections ? 'Select one or more picklists.' : undefined}
                onClick={onDelete}
            >
                <span className="fa fa-trash" />
                <span>&nbsp;Delete</span>
            </DisableableButton>
        </RequiresPermission>
    );
});

const PicklistGridImpl: FC<PicklistGridProps & InjectedQueryModels> = memo(props => {
    const { actions, queryModels, user, activeTab } = props;
    const { createNotification } = useNotificationsContext();

    const tabOrder = useMemo(() => {
        return Object.keys(queryModels);
    }, [queryModels]);

    const [activeTabId, setActiveTabId] = useState(activeTab ?? tabOrder[0]);
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

    const onChangeTab = useCallback((tab: string) => {
        window.location.href = tab === MY_PICKLISTS_GRID_ID ? MY_PICKLISTS_HREF.toHref() : TEAM_PICKLISTS_HREF.toHref();
        setActiveTabId(tab);
    }, []);

    const showDeleteConfirm = (): void => {
        setShowDeleteModal(true);
    };

    const hideDeleteConfirm = (): void => {
        setShowDeleteModal(false);
    };

    const onPicklistDelete = (listsToDelete: Picklist[]) => {
        const noun = listsToDelete.length === 1 ? 'list' : 'lists';
        deletePicklists(listsToDelete)
            .then(() => {
                setShowDeleteModal(false);
                actions.loadModel(queryModels[activeTabId].id, true, true);
                createNotification('Successfully deleted ' + listsToDelete.length + ' pick' + noun + '.');
            })
            .catch(() => {
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
                userCanManagePicklists(user) ? (
                    <PicklistCreationMenuItem
                        user={user}
                        asMenuItem={false}
                        itemText="Create Picklist"
                        onCreatePicklist={() => actions.loadAllModels()}
                    />
                ) : undefined
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
                allowViewCustomization={false}
                ButtonsComponent={PicklistGridButtons}
                buttonsComponentProps={{
                    onDelete: showDeleteConfirm,
                    activeId: activeTabId,
                    queryModel: queryModels[activeTabId],
                }}
                exportFilename="PickLists"
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
    const { initTab, user } = props;

    const queryConfigs = {};
    if (userCanManagePicklists(user)) {
        queryConfigs[MY_PICKLISTS_GRID_ID] = {
            baseFilters: [Filter.create('CreatedBy', user.id)],
            containerFilter: getPicklistListingContainerFilter(),
            sorts: [new QuerySort({ fieldKey: 'Name' })],
            id: MY_PICKLISTS_GRID_ID,
            title: 'My Picklists',
            omittedColumns: ['CreatedBy'],
            schemaQuery: SCHEMAS.LIST_METADATA_TABLES.PICKLISTS,
            includeTotalCount: true,
        };
    }
    queryConfigs[TEAM_PICKLISTS_GRID_ID] = {
        baseFilters: [Filter.create('Category', PUBLIC_PICKLIST_CATEGORY)],
        containerFilter: getPicklistListingContainerFilter(),
        sorts: [new QuerySort({ fieldKey: 'Name' })],
        id: TEAM_PICKLISTS_GRID_ID,
        title: 'Team Picklists',
        omittedColumns: ['Category', 'Sharing'],
        schemaQuery: SCHEMAS.LIST_METADATA_TABLES.PICKLISTS,
        includeTotalCount: true,
    };

    return (
        <Page title="Picklists">
            <PicklistGridWithModels queryConfigs={queryConfigs} autoLoad={true} activeTab={initTab} {...props} />
        </Page>
    );
});
