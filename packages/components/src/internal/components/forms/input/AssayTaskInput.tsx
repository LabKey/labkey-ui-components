import React, { FC, memo, useEffect, useState } from 'react';
import { Filter } from '@labkey/api';
import {selectRowsDeprecated} from "../../../query/api";
import {LoadingSpinner} from "../../base/LoadingSpinner";
import {Alert} from "../../base/Alert";
import {SelectInput} from "./SelectInput";

interface InputOption {
    label: string;
    value: number;
}

async function loadInputOptions(assayId: number): Promise<InputOption[]> {
    const { key, models } = await selectRowsDeprecated({
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

interface WorkflowTaskInputProps {
    assayId: number;
    isDetailInput: boolean;
    name: string;
    value: number;
}

// Note: this component is specific to Workflow, and ideally would live in the Workflow package, however we do not
// currently have a way for our Apps to override the InputRenderers used by resolveRenderer (see renderers.tsx).
export const AssayTaskInput: FC<WorkflowTaskInputProps> = memo(props => {
    const { assayId, isDetailInput, name, value } = props;
    const [loading, setLoading] = useState<boolean>(true);
    const [taskOptions, setTaskOptions] = useState<InputOption[]>(undefined);
    const [error, setError] = useState<string>(undefined);
    const load = async (): Promise<void> => {
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
        } catch (error) {
            console.error(error.exception);
            setError('Error loading workflow tasks');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        load();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="workflow-task-input">
            {loading && <LoadingSpinner msg="Loading tasks" />}

            {!loading && error && <Alert>{error}</Alert>}

            {!loading && !error && (
                <SelectInput
                    formsy
                    clearable
                    description={isDetailInput ? undefined : 'The workflow task associated with this Run'}
                    disabled={taskOptions === undefined}
                    inputClass={isDetailInput ? 'col-sm-12' : undefined}
                    isLoading={loading}
                    label={isDetailInput ? undefined : 'Workflow Task'}
                    name={name}
                    options={taskOptions}
                    value={value}
                />
            )}
        </div>
    );
});
