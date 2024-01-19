import React, { FC, memo, useCallback, useMemo, useState } from 'react';

import { resolveErrorMessage } from '../../util/messaging';
import { Alert } from '../base/Alert';
import { EntityDataType, ProjectConfigurableDataType } from '../entities/models';

import { DataTypeSelector } from '../entities/DataTypeSelector';

import { FolderAPIWrapper, ProjectSettingsOptions } from '../container/FolderAPIWrapper';
import { Container } from '../base/models/Container';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { useFolderDataTypeExclusions } from './useFolderDataTypeExclusions';

interface Props {
    api?: FolderAPIWrapper;
    dataTypePrefix?: string;
    entityDataTypes?: EntityDataType[];
    onSuccess?: (reload?: boolean) => void;
    panelTitle?: string;
    panelDescription?: string;
    project?: Container;
    showUncheckedWarning?: boolean;
    updateDataTypeExclusions: (dataType: ProjectConfigurableDataType, exclusions: number[]) => void;
}

export const ProjectDataTypeSelections: FC<Props> = memo(props => {
    const {
        api,
        entityDataTypes,
        panelTitle,
        panelDescription,
        project,
        updateDataTypeExclusions,
        onSuccess,
        showUncheckedWarning,
        dataTypePrefix,
    } = props;

    const [dirty, setDirty] = useState<boolean>(false);
    const [saveError, setSaveError] = useState<string>();
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [dataTypeExclusion, setDataTypeExclusion] = useState<{ [key: string]: number[] }>({});
    const { loaded, error, disabledTypesMap } = useFolderDataTypeExclusions(api, project);
    const perDataTypeColumns = useMemo(() => (entityDataTypes?.length === 1 ? 2 : 1), [entityDataTypes]);
    const perEntityTypeColCls = useMemo(
        () => (entityDataTypes?.length === 1 ? 'col-xs-12' : 'col-xs-12 col-md-4'),
        [entityDataTypes]
    );

    const updateDataTypeExclusions_ = useCallback(
        (dataType: ProjectConfigurableDataType, exclusions: number[]) => {
            updateDataTypeExclusions?.(dataType, exclusions);

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
                disabledDashboardSampleTypes: dataTypeExclusion?.['DashboardSampleType'],
                disabledDataClasses: dataTypeExclusion?.['DataClass'],
                disabledAssayDesigns: dataTypeExclusion?.['AssayDesign'],
            };

            await api.updateProjectDataExclusions(options, project?.path);

            setDirty(false);
            onSuccess(true);
        } catch (e) {
            setSaveError(resolveErrorMessage(e) ?? 'Failed to update project settings');
        } finally {
            setIsSaving(false);
        }
    }, [isSaving, dataTypeExclusion, api, project?.path, onSuccess]);

    return (
        <div className="panel panel-default">
            <div className="panel-heading">{panelTitle}</div>
            <div className="panel-body">
                <div className="form-horizontal">
                    {error && <Alert>{error}</Alert>}
                    {saveError && <Alert>{saveError}</Alert>}
                    <div className="bottom-spacing">{panelDescription}</div>
                    {!loaded && <LoadingSpinner />}
                    <div className="row">
                        {loaded &&
                            entityDataTypes?.map(entityDataType => {
                                // uncheck those data types that have been configured  to be excluded, but if this
                                // is a "child/related" exclusion type, then use the parent exclusions to hide options
                                // (i.e. for the "Sample Type" exclusions and the "Dashboard Sample Type" exclusions)
                                const uncheckedDataTypes =
                                    disabledTypesMap?.[dataTypePrefix + entityDataType.projectConfigurableDataType];
                                const hiddenDataTypes = dataTypePrefix
                                    ? disabledTypesMap?.[entityDataType.projectConfigurableDataType]
                                    : undefined;

                                return (
                                    <div
                                        key={entityDataType.nounSingular}
                                        className={'bottom-spacing project-datatype-col ' + perEntityTypeColCls}
                                    >
                                        <DataTypeSelector
                                            project={project}
                                            columns={perDataTypeColumns}
                                            dataTypePrefix={dataTypePrefix}
                                            entityDataType={entityDataType}
                                            updateUncheckedTypes={updateDataTypeExclusions_}
                                            uncheckedEntitiesDB={uncheckedDataTypes}
                                            hiddenEntities={hiddenDataTypes}
                                            showUncheckedWarning={showUncheckedWarning}
                                            isNewFolder={!project}
                                        />
                                    </div>
                                );
                            })}
                    </div>

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

ProjectDataTypeSelections.defaultProps = {
    dataTypePrefix: '',
    panelTitle: 'Data in Project',
    panelDescription: 'Select the types of data that will be used in this project.',
    showUncheckedWarning: true,
};

ProjectDataTypeSelections.displayName = 'ProjectDataTypeSelections';
