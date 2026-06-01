/*
 * Copyright (c) 2021-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { ChangeEvent, FC, memo, useCallback, useMemo, useState } from 'react';
import { Utils } from '@labkey/api';

import { Alert } from '../base/Alert';
import { resolveErrorMessage } from '../../util/messaging';
import { useNotificationsContext } from '../notifications/NotificationsContext';
import { Modal } from '../../Modal';
import { CheckboxLK } from '../../Checkbox';
import { useAppContext } from '../../AppContext';
import { AppURL } from '../../url/AppURL';
import { PICKLIST_KEY } from '../../app/constants';
import { AppLink } from '../../url/AppLink';
import { Picklist } from './models';
import { createPicklist, updatePicklist } from './actions';
import { PRIVATE_PICKLIST_CATEGORY, PUBLIC_PICKLIST_CATEGORY } from './constants';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { usePicklistSampleSelections } from './usePicklistSampleSelections';
import { isLoading } from '../../../public/LoadingState';
import { LoadingSpinner } from '../base/LoadingSpinner';

export interface PicklistEditModalProps {
    metricFeatureArea?: string;
    onCancel: () => void;
    onFinish: (picklist: Picklist) => void;
    picklist?: Picklist;
    // If sampleFieldKey is present the modal queries the rowIds in order to fetch sampleIds via sampleFieldKey
    sampleFieldKey?: string;
    schemaQuery?: SchemaQuery;
    selectedRowIds?: number[] | string[];
    showNotification?: boolean;
}

export const PicklistEditModal: FC<PicklistEditModalProps> = memo(props => {
    const {
        onCancel,
        onFinish,
        picklist,
        sampleFieldKey,
        schemaQuery,
        selectedRowIds,
        showNotification,
        metricFeatureArea,
    } = props;
    const [name, setName] = useState<string>(picklist?.name ?? '');
    const onNameChange = useCallback((evt: ChangeEvent<HTMLInputElement>) => setName(evt.target.value), []);

    const [description, setDescription] = useState<string>(picklist?.Description ?? '');
    const onDescriptionChange = useCallback(
        (evt: ChangeEvent<HTMLTextAreaElement>) => setDescription(evt.target.value),
        []
    );
    const [shared, setShared] = useState<boolean>(picklist?.isPublic() ?? false);
    const onSharedChanged = useCallback(
        (evt: ChangeEvent<HTMLInputElement>) => setShared(evt.currentTarget.checked),
        []
    );
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [saveError, setSaveError] = useState<string>(undefined);
    const { api } = useAppContext();
    const { createNotification } = useNotificationsContext();

    const { finishVerb, finishingVerb, isUpdate } = useMemo(() => {
        const isUpdate_ = picklist !== undefined;
        return {
            finishVerb: isUpdate_ ? 'Update' : 'Create',
            finishingVerb: isUpdate_ ? 'Updating' : 'Creating',
            isUpdate: isUpdate_,
        };
    }, [picklist]);

    const {
        error,
        loadingState,
        value: sampleIds,
    } = usePicklistSampleSelections(selectedRowIds, sampleFieldKey, schemaQuery);
    const loading = isLoading(loadingState);
    const sampleCount = sampleIds?.length;

    const onSavePicklist = useCallback(async (): Promise<void> => {
        setSubmitting(true);
        try {
            let updatedList: Picklist;
            const trimmedName = name.trim();
            if (isUpdate) {
                updatedList = await updatePicklist(
                    new Picklist({
                        Container: picklist.Container,
                        name: trimmedName,
                        listId: picklist.listId,
                        Description: description,
                        Category: shared ? PUBLIC_PICKLIST_CATEGORY : PRIVATE_PICKLIST_CATEGORY,
                    })
                );
            } else {
                updatedList = await createPicklist(trimmedName, description, shared, sampleIds);
                api.query.incrementClientSideMetricCount(metricFeatureArea, 'createPicklist');
            }

            if (showNotification) {
                const url = AppURL.create(PICKLIST_KEY, updatedList.listId);
                const noun = sampleCount ? Utils.pluralize(sampleCount, 'sample', 'samples') : ' no samples';
                createNotification({
                    message: (
                        <>
                            Successfully created "{updatedList.name}" with {noun}.{' '}
                            <AppLink to={url}>View picklist</AppLink>.
                        </>
                    ),
                    alertClass: 'success',
                });
            }

            onFinish(updatedList);
        } catch (e) {
            setSaveError(resolveErrorMessage(e));
            setSubmitting(false);
        }
    }, [
        api.query,
        createNotification,
        description,
        isUpdate,
        metricFeatureArea,
        name,
        onFinish,
        picklist?.Container,
        picklist?.listId,
        sampleIds,
        shared,
        showNotification,
        sampleCount,
    ]);

    let title: string;
    if (loading) {
        title = 'Loading Selection Data...';
    } else if (error) {
        title = 'Error Loading Selection Data';
    } else if (isUpdate) {
        title = 'Update Picklist Data';
    } else {
        if (!sampleCount) {
            title = 'Create an Empty Picklist';
        } else if (sampleCount > 1) {
            title = `Create a New Picklist with the ${sampleCount.toLocaleString()} Selected Samples`;
        } else if (sampleCount === 1) {
            title = 'Create a New Picklist with This Sample';
        }
    }

    const showForm = !error && !loading;

    return (
        <Modal
            canConfirm={!!name}
            confirmingText={finishingVerb + ' Picklist...'}
            confirmText={finishVerb + ' Picklist'}
            isConfirming={submitting}
            onCancel={onCancel}
            onConfirm={onSavePicklist}
            title={title}
        >
            <Alert>{error || saveError}</Alert>
            {loading && <LoadingSpinner />}
            {showForm && (
                <form>
                    <div className="form-group">
                        <label className="control-label" htmlFor="picklist-name">
                            Name *
                        </label>

                        <input
                            className="form-control"
                            id="picklist-name"
                            onChange={onNameChange}
                            placeholder="Give this list a name"
                            type="text"
                            value={name}
                        />
                    </div>
                    <div className="form-group">
                        <label className="control-label" htmlFor="picklist-description">Description</label>

                        <textarea
                            className="form-control"
                            id="picklist-description"
                            onChange={onDescriptionChange}
                            placeholder="Add a description"
                            value={description}
                        />

                        <CheckboxLK checked={shared} name="shared" onChange={onSharedChanged}>
                            Share this picklist
                        </CheckboxLK>
                    </div>
                </form>
            )}
        </Modal>
    );
});
PicklistEditModal.displayName = 'PicklistEditModal';
