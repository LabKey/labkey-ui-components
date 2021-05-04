import React, { FC, useState } from 'react';
import { PicklistEditModal } from './PicklistEditModal';
import { createNotification } from '../notifications/actions';
import { MenuItem } from 'react-bootstrap';
import { AppURL } from '../../url/AppURL';
import { QueryGridModel } from '../../QueryGridModel';
import { PicklistModel } from './models';

interface Props {
    selectionModel: QueryGridModel
    key: string
}

export const PicklistCreationMenuItem: FC<Props> = props => {
    const { selectionModel, key } = props;
    const [ showModal, setShowModal ] = useState<boolean>(false);

    const onFinish = (picklist: PicklistModel) => {
        createNotification({
            message: () => {
               return (
                   <>
                       Successfully created "{picklist.name}" with {selectionModel.selectedQuantity} sample{selectionModel.selectedQuantity === 1 ? '': 's'}.&nbsp;
                       <a href={AppURL.create("picklist", picklist.name).toHref()}>View picklist.</a>
                   </>
               )
            },
            alertClass: 'success'
        });
        setShowModal(false);
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
            <PicklistEditModal
                useSelection={true}
                show={showModal}
                samplesModel={selectionModel}
                onFinish={onFinish}
                onCancel={onCancel}
            />
        </>
    )
}
