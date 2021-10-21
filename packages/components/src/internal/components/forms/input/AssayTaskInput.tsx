import React, { FC, memo, useCallback, useEffect, useReducer } from 'react';
import { Filter } from '@labkey/api';

import { Alert, LoadingSpinner, SelectInput, selectRows } from '../../../..';

interface InputOption {
    label: string;
    value: number;
}

async function loadInputOptions(assayId: number): Promise<InputOption[]> {
    const { key, models } = await selectRows({
        schemaName: 'samplemanagement',
        queryName: 'Tasks',
        columns: 'RowId,Name,AssayTypes,Run/Name',
        filterArray: [
            Filter.create('AssayTypes', undefined, Filter.Types.NONBLANK),
            Filter.create('Status/Value', 'In Progress'),
        ],
        maxRows: -1,
    });
    const rows = Object.values(models[key]);
    const taskOptions = [];

    rows.forEach(row => {
        const taskId = row['RowId'].value;
        const jobName = row['Run/Name'].value;
        const taskName = row['Name'].value;
        const assays = row['AssayTypes'].value.split(',').map(Number);
        const hasAssay = assays.find(id => assayId === id);

        if (hasAssay) {
            taskOptions.push({ label: `${jobName} - ${taskName}`, value: taskId });
        }
    });

    return taskOptions;
}

interface WorkflowTaskInputOptionsState {
    error: string;
    loading: boolean;
    taskOptions: InputOption[];
    value: number;
}

interface WorkflowTaskInputHook {
    setValue: (value: number) => void;
    state: WorkflowTaskInputOptionsState;
}

const DEFAULT_STATE = {
    taskOptions: undefined,
    value: undefined,
    loading: true,
    error: undefined,
};

const inputReducer = (
    state: WorkflowTaskInputOptionsState,
    change: Partial<WorkflowTaskInputOptionsState>
): WorkflowTaskInputOptionsState => ({ ...state, ...change });

function useWorkflowTaskInputState(assayId: number, value?: number): WorkflowTaskInputHook {
    const [state, setState] = useReducer(inputReducer, { ...DEFAULT_STATE, value });
    const load = async (): Promise<void> => {
        if (assayId === undefined) {
            // If the components rendering the QueryFormInputs or EditableDetailPanel don't properly inject the assayId
            // into the form data (via ASSAY_INDEX key defined above) then this will happen.
            setState({ loading: false, error: 'Assay ID not set, cannot load Workflow Tasks' });
            return;
        }

        try {
            const taskOptions = await loadInputOptions(assayId);
            setState({ taskOptions, loading: false });
        } catch (error) {
            console.error(error.exception);
            setState({ loading: false, error: 'Error loading Workflow Tasks' });
        }
    };
    useEffect(() => {
        load();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const setValue = useCallback((newValue: number) => setState({ value: newValue }), []);

    return { setValue, state };
}

interface WorkflowTaskInputProps {
    assayId: number;
    isDetailInput: boolean;
    value: number;
}

// Note: this component is specific to Workflow, and ideally would live in the Workflow package, however we do not
// currently have a way for our Apps to override the InputRenderers used by resolveRenderer (see renderers.tsx).
export const AssayTaskInput: FC<WorkflowTaskInputProps> = memo(props => {
    const { assayId, isDetailInput } = props;
    const { setValue, state } = useWorkflowTaskInputState(assayId, props.value);
    const { error, loading, taskOptions, value } = state;
    const onTaskSelect = useCallback((_, taskId) => setValue(taskId), [setValue]);
    let label;
    let description;

    if (!isDetailInput) {
        label = 'Workflow Task';
        description = 'The Workflow Task associated with this Run';
    }

    return (
        <div className="workflow-task-input">
            {loading && <LoadingSpinner msg="Loading tasks" />}

            {!loading && error && <Alert>{error}</Alert>}

            {!loading && !error && (
                <SelectInput
                    formsy
                    clearable
                    description={description}
                    disabled={taskOptions === undefined}
                    inputClass={isDetailInput ? 'col-sm-12' : undefined}
                    isLoading={loading}
                    label={label}
                    name="workflowtask"
                    onChange={onTaskSelect}
                    options={taskOptions}
                    value={value}
                />
            )}
        </div>
    );
});
