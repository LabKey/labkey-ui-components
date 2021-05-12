import React, { ChangeEvent, FC, FormEvent, memo, useCallback, useState } from 'react';
import { Checkbox, Modal } from 'react-bootstrap';
import { WizardNavButtons } from '../buttons/WizardNavButtons';
import { addSamplesToPicklist, createPicklist, setPicklistDefaultView, updatePicklist } from './actions';
import { Alert } from '../base/Alert';
import { resolveErrorMessage } from '../../util/messaging';
import { PicklistModel } from './models';
import { PRIVATE_PICKLIST_CATEGORY, PUBLIC_PICKLIST_CATEGORY } from '../domainproperties/list/constants';
import { Utils } from '@labkey/api';

interface Props {
    show: boolean,
    selectionKey?: string, // pass in either selectionKey and selectedQuantity or sampleIds.
    selectedQuantity?: number,
    sampleIds?: string[],
    picklist?: PicklistModel,
    onCancel: () => void,
    onFinish: (picklist: PicklistModel) => void,
}

export const PicklistEditModal: FC<Props> = memo(props => {
    const { show, onCancel, onFinish, selectionKey, selectedQuantity, sampleIds, picklist } = props;
    const [ name, setName ] = useState<string>(picklist ? picklist.name : '');
    const onNameChange = useCallback((evt: ChangeEvent<HTMLInputElement>) => setName(evt.target.value), []);

    const [ description, setDescription ] = useState<string>(picklist ? picklist.Description : '');
    const onDescriptionChange = useCallback((evt: ChangeEvent<HTMLTextAreaElement>) => setDescription(evt.target.value), []);

    const [ shared, setShared ] = useState<boolean>(picklist ? picklist.isPublic() : false);
    // Using a type for evt here causes difficulties.  It wants a FormEvent<Checkbox> but
    // then it doesn't recognize checked as a valid field on current target.
    const onSharedChanged = useCallback((evt) => {
        setShared(evt.currentTarget.checked);
    }, []);

    const [ isSubmitting, setIsSubmitting ] = useState<boolean>(false);
    const [ picklistError, setPicklistError ] = useState<string>(undefined);

    const isUpdate = picklist !== undefined;
    let finishVerb, finishingVerb;
    if (isUpdate) {
        finishVerb = "Update";
        finishingVerb = "Updating";
    } else {
        finishVerb = "Create";
        finishingVerb = "Creating"
    }

    const onHide = useCallback(() => {
        setPicklistError(undefined);
        setIsSubmitting(false);
        onCancel();
    }, []);

    const onSavePicklist = useCallback(async () => {
        setIsSubmitting(true);
        try {
            let updatedList;
            const trimmedName = name.trim();
            if (isUpdate) {
                updatedList = await updatePicklist(new PicklistModel({
                    name: trimmedName,
                    listId: picklist.listId,
                    Description: description,
                    Category: shared ? PUBLIC_PICKLIST_CATEGORY : PRIVATE_PICKLIST_CATEGORY
                }));
            }
            else {
                updatedList = await createPicklist(trimmedName, description, shared);
                await addSamplesToPicklist(trimmedName, selectionKey, sampleIds);
                await setPicklistDefaultView(trimmedName)
            }
            setIsSubmitting(false);
            onFinish(updatedList);
        } catch (e) {
            setPicklistError(resolveErrorMessage(e));
            setIsSubmitting(false);
        }
    }, [name, description, onFinish, shared]);

    let title;
    if (isUpdate) {
        title = 'Update Picklist Data';
    }
    else {
        const count = sampleIds?.length ?? selectedQuantity;
        if (count === 0) {
            title = 'Create an Empty Picklist';
        }
        else if (selectionKey) {
            title = <>Create a New Picklist with the {Utils.pluralize(selectedQuantity, 'Selected Sample', 'Selected Samples')}</>;
        } else if (count === 1) {
            title = 'Create a New Picklist with This Sample';
        } else {
            title = 'Create a New Picklist with These Samples';
        }
    }

    return (
        <Modal show={show} onHide={onCancel}>
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Alert>{picklistError}</Alert>

                <form>
                    <div className="form-group">
                        <label className="control-label">Name *</label>

                        <input placeholder="Give this list a name" className="form-control" value={name} onChange={onNameChange} type="text"/>
                    </div>
                    <div className="form-group">
                        <label className="control-label">Description</label>

                        <textarea placeholder="Add a description" className="form-control" value={description} onChange={onDescriptionChange}/>

                        <Checkbox checked={shared} onChange={onSharedChanged} >
                            <span>Share this picklist publicly with team members</span>
                        </Checkbox>
                    </div>
                </form>
            </Modal.Body>

            <Modal.Footer>
                <WizardNavButtons
                    cancel={onHide}
                    cancelText={'Cancel'}
                    canFinish={!!name}
                    containerClassName=""
                    isFinishing={isSubmitting}
                    isFinishingText={finishingVerb + " Picklist..."}
                    finish
                    finishText={finishVerb + " Picklist"}
                    nextStep={onSavePicklist}
                />
            </Modal.Footer>
        </Modal>
    )
});
