import React, { FC, memo } from 'react';
import { DropdownButton } from 'react-bootstrap';
import { PicklistCreationMenuItem } from './PicklistCreationMenuItem';
import { AddToPicklistMenuItem } from './AddToPicklistMenuItem';
import { User } from '../base/models/User';
import { QueryModel } from '../../../public/QueryModel/QueryModel';

interface Props {
    model: QueryModel
    user: User
}

export const PicklistButton: FC<Props> = memo(props => {
    const { model, user } = props;

    return (
        <>
            <DropdownButton
                title={'Picklists'}
                id={'samples-picklist-menu'}
            >
                <PicklistCreationMenuItem
                    itemText={'Create Picklist'}
                    selectionKey={model?.id}
                    selectedQuantity={model?.selections?.size}
                    key={'picklist'}
                    user={user}
                />
                <AddToPicklistMenuItem queryModel={model} user={user} />
            </DropdownButton>

        </>
    )
});
