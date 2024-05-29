import React, { FC, memo, useEffect, useState } from 'react';
import { List, Map } from 'immutable';
import { Filter, Query } from '@labkey/api';

import { selectRows } from '../../../query/selectRows';

import { encodePart, SchemaQuery } from '../../../../public/SchemaQuery';
import { ViewInfo } from '../../../ViewInfo';
import { caseInsensitive } from '../../../util/utils';

import { InputRendererProps } from './types';

import { DisableableInputProps } from './DisableableInput';
import { SelectInput, SelectInputChange, SelectInputOption, SelectInputProps } from './SelectInput';

async function loadInputOptions(assayId: number): Promise<SelectInputOption[]> {
    const result = await selectRows({
        columns: 'RowId, Name, AssayTypes, Run/Name',
        filterArray: [
            Filter.create('AssayTypes', undefined, Filter.Types.NONBLANK),
            Filter.create('Status/Value', 'In Progress'),
        ],
        maxRows: -1,
        schemaQuery: new SchemaQuery('samplemanagement', 'Tasks', ViewInfo.DETAIL_NAME),
    });
    const taskOptions: SelectInputOption[] = [];

    result.rows.forEach(row => {
        const taskId = caseInsensitive(row, 'RowId').value;
        const jobName = caseInsensitive(row, 'Run/Name').value;
        const taskName = caseInsensitive(row, 'Name').value;
        const assays = caseInsensitive(row, 'AssayTypes').value.split(',').map(Number);
        const hasAssay = assays.find(id => assayId === id);

        if (hasAssay) {
            taskOptions.push({ label: `${jobName} - ${taskName}`, value: taskId });
        }
    });

    return taskOptions;
}

interface WorkflowTaskInputProps
    extends DisableableInputProps,
        Omit<SelectInputProps, 'isLoading' | 'loadOptions' | 'options'> {
    assayId: number;
    containerFilter?: Query.ContainerFilter;
    onChange: SelectInputChange;
}

// Note: this component is specific to Workflow, and ideally would live in the Workflow package, however we do not
// currently have a way for our Apps to override the InputRenderers (see InputRenderer.tsx).
export const AssayTaskInput: FC<WorkflowTaskInputProps> = memo(props => {
    const { assayId,  ...selectInputProps } = props;
    const [loading, setLoading] = useState<boolean>(true);
    const [taskOptions, setTaskOptions] = useState<SelectInputOption[]>();
    const [error, setError] = useState<string>();

    useEffect(() => {
        (async () => {
            if (assayId === undefined) {
                // If the components rendering the QueryFormInputs or EditableDetailPanel don't properly inject the assayId
                // into the form data (via ASSAY_INDEX key defined above) then this will happen.
                setError('Assay ID not set, cannot load workflow tasks');
                setLoading(false);
                return;
            }

            try {
                const options = await loadInputOptions(assayId);
                setTaskOptions(options);
            } catch (e) {
                console.error(e.exception);
                setError('Error loading workflow tasks');
            } finally {
                setLoading(false);
            }
        })();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <SelectInput
            {...selectInputProps}
            disabled={error ? true : props.disabled}
            isLoading={loading}
            options={taskOptions}
            placeholder={error ? `Error: ${error}` : props.placeholder}
            value={loading ? undefined : selectInputProps.value}
        />
    );
});

AssayTaskInput.defaultProps = {
    clearable: true,
    description: 'The workflow task associated with this Run',
    label: 'Workflow Task',
};

AssayTaskInput.displayName = 'AssayTaskInput';

const ASSAY_ID_INDEX = 'Protocol/RowId';

function resolveAssayId(data: any): any {
    // Used in multiple contexts so need to check various data formats
    let assayId = Map.isMap(data) ? data.get(ASSAY_ID_INDEX) : data[ASSAY_ID_INDEX];
    if (!assayId) {
        assayId = Map.isMap(data) ? data.get(encodePart(ASSAY_ID_INDEX)) : data[encodePart(ASSAY_ID_INDEX)];
    }
    if (List.isList(assayId)) {
        assayId = assayId.get(0);
    }
    return assayId?.get?.('value') ?? assayId?.value ?? assayId;
}

export const AssayTaskInputRenderer: FC<InputRendererProps> = memo(props => {
    const {
        allowFieldDisable,
        col,
        data,
        formsy,
        initiallyDisabled,
        onSelectChange,
        onToggleDisable,
        selectInputProps,
        value,
    } = props;

    return (
        <AssayTaskInput
            {...selectInputProps}
            allowDisable={allowFieldDisable}
            assayId={resolveAssayId(data)}
            formsy={formsy}
            initiallyDisabled={initiallyDisabled}
            name={col.name}
            onChange={onSelectChange}
            onToggleDisable={onToggleDisable}
            value={value}
        />
    );
});
