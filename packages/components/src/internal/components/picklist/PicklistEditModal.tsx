import React, { ChangeEvent, FC, FormEvent, memo, useCallback, useState } from 'react';
import { Checkbox, Modal } from 'react-bootstrap';
import { WizardNavButtons } from '../buttons/WizardNavButtons';
import { QueryGridModel } from '../../QueryGridModel';
import { addSamplesToPicklist, createPicklist, updatePicklist } from './actions';
import { Alert } from '../base/Alert';
import { resolveErrorMessage } from '../../util/messaging';
import { PicklistModel } from './models';
import { PRIVATE_PICKLIST_CATEGORY, PUBLIC_PICKLIST_CATEGORY } from '../domainproperties/list/constants';

interface Props {
    show: boolean,
    samplesModel?: QueryGridModel,
    picklist?: PicklistModel,
    useSelection?: boolean, // if false, will use the single row from the samplesModel
    onCancel: (any) => void,
    onFinish: (picklist: PicklistModel) => void,
}

export const PicklistEditModal: FC<Props> = memo(props => {
    const { show, onCancel, onFinish, samplesModel, useSelection, picklist } = props;
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
        finishingVerb = "Creating."
    }

    const onHide = useCallback((data: any) => {
        setPicklistError(undefined);
        setIsSubmitting(false);
        onCancel(data);
    }, []);

    const onSavePicklist = useCallback(async () => {
        setIsSubmitting(true);
        try {
            let updatedList;
            if (isUpdate) {
                updatedList = await updatePicklist(new PicklistModel({
                    name: name,
                    Description: description,
                    Category: shared ? PUBLIC_PICKLIST_CATEGORY : PRIVATE_PICKLIST_CATEGORY
                }));
            }
            else {
                updatedList = await createPicklist(name, description, shared);
                await addSamplesToPicklist(
                    name,
                    useSelection ? samplesModel.selectionKey : undefined,
                    useSelection ? undefined : [samplesModel.getRow().getIn(['RowId', 'value'])]);
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
    }
    else if (useSelection) {
        if (samplesModel.selectedQuantity == 0) {
            title = 'Create an Empty Picklist';
        }
        else {
            title = <>Create a New Picklist with the {samplesModel.selectedQuantity} Selected Sample{samplesModel.selectedQuantity === 1 ? '' : 's'}</>;
        }
    }
    else {
        title = 'Create a New Picklist with this Sample';
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
                        <label className="control-label">Name</label>

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
                    canFinish={true}
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
