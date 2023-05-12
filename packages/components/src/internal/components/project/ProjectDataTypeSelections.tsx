import React, { FC, memo, useCallback, useState } from 'react';
import {Button, Col, Row} from 'react-bootstrap';

import { resolveErrorMessage } from '../../util/messaging';
import { Alert } from '../base/Alert';
import {EntityDataType, ProjectConfigurableDataType} from '../entities/models';

import { DataTypeSelector } from '../entities/DataTypeSelector';

import {FolderAPIWrapper, ProjectSettingsOptions} from "../container/FolderAPIWrapper";

interface Props {
    entityDataTypes?: EntityDataType[];
    projectId?: string;
    showWarning?: boolean;
    updateDataTypeExclusions: (dataType: ProjectConfigurableDataType, exclusions: number[]) => void;
    onSuccess?: () => void;
    api?: FolderAPIWrapper;
    disabledTypesMap?: { [key: string]: number[] };
}

export const ProjectDataTypeSelections: FC<Props> = memo(props => {
    const { api, entityDataTypes, showWarning, projectId, updateDataTypeExclusions, onSuccess, disabledTypesMap } = props;

    const [dirty, setDirty] = useState<boolean>(false);
    const [error, setError] = useState<string>();
    const [isSaving, setIsSaving] = useState<boolean>(false);

    const [dataTypeExclusion, setDataTypeExclusion] = useState<{ [key: string]: number[] }>({});

    const updateDataTypeExclusions_ = useCallback(
        (dataType: ProjectConfigurableDataType, exclusions: number[]) => {
            if (updateDataTypeExclusions)
                updateDataTypeExclusions(dataType, exclusions);

            if (projectId) {
                setDataTypeExclusion(prev => {
                    const uncheckedUpdates = { ...prev };
                    uncheckedUpdates[dataType] = exclusions;
                    return uncheckedUpdates;
                });
                setDirty(true);
            }
        },
        [updateDataTypeExclusions, projectId]
    );

    const onSave = useCallback(async () => {
        if (isSaving) return;
        setIsSaving(true);

        try {
            const options: ProjectSettingsOptions = {
                disabledSampleTypes: dataTypeExclusion?.['sampletype'],
                disabledDataClasses: dataTypeExclusion?.['dataclass'],
                disabledAssayDesigns: dataTypeExclusion?.['assaydesign'],
            };

            await api.updateProjectDataType(options);

            setDirty(false);
            onSuccess();
        } catch (e) {
            setError(resolveErrorMessage(e) ?? 'Failed to update project settings');
        } finally {
            setIsSaving(false);
        }

    }, [isSaving, onSuccess, projectId, dataTypeExclusion]);

    return (
        <div className="panel panel-default">
            <div className="panel-body">
                <div className="form-horizontal">
                    <div className="form-subtitle">Data in Project</div>
                    {error && <Alert>{error}</Alert>}
                    <div className="bottom-spacing">Select what types of data will be used in this project.</div>
                    <Row>
                        {entityDataTypes?.map((entityDataType, index) => {
                            return (
                                <Col key={index} xs={12} md={4} className="bottom-spacing">
                                    <DataTypeSelector
                                        showWarning={showWarning}
                                        entityDataType={entityDataType}
                                        updateUncheckedTypes={updateDataTypeExclusions_}
                                        uncheckedEntitiesDB={disabledTypesMap?.[entityDataType.projectConfigurableDataType]}
                                    />
                                </Col>
                            );
                        })}
                    </Row>

                    {projectId && (
                        <div className="pull-right">
                            <Button
                                className="pull-right alert-button"
                                bsStyle="success"
                                disabled={isSaving || !dirty}
                                onClick={onSave}
                            >
                                Save
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

