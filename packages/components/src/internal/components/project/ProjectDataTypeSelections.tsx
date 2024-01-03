import React, { FC, memo, useCallback, useState } from 'react';
import { Col, Row } from 'react-bootstrap';

import { resolveErrorMessage } from '../../util/messaging';
import { Alert } from '../base/Alert';
import { EntityDataType, ProjectConfigurableDataType } from '../entities/models';

import { DataTypeSelector } from '../entities/DataTypeSelector';

import { FolderAPIWrapper, ProjectSettingsOptions } from '../container/FolderAPIWrapper';
import { Container } from '../base/models/Container';

interface Props {
    api?: FolderAPIWrapper;
    disabledTypesMap?: { [key: string]: number[] };
    entityDataTypes?: EntityDataType[];
    onSuccess?: (reload?: boolean) => void;
    project?: Container;
    updateDataTypeExclusions: (dataType: ProjectConfigurableDataType, exclusions: number[]) => void;
}

export const ProjectDataTypeSelections: FC<Props> = memo(props => {
    const { api, entityDataTypes, project, updateDataTypeExclusions, onSuccess, disabledTypesMap } = props;

    const [dirty, setDirty] = useState<boolean>(false);
    const [error, setError] = useState<string>();
    const [isSaving, setIsSaving] = useState<boolean>(false);

    const [dataTypeExclusion, setDataTypeExclusion] = useState<{ [key: string]: number[] }>({});

    const updateDataTypeExclusions_ = useCallback(
        (dataType: ProjectConfigurableDataType, exclusions: number[]) => {
            if (updateDataTypeExclusions) updateDataTypeExclusions(dataType, exclusions);

            if (project) {
                setDataTypeExclusion(prev => {
                    const uncheckedUpdates = { ...prev };
                    uncheckedUpdates[dataType] = exclusions;
                    return uncheckedUpdates;
                });
                setDirty(true);
            }
        },
        [updateDataTypeExclusions, project]
    );

    const onSave = useCallback(async () => {
        if (isSaving) return;
        setIsSaving(true);

        try {
            const options: ProjectSettingsOptions = {
                disabledSampleTypes: dataTypeExclusion?.['SampleType'],
                disabledDataClasses: dataTypeExclusion?.['DataClass'],
                disabledAssayDesigns: dataTypeExclusion?.['AssayDesign'],
            };

            await api.updateProjectDataExclusions(options, project?.path);

            setDirty(false);
            onSuccess(true);
        } catch (e) {
            setError(resolveErrorMessage(e) ?? 'Failed to update project settings');
        } finally {
            setIsSaving(false);
        }
    }, [isSaving, onSuccess, project, dataTypeExclusion]);

    return (
        <div className="panel panel-default">
            <div className="panel-heading">Data in Project</div>
            <div className="panel-body">
                <div className="form-horizontal">
                    {error && <Alert>{error}</Alert>}
                    <div className="bottom-spacing">Select the types of data that will be used in this project.</div>
                    <Row>
                        {entityDataTypes?.map((entityDataType, index) => {
                            return (
                                <Col key={index} xs={12} md={4} className="bottom-spacing">
                                    <DataTypeSelector
                                        entityDataType={entityDataType}
                                        updateUncheckedTypes={updateDataTypeExclusions_}
                                        uncheckedEntitiesDB={
                                            disabledTypesMap?.[entityDataType.projectConfigurableDataType]
                                        }
                                        isNewFolder={!project}
                                    />
                                </Col>
                            );
                        })}
                    </Row>

                    {project && (
                        <div className="pull-right">
                            <button
                                className="pull-right alert-button btn btn-success"
                                disabled={isSaving || !dirty}
                                onClick={onSave}
                                type="button"
                            >
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
