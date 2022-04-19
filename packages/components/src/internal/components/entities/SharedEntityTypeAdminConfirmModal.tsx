import React from 'react';

import { ConfirmModal } from '../base/ConfirmModal';

import { EntityDataType } from './models';
import { ActionURL } from '@labkey/api';
import { SHARED_CONTAINER_PATH } from '../../constants';

interface Props {
    typeId: number;
    entityDataType: EntityDataType
    label: string;
    onCancel: () => any;
    isEdit: boolean;
}

export function getEditSharedEntityUrl(typeId: number, entityDataType: EntityDataType): string {
    return ActionURL.buildURL('experiment', entityDataType.editDomainActionName, SHARED_CONTAINER_PATH, {
        RowId: typeId,
        returnUrl: window.location.pathname + (window.location.hash ? window.location.hash : ''),
    }).toString();
}

export function getDeleteSharedEntityUrl(typeId: number, entityDataType: EntityDataType): string {
    return ActionURL.buildURL('experiment', entityDataType.deleteDomainActionName, SHARED_CONTAINER_PATH, {
        singleObjectRowId: typeId,
        returnUrl: window.location.pathname + '#/' + entityDataType.appUrlPrefixParts.join('/'),
    }).toString();
}

export class SharedEntityTypeAdminConfirmModal extends React.Component<Props, any> {
    onConfirm = () => {
        const { typeId, isEdit, entityDataType } = this.props;
        window.location.href = isEdit
            ? getEditSharedEntityUrl(typeId, entityDataType)
            : getDeleteSharedEntityUrl(typeId, entityDataType);
    };

    render() {
        const { onCancel, label, isEdit, entityDataType } = this.props;

        const verb = isEdit ? 'modified' : 'deleted';
        return (
            <ConfirmModal
                cancelButtonText="Cancel"
                confirmButtonText="Yes, Proceed to LabKey Server"
                onCancel={onCancel}
                onConfirm={this.onConfirm}
                title="You are about to leave the application. Continue?"
            >
                {`Shared ${entityDataType.typeNounSingular.toLowerCase()} '${label}' can only be ${verb} in LabKey Server. Do you want to proceed?`}
            </ConfirmModal>
        );
    }
}
