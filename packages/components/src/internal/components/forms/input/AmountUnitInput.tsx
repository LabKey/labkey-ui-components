import React, { FC, memo, useCallback, useState } from 'react';

import { TextInput } from './TextInput';
import { QuerySelect } from '../QuerySelect';
import { getContainerFilterForLookups } from '../../../query/api';
import { FieldLabel } from '../FieldLabel';
import { InputRendererProps } from './types';
import { caseInsensitive, generateId } from '../../../util/utils';
import { FormsyInput } from './FormsyReactComponents';

export const AmountUnitInput: FC<InputRendererProps> = memo(props => {
    const { allowFieldDisable, onSelectChange,
        onToggleDisable, initiallyDisabled,
        containerFilter, containerPath,
        allColumns, data } = props;
    const [disabled, setDisabled] = useState<boolean>(initiallyDisabled && allowFieldDisable);

    const id = generateId('selectinput-');
    const amountCol = allColumns.filter(col => col.name.toLowerCase() === 'storedamount').valueArray?.[0];
    const unitCol = allColumns.filter(col => col.name.toLowerCase() === 'units').valueArray?.[0];
    const amountValue = caseInsensitive(data, amountCol.name);
    const unitValue = caseInsensitive(data, unitCol.name);

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
                id={id}
                fieldName={amountCol.name}
                labelOverlayProps={{
                    inputId: amountCol.name,
                    description: 'TODO',
                    label: "Amount and Units",
                    isFormsy: false,
                }}
                showLabel
                showToggle={allowFieldDisable}
                isDisabled={disabled}
                toggleProps={{
                    onClick: onToggleChange,
                }}
            />
            <TextInput
                queryColumn={amountCol}
                value={amountValue ? String(amountValue) : amountValue}
                disableInput={disabled}
                showLabel={false}
                rowClassName={"col-sm-5 col-xs-6"}
                elementWrapperClassName=""
            />
            <QuerySelect
                id={id}
                containerFilter={
                    unitCol.lookup.containerFilter ??
                    containerFilter ??
                    getContainerFilterForLookups()
                }
                containerPath={unitCol.lookup.containerPath ?? containerPath}
                description={unitCol.description}
                displayColumn={unitCol.lookup.displayColumn}
                formsy
                showLabel={false}
                name={unitCol.fieldKey}
                onQSChange={onSelectChange}
                placeholder="Select or type to search..."
                schemaQuery={unitCol.lookup.schemaQuery}
                value={unitValue}
                valueColumn={unitCol.lookup.keyColumn}
                disableInput={disabled}
                containerClass={"col-sm-4 col-xs-6"}
                inputClass={""}
            />
            {allowFieldDisable && !disabled && (
                <FormsyInput name={unitCol.name + '::enabled'} type="hidden" value="true" />
            )}
        </div>
    );
});

AmountUnitInput.displayName = 'AmountUnitInput';
