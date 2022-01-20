import React, { ChangeEvent, FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Checkbox, Modal } from 'react-bootstrap';

import { Utils } from '@labkey/api';

import { WizardNavButtons } from '../buttons/WizardNavButtons';

import { Alert } from '../base/Alert';
import { resolveErrorMessage } from '../../util/messaging';

import { PRIVATE_PICKLIST_CATEGORY, PUBLIC_PICKLIST_CATEGORY } from '../domainproperties/list/constants';

import { createNotification } from '../notifications/actions';

import { incrementClientSideMetricCount } from '../../actions';
import { SampleOperation } from '../samples/constants';
import { OperationConfirmationData } from '../entities/models';
import { getSampleIdsFromSelection } from '../samples/actions';
import { getOperationNotPermittedMessage } from '../samples/utils';
import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';
import { SchemaQuery } from '../../../public/SchemaQuery';

import { Picklist } from './models';
import { createPicklist, getPicklistUrl, updatePicklist } from './actions';

interface Props {
    selectionKey?: string; // pass in either selectionKey and selectedQuantity or sampleIds.
    selectedQuantity?: number;
    sampleIds?: string[];
    picklist?: Picklist;
    onCancel: () => void;
    onFinish: (picklist: Picklist) => void;
    showNotification?: boolean;
    currentProductId?: string;
    picklistProductId?: string;
    metricFeatureArea?: string;
    api?: ComponentsAPIWrapper;
    assaySchemaQuery?: SchemaQuery;
    sampleFieldKey?: string;
    selectedIds?: Set<string>;
}

export const PicklistEditModal: FC<Props> = memo(props => {
    const {
        api,
        onCancel,
        onFinish,
        selectionKey: initSelectionKey,
        selectedQuantity,
        sampleIds: initSampleIds,
        picklist,
        showNotification,
        currentProductId,
        picklistProductId,
        metricFeatureArea,
        assaySchemaQuery,
        sampleFieldKey,
        selectedIds,
    } = props;
    const [name, setName] = useState<string>(picklist?.name ?? '');
    const onNameChange = useCallback((evt: ChangeEvent<HTMLInputElement>) => setName(evt.target.value), []);

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
    const [sampleIds, setSampleIds] = useState<string[]>(initSampleIds);
    const [validCount, setValidCount] = useState<number>(selectedQuantity ? selectedQuantity : sampleIds?.length);
    const [statusData, setStatusData] = useState<OperationConfirmationData>(undefined);
    const selectionKey = useMemo(
        //If we are sampleFieldKey is set then selectionKey isn't going to correctly indicate selected samples
        () => (sampleFieldKey ? undefined : initSelectionKey),
        [sampleFieldKey, initSelectionKey]
    );

    const validateSamples = useCallback(() => {
        api.samples
            .getSampleOperationConfirmationData(SampleOperation.AddToPicklist, selectionKey, sampleIds)
            .then(data => {
                setStatusData(data);
                setValidCount(data.allowed.length);
            })
            .catch(reason => {
                setPicklistError(reason);
            });
    }, [selectionKey, sampleIds]);

    useEffect(() => {
        (async () => {
            //Look up SampleIds from the selected assay row ids.
            // Using sampleFieldKey as proxy flag to determine if lookup is needed
            if (sampleFieldKey && selectedIds) {
                const ids = await getSampleIdsFromSelection(
                    assaySchemaQuery?.schemaName,
                    assaySchemaQuery?.queryName,
                    [...selectedIds],
                    sampleFieldKey
                );
                setSampleIds(ids);
            }
            validateSamples();
        })();
    }, [sampleFieldKey, selectedIds, assaySchemaQuery, selectionKey, sampleIds]);

    const isUpdate = picklist !== undefined;
    let finishVerb, finishingVerb;
    if (isUpdate) {
        finishVerb = 'Update';
        finishingVerb = 'Updating';
    } else {
        finishVerb = 'Create';
        finishingVerb = 'Creating';
    }

    const reset = () => {
        setPicklistError(undefined);
        setIsSubmitting(false);
        setName(undefined);
        setDescription(undefined);
        setShared(false);
    };

    const onHide = useCallback(() => {
        reset();
        onCancel();
    }, []);

    const createSuccessNotification = (picklist: Picklist) => {
        createNotification({
            message: () => {
                return (
                    <>
                        Successfully created "{picklist.name}" with{' '}
                        {validCount ? Utils.pluralize(validCount, 'sample', 'samples') : ' no samples'}.&nbsp;
                        <a href={getPicklistUrl(picklist.listId, picklistProductId, currentProductId)}>View picklist</a>
                        .
                    </>
                );
            },
            alertClass: 'success',
        });
    };

    const onSavePicklist = useCallback(async () => {
        setIsSubmitting(true);
        try {
            let updatedList;
            const trimmedName = name.trim();
            if (isUpdate) {
                updatedList = await updatePicklist(
                    new Picklist({
                        name: trimmedName,
                        listId: picklist.listId,
                        Description: description,
                        Category: shared ? PUBLIC_PICKLIST_CATEGORY : PRIVATE_PICKLIST_CATEGORY,
                    })
                );
            } else {
                updatedList = await createPicklist(
                    trimmedName,
                    description,
                    shared,
                    statusData,
                    selectionKey,
                    sampleIds
                );
                incrementClientSideMetricCount(metricFeatureArea, 'createPicklist');
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
    }, [name, description, onFinish, shared]);

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
                <Alert bsStyle="warning">
                    {getOperationNotPermittedMessage(SampleOperation.AddToPicklist, statusData)}
                </Alert>
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
                <WizardNavButtons
                    cancel={onHide}
                    cancelText="Cancel"
                    canFinish={!!name}
                    containerClassName=""
                    isFinishing={isSubmitting}
                    isFinishingText={finishingVerb + ' Picklist...'}
                    finish
                    finishText={finishVerb + ' Picklist'}
                    nextStep={onSavePicklist}
                />
            </Modal.Footer>
        </Modal>
    );
});

PicklistEditModal.defaultProps = {
    api: getDefaultAPIWrapper(),
};
