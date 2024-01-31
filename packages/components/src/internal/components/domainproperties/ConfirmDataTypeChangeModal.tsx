import React, { FC, memo } from 'react';

import { ConfirmModal } from '../base/ConfirmModal';

import { PropDescType } from './PropDescType';
import {
    DATE_RANGE_URI,
    DATETIME_RANGE_URI,
    FILELINK_RANGE_URI,
    INT_RANGE_URI,
    MULTILINE_RANGE_URI,
    TIME_RANGE_URI,
} from './constants';

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

    const reversible =
        (PropDescType.isDate(originalRangeURI) && PropDescType.isDateTime(newDataType.rangeURI)) ||
        (PropDescType.isDateTime(originalRangeURI) && PropDescType.isDate(newDataType.rangeURI));

    let dataLossWarning = null;
    if (
        originalRangeURI === DATETIME_RANGE_URI &&
        (newDataType.rangeURI === DATE_RANGE_URI || newDataType.rangeURI === TIME_RANGE_URI)
    ) {
        dataLossWarning = (
            <>
                This will cause the {newDataType.rangeURI === DATE_RANGE_URI ? 'Time' : 'Date'} portion of the value to
                be <span className="bold-text">removed</span>.{' '}
            </>
        );
    }

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
                <span className="domain-field-confirm-datatype">{origTypeLabel}</span> to{' '}
                <span className="domain-field-confirm-datatype">{newTypeLabel}</span>. {dataLossWarning}
                {!reversible && (
                    <>
                        Once you save your changes, you will not be able to change it back to{' '}
                        <span className="domain-field-confirm-datatype">{origTypeLabel}</span>.{' '}
                    </>
                )}
                Would you like to continue?
            </div>
        </ConfirmModal>
    );
});

// exported for jest testing
export const getDataTypeConfirmDisplayText = (rangeURI: string): string => {
    if (rangeURI === INT_RANGE_URI) return 'integer';
    if (rangeURI === MULTILINE_RANGE_URI) return 'string';
    if (rangeURI === FILELINK_RANGE_URI) return 'file';
    return rangeURI.substring(rangeURI.indexOf('#') + 1);
};
