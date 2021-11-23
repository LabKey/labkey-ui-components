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
    SAMPLE_STATUS_REQUIRED_COLUMNS,
    SamplesEditableGridProps,
    SamplesTabbedGridPanel,
    SchemaQuery,
    SCHEMAS,
    User,
    withTimeout,
} from '../../..';

// These need to be direct imports from files to avoid circular dependencies in index.ts
import { InjectedQueryModels, withQueryModels } from '../../../public/QueryModel/withQueryModels';

import { PRIVATE_PICKLIST_CATEGORY, PUBLIC_PICKLIST_CATEGORY } from '../domainproperties/list/constants';

import { deletePicklists, updatePicklist } from './actions';
import { Picklist, PICKLIST_SAMPLES_FILTER } from './models';
import { PicklistDeleteConfirm } from './PicklistDeleteConfirm';
import { PicklistEditModal } from './PicklistEditModal';
import { PicklistGridButtons } from './PicklistGridButtons';
import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';
import { ALIQUOTED_FROM_COL } from '../samples/constants';

const PICKLIST_ITEMS_ID_PREFIX = 'picklist-items-';
const PICKLIST_PER_SAMPLE_TYPE_ID_PREFIX = 'picklist-per-sample-type-';

interface OwnProps {
    user: User;
    navigate: (url: string | AppURL) => any;
    params?: any;
    AdditionalGridButtons?: ComponentType<RequiresModelAndActions>;
    samplesEditableGridProps?: Partial<SamplesEditableGridProps>;
    advancedExportOptions?: { [key: string]: any };
    api?: ComponentsAPIWrapper;
}

interface ImplProps {
    picklist: Picklist;
    loadPicklist: (incrementCounter: boolean) => void;
}

type Props = OwnProps & ImplProps & InjectedQueryModels;

export const PICKLIST_EXPORT_CONFIG = {
    'exportAlias.SampleID/AliquotedFromLSID': ALIQUOTED_FROM_COL,
    'exportAlias.AliquotedFromLSID': ALIQUOTED_FROM_COL,
    includeColumn: ['SampleID/AliquotedFromLSID', 'AliquotedFromLSID']
};

// exported for jest testing
export const PicklistOverviewImpl: FC<Props> = memo(props => {
    const {
        queryModels,
        actions,
        user,
        navigate,
        advancedExportOptions,
        picklist,
        loadPicklist,
        AdditionalGridButtons,
        samplesEditableGridProps,
    } = props;
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [showEditModal, setShowEditModal] = useState<boolean>(false);

    const onDeletePicklistClick = useCallback(() => {
        setShowDeleteModal(true);
    }, []);

    const hideDeletePicklistConfirm = useCallback(() => {
        setShowDeleteModal(false);
    }, []);

    const exportConfig = useMemo(() => {
        return advancedExportOptions ? {...PICKLIST_EXPORT_CONFIG, ...advancedExportOptions} : PICKLIST_EXPORT_CONFIG;
    }, [advancedExportOptions])

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
    }, [picklist, hideDeletePicklistConfirm, navigate]);

    const onEditPicklistMetadataClick = useCallback(() => {
        setShowEditModal(true);
    }, []);

    const hideEditPicklistMetadataModal = useCallback(() => {
        setShowEditModal(false);
    }, []);

    const afterSavePicklist = useCallback(
        updatedPicklist => {
            // if picklist name changed, we need to pass true here to that the queryConfigs are updated
            const nameChanged = picklist.name !== updatedPicklist.name;
            loadPicklist(nameChanged);

            hideEditPicklistMetadataModal();

            withTimeout(() => {
                createNotification('Successfully updated picklist metadata.');
            });
        },
        [hideEditPicklistMetadataModal, loadPicklist, picklist]
    );

    // Using a type for evt here causes difficulties.  It wants a FormEvent<Checkbox> but
    // then it doesn't recognize checked as a valid field on current target.
    const onSharedChanged = useCallback(
        evt => {
            const updatedPicklist = picklist.mutate({
                Category: evt.currentTarget.checked ? PUBLIC_PICKLIST_CATEGORY : PRIVATE_PICKLIST_CATEGORY,
            }) as Picklist;
            updatePicklist(updatedPicklist)
                .then(() => {
                    loadPicklist(false);
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
        [picklist, loadPicklist]
    );

    const afterSampleActionComplete = useCallback(() => {
        invalidateLineageResults();
        queryGridInvalidate(SCHEMAS.EXP_TABLES.MATERIALS);

        loadPicklist(true);
    }, [loadPicklist]);

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
                            <MenuItem onClick={onEditPicklistMetadataClick} className="picklistHeader-edit">
                                Edit Picklist
                            </MenuItem>
                        )}
                        <MenuItem onClick={onDeletePicklistClick} className="picklistHeader-delete">
                            Delete Picklist
                        </MenuItem>
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
                                advancedExportOptions: exportConfig,
                                alwaysShowTabs: true,
                            }}
                        />
                    </div>
                </div>
            </div>
            {showDeleteModal && (
                <PicklistDeleteConfirm
                    picklist={picklist}
                    onConfirm={deletePicklist}
                    onCancel={hideDeletePicklistConfirm}
                    user={user}
                />
            )}
            {showEditModal && (
                <PicklistEditModal
                    picklist={picklist}
                    onCancel={hideEditPicklistMetadataModal}
                    onFinish={afterSavePicklist}
                    showNotification={false}
                />
            )}
        </Page>
    );
});

// exported for jest testing
export const PicklistOverviewWithQueryModels = withQueryModels<OwnProps & ImplProps>(PicklistOverviewImpl);

// Keep a counter so that each time the loadPicklist() is called we re-render the tabbed grid panel and recreate the
// queryConfigs. This is because the sample actions like "remove from picklist" can affect the queryConfig filter IN
// clause and using the actions.setFilters() doesn't update the baseFilters but instead updates the user defined filters.
let LOAD_PICKLIST_COUNTER = 0;

export const PicklistOverview: FC<OwnProps> = memo(props => {
    const { params, user, api } = props;
    const listId = parseInt(params.id, 10);
    const [picklist, setPicklist] = useState<Picklist>();

    const loadPicklist = useCallback(
        async (incrementCounter: boolean) => {
            if (incrementCounter) LOAD_PICKLIST_COUNTER++;

            try {
                const updatedPicklist = await api.picklist.getPicklistFromId(listId);
                setPicklist(updatedPicklist);
            } catch (e) {
                console.error('There was a problem retrieving the picklist data.', e);
                setPicklist(new Picklist(/* use empty picklist to signal not found */));
            }
        },
        [listId]
    );

    useEffect(() => {
        loadPicklist(true);
    }, [loadPicklist]);

    const queryConfigs: QueryConfigMap = useMemo(() => {
        const configs = {};

        if (picklist?.listId) {
            const gridId = PICKLIST_ITEMS_ID_PREFIX + LOAD_PICKLIST_COUNTER;
            configs[gridId] = {
                id: gridId,
                title: 'All Samples',
                schemaQuery: SchemaQuery.create(SCHEMAS.PICKLIST_TABLES.SCHEMA, picklist.name),
                // For picklists, we get a sample-related things via a lookup through SampleID.
                requiredColumns: [
                    'Created',
                    'SampleID/AliquotedFromLsid',
                    ...SAMPLE_STATUS_REQUIRED_COLUMNS.map(name => "SampleID/" + name)
                ],
            };

            // add a queryConfig for each distinct sample type of the picklist samples, with an filter clause
            // for the picklist id (which the server will turn into a sampleId IN clause)
            [...picklist.sampleTypes].sort().forEach(sampleType => {
                const id = `${PICKLIST_PER_SAMPLE_TYPE_ID_PREFIX}${LOAD_PICKLIST_COUNTER}|samples/${sampleType}`;
                configs[id] = {
                    id,
                    title: sampleType,
                    schemaQuery: SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, sampleType),
                    requiredColumns: SAMPLE_STATUS_REQUIRED_COLUMNS,
                    baseFilters: [Filter.create('RowId', picklist.listId, PICKLIST_SAMPLES_FILTER)],
                };
            });
        }

        return configs;
    }, [picklist]);

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
            key={LOAD_PICKLIST_COUNTER}
            autoLoad={false}
            queryConfigs={queryConfigs}
            picklist={picklist}
            loadPicklist={loadPicklist}
        />
    );
});

PicklistOverview.defaultProps = {
    api: getDefaultAPIWrapper(),
};
