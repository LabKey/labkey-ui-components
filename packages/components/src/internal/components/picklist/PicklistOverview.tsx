import React, { ComponentType, FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Checkbox, MenuItem } from 'react-bootstrap';
import { AuditBehaviorTypes, Filter } from '@labkey/api';
import {
    App,
    AppURL,
    createNotification,
    InsufficientPermissionsPage,
    invalidateLineageResults,
    LoadingPage,
    ManageDropdownButton,
    NotFound,
    Page,
    PageDetailHeader,
    QueryConfigMap,
    queryGridInvalidate,
    RequiresModelAndActions,
    resolveErrorMessage,
    SamplesEditableGridProps,
    SamplesTabbedGridPanel,
    SchemaQuery,
    SCHEMAS,
    User,
} from '../../..';

// These need to be direct imports from files to avoid circular dependencies in index.ts
import { InjectedQueryModels, withQueryModels } from '../../../public/QueryModel/withQueryModels';

import { getPicklistFromId, deletePicklists, updatePicklist } from './actions';
import { Picklist } from './models';
import { PUBLIC_PICKLIST_CATEGORY, PRIVATE_PICKLIST_CATEGORY } from '../domainproperties/list/constants';
import { PicklistDeleteConfirm } from './PicklistDeleteConfirm';
import { PicklistEditModal } from './PicklistEditModal';
import { PicklistGridButtons } from "./PicklistGridButtons";

const PICKLIST_ITEMS_ID_PREFIX = 'picklist-items-';
const PICKLIST_PER_SAMPLE_TYPE_ID_PREFIX = 'picklist-per-sample-type-';

interface OwnProps {
    user: User;
    navigate: (url: string | AppURL) => any;
    params?: any;
    AdditionalGridButtons?: ComponentType<RequiresModelAndActions>;
    samplesEditableGridProps?: Partial<SamplesEditableGridProps>;
    sampleExportOptions?: { [key: string]: any };
}

interface ImplProps {
    picklist: Picklist;
    loadPicklist: () => void;
}

type Props = OwnProps & ImplProps & InjectedQueryModels;

export const PicklistOverviewImpl: FC<Props> = memo(props => {
    const {
        queryModels,
        actions,
        user,
        navigate,
        sampleExportOptions,
        picklist,
        loadPicklist,
        AdditionalGridButtons,
        samplesEditableGridProps,
    } = props;
    const { id } = props.params;
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [showEditModal, setShowEditModal] = useState<boolean>(false);

    const itemsQueryModel = useMemo(() => {
        return queryModels[PICKLIST_ITEMS_ID_PREFIX + id];
    }, [id, queryModels]);

    const onDeletePicklistClick = useCallback(() => {
        setShowDeleteModal(true);
    }, []);

    const hideDeletePicklistConfirm = useCallback(() => {
        setShowDeleteModal(false);
    }, []);

    const deletePicklist = useCallback(() => {
        deletePicklists([picklist])
            .then(() => {
                hideDeletePicklistConfirm();
                navigate(AppURL.create(App.PICKLIST_KEY));
                createNotification('Successfully deleted picklist "' + picklist.name + '".');
            })
            .catch(() => {
                hideDeletePicklistConfirm();
                createNotification({
                    message:
                        'There was a problem deleting this picklist.  Be sure the list is still valid and has not been deleted by another user.',
                    alertClass: 'danger',
                });
            });
    }, [picklist, navigate]);

    const onEditPicklistMetadataClick = useCallback(() => {
        setShowEditModal(true);
    }, []);

    const hideEditPicklistMetadataModal = useCallback(() => {
        setShowEditModal(false);
    }, []);

    const afterSavePicklist = useCallback(() => {
        loadPicklist();
        createNotification('Successfully updated picklist metadata.');
        hideEditPicklistMetadataModal();
    }, [loadPicklist]);

    // Using a type for evt here causes difficulties.  It wants a FormEvent<Checkbox> but
    // then it doesn't recognize checked as a valid field on current target.
    const onSharedChanged = useCallback(
        evt => {
            const updatedPicklist = picklist.mutate({
                Category: evt.currentTarget.checked ? PUBLIC_PICKLIST_CATEGORY : PRIVATE_PICKLIST_CATEGORY,
            }) as Picklist;
            updatePicklist(updatedPicklist)
                .then(loadPicklist)
                .catch(reason => {
                    createNotification({
                        message:
                            'There was a problem updating the sharing for this picklist. ' +
                            resolveErrorMessage(reason),
                        alertClass: 'danger',
                    });
                });
        },
        [picklist, loadPicklist]
    );

    const afterSampleActionComplete = useCallback(() => {
        invalidateLineageResults();
        queryGridInvalidate(SCHEMAS.EXP_TABLES.MATERIALS);

        // actions.loadAllModels(true);
        actions.replaceSelections(itemsQueryModel.id, []);
        actions.loadModel(itemsQueryModel.id, true);
        // loadPicklist();
    }, [actions, itemsQueryModel]);

    const getSampleAuditBehaviorType = useCallback(() => AuditBehaviorTypes.DETAILED, []);

    const gridButtonProps = {
        user,
        picklist,
        AdditionalGridButtons,
        afterSampleActionComplete,
    };

    return (
        <Page title={picklist?.name}>
            <PageDetailHeader
                user={user}
                iconDir="_images"
                iconSrc="workflow"
                title={picklist?.name}
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
                        <SamplesTabbedGridPanel
                            asPanel={false}
                            actions={actions}
                            queryModels={queryModels}
                            user={user}
                            gridButtons={PicklistGridButtons}
                            gridButtonProps={gridButtonProps}
                            getSampleAuditBehaviorType={getSampleAuditBehaviorType}
                            afterSampleActionComplete={afterSampleActionComplete}
                            samplesEditableGridProps={samplesEditableGridProps}
                            tabbedGridPanelProps={{
                                advancedExportOptions: sampleExportOptions,
                                alwaysShowTabs: true,
                            }}
                        />
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

const PicklistOverviewWithQueryModels = withQueryModels<OwnProps & ImplProps>(PicklistOverviewImpl);

export const PicklistOverview: FC<OwnProps> = memo(props => {
    const { params, user } = props;
    const listId = parseInt(params.id, 10);
    const [picklist, setPicklist] = useState<Picklist>();

    const loadPicklist = useCallback(async () => {
        try {
            const updatedPicklist = await getPicklistFromId(listId);
            setPicklist(updatedPicklist);
        } catch (e) {
            console.error('There was a problem retrieving the picklist data.', e);
            setPicklist(new Picklist(/* use empty picklist to signal not found */));
        }
    }, [listId]);

    useEffect(() => {
        loadPicklist();
    }, [loadPicklist]);

    const queryConfigs: QueryConfigMap = useMemo(
        () => {
            const configs = {};

            if (picklist) {
                const gridId = PICKLIST_ITEMS_ID_PREFIX + listId;
                configs[gridId] = {
                    id: gridId,
                    title: 'All Samples',
                    schemaQuery: SchemaQuery.create(SCHEMAS.PICKLIST_TABLES.SCHEMA, picklist.name),
                    requiredColumns: ['Created'],
                };

                Object.keys(picklist.sampleIdsByType).sort().forEach(sampleType => {
                    const id = `${PICKLIST_PER_SAMPLE_TYPE_ID_PREFIX}${listId}|samples/${sampleType}`;
                    configs[id] = {
                        id,
                        title: sampleType,
                        schemaQuery: SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, sampleType),
                        baseFilters: [Filter.create('RowId', picklist.sampleIdsByType[sampleType], Filter.Types.IN)],
                    };
                });
            }

            return configs;
        },
        [listId, picklist]
    );

    if (!picklist) {
        return <LoadingPage />;
    }

    if (!picklist.isValid()) {
        return <NotFound />;
    }

    if (!picklist.isUserList(user) && !picklist.isPublic()) {
        return <InsufficientPermissionsPage title="Picklist" />;
    }

    return (
        <PicklistOverviewWithQueryModels
            {...props}
            key={listId}
            autoLoad={false}
            queryConfigs={queryConfigs}
            picklist={picklist}
            loadPicklist={loadPicklist}
        />
    );
});
