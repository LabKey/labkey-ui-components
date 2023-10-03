import React, { ChangeEvent, FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Checkbox, Modal } from 'react-bootstrap';

import { Utils } from '@labkey/api';

import { ModalButtons } from '../../ModalButtons';

import { WizardNavButtons } from '../buttons/WizardNavButtons';

import { Alert } from '../base/Alert';
import { resolveErrorMessage } from '../../util/messaging';
import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { QueryModel } from '../../../public/QueryModel/QueryModel';

import { useNotificationsContext } from '../notifications/NotificationsContext';

import { setSnapshotSelections } from '../../actions';

import { Picklist } from './models';
import { createPicklist, getPicklistUrl, updatePicklist } from './actions';
import { PRIVATE_PICKLIST_CATEGORY, PUBLIC_PICKLIST_CATEGORY } from './constants';

export interface PicklistEditModalProps {
    sampleIds?: string[];
    picklist?: Picklist;
    onCancel: () => void;
    onFinish: (picklist: Picklist) => void;
    showNotification?: boolean;
    currentProductId?: string;
    picklistProductId?: string;
    metricFeatureArea?: string;
    api?: ComponentsAPIWrapper;
    sampleFieldKey?: string;
    queryModel?: QueryModel;
}

export const PicklistEditModal: FC<PicklistEditModalProps> = memo(props => {
    const { api, queryModel, sampleFieldKey, sampleIds } = props;
    const [ids, setIds] = useState<string[]>(sampleIds);

    useEffect(() => {
        (async () => {
            // Look up SampleIds from the selected row ids.
            // Using sampleFieldKey as proxy flag to determine if lookup is needed
            if (sampleFieldKey && queryModel && !queryModel.isLoadingSelections) {
                try {
                    const ids_ = await api.samples.getFieldLookupFromSelection(
                        queryModel.schemaQuery.schemaName,
                        queryModel.schemaQuery.queryName,
                        [...queryModel.selections],
                        sampleFieldKey
                    );
                    setIds(ids_);
                    await setSnapshotSelections(queryModel.selectionKey, [...queryModel.selections]);
                } catch (error) {
                    console.error(error);
                }
            }
        })();
    }, [api, sampleFieldKey, queryModel]);

    return <PicklistEditModalDisplay {...props} sampleIds={ids} />;
});

const PicklistEditModalDisplay: FC<PicklistEditModalProps> = memo(props => {
    const {
        api,
        onCancel,
        onFinish,
        sampleFieldKey,
        sampleIds,
        picklist,
        showNotification,
        currentProductId,
        picklistProductId,
        metricFeatureArea,
        queryModel,
    } = props;
    const useSnapshotSelection = queryModel?.filterArray.length > 0;
    const { createNotification } = useNotificationsContext();
    const [name, setName] = useState<string>(picklist?.name ?? '');
    const onNameChange = useCallback((evt: ChangeEvent<HTMLInputElement>) => setName(evt.target.value), []);
    const validCount = useMemo(
        () => sampleIds?.length || queryModel?.selections.size,
        [sampleIds, queryModel?.selections]
    );
    const selectionKey = useMemo(() => sampleFieldKey ? undefined : queryModel?.selectionKey, [sampleFieldKey, queryModel?.selectionKey]);

    const [description, setDescription] = useState<string>(picklist?.Description ?? '');
    const onDescriptionChange = useCallback(
        (evt: ChangeEvent<HTMLTextAreaElement>) => setDescription(evt.target.value),
        []
    );

    const [shared, setShared] = useState<boolean>(picklist?.isPublic() ?? false);
    // Using a type for evt here causes difficulties.  It wants a FormEvent<Checkbox> but
    // then it doesn't recognize checked as a valid field on current target.
    const onSharedChanged = useCallback(evt => setShared(evt.currentTarget.checked), []);

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [picklistError, setPicklistError] = useState<string>(undefined);

    useEffect(() => {
        (async () => {
            if (useSnapshotSelection) await setSnapshotSelections(selectionKey, [...queryModel.selections]);
        })();
    }, [useSnapshotSelection, selectionKey, queryModel?.selections]);

    const isUpdate = picklist !== undefined;
    let finishVerb, finishingVerb;
    if (isUpdate) {
        finishVerb = 'Update';
        finishingVerb = 'Updating';
    } else {
        finishVerb = 'Create';
        finishingVerb = 'Creating';
    }

    const reset = (): void => {
        setPicklistError(undefined);
        setIsSubmitting(false);
        setName(undefined);
        setDescription(undefined);
        setShared(false);
    };

    const onHide = useCallback(() => {
        reset();
        onCancel();
    }, [onCancel]);

    const createSuccessNotification = (picklist: Picklist): void => {
        createNotification({
            message: (
                <>
                    Successfully created "{picklist.name}" with{' '}
                    {validCount ? Utils.pluralize(validCount, 'sample', 'samples') : ' no samples'}.&nbsp;
                    <a href={getPicklistUrl(picklist.listId, picklistProductId, currentProductId)}>View picklist</a>.
                </>
            ),
            alertClass: 'success',
        });
    };

    const onSavePicklist = useCallback(async (): Promise<void> => {
        setIsSubmitting(true);
        try {
            let updatedList;
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
                updatedList = await createPicklist(trimmedName, description, shared, selectionKey, useSnapshotSelection, sampleIds);
                api.query.incrementClientSideMetricCount(metricFeatureArea, 'createPicklist');
            }
            reset();
            if (showNotification) {
                createSuccessNotification(updatedList);
            }

            onFinish(updatedList);
        } catch (e) {
            setPicklistError(resolveErrorMessage(e));
            setIsSubmitting(false);
        }
    }, [
        api.query,
        createSuccessNotification,
        description,
        isUpdate,
        metricFeatureArea,
        name,
        onFinish,
        picklist.Container,
        picklist.listId,
        sampleIds,
        selectionKey,
        shared,
        showNotification,
        statusData,
        useSnapshotSelection,
    ]);

    let title;
    if (isUpdate) {
        title = 'Update Picklist Data';
    } else {
        if (!validCount) {
            title = 'Create an Empty Picklist';
        } else if (selectionKey && validCount) {
            title = (
                <>Create a New Picklist with the {Utils.pluralize(validCount, 'Selected Sample', 'Selected Samples')}</>
            );
        } else if (validCount === 1) {
            title = 'Create a New Picklist with This Sample';
        } else {
            title = 'Create a New Picklist with These Samples';
        }
    }

    return (
        <Modal show={true} onHide={onCancel}>
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Alert>{picklistError}</Alert>
                <form>
                    <div className="form-group">
                        <label className="control-label">Name *</label>

                        <input
                            placeholder="Give this list a name"
                            className="form-control"
                            value={name}
                            onChange={onNameChange}
                            type="text"
                        />
                    </div>
                    <div className="form-group">
                        <label className="control-label">Description</label>

                        <textarea
                            placeholder="Add a description"
                            className="form-control"
                            value={description}
                            onChange={onDescriptionChange}
                        />

                        <Checkbox checked={shared} onChange={onSharedChanged}>
                            <span>Share this picklist publicly with team members</span>
                        </Checkbox>
                    </div>
                </form>
            </Modal.Body>

            <Modal.Footer>
                <ModalButtons
                    canConfirm={!!name}
                    confirmText={finishVerb + ' Picklist'}
                    confirmingText={finishingVerb + ' Picklist...'}
                    isConfirming={isSubmitting}
                    onCancel={onHide}
                    onConfirm={onSavePicklist}
                />
            </Modal.Footer>
        </Modal>
    );
});

PicklistEditModal.defaultProps = {
    api: getDefaultAPIWrapper(),
};
