/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useCallback, useMemo, useState } from 'react';
import { List } from 'immutable';

import { TextInput } from './TextInput';
import { QuerySelect } from '../QuerySelect';
import { getContainerFilterForLookups } from '../../../query/api';
import { FieldLabel } from '../FieldLabel';
import { InputRendererProps } from './types';
import { caseInsensitive, generateId, getInvalidSampleAmountMessage, stringToHtmlId } from '../../../util/utils';
import { FormsyInput } from './FormsyReactComponents';
import { Operation } from '../../../../public/QueryColumn';
import { STORED_AMOUNT_FIELDS } from '../../samples/constants';
import { Alert } from '../../base/Alert';
import { LOOKUP_DEFAULT_SIZE } from '../../../constants';
import { INPUT_LABEL_CLASS_NAME, INPUT_LABEL_CLASS_NAME_WITH_TOGGLE } from '../constants';

export const AmountUnitInput: FC<InputRendererProps> = memo(props => {
    const {
        allowFieldDisable,
        onSelectChange,
        onToggleDisable,
        initiallyDisabled,
        containerFilter,
        containerPath,
        allColumns,
        data,
        queryFilters,
        fieldWithMixedValues,
    } = props;
    const [disabled, setDisabled] = useState<boolean>(initiallyDisabled && allowFieldDisable);
    const [amountError, setAmountError] = useState<string>(undefined);

    const amountCol = allColumns.find(col => col.name.toLowerCase() === STORED_AMOUNT_FIELDS.AMOUNT.toLowerCase());
    const unitCol = allColumns.find(col => col.name.toLowerCase() === STORED_AMOUNT_FIELDS.UNITS.toLowerCase());
    const amountValue = caseInsensitive(data, amountCol?.name);
    const unitValue = caseInsensitive(data, unitCol?.name);
    const hasMixedAmountValue = fieldWithMixedValues?.includes(amountCol?.name.toLowerCase());
    const hasMixedUnitValue = fieldWithMixedValues?.includes(unitCol?.name.toLowerCase());
    const queryFilter = unitCol?.lookup.hasQueryFilters(Operation.insert)
        ? List(unitCol?.lookup.getQueryFilters(Operation.insert))
        : queryFilters?.[unitCol?.fieldKey];

    const id = useMemo(() => generateId('amount-unit-input-'), []);

    const onToggleChange = useCallback(() => {
        setDisabled(prevDisabled => {
            const newDisabled = !prevDisabled;
            onToggleDisable?.(newDisabled);
            return newDisabled;
        });
    }, [onToggleDisable]);

    const onAmountChange = useCallback((name: string, value: any) => {
        const errorMsg = getInvalidSampleAmountMessage(value);
        setAmountError(errorMsg);
    }, []);

    if (!amountCol || !unitCol) {
        return null;
    }

    const inputLabelClass = allowFieldDisable ? INPUT_LABEL_CLASS_NAME_WITH_TOGGLE : INPUT_LABEL_CLASS_NAME;

    return (
        <>
            <div className="form-group row">
                <FieldLabel
                    fieldName={amountCol.name}
                    id={id}
                    isDisabled={disabled}
                    label={
                        <span
                            className={inputLabelClass + ' bold-text text__truncate-and-wrap'}
                            data-fieldkey={amountCol.name}
                        >
                            Amount and Units
                        </span>
                    }
                    labelOverlayProps={{
                        description: 'The amount and units of this sample currently on hand.',
                        label: 'Amount and Units',
                        isFormsy: false,
                    }}
                    showLabel
                    showToggle={allowFieldDisable}
                    toggleProps={{
                        onClick: onToggleChange,
                    }}
                    withLabelOverlay={false}
                />
                <TextInput
                    aria-label="Amount"
                    disableInput={disabled}
                    elementWrapperClassName=""
                    hasMixedValue={hasMixedAmountValue}
                    onChange={onAmountChange}
                    queryColumn={amountCol}
                    rowClassName="col-sm-5 col-xs-6"
                    showLabel={false}
                    type="number"
                    validations="sampleAmount"
                    value={amountValue ? String(amountValue) : amountValue}
                />
                <QuerySelect
                    containerClass="col-sm-4 col-xs-6"
                    containerFilter={
                        unitCol.lookup.containerFilter ?? containerFilter ?? getContainerFilterForLookups()
                    }
                    containerPath={unitCol.lookup.containerPath ?? containerPath}
                    description={unitCol.description}
                    disableInput={disabled}
                    displayColumn={unitCol.lookup.displayColumn}
                    formsy
                    hasMixedValue={hasMixedUnitValue}
                    id={id}
                    inputClass={''}
                    maxRows={LOOKUP_DEFAULT_SIZE}
                    name={unitCol.fieldKey}
                    onQSChange={onSelectChange}
                    placeholder="Select or type to search..."
                    queryFilters={queryFilter}
                    schemaQuery={unitCol.lookup.schemaQuery}
                    showLabel={false}
                    value={unitValue}
                    valueColumn={unitCol.lookup.keyColumn}
                />
                {allowFieldDisable && (
                    <FormsyInput
                        id={stringToHtmlId(unitCol.name)}
                        name={unitCol.name + '::enabled'}
                        type="hidden"
                        value={disabled ? 'false' : 'true'}
                    />
                )}
            </div>
            <Alert>{amountError}</Alert>
        </>
    );
});
AmountUnitInput.displayName = 'AmountUnitInput';
