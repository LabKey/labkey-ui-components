import React, { FC, memo, useCallback, useEffect, useState } from 'react';

import { Button } from 'react-bootstrap';

import { useAppContext } from '../../AppContext';
import { useServerContext, useServerContextDispatch } from '../base/ServerContext';

import { ProjectSettingsOptions } from '../container/FolderAPIWrapper';
import { resolveErrorMessage } from '../../util/messaging';
import { Alert } from '../base/Alert';
import { Container } from '../base/models/Container';

import { useAdminAppContext } from '../administration/useAdminAppContext';
import { getFolderDataTypeExclusions } from '../entities/actions';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { DeleteProjectModal } from './DeleteProjectModal';
import { ProjectDataTypeSelections } from './ProjectDataTypeSelections';
import { ProjectNameSetting } from './ProjectNameSetting';
import {BarTenderSettingsForm} from "../labels/BarTenderSettingsForm";
import {NameIdSettings} from "../settings/NameIdSettings";
import {biologicsIsPrimaryApp, isProtectedDataEnabled} from "../../app/utils";
import {ProtectedDataSettingsPanel} from "../administration/ProtectedDataSettingsPanel";

export interface ProjectSettingsProps {
    onChange: (dirty?: boolean) => void;
    onPageError: (e: string) => void;
    onSuccess: (dirty?: boolean, reload?: boolean, isDelete?: boolean) => void;
    project?: Container;
}

export const ProjectSettings: FC<ProjectSettingsProps> = memo(props => {
    const { onChange, onSuccess, onPageError, project } = props;

    const [loaded, setLoaded] = useState<boolean>(false);
    const [disabledTypesMap, setDisabledTypesMap] = useState<{ [key: string]: number[] }>(undefined);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [nameDirty, setNameDirty] = useState<boolean>(false);
    const [dataTypeDirty, setDataTypeDirty] = useState<boolean>(false);
    const [storageDirty, setStorageDirty] = useState<boolean>(false);
    const [barDirty, setBarDirty] = useState<boolean>(false);
    const [nameIdDirty, setNameIdDirty] = useState<boolean>(false);
    const [error, setError] = useState<string>();
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const { api } = useAppContext();
    const { projectDataTypes, ProjectFreezerSelectionComponent } = useAdminAppContext();
    const { container, user, moduleContext } = useServerContext();
    const dispatch = useServerContextDispatch();

    useEffect(() => {
        (async () => {
            setLoaded(false);
            setError(undefined);

            try {
                const disabledTypesMap_ = await getFolderDataTypeExclusions(project.path);
                setDisabledTypesMap(disabledTypesMap_);
            } catch (e) {
                setError(`Error: ${resolveErrorMessage(e)}`);
            } finally {
                setLoaded(true);
            }
        })();
    }, [project]);

    const onNameChange_ = useCallback(() => {
        setNameDirty(true);
        onChange(true);
    }, [onChange]);

    const onDataTypeChange_ = useCallback(() => {
        setDataTypeDirty(true);
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

    const onBarSuccess_ = useCallback(
        () => {
            setBarDirty(false);
            onSuccess(nameDirty || dataTypeDirty || storageDirty || nameIdDirty, false);
        },
        [nameDirty, dataTypeDirty, storageDirty, nameIdDirty]
    );

    const onNameIdChange_ = useCallback((dirty) => {
        setNameIdDirty(dirty);
        if (dirty)
            onChange(true);
        else
            onSuccess(nameDirty || dataTypeDirty || storageDirty || barDirty, false);
    }, [onChange, nameDirty, dataTypeDirty, storageDirty, barDirty]);

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
                onSuccess(dataTypeDirty || storageDirty || barDirty || nameIdDirty);
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
        [api.folder, container, dispatch, project, isSaving, onSuccess, dataTypeDirty, storageDirty, barDirty, nameIdDirty]
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
        onSuccess(false);
        setShowModal(false);
    }, [onSuccess]);

    const onDataTypeSuccess = useCallback(
        (reload?: boolean) => {
            setDataTypeDirty(false);
            onSuccess(nameDirty || storageDirty || barDirty || nameIdDirty, reload);
        },
        [nameDirty, storageDirty, barDirty, nameIdDirty]
    );

    const onStorageSuccess = useCallback(
        (reload?: boolean) => {
            setStorageDirty(false);
            onSuccess(nameDirty || dataTypeDirty || barDirty || nameIdDirty, reload);
        },
        [nameDirty, dataTypeDirty, barDirty, nameIdDirty]
    );

    if (!project || project.isProject || !user.isAdmin) {
        return null;
    }

    return (
        <div className="merged-panels-container">
            <div className="project-settings panel panel-default">
                <div className="panel-heading">Settings</div>
                <div className="panel-body">
                    {!!error && <Alert>{error}</Alert>}

                    <form className="project-settings-form form-horizontal" onSubmit={onSubmitName}>
                        <ProjectNameSetting
                            defaultName={project.name}
                            defaultTitle={project.title}
                            onChange={onNameChange_}
                        />

                        <div className="pull-right">
                            <Button
                                className="btn btn-default delete-project-button"
                                type="button"
                                onClick={openModalHandler}
                            >
                                <i className="fa fa-trash" /> Delete Project
                            </Button>

                            <button className="btn btn-success" disabled={isSaving || !nameDirty} type="submit">
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
            {!loaded && <LoadingSpinner />}
            {loaded && (
                <>
                    <ProjectDataTypeSelections
                        entityDataTypes={projectDataTypes}
                        project={project}
                        key={project?.id}
                        updateDataTypeExclusions={onDataTypeChange_}
                        disabledTypesMap={disabledTypesMap}
                        api={api.folder}
                        onSuccess={onDataTypeSuccess}
                    />
                    {!!ProjectFreezerSelectionComponent && (
                        <ProjectFreezerSelectionComponent
                            project={project}
                            updateDataTypeExclusions={onStorageChange_}
                            disabledTypesMap={disabledTypesMap}
                            onSuccess={onStorageSuccess}
                        />
                    )}
                    {biologicsIsPrimaryApp(moduleContext) &&
                        <BarTenderSettingsForm
                            onChange={onBarChange_}
                            onSuccess={onBarSuccess_}
                            container={project}
                            setIsDirty={null} // used by templates, not needed here
                            getIsDirty={null}
                        />
                    }
                    <NameIdSettings {...props} container={project} isAppHome={false} setIsDirty={onNameIdChange_} getIsDirty={null}/>
                    {biologicsIsPrimaryApp(moduleContext) && isProtectedDataEnabled(moduleContext) &&
                        <ProtectedDataSettingsPanel containerPath={project.path}/>
                    }
                </>
            )}
        </div>
    );
});
