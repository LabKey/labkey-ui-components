import React, { FC, memo, useEffect, useState } from 'react';
import { Filter } from '@labkey/api';

import { selectRows } from '../../../query/selectRows';
import { LoadingSpinner } from '../../base/LoadingSpinner';
import { Alert } from '../../base/Alert';

import { SchemaQuery } from '../../../../public/SchemaQuery';
import { ViewInfo } from '../../../ViewInfo';
import { caseInsensitive } from '../../../util/utils';

import { DisableableInputProps } from './DisableableInput';
import { SelectInput, SelectInputProps } from './SelectInput';

export interface InputOption {
    label: string;
    value: number;
}

async function loadInputOptions(assayId: number): Promise<InputOption[]> {
    const result = await selectRows({
        columns: 'RowId, Name, AssayTypes, Run/Name',
        filterArray: [
            Filter.create('AssayTypes', undefined, Filter.Types.NONBLANK),
            Filter.create('Status/Value', 'In Progress'),
        ],
        maxRows: -1,
        schemaQuery: SchemaQuery.create('samplemanagement', 'Tasks', ViewInfo.DETAIL_NAME),
    });
    const taskOptions: InputOption[] = [];

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
}

// Note: this component is specific to Workflow, and ideally would live in the Workflow package, however we do not
// currently have a way for our Apps to override the InputRenderers (see InputRenderer.tsx).
export const AssayTaskInput: FC<WorkflowTaskInputProps> = memo(props => {
    const { assayId, ...selectInputProps } = props;
    const [loading, setLoading] = useState<boolean>(true);
    const [taskOptions, setTaskOptions] = useState<InputOption[]>();
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
        <div className="workflow-task-input">
            {loading && <LoadingSpinner msg="Loading tasks" />}

            {!loading && error && <Alert>{error}</Alert>}

            {!loading && !error && <SelectInput {...selectInputProps} options={taskOptions} />}
        </div>
    );
});

AssayTaskInput.defaultProps = {
    clearable: true,
    description: 'The workflow task associated with this Run',
    label: 'Workflow Task',
};

AssayTaskInput.displayName = 'AssayTaskInput';
