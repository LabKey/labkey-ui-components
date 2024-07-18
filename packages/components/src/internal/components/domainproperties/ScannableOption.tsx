import React, { FC, memo, useCallback } from 'react';

import { DomainFieldLabel } from './DomainFieldLabel';
import { createFormInputId, createFormInputName } from './utils';
import { DOMAIN_FIELD_SCANNABLE_OPTION } from './constants';
import { isFieldFullyLocked } from './propertiesUtil';
import { ITypeDependentProps } from './models';

export interface ScannableProps extends ITypeDependentProps {
    appPropertiesOnly?: boolean;
    scannable?: boolean;
    showScannableOption?: boolean;
}

export const ScannableOption: FC<ScannableProps> = memo(props => {
    const { domainIndex, index, lockType, scannable = false, appPropertiesOnly, showScannableOption, onChange } = props;
    if (!appPropertiesOnly || !showScannableOption) return null;

    const handleOptionToggle = useCallback(
        (event: any): void => {
            const { id, checked } = event.target;
            onChange?.(id, checked);
        },
        [onChange]
    );

    return (
        <>
            <div className="row">
                <div className="col-xs-3">
                    <div className="domain-field-label">
                        <DomainFieldLabel
                            label="Barcode Field"
                            helpTipBody={
                                'When using the Find Samples dialog from the search bar and choosing the "Barcodes" option, fields that are designated as Barcode fields will be queried along with any UniqueId fields for this sample type.'
                            }
                        />
                    </div>
                </div>
            </div>
            <div className="row">
                <div className="col-xs-12 domain-text-options-col">
                    <input
                        type="checkbox"
                        id={createFormInputId(DOMAIN_FIELD_SCANNABLE_OPTION, domainIndex, index)}
                        name={createFormInputName(DOMAIN_FIELD_SCANNABLE_OPTION)}
                        className="form-control domain-text-option-scannable"
                        onChange={handleOptionToggle}
                        disabled={isFieldFullyLocked(lockType)}
                        checked={scannable}
                    />
                    <span>Search this field when scanning samples</span>
                </div>
            </div>
        </>
    );
});
