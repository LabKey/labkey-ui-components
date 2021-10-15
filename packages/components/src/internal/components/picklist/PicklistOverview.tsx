import React, { ComponentType, FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Checkbox, MenuItem } from 'react-bootstrap';

import { Filter, PermissionTypes, Utils } from '@labkey/api';

import {
    App,
    AppURL,
    ConfirmModal,
    createNotification,
    deletePicklists,
    getConfirmDeleteMessage,
    getListProperties,
    GridPanel,
    InsufficientPermissionsPage,
    invalidateLineageResults,
    LoadingPage,
    LoadingSpinner,
    ManageDropdownButton,
    NotFound,
    Page,
    PageDetailHeader,
    Picklist,
    PicklistDeleteConfirm,
    PicklistEditModal,
    PRIVATE_PICKLIST_CATEGORY,
    PUBLIC_PICKLIST_CATEGORY,
    queryGridInvalidate,
    QueryModel,
    removeSamplesFromPicklist,
    RequiresPermission,
    resolveErrorMessage,
    SchemaQuery,
    SCHEMAS,
    SelectionMenuItem,
    updatePicklist,
    User,
} from '../../..';
// These need to be direct imports from files to avoid circular dependencies in index.ts
import {
    InjectedQueryModels,
    RequiresModelAndActions,
    withQueryModels,
} from '../../../public/QueryModel/withQueryModels';

import { SampleStorageButton } from '../samples/models';

interface OwnProps {
    user: User;
    navigate: (url: string | AppURL) => any;
    params?: any;
    StorageButtonsComponent?: SampleStorageButton;
    JobsButtonsComponent?: SampleJobsButton;
    sampleExportOptions?: { [key: string]: any };
}

interface SampleJobsButtonsComponentProps {
    user: User;
    model?: QueryModel;
    isPicklist?: boolean;
}

type SampleJobsButton = ComponentType<SampleJobsButtonsComponentProps>;

const PICKLIST_ITEMS_ID_PREFIX = 'picklist-items-';
const PICKLIST_METADATA_ID = 'picklist-metadata-';

interface GridButtonProps {
    user: User;
    picklist: Picklist;
    onRemoveFromPicklistClick?: () => void;
    afterStorageUpdate?: () => void;
    StorageButtonsComponent?: SampleStorageButton;
    JobsButtonsComponent?: SampleJobsButton;
}

export const GridButtons: FC<GridButtonProps & RequiresModelAndActions> = memo(props => {
    const {
        picklist,
        model,
        afterStorageUpdate,
        onRemoveFromPicklistClick,
        user,
        StorageButtonsComponent,
        JobsButtonsComponent,
    } = props;
    if (!model || model.isLoading) {
        return null;
    }

    return (
        <RequiresPermission perms={PermissionTypes.Insert}>
            <div className="btn-group">
                <ManageDropdownButton id="picklist-samples">
                    {picklist.canRemoveItems(user) && (
                        <SelectionMenuItem
                            id="remove-samples-menu-item"
                            text="Remove from Picklist"
                            onClick={onRemoveFromPicklistClick}
                            queryModel={model}
                            nounPlural="samples"
                        />
                    )}
                </ManageDropdownButton>
                {JobsButtonsComponent && <JobsButtonsComponent user={user} model={model} isPicklist={true} />}
                {StorageButtonsComponent && (
                    <StorageButtonsComponent
                        afterStorageUpdate={afterStorageUpdate}
                        queryModel={model}
                        user={user}
                        isPicklist={true}
                    />
                )}
            </div>
        </RequiresPermission>
    );
});

type Props = OwnProps & InjectedQueryModels;

export const PicklistOverviewImpl: FC<Props> = memo(props => {
    const { id } = props.params;
    const { queryModels, actions, user, navigate, sampleExportOptions, StorageButtonsComponent, JobsButtonsComponent } =
        props;
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [showEditModal, setShowEditModal] = useState<boolean>(false);
    const [listName, setListName] = useState<string>(undefined);

    const [showRemoveFromPicklistConfirm, setShowRemoveFromPicklistConfirm] = useState<boolean>(false);

    const getMetadataGridId = () => {
        return PICKLIST_METADATA_ID + id;
    };

    const getItemsGridId = () => {
        return PICKLIST_ITEMS_ID_PREFIX + id;
    };

    const metadataQueryModel = useMemo(() => {
        return queryModels[getMetadataGridId()];
    }, [queryModels]);

    const itemsQueryModel = useMemo(() => {
        return queryModels[getItemsGridId()];
    }, [queryModels]);

    let picklist = useMemo(() => {
        const listMetadataModel = metadataQueryModel;
        if (listMetadataModel && !listMetadataModel.isLoading) {
            return new Picklist(listMetadataModel.getRow(undefined, true));
        }
        return undefined;
    }, [queryModels]);

    useEffect(() => {
        actions.addModel(
            {
                schemaQuery: SCHEMAS.LIST_METADATA_TABLES.PICKLISTS,
                id: getMetadataGridId(),
                bindURL: false,
                requiredColumns: ['Category'],
                baseFilters: [Filter.create('listId', id)],
            },
            true
        );
        getListProperties(id).then(listModel => {
            setListName(listModel.name);
            actions.addModel({
                schemaQuery: SchemaQuery.create('lists', listModel.name),
                id: getItemsGridId(),
                requiredColumns: ['Created'],
                bindURL: true,
            });
        });
    }, [listName, actions, id]);

    const onDeletePicklistClick = useCallback(() => {
        setShowDeleteModal(true);
    }, [showDeleteModal]);

    const deletePicklist = useCallback(() => {
        deletePicklists([picklist])
            .then(() => {
                setShowDeleteModal(false);
                navigate(AppURL.create(App.PICKLIST_KEY));
                createNotification('Successfully deleted picklist "' + picklist.name + '".');
            })
            .catch(() => {
                setShowDeleteModal(false);
                createNotification({
                    message:
                        'There was a problem deleting this picklist.  Be sure the list is still valid and has not been deleted by another user.',
                    alertClass: 'danger',
                });
            });
    }, [picklist, navigate]);

    const hideDeletePicklistConfirm = useCallback(() => {
        setShowDeleteModal(false);
    }, [showDeleteModal]);

    const onEditPicklistMetadataClick = useCallback(() => {
        setShowEditModal(true);
    }, [showEditModal]);

    const hideEditPicklistMetadataModal = useCallback(() => {
        setShowEditModal(false);
    }, [showEditModal]);

    const afterSavePicklist = useCallback((picklist: Picklist) => {
        if (listName != picklist.name) {
            setListName(picklist.name);
        }
        actions.loadModel(getMetadataGridId());
        createNotification('Successfully updated picklist metadata.');
        setShowEditModal(false);
    }, []);

    // Using a type for evt here causes difficulties.  It wants a FormEvent<Checkbox> but
    // then it doesn't recognize checked as a valid field on current target.
    const onSharedChanged = useCallback(
        evt => {
            picklist = picklist.mutate({
                Category: evt.currentTarget.checked ? PUBLIC_PICKLIST_CATEGORY : PRIVATE_PICKLIST_CATEGORY,
            }) as Picklist;
            updatePicklist(picklist)
                .then(update => {
                    actions.loadModel(getMetadataGridId());
                })
                .catch(reason => {
                    createNotification({
                        message:
                            'There was a problem updating the sharing for this picklist. ' +
                            resolveErrorMessage(reason),
                        alertClass: 'danger',
                    });
                });
        },
        [picklist]
    );

    const onRemoveFromPicklistClick = () => {
        setShowRemoveFromPicklistConfirm(true);
    };

    const onCancelRemoveFromList = () => {
        setShowRemoveFromPicklistConfirm(false);
    };

    const onRemoveFromList = useCallback(async () => {
        if (itemsQueryModel?.hasSelections) {
            const numDeleted = await removeSamplesFromPicklist(picklist, itemsQueryModel);
            createNotification(
                'Successfully removed ' + Utils.pluralize(numDeleted, 'sample', 'samples') + ' from this list.'
            );
            setShowRemoveFromPicklistConfirm(false);
            actions.replaceSelections(getItemsGridId(), []);
            actions.loadModel(getItemsGridId(), true);
        }
    }, [actions, picklist, queryModels, id, setShowRemoveFromPicklistConfirm]);

    const onSampleSetChange = useCallback(() => {
        invalidateLineageResults();
        queryGridInvalidate(SCHEMAS.EXP_TABLES.MATERIALS);
    }, []);

    const afterStorageUpdate = () => {
        const { actions } = props;
        onSampleSetChange();
        actions.loadAllModels(true);
    };

    if (!picklist) {
        return <LoadingPage />;
    }

    if (!picklist.isValid()) {
        return <NotFound />;
    }

    if (!picklist.isUserList(user) && !picklist.isPublic()) {
        return <InsufficientPermissionsPage title="Picklist" />;
    }

    const gridButtonProps = {
        onRemoveFromPicklistClick,
        afterStorageUpdate,
        user,
        picklist,
        StorageButtonsComponent,
        JobsButtonsComponent,
    };

    const nounAndNumber = itemsQueryModel?.selections
        ? Utils.pluralize(itemsQueryModel.selections.size, 'Sample', 'Samples')
        : undefined;
    const selectedNounAndNumber = itemsQueryModel?.selections
        ? Utils.pluralize(itemsQueryModel.selections.size, 'selected sample', 'selected samples')
        : undefined;
    return (
        <Page title={listName}>
            <PageDetailHeader
                user={user}
                iconDir="_images"
                iconSrc="workflow"
                title={listName}
                subTitle={undefined}
                description={picklist.Description}
                leftColumns={9}
                iconAltText="picklist-icon"
            >
                {(picklist.isEditable(user) || picklist.isDeletable(user)) && (
                    <ManageDropdownButton id="picklistHeader" pullRight collapsed>
                        {picklist.isUserList(user) && (
                            <MenuItem onClick={onEditPicklistMetadataClick}>Edit Picklist</MenuItem>
                        )}
                        <MenuItem onClick={onDeletePicklistClick}>Delete Picklist</MenuItem>
                    </ManageDropdownButton>
                )}
            </PageDetailHeader>

            <div className="panel panel-default">
                <div className="panel-body">
                    <div className="picklist-grid">
                        {picklist.isEditable(user) && (
                            <>
                                <div className="picklist-sharing">Sharing</div>
                                <Checkbox checked={picklist.isPublic()} onChange={onSharedChanged}>
                                    <span>Share this picklist publicly with team members</span>
                                </Checkbox>
                            </>
                        )}
                        {queryModels[getItemsGridId()] ? (
                            <GridPanel
                                ButtonsComponent={GridButtons}
                                buttonsComponentProps={gridButtonProps}
                                model={queryModels[getItemsGridId()]}
                                actions={actions}
                                advancedExportOptions={sampleExportOptions}
                            />
                        ) : (
                            <LoadingSpinner />
                        )}
                    </div>
                </div>
            </div>

            {showDeleteModal && (
                <PicklistDeleteConfirm
                    model={metadataQueryModel}
                    useSelection={false}
                    onConfirm={deletePicklist}
                    onCancel={hideDeletePicklistConfirm}
                    user={user}
                />
            )}
            <PicklistEditModal
                show={showEditModal}
                picklist={picklist}
                onCancel={hideEditPicklistMetadataModal}
                onFinish={afterSavePicklist}
                showNotification={false}
            />
            {showRemoveFromPicklistConfirm && (
                <ConfirmModal
                    title="Remove from Picklist"
                    onConfirm={onRemoveFromList}
                    onCancel={onCancelRemoveFromList}
                    confirmVariant="danger"
                    confirmButtonText={'Yes, Remove ' + nounAndNumber}
                    cancelButtonText="Cancel"
                >
                    Permanently remove the {selectedNounAndNumber} from this list?
                    {getConfirmDeleteMessage('Removal')}
                </ConfirmModal>
            )}
        </Page>
    );
});

export const PicklistOverview = withQueryModels<OwnProps>(PicklistOverviewImpl);
