import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Col, Row } from 'react-bootstrap';

import { hasProductProjects, isAppHomeFolder, isProductProjectDataTypeSelectionEnabled } from '../../app/utils';

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
    dataType?: ProjectConfigurableDataType;
    dataTypeName?: string;
    dataTypeRowId?: number;
    entityDataType: EntityDataType;
    onUpdateExcludedProjects: (excludedProjects: string[]) => void;
}

const DataTypeProjectsPanelImpl: FC<OwnProps & InjectedDomainPropertiesPanelCollapseProps> = memo(props => {
    const {
        collapsed,
        togglePanel,
        controlledCollapse,
        dataType,
        dataTypeRowId,
        dataTypeName,
        onUpdateExcludedProjects,
        entityDataType,
    } = props;
    const { moduleContext, container } = useServerContext();
    const { api } = useAppContext<AppContext>();
    const [isValid, setIsValid] = useState<boolean>(!collapsed || !!dataTypeRowId);
    const [error, setError] = useState<string>();
    const [loading, setLoading] = useState<LoadingState>(LoadingState.INITIALIZED);
    const [allDataCounts, setAllDataCounts] = useState<Record<string, number>>({});
    const [allProjects, setAllProjects] = useState<DataTypeEntity[]>();
    const [excludedProjectIdsDB, setExcludedProjectIdsDB] = useState<string[]>();
    const [excludedProjectIds, setExcludedProjectIds] = useState<string[]>();

    useEffect(
        () => {
            (async () => {
                setLoading(LoadingState.LOADING);
                setError(undefined);

                try {
                    const containers = await api.security.fetchContainers({
                        containerPath: isAppHomeFolder(container, moduleContext)
                            ? container.path
                            : container.parentPath,
                        includeEffectivePermissions: false,
                        includeStandardProperties: true, // needed to get the container title
                        includeWorkbookChildren: false,
                        includeSubfolders: true,
                        depth: 1,
                    });

                    const allProjects_ = containers
                        // if user doesn't have permissions to the parent/project, the response will come back with an empty Container object
                        .filter(c => c !== undefined && c.id !== '')
                        // filter out the Home project container (i.e. the type = "project")
                        .filter(c => c.type === 'folder')
                        // convert to an array of DataTypeEntity
                        .map(project => {
                            return { label: project.title, lsid: project.id, type: 'Project' } as DataTypeEntity;
                        });

                    setAllProjects(allProjects_);

                    const excludedProjectIds_ = await api.folder.getDataTypeExcludedProjects(dataType, dataTypeRowId);
                    setExcludedProjectIdsDB(excludedProjectIds_);
                    setExcludedProjectIds(excludedProjectIds_);

                    const allDataCounts_ = await api.query.getDataTypeProjectDataCount(entityDataType, dataTypeRowId, dataTypeName);
                    setAllDataCounts(allDataCounts_);
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
        (_: ProjectConfigurableDataType, exclusions: string[]) => {
            onUpdateExcludedProjects(exclusions);
            setExcludedProjectIds(exclusions);
        },
        [onUpdateExcludedProjects]
    );

    if (!isProductProjectDataTypeSelectionEnabled(moduleContext) || !hasProductProjects(moduleContext)) {
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
                Select which projects use this {entityDataType.typeNounSingular.toLowerCase()}.
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
                <Row>
                    <Col xs={12} className="bottom-spacing">
                        <DataTypeSelector
                            entityDataType={entityDataType}
                            allDataCounts={allDataCounts}
                            allDataTypes={allProjects}
                            updateUncheckedTypes={updateExcludedProjects}
                            uncheckedEntitiesDB={excludedProjectIdsDB}
                            dataTypeLabel="projects"
                            noHeader={true}
                            columns={2}
                        />
                    </Col>
                </Row>
            )}
        </BasePropertiesPanel>
    );
});

export const DataTypeProjectsPanel = withDomainPropertiesPanelCollapse<OwnProps>(DataTypeProjectsPanelImpl);
