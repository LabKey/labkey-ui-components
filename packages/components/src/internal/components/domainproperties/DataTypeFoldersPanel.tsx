import React, { FC, memo, useCallback, useEffect, useState } from 'react';

import { hasProductFolders } from '../../app/utils';

import { useServerContext } from '../base/ServerContext';

import { isLoading, LoadingState } from '../../../public/LoadingState';
import { AppContext, useAppContext } from '../../AppContext';
import { DataTypeEntity, EntityDataType, FolderConfigurableDataType } from '../entities/models';

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
    dataTypeCopyId?: number; // RowId for the data type being copied, if applicable
    dataTypeName?: string;
    dataTypeRowId?: number;
    entityDataType: EntityDataType;
    onUpdateExcludedFolders: (dataType: FolderConfigurableDataType, excludedFolders: string[]) => void;
    relatedDataTypeLabel?: string;
    relatedFolderConfigurableDataType?: FolderConfigurableDataType;
}

// export for jest testing
export const DataTypeFoldersPanelImpl: FC<InjectedDomainPropertiesPanelCollapseProps & OwnProps> = memo(props => {
    const {
        collapsed,
        togglePanel,
        controlledCollapse,
        dataTypeCopyId,
        dataTypeRowId,
        dataTypeName,
        onUpdateExcludedFolders,
        entityDataType,
        relatedDataTypeLabel,
        relatedFolderConfigurableDataType,
    } = props;
    const { moduleContext, container } = useServerContext();
    const { api } = useAppContext<AppContext>();
    const [isValid, setIsValid] = useState<boolean>(!collapsed || !!dataTypeRowId);
    const [error, setError] = useState<string>();
    const [loading, setLoading] = useState<LoadingState>(LoadingState.INITIALIZED);
    const [allDataCounts, setAllDataCounts] = useState<Record<string, number>>({});
    const [childFolders, setChildFolders] = useState<DataTypeEntity[]>();
    const [allContainers, setAllContainers] = useState<DataTypeEntity[]>();
    const [excludedContainerIdsDB, setExcludedContainerIdsDB] = useState<string[]>();
    const [excludedContainerIds, setExcludedContainerIds] = useState<string[]>();
    const [relatedExcludedContainerIdsDB, setRelatedExcludedContainerIdsDB] = useState<string[]>();
    const copy = !!dataTypeCopyId && !dataTypeRowId;
    const isNewEntity = !dataTypeRowId && !copy;

    useEffect(
        () => {
            (async () => {
                setLoading(LoadingState.LOADING);
                setError(undefined);

                try {
                    const containers = await api.folder.getContainers(container, moduleContext, true, true, true);
                    const dataTypeRowId_ = copy ? dataTypeCopyId : dataTypeRowId;

                    const allContainers_ = containers.map(container_ => {
                        return {
                            label: container_.title,
                            lsid: container_.id,
                            type: 'Container',
                            inactive: container_.isArchived,
                        } as DataTypeEntity;
                    });

                    setChildFolders(allContainers_.slice(1));
                    setAllContainers(allContainers_);

                    const excludedContainerIds_ = await api.folder.getDataTypeExcludedContainers(
                        entityDataType.folderConfigurableDataType,
                        dataTypeRowId_
                    );
                    setExcludedContainerIdsDB(excludedContainerIds_);
                    setExcludedContainerIds(excludedContainerIds_);
                    if (copy) {
                        onUpdateExcludedFolders(entityDataType.folderConfigurableDataType, excludedContainerIds_);
                    }

                    const allDataCounts_ = await api.query.getDataTypeFolderDataCount(
                        entityDataType,
                        dataTypeRowId,
                        dataTypeName
                    );
                    setAllDataCounts(allDataCounts_);

                    if (relatedFolderConfigurableDataType) {
                        const relatedExcludedContainerIds_ = await api.folder.getDataTypeExcludedContainers(
                            relatedFolderConfigurableDataType,
                            dataTypeRowId
                        );
                        setRelatedExcludedContainerIdsDB(relatedExcludedContainerIds_);
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

    const updateExcludedFolders = useCallback(
        (dataType: FolderConfigurableDataType, exclusions: string[]) => {
            onUpdateExcludedFolders(dataType, exclusions);
            setExcludedContainerIds(exclusions);
        },
        [onUpdateExcludedFolders]
    );

    const updateRelatedExcludedFolders = useCallback(
        (dataType: FolderConfigurableDataType, exclusions: string[]) => {
            onUpdateExcludedFolders(dataType, exclusions);
        },
        [onUpdateExcludedFolders]
    );

    if (!hasProductFolders(moduleContext)) {
        return null;
    }

    return (
        <BasePropertiesPanel
            collapsed={collapsed}
            controlledCollapse={controlledCollapse}
            headerId="domain-folders-hdr"
            isValid
            panelStatus={collapsed && isValid ? 'COMPLETE' : isValid ? 'INPROGRESS' : 'TODO'}
            title="Folders"
            todoIconHelpMsg={
                'This section defines which folders use this ' +
                entityDataType.typeNounSingular.toLowerCase() +
                '. You may want to review.'
            }
            togglePanel={togglePanel}
            updateValidStatus={updateValidStatus}
        >
            <div className="bottom-padding">
                Select which folders can use this {entityDataType.typeNounSingular.toLowerCase()}.
            </div>
            {!!allContainers && allContainers?.length === excludedContainerIds?.length && (
                <Alert bsStyle="warning">
                    Note that this {entityDataType.typeNounSingular.toLowerCase()} can be re-enabled in the Folder
                    Settings page for individual folders.
                </Alert>
            )}
            {error && <Alert>{error}</Alert>}
            {isLoading(loading) ? (
                <LoadingSpinner />
            ) : (
                <div className="row">
                    {!relatedFolderConfigurableDataType && (
                        <div className="col-xs-12 bottom-padding">
                            <DataTypeSelector
                                allDataCounts={allDataCounts}
                                allDataTypes={childFolders}
                                columns={2}
                                dataTypeLabel="folders"
                                entityDataType={entityDataType}
                                inactiveSectionLabel="Archived Folders"
                                isNewEntity={isNewEntity}
                                noHeader
                                showUncheckedWarning={!!dataTypeRowId}
                                uncheckedEntitiesDB={excludedContainerIdsDB}
                                updateUncheckedTypes={updateExcludedFolders}
                            />
                        </div>
                    )}
                    {!!relatedFolderConfigurableDataType && (
                        <>
                            <div className="col-xs-6 bottom-padding">
                                <DataTypeSelector
                                    allDataCounts={allDataCounts}
                                    allDataTypes={childFolders}
                                    dataTypeLabel="Include in Folders"
                                    entityDataType={entityDataType}
                                    inactiveSectionLabel="Archived Folders"
                                    isNewEntity={isNewEntity}
                                    showUncheckedWarning={!!dataTypeRowId}
                                    uncheckedEntitiesDB={excludedContainerIdsDB}
                                    updateUncheckedTypes={updateExcludedFolders}
                                />
                            </div>
                            <div className="col-xs-6 bottom-padding">
                                <DataTypeSelector
                                    allDataTypes={allContainers}
                                    dataTypeLabel={relatedDataTypeLabel}
                                    dataTypePrefix="Dashboard"
                                    entityDataType={entityDataType}
                                    hiddenEntities={excludedContainerIds}
                                    inactiveSectionLabel="Archived Folders"
                                    isNewEntity={isNewEntity}
                                    showUncheckedWarning={false}
                                    uncheckedEntitiesDB={relatedExcludedContainerIdsDB}
                                    updateUncheckedTypes={updateRelatedExcludedFolders}
                                />
                            </div>
                        </>
                    )}
                </div>
            )}
        </BasePropertiesPanel>
    );
});

export const DataTypeFoldersPanel = withDomainPropertiesPanelCollapse<OwnProps>(DataTypeFoldersPanelImpl);

DataTypeFoldersPanel.displayName = 'DataTypeFoldersPanel';
