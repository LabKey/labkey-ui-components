import React, { FC, memo, useCallback, useState } from 'react';

import { useAppContext } from '../../AppContext';
import { useServerContext, useServerContextDispatch } from '../base/ServerContext';

import { ProjectSettingsOptions } from '../container/FolderAPIWrapper';
import { resolveErrorMessage } from '../../util/messaging';
import { Alert } from '../base/Alert';
import { Container } from '../base/models/Container';

import { useAdminAppContext } from '../administration/useAdminAppContext';

import { BarTenderSettingsForm } from '../labels/BarTenderSettingsForm';
import { NameIdSettings } from '../settings/NameIdSettings';
import { biologicsIsPrimaryApp, isAppHomeFolder, isProtectedDataEnabled } from '../../app/utils';
import { ProtectedDataSettingsPanel } from '../administration/ProtectedDataSettingsPanel';

import { ProjectNameSetting } from './ProjectNameSetting';
import { ProjectDataTypeSelections } from './ProjectDataTypeSelections';
import { DeleteProjectModal } from './DeleteProjectModal';
import { useRouteLeave } from '../../util/RouteLeave';

export interface ProjectSettingsProps {
    onChange: (dirty?: boolean) => void;
    onPageError: (e: string) => void;
    onSuccess: (dirty?: boolean, reload?: boolean, isDelete?: boolean) => void;
    project?: Container;
}

export const ProjectSettings: FC<ProjectSettingsProps> = memo(props => {
    const { onChange, onSuccess, onPageError, project } = props;

    const [showModal, setShowModal] = useState<boolean>(false);
    const [nameDirty, setNameDirty] = useState<boolean>(false);
    const [hasValidName, setHasValidName] = useState<boolean>(project.name.length > 0);
    const [dataTypeDirty, setDataTypeDirty] = useState<boolean>(false);
    const [dashboardDirty, setDashboardDirty] = useState<boolean>(false);
    const [storageDirty, setStorageDirty] = useState<boolean>(false);
    const [barDirty, setBarDirty] = useState<boolean>(false);
    const [nameIdDirty, setNameIdDirty] = useState<boolean>(false);
    const [error, setError] = useState<string>();
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const { api } = useAppContext();
    const { projectDataTypes, sampleTypeDataType, ProjectFreezerSelectionComponent } = useAdminAppContext();
    const { container, user, moduleContext } = useServerContext();
    const isAppHomeSelected = isAppHomeFolder(project, moduleContext);
    const dispatch = useServerContextDispatch();
    const [getIsDirty, setIsDirty] = useRouteLeave();

    const onNameChange_ = useCallback((name: string) => {
        setNameDirty(true);
        setHasValidName(name?.trim().length > 0);
        onChange(true);
    }, [onChange]);

    const onDataTypeChange_ = useCallback(() => {
        setDataTypeDirty(true);
        onChange(true);
    }, [onChange]);

    const onDashboardChange_ = useCallback(() => {
        setDashboardDirty(true);
        onChange(true);
    }, [onChange]);

    const onStorageChange_ = useCallback(() => {
        setStorageDirty(true);
        onChange(true);
    }, [onChange]);

    const onBarChange_ = useCallback(() => {
        setBarDirty(true);
        onChange(true);
    }, [onChange]);

    const onBarSuccess_ = useCallback(() => {
        setBarDirty(false);
        onSuccess(nameDirty || dataTypeDirty || dashboardDirty || storageDirty || nameIdDirty, false);
    }, [onSuccess, nameDirty, dataTypeDirty, dashboardDirty, storageDirty, nameIdDirty]);

    const onNameIdChange_ = useCallback(
        dirty => {
            setNameIdDirty(dirty);
            if (dirty) onChange(true);
            else onSuccess(nameDirty || dataTypeDirty || dashboardDirty || storageDirty || barDirty, false);
        },
        [onChange, onSuccess, nameDirty, dataTypeDirty, dashboardDirty, storageDirty, barDirty]
    );

    const onSubmitName = useCallback(
        async evt => {
            evt.preventDefault();
            evt.stopPropagation();
            if (isSaving) return;
            setIsSaving(true);

            let renamedProject: Container;
            try {
                const formData = new FormData(evt.target);
                const options: ProjectSettingsOptions = {
                    name: formData.get('name') as string,
                    nameAsTitle: !!formData.get('nameAsTitle'),
                    title: formData.get('title') as string,
                };

                renamedProject = await api.folder.renameProject(options, project.path);
                setNameDirty(false);
                onSuccess(dataTypeDirty || dashboardDirty || storageDirty || barDirty || nameIdDirty);
            } catch (e) {
                setError(resolveErrorMessage(e) ?? 'Failed to update project settings');
            } finally {
                setIsSaving(false);
            }

            // If this change has been made to the current folder then dispatch a
            // context update of the container's name and title.
            if (renamedProject?.id === container.id) {
                dispatch({
                    container: new Container({
                        ...container,
                        name: project.name,
                        title: project.title,
                    }),
                });
            }
        },
        [
            api.folder,
            container,
            dispatch,
            project,
            isSaving,
            onSuccess,
            dataTypeDirty,
            dashboardDirty,
            storageDirty,
            barDirty,
            nameIdDirty,
        ]
    );

    const closeModalHandler = useCallback(() => {
        setShowModal(false);
    }, []);

    const openModalHandler = useCallback(() => {
        setShowModal(true);
    }, []);

    const onDeleteError = useCallback(
        (e: string) => {
            setShowModal(false);
            onPageError(e);
        },
        [onPageError]
    );

    const onDeleteSuccess = useCallback(() => {
        onSuccess(false, false, true);
        setShowModal(false);
    }, [onSuccess]);

    const onDataTypeSuccess = useCallback(
        (reload?: boolean) => {
            setDataTypeDirty(false);
            onSuccess(nameDirty || dashboardDirty || storageDirty || barDirty || nameIdDirty, reload);
        },
        [onSuccess, nameDirty, dashboardDirty, storageDirty, barDirty, nameIdDirty]
    );

    const onDashboardSuccess = useCallback(
        (reload?: boolean) => {
            setDashboardDirty(false);
            onSuccess(nameDirty || dataTypeDirty || storageDirty || barDirty || nameIdDirty, reload);
        },
        [onSuccess, nameDirty, dataTypeDirty, storageDirty, barDirty, nameIdDirty]
    );

    const onStorageSuccess = useCallback(
        (reload?: boolean) => {
            setStorageDirty(false);
            onSuccess(nameDirty || dataTypeDirty || dashboardDirty || barDirty || nameIdDirty, reload);
        },
        [onSuccess, nameDirty, dataTypeDirty, dashboardDirty, barDirty, nameIdDirty]
    );

    if (!project || !user.isAdmin) {
        return null;
    }

    if (isAppHomeSelected) {
        return (
            <div className="project-settings-container">
                <div className="project-settings panel panel-default">
                    <ProjectDataTypeSelections
                        api={api.folder}
                        panelTitle="Dashboard"
                        panelDescription="Select the data types to include in the Dashboard Insights graphs."
                        dataTypePrefix="Dashboard"
                        entityDataTypes={[sampleTypeDataType]}
                        project={project}
                        showUncheckedWarning={false}
                        updateDataTypeExclusions={onDashboardChange_}
                        onSuccess={onDashboardSuccess}
                        setIsDirty={setIsDirty}
                        getIsDirty={getIsDirty}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="project-settings-container">
            <div className="project-settings panel panel-default">
                <div className="panel-heading">Settings</div>
                <div className="panel-body">
                    {!!error && <Alert>{error}</Alert>}

                    <form className="project-settings-form form-horizontal" onSubmit={onSubmitName}>
                        <ProjectNameSetting
                            defaultName={project.name}
                            defaultTitle={project.title}
                            onChange={onNameChange_}
                            setIsDirty={setIsDirty}
                            getIsDirty={getIsDirty}
                        />

                        <div className="pull-right">
                            <button
                                className="btn btn-default delete-project-button"
                                onClick={openModalHandler}
                                type="button"
                            >
                                <i className="fa fa-trash" /> Delete Project
                            </button>

                            <button
                                className="btn btn-success"
                                disabled={isSaving || !nameDirty || !hasValidName}
                                type="submit"
                            >
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </form>
                </div>

                {showModal && (
                    <DeleteProjectModal
                        project={project}
                        onCancel={closeModalHandler}
                        onError={onDeleteError}
                        onDeleteSuccess={onDeleteSuccess}
                    />
                )}
            </div>
            <ProjectDataTypeSelections
                entityDataTypes={projectDataTypes}
                project={project}
                key={project?.id}
                updateDataTypeExclusions={onDataTypeChange_}
                api={api.folder}
                onSuccess={onDataTypeSuccess}
                setIsDirty={setIsDirty}
                getIsDirty={getIsDirty}
            />
            {sampleTypeDataType && (
                <ProjectDataTypeSelections
                    api={api.folder}
                    panelTitle="Dashboard"
                    panelDescription="Select the data types to include in the Dashboard Insights graphs."
                    dataTypePrefix="Dashboard"
                    entityDataTypes={[sampleTypeDataType]}
                    project={project}
                    showUncheckedWarning={false}
                    updateDataTypeExclusions={onDashboardChange_}
                    onSuccess={onDashboardSuccess}
                    setIsDirty={setIsDirty}
                    getIsDirty={getIsDirty}
                />
            )}
            {!!ProjectFreezerSelectionComponent && (
                <ProjectFreezerSelectionComponent
                    project={project}
                    updateDataTypeExclusions={onStorageChange_}
                    onSuccess={onStorageSuccess}
                    setIsDirty={setIsDirty}
                    getIsDirty={getIsDirty}
                />
            )}
            {biologicsIsPrimaryApp(moduleContext) && (
                <BarTenderSettingsForm
                    onChange={onBarChange_}
                    onSuccess={onBarSuccess_}
                    container={project}
                    setIsDirty={null} // used by templates, not needed here
                    getIsDirty={null}
                />
            )}
            <NameIdSettings
                {...props}
                container={project}
                isAppHome={false}
                setIsDirty={onNameIdChange_}
                getIsDirty={null}
            />
            {biologicsIsPrimaryApp(moduleContext) && isProtectedDataEnabled(moduleContext) && (
                <ProtectedDataSettingsPanel containerPath={project.path} />
            )}
        </div>
    );
});
