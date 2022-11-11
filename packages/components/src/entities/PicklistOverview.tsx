import React, { ComponentType, FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Checkbox, MenuItem } from 'react-bootstrap';
import { AuditBehaviorTypes, Filter } from '@labkey/api';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../internal/APIWrapper';

import { ALIQUOTED_FROM_COL, SAMPLE_STATUS_REQUIRED_COLUMNS } from '../internal/components/samples/constants';
import { PRIVATE_PICKLIST_CATEGORY, PUBLIC_PICKLIST_CATEGORY } from '../internal/components/picklist/constants';
import { PICKLIST_KEY } from '../internal/app/constants';

import { AppURL } from '../internal/url/AppURL';

import { User } from '../internal/components/base/models/User';
import { useNotificationsContext } from '../internal/components/notifications/NotificationsContext';
import { resolveErrorMessage } from '../internal/util/messaging';
import { invalidateLineageResults } from '../internal/components/lineage/actions';
import { Page } from '../internal/components/base/Page';
import { PageDetailHeader } from '../internal/components/forms/PageDetailHeader';
import { ManageDropdownButton } from '../internal/components/buttons/ManageDropdownButton';

import { SCHEMAS } from '../internal/schemas';
import { SchemaQuery } from '../public/SchemaQuery';
import { LoadingPage } from '../internal/components/base/LoadingPage';
import { NotFound } from '../internal/components/base/NotFound';
import { InsufficientPermissionsPage } from '../internal/components/permissions/InsufficientPermissionsPage';

import {
    InjectedQueryModels,
    QueryConfigMap,
    RequiresModelAndActions,
    withQueryModels,
} from '../public/QueryModel/withQueryModels';

import { PicklistEditModal } from '../internal/components/picklist/PicklistEditModal';

import { Picklist, PICKLIST_SAMPLES_FILTER } from '../internal/components/picklist/models';
import { deletePicklists, updatePicklist } from '../internal/components/picklist/actions';

import { PicklistDeleteConfirm } from './PicklistDeleteConfirm';
import { PicklistGridButtons } from './PicklistGridButtons';
import { SamplesTabbedGridPanel } from './SamplesTabbedGridPanel';
import { SamplesEditableGridProps } from './SamplesEditableGrid';

const PICKLIST_ITEMS_ID_PREFIX = 'picklist-items-';
const PICKLIST_PER_SAMPLE_TYPE_ID_PREFIX = 'picklist-per-sample-type-';

interface OwnProps {
    AdditionalGridButtons?: ComponentType<RequiresModelAndActions>;
    advancedExportOptions?: { [key: string]: any };
    api?: ComponentsAPIWrapper;
    getIsDirty?: () => boolean;
    navigate: (url: string | AppURL) => any;
    params?: any;
    samplesEditableGridProps?: Partial<SamplesEditableGridProps>;
    setIsDirty?: (isDirty: boolean) => void;
    user: User;
}

interface ImplProps {
    loadPicklist: (incrementCounter: boolean) => void;
    picklist: Picklist;
}

type Props = OwnProps & ImplProps & InjectedQueryModels;

const PICKLIST_EXPORT_CONFIG = {
    'exportAlias.SampleID/AliquotedFromLSID': ALIQUOTED_FROM_COL,
    'exportAlias.AliquotedFromLSID': ALIQUOTED_FROM_COL,
    includeColumn: ['SampleID/AliquotedFromLSID', 'AliquotedFromLSID'],
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
        getIsDirty,
        setIsDirty,
        AdditionalGridButtons,
        samplesEditableGridProps,
    } = props;
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [showEditModal, setShowEditModal] = useState<boolean>(false);
    const { createNotification } = useNotificationsContext();

    const onDeletePicklistClick = useCallback(() => {
        setShowDeleteModal(true);
    }, []);

    const hideDeletePicklistConfirm = useCallback(() => {
        setShowDeleteModal(false);
    }, []);

    const exportConfig = useMemo(() => {
        return advancedExportOptions ? { ...PICKLIST_EXPORT_CONFIG, ...advancedExportOptions } : PICKLIST_EXPORT_CONFIG;
    }, [advancedExportOptions]);

    const deletePicklist = useCallback(() => {
        deletePicklists([picklist])
            .then(() => {
                hideDeletePicklistConfirm();
                navigate(AppURL.create(PICKLIST_KEY));
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
    }, [picklist, hideDeletePicklistConfirm, navigate, createNotification]);

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

            createNotification('Successfully updated picklist metadata.', true);
        },
        [createNotification, hideEditPicklistMetadataModal, loadPicklist, picklist.name]
    );

    // Using a type for evt here causes difficulties.  It wants a FormEvent<Checkbox> but
    // then it doesn't recognize checked as a valid field on current target.
    const onSharedChanged = useCallback(
        evt => {
            const updatedPicklist = picklist.mutate({
                Category: evt.currentTarget.checked ? PUBLIC_PICKLIST_CATEGORY : PRIVATE_PICKLIST_CATEGORY,
            });
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
                iconDir="_images"
                iconSrc="picklist"
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
                            withTitle={false}
                            actions={actions}
                            queryModels={queryModels}
                            user={user}
                            gridButtons={PicklistGridButtons}
                            gridButtonProps={gridButtonProps}
                            getIsDirty={getIsDirty}
                            setIsDirty={setIsDirty}
                            getSampleAuditBehaviorType={getSampleAuditBehaviorType}
                            afterSampleActionComplete={afterSampleActionComplete}
                            samplesEditableGridProps={samplesEditableGridProps}
                            tabbedGridPanelProps={{
                                advancedExportOptions: exportConfig,
                                alwaysShowTabs: true,
                                exportFilename: picklist.name + '_Samples',
                            }}
                            showLabelOption
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
    const { params, user, api, samplesEditableGridProps } = props;
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
        [api, listId]
    );

    useEffect(() => {
        loadPicklist(true);
    }, [loadPicklist]);

    const queryConfigs: QueryConfigMap = useMemo(() => {
        const configs = {};

        if (picklist?.listId) {
            const gridId =
                PICKLIST_ITEMS_ID_PREFIX +
                picklist.listId +
                '-' +
                LOAD_PICKLIST_COUNTER +
                '|' +
                SCHEMAS.PICKLIST_TABLES.SCHEMA +
                '/' +
                picklist.name;
            configs[gridId] = {
                id: gridId,
                title: 'All Samples',
                schemaQuery: SchemaQuery.create(SCHEMAS.PICKLIST_TABLES.SCHEMA, picklist.name),
                // For picklists, we get sample-related things via a lookup through SampleID.
                requiredColumns: [
                    'Created',
                    'SampleID/AliquotedFromLsid',
                    ...SAMPLE_STATUS_REQUIRED_COLUMNS.map(name => 'SampleID/' + name),
                ],
            };

            // add a queryConfig for each distinct sample type of the picklist samples, with a filter clause
            // for the picklist id (which the server will turn into a sampleId IN clause)
            [...picklist.sampleTypes].sort().forEach(sampleType => {
                const id = `${PICKLIST_PER_SAMPLE_TYPE_ID_PREFIX}-${listId}-${LOAD_PICKLIST_COUNTER}|samples/${sampleType}`;
                configs[id] = {
                    id,
                    title: sampleType,
                    schemaQuery: SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, sampleType),
                    requiredColumns: SAMPLE_STATUS_REQUIRED_COLUMNS.concat(
                        samplesEditableGridProps?.samplesGridRequiredColumns ?? []
                    ),
                    baseFilters: [Filter.create('RowId', picklist.name, PICKLIST_SAMPLES_FILTER)],
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
            autoLoad
            queryConfigs={queryConfigs}
            picklist={picklist}
            loadPicklist={loadPicklist}
        />
    );
});

PicklistOverview.defaultProps = {
    api: getDefaultAPIWrapper(),
};
