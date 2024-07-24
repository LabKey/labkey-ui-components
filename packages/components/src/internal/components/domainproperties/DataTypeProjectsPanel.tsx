import React, { FC, memo, useCallback, useEffect, useState } from 'react';

import { hasProductProjects } from '../../app/utils';

import { useServerContext } from '../base/ServerContext';

import { isLoading, LoadingState } from '../../../public/LoadingState';
import { AppContext, useAppContext } from '../../AppContext';
import { DataTypeEntity, EntityDataType, ProjectConfigurableDataType } from '../entities/models';

import { resolveErrorMessage } from '../../util/messaging';
import { Alert } from '../base/Alert';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { DataTypeSelector } from '../entities/DataTypeSelector';

import { BasePropertiesPanel } from './BasePropertiesPanel';
import {
    InjectedDomainPropertiesPanelCollapseProps,
    withDomainPropertiesPanelCollapse,
} from './DomainPropertiesPanelCollapse';

interface OwnProps {
    dataTypeName?: string;
    dataTypeRowId?: number;
    entityDataType: EntityDataType;
    onUpdateExcludedProjects: (dataType: ProjectConfigurableDataType, excludedProjects: string[]) => void;
    relatedDataTypeLabel?: string;
    relatedProjectConfigurableDataType?: ProjectConfigurableDataType;
}

// export for jest testing
export const DataTypeProjectsPanelImpl: FC<OwnProps & InjectedDomainPropertiesPanelCollapseProps> = memo(props => {
    const {
        collapsed,
        togglePanel,
        controlledCollapse,
        dataTypeRowId,
        dataTypeName,
        onUpdateExcludedProjects,
        entityDataType,
        relatedDataTypeLabel,
        relatedProjectConfigurableDataType,
    } = props;
    const { moduleContext, container } = useServerContext();
    const { api } = useAppContext<AppContext>();
    const [isValid, setIsValid] = useState<boolean>(!collapsed || !!dataTypeRowId);
    const [error, setError] = useState<string>();
    const [loading, setLoading] = useState<LoadingState>(LoadingState.INITIALIZED);
    const [allDataCounts, setAllDataCounts] = useState<Record<string, number>>({});
    const [childProjects, setChildProjects] = useState<DataTypeEntity[]>();
    const [allProjects, setAllProjects] = useState<DataTypeEntity[]>();
    const [excludedProjectIdsDB, setExcludedProjectIdsDB] = useState<string[]>();
    const [excludedProjectIds, setExcludedProjectIds] = useState<string[]>();
    const [relatedExcludedProjectIdsDB, setRelatedExcludedProjectIdsDB] = useState<string[]>();

    useEffect(
        () => {
            (async () => {
                setLoading(LoadingState.LOADING);
                setError(undefined);

                try {
                    const containers = await api.folder.getProjects(container, moduleContext, true, true, true);

                    const allProjects_ = containers.map(project => {
                        return { label: project.title, lsid: project.id, type: 'Project' } as DataTypeEntity;
                    });

                    setChildProjects(allProjects_.slice(1));
                    setAllProjects(allProjects_);

                    const excludedProjectIds_ = await api.folder.getDataTypeExcludedProjects(
                        entityDataType.projectConfigurableDataType,
                        dataTypeRowId
                    );
                    setExcludedProjectIdsDB(excludedProjectIds_);
                    setExcludedProjectIds(excludedProjectIds_);

                    const allDataCounts_ = await api.query.getDataTypeProjectDataCount(
                        entityDataType,
                        dataTypeRowId,
                        dataTypeName
                    );
                    setAllDataCounts(allDataCounts_);

                    if (relatedProjectConfigurableDataType) {
                        const relatedExcludedProjectIds_ = await api.folder.getDataTypeExcludedProjects(
                            relatedProjectConfigurableDataType,
                            dataTypeRowId
                        );
                        setRelatedExcludedProjectIdsDB(relatedExcludedProjectIds_);
                    }
                } catch (e) {
                    setError(`Error: ${resolveErrorMessage(e)}`);
                } finally {
                    setLoading(LoadingState.LOADED);
                }
            })();
        },
        [
            /* on mount only */
        ]
    );

    useEffect(() => {
        // consider the panel valid once the user has expanded/opened it at least once
        if (!collapsed && !isValid) setIsValid(true);
    }, [collapsed, isValid]);

    const updateValidStatus = useCallback(() => {
        /* no-op */
    }, []);

    const updateExcludedProjects = useCallback(
        (dataType: ProjectConfigurableDataType, exclusions: string[]) => {
            onUpdateExcludedProjects(dataType, exclusions);
            setExcludedProjectIds(exclusions);
        },
        [onUpdateExcludedProjects]
    );

    const updateRelatedExcludedProjects = useCallback(
        (dataType: ProjectConfigurableDataType, exclusions: string[]) => {
            onUpdateExcludedProjects(dataType, exclusions);
        },
        [onUpdateExcludedProjects]
    );

    if (!hasProductProjects(moduleContext)) {
        return null;
    }

    return (
        <BasePropertiesPanel
            headerId="domain-projects-hdr"
            title="Projects"
            collapsed={collapsed}
            controlledCollapse={controlledCollapse}
            isValid
            panelStatus={collapsed && isValid ? 'COMPLETE' : isValid ? 'INPROGRESS' : 'TODO'}
            updateValidStatus={updateValidStatus}
            todoIconHelpMsg={
                'This section defines which projects use this ' +
                entityDataType.typeNounSingular.toLowerCase() +
                '. You may want to review.'
            }
            togglePanel={togglePanel}
        >
            <div className="bottom-spacing">
                Select which projects will use this {entityDataType.typeNounSingular.toLowerCase()}.
            </div>
            {!!allProjects && allProjects?.length === excludedProjectIds?.length && (
                <Alert bsStyle="warning">
                    Note that this {entityDataType.typeNounSingular.toLowerCase()} can be re-enabled in the Project
                    Settings page for individual projects.
                </Alert>
            )}
            {error && <Alert>{error}</Alert>}
            {isLoading(loading) ? (
                <LoadingSpinner />
            ) : (
                <div className="row">
                    {!relatedProjectConfigurableDataType && (
                        <div className="col-xs-12 bottom-spacing">
                            <DataTypeSelector
                                api={api}
                                entityDataType={entityDataType}
                                allDataCounts={allDataCounts}
                                allDataTypes={childProjects}
                                updateUncheckedTypes={updateExcludedProjects}
                                uncheckedEntitiesDB={excludedProjectIdsDB}
                                dataTypeLabel="projects"
                                noHeader
                                columns={2}
                            />
                        </div>
                    )}
                    {!!relatedProjectConfigurableDataType && (
                        <>
                            <div className="col-xs-6 bottom-spacing">
                                <DataTypeSelector
                                    api={api}
                                    entityDataType={entityDataType}
                                    allDataCounts={allDataCounts}
                                    allDataTypes={childProjects}
                                    updateUncheckedTypes={updateExcludedProjects}
                                    uncheckedEntitiesDB={excludedProjectIdsDB}
                                    dataTypeLabel="Include in Projects"
                                />
                            </div>
                            <div className="col-xs-6 bottom-spacing">
                                <DataTypeSelector
                                    api={api}
                                    dataTypePrefix="Dashboard"
                                    entityDataType={entityDataType}
                                    allDataTypes={allProjects}
                                    updateUncheckedTypes={updateRelatedExcludedProjects}
                                    uncheckedEntitiesDB={relatedExcludedProjectIdsDB}
                                    hiddenEntities={excludedProjectIds}
                                    dataTypeLabel={relatedDataTypeLabel}
                                />
                            </div>
                        </>
                    )}
                </div>
            )}
        </BasePropertiesPanel>
    );
});

export const DataTypeProjectsPanel = withDomainPropertiesPanelCollapse<OwnProps>(DataTypeProjectsPanelImpl);
