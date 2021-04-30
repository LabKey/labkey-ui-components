import React, { ChangeEvent, FC, FormEvent, memo, useCallback, useState } from 'react';
import { Checkbox, Modal } from 'react-bootstrap';
import { WizardNavButtons } from '../buttons/WizardNavButtons';
import { QueryGridModel } from '../../QueryGridModel';
import { addSamplesToPicklist, createPicklist } from './actions';
import { Alert } from '../base/Alert';
import { resolveErrorMessage } from '../../util/messaging';

interface Props {
    show: boolean,
    model: QueryGridModel,
    useSelection?: boolean, // if false, will use the single row from the model
    onCancel: (any) => void,
    onFinish: (name: string) => void,
}

export const PicklistCreationModal: FC<Props> = memo(props => {
    const { show, onCancel, onFinish, model, useSelection } = props;
    const [ name, setName ] = useState<string>('');
    const onNameChange = useCallback((evt: ChangeEvent<HTMLInputElement>) => setName(evt.target.value), []);

    const [ description, setDescription ] = useState<string>(undefined);
    const onDescriptionChange = useCallback((evt: ChangeEvent<HTMLTextAreaElement>) => setDescription(evt.target.value), []);

    const [ shared, setShared ] = useState<boolean>(false);
    // Using a type for evt here causes difficulties.  It wants a FormEvent<Checkbox> but
    // then it doesn't recognize checked as a valid field on current target.
    const onSharedChanged = useCallback((evt) => {
        setShared(evt.currentTarget.checked);
    }, []);

    const [ isSubmitting, setIsSubmitting ] = useState<boolean>(false);
    const [ picklistError, setPicklistError ] = useState<string>(undefined);

    const onHide = useCallback((data: any) => {
        setPicklistError(undefined);
        setIsSubmitting(false);
        onCancel(data);
    }, []);

    const onCreatePicklist = useCallback(async () => {
        setIsSubmitting(true);
        try {
            const picklist = await createPicklist(name, description, shared, model, useSelection);
            await addSamplesToPicklist(
                name,
                useSelection ? model.selectionKey : undefined,
                useSelection ? undefined : [model.getRow().getIn(['RowId', 'value'])]);
            onFinish(picklist.name)
        } catch (e) {
            setPicklistError(resolveErrorMessage(e));
        }
        finally {
            setIsSubmitting(false);
        }
    }, [name, description, onFinish]);

    let title;
    if (useSelection) {
        if (model.selectedQuantity == 0) {
            title = 'Create an Empty Picklist';
        }
        else {
            title = <>Create a New Picklist with the {model.selectedQuantity} Selected Sample{model.selectedQuantity === 1 ? '' : 's'}</>;
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
                    isFinishingText="Creating Picklist..."
                    finish
                    finishText="Create Picklist"
                    nextStep={onCreatePicklist}
                />
            </Modal.Footer>
        </Modal>
    )
});
