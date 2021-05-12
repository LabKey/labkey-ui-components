import React, { FC, useState } from 'react';
import { PicklistEditModal } from './PicklistEditModal';
import { createNotification } from '../notifications/actions';
import { MenuItem } from 'react-bootstrap';
import { AppURL } from '../../url/AppURL';
import { PicklistModel } from './models';
import { PICKLIST_KEY } from '../../app/constants';
import { Utils } from '@labkey/api';

interface Props {
    selectionKey?: string,
    selectedQuantity?: number,
    sampleIds?: string[],
    key: string,
    itemText: string,
}

export const PicklistCreationMenuItem: FC<Props> = props => {
    const { sampleIds, selectionKey, selectedQuantity, key, itemText } = props;
    const [ showModal, setShowModal ] = useState<boolean>(false);

    const onFinish = (picklist: PicklistModel) => {
        const count = sampleIds ? sampleIds.length : selectedQuantity;
        createNotification({
            message: () => {
               return (
                   <>
                       Successfully created "{picklist.name}" with {Utils.pluralize(count, 'sample', 'samples')}.&nbsp;
                       <a href={AppURL.create(PICKLIST_KEY, picklist.listId).toHref()}>View picklist</a>.
                   </>
               );
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
            <MenuItem onClick={onClick} key={key}>{itemText}</MenuItem>
            <PicklistEditModal
                selectionKey={selectionKey}
                selectedQuantity={selectedQuantity}
                sampleIds={sampleIds}
                show={showModal}
                onFinish={onFinish}
                onCancel={onCancel}
            />
        </>
    )
}
