import React, { FC, memo } from 'react';

import { Modal } from '../../Modal';

import { PropDescType } from './PropDescType';
import {
    DATE_RANGE_URI,
    DATETIME_RANGE_URI,
    FILELINK_RANGE_URI,
    INT_RANGE_URI,
    MULTILINE_RANGE_URI,
    TIME_RANGE_URI,
} from './constants';
import { IDomainField } from './models';

interface Props {
    newDataType: PropDescType;
    onCancel: () => void;
    onConfirm: () => void;
    original: Partial<IDomainField>;
}

export const ConfirmDataTypeChangeModal: FC<Props> = memo(props => {
    const { original, newDataType, onConfirm, onCancel } = props;
    const originalRangeURI = original.rangeURI || '';
    const origTypeLabel = getDataTypeConfirmDisplayText(original.dataType);
    const newTypeLabel = getDataTypeConfirmDisplayText(newDataType);
    const newMultiChoice = PropDescType.isMultiChoice(newDataType.rangeURI);
    const oldMultiChoice = PropDescType.isMultiChoice(original.dataType.rangeURI);
    const newTextChoice = PropDescType.isTextChoice(newDataType.conceptURI);

    const reversible =
        (PropDescType.isDate(originalRangeURI) && PropDescType.isDateTime(newDataType.rangeURI)) ||
        (PropDescType.isDateTime(originalRangeURI) && PropDescType.isDate(newDataType.rangeURI)) ||
        newMultiChoice ||
        oldMultiChoice;

    let dataLossWarning = null;
    if (newMultiChoice) {
        dataLossWarning = (
            <>
                Filters in saved views might not function as expected and any conditional formatting configured for this
                field will be <span className="bold-text">removed</span>.{' '}
            </>
        );
    } else if (oldMultiChoice) {
        dataLossWarning = <>Filters in saved views might not function as expected. </>;
    } else if (
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
        <Modal
            confirmClass="btn-danger"
            confirmText="Yes, Change Data Type"
            onCancel={onCancel}
            onConfirm={onConfirm}
            title="Confirm Data Type Change"
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
        </Modal>
    );
});
ConfirmDataTypeChangeModal.displayName = 'ConfirmDataTypeChangeModal';

// exported for jest testing

export const getDataTypeConfirmDisplayText = (dataType: PropDescType): string => {
    if (dataType?.longDisplay) {
        return dataType.longDisplay;
    }
    const rangeURI = dataType?.rangeURI || '';
    if (rangeURI === INT_RANGE_URI) return 'integer';
    if (rangeURI === MULTILINE_RANGE_URI) return 'string';
    if (rangeURI === FILELINK_RANGE_URI) return 'file';
    return rangeURI.substring(rangeURI.indexOf('#') + 1);
};
