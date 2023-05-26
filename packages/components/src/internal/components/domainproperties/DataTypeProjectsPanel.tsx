import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';

import { hasProductProjects, isAppHomeFolder, isProductProjectDataTypeSelectionEnabled } from '../../app/utils';

import { useServerContext } from '../base/ServerContext';

import { isLoading, LoadingState } from '../../../public/LoadingState';
import { AppContext, useAppContext } from '../../AppContext';
import { DataTypeEntity, ProjectConfigurableDataType } from '../entities/models';

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
    dataTypeRowId?: number;
    isNew: boolean;
    noun: string;
    onUpdateExcludedProjects: (excludedProjects: string[]) => void;
}

const DataTypeProjectsPanelImpl: FC<OwnProps & InjectedDomainPropertiesPanelCollapseProps> = memo(props => {
    const {
        collapsed,
        togglePanel,
        controlledCollapse,
        isNew,
        noun,
        dataType,
        dataTypeRowId,
        onUpdateExcludedProjects,
    } = props;
    const { moduleContext, container } = useServerContext();
    const { api } = useAppContext<AppContext>();
    const [isValid, setIsValid] = useState<boolean>(!collapsed || !isNew);
    const [error, setError] = useState<string>();
    const [loading, setLoading] = useState<LoadingState>(LoadingState.INITIALIZED);
    const [allProjects, setAllProjects] = useState<DataTypeEntity[]>();
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
                    setExcludedProjectIds(excludedProjectIds_);
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
                'This section defines which projects use this ' + noun.toLowerCase() + '. You may want to review.'
            }
            togglePanel={togglePanel}
        >
            <div className="bottom-spacing">Select which projects use this {noun.toLowerCase()}.</div>
            {error && <Alert>{error}</Alert>}
            {isLoading(loading) ? (
                <LoadingSpinner />
            ) : (
                <Row>
                    <Col xs={12} className="bottom-spacing">
                        <DataTypeSelector
                            allDataCounts={{}} // TODO
                            allDataTypes={allProjects}
                            updateUncheckedTypes={updateExcludedProjects}
                            uncheckedEntitiesDB={excludedProjectIds}
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
