import React, { FC, memo, useCallback, useState } from 'react';
import { List } from 'immutable';

import { TextInput } from './TextInput';
import { QuerySelect } from '../QuerySelect';
import { getContainerFilterForLookups } from '../../../query/api';
import { FieldLabel } from '../FieldLabel';
import { InputRendererProps } from './types';
import { caseInsensitive, generateId } from '../../../util/utils';
import { FormsyInput } from './FormsyReactComponents';
import { Operation } from '../../../../public/QueryColumn';

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
    } = props;
    const [disabled, setDisabled] = useState<boolean>(initiallyDisabled && allowFieldDisable);

    const id = generateId('selectinput-');
    const amountCol = allColumns.filter(col => col.name.toLowerCase() === 'storedamount').valueArray?.[0];
    const unitCol = allColumns.filter(col => col.name.toLowerCase() === 'units').valueArray?.[0];
    const amountValue = caseInsensitive(data, amountCol.name);
    const unitValue = caseInsensitive(data, unitCol.name);
    const queryFilter = unitCol.lookup.hasQueryFilters(Operation.insert)
        ? List(unitCol.lookup.getQueryFilters(Operation.insert))
        : queryFilters?.[unitCol.fieldKey];

    const onToggleChange = useCallback(() => {
        setDisabled(prevDisabled => {
            const newDisabled = !prevDisabled;
            onToggleDisable?.(newDisabled);
            return newDisabled;
        });
    }, [setDisabled]);

    return (
        <div className="form-group row">
            <FieldLabel
                fieldName={amountCol.name}
                id={id}
                isDisabled={disabled}
                labelOverlayProps={{
                    inputId: amountCol.name,
                    description: 'TODO',
                    label: 'Amount and Units',
                    isFormsy: false,
                }}
                showLabel
                showToggle={allowFieldDisable}
                toggleProps={{
                    onClick: onToggleChange,
                }}
            />
            <TextInput
                disableInput={disabled}
                elementWrapperClassName=""
                queryColumn={amountCol}
                rowClassName={'col-sm-5 col-xs-6'}
                showLabel={false}
                value={amountValue ? String(amountValue) : amountValue}
            />
            <QuerySelect
                containerClass={'col-sm-4 col-xs-6'}
                containerFilter={unitCol.lookup.containerFilter ?? containerFilter ?? getContainerFilterForLookups()}
                containerPath={unitCol.lookup.containerPath ?? containerPath}
                description={unitCol.description}
                disableInput={disabled}
                displayColumn={unitCol.lookup.displayColumn}
                formsy
                id={id}
                inputClass={''}
                name={unitCol.fieldKey}
                onQSChange={onSelectChange}
                placeholder="Select or type to search..."
                queryFilters={queryFilter}
                schemaQuery={unitCol.lookup.schemaQuery}
                showLabel={false}
                value={unitValue}
                valueColumn={unitCol.lookup.keyColumn}
            />
            {allowFieldDisable && !disabled && (
                <FormsyInput name={unitCol.name + '::enabled'} type="hidden" value="true" />
            )}
        </div>
    );
});

AmountUnitInput.displayName = 'AmountUnitInput';
