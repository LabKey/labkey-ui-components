import React, { FC, memo } from 'react';
import { PropDescType } from "./PropDescType";
import { ConfirmModal } from "../base/ConfirmModal";
import { INT_RANGE_URI, MULTILINE_RANGE_URI } from "./constants";

interface Props {
    originalRangeURI: string;
    newDataType: PropDescType;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmDataTypeChangeModal: FC<Props> = memo(props => {
    const { originalRangeURI, newDataType, onConfirm, onCancel } = props;
    const origTypeLabel = getDataTypeConfirmDisplayText(originalRangeURI);
    const newTypeLabel = getDataTypeConfirmDisplayText(newDataType.rangeURI);

    return (
        <ConfirmModal
            title="Confirm Data Type Change"
            onConfirm={onConfirm}
            onCancel={onCancel}
            confirmVariant="danger"
            confirmButtonText="Yes, Change Data Type"
            cancelButtonText="Cancel"
        >
            <div>
                This change will convert the values in the field from{' '}
                <span className="domain-field-confirm-datatype">{origTypeLabel}</span>{' '}
                to <span className="domain-field-confirm-datatype">{newTypeLabel}</span>.
                Once you save your changes, you will not be able to change it back to{' '}
                <span className="domain-field-confirm-datatype">{origTypeLabel}</span>.
                Would you like to continue?
            </div>
        </ConfirmModal>
    )
});

const getDataTypeConfirmDisplayText = (rangeURI: string): string => {
    if (rangeURI === INT_RANGE_URI) return 'Integer';
    if (rangeURI === MULTILINE_RANGE_URI) return 'String';
    return rangeURI.substring(rangeURI.indexOf('#') + 1);
}
