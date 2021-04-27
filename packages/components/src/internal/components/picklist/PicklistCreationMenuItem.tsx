import React, { FC, useState } from 'react';
import { PicklistCreationModal } from './PicklistCreationModal';
import { createNotification } from '../notifications/actions';
import { MenuItem } from 'react-bootstrap';
import { AppURL } from '../../url/AppURL';
import { QueryGridModel } from '../../QueryGridModel';
import { resolveErrorMessage } from '../../util/messaging';

interface Props {
    selectionModel: QueryGridModel
    key: string
}

export const PicklistCreationMenuItem: FC<Props> = props => {
    const { selectionModel, key } = props;
    const [ showModal, setShowModal ] = useState<boolean>(false);

    const onFinish = (name: string, id: number) => {
        createNotification({
            message: () => {
               return (
                   <>
                       Successfully created "{name}" with {selectionModel.selectedQuantity} sample{selectionModel.selectedQuantity === 1 ? '': 's'}.&nbsp;
                       <a href={AppURL.create("picklist", id).toHref()}>View picklist.</a>
                   </>
               )
            },
            alertClass: 'success'
        });
        setShowModal(false);
    }

    const onError = (reason: string) => {
        createNotification({
            message: resolveErrorMessage(reason),
            alertClass: 'danger'
        })
    }

    const onCancel = () => {
        setShowModal(false);
    }

    const onClick = () => {
        setShowModal(true);
    }

    return (
        <>
            <MenuItem onClick={onClick} key={key}>Picklist</MenuItem>
            <PicklistCreationModal useSelection={true} show={showModal} model={selectionModel} onFinish={onFinish} onCancel={onCancel}/>
        </>
    )
}
