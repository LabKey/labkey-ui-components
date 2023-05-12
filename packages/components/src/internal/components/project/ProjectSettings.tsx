import React, { FC, memo, useCallback, useState } from 'react';

import { Button } from 'react-bootstrap';

import { useAppContext} from '../../AppContext';
import { useServerContext, useServerContextDispatch } from '../base/ServerContext';
import { ProjectProperties } from '../project/ProjectProperties';
import { ProjectSettingsOptions } from '../container/FolderAPIWrapper';
import { resolveErrorMessage } from '../../util/messaging';
import { Alert } from '../base/Alert';
import { Container } from '../base/models/Container';

import { DeleteProjectModal } from './DeleteProjectModal';
import { useAdminAppContext } from "../administration/useAdminAppContext";

export interface ProjectSettingsProps {
    onChange: () => void;
    onPageError: (e: string) => void;
    onSuccess: () => void;
}
//
export const ProjectSettings: FC<ProjectSettingsProps> = memo(({ onChange, onSuccess, onPageError }) => {
    const [showModal, setShowModal] = useState<boolean>(false);
    const [dirty, setDirty] = useState<boolean>(false);
    const [error, setError] = useState<string>();
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const { api } = useAppContext();
    const {
        ProjectFreezerSelectionComponent,
    } = useAdminAppContext();
    const { container, user } = useServerContext();
    const dispatch = useServerContextDispatch();

    const onChange_ = useCallback(() => {
        setDirty(true);
        onChange();
    }, [onChange]);

    const onSubmit = useCallback(
        async evt => {
            evt.preventDefault();
            evt.stopPropagation();
            if (isSaving) return;
            setIsSaving(true);

            let project: Container;
            try {
                const formData = new FormData(evt.target);
                const options: ProjectSettingsOptions = {
                    name: formData.get('name') as string,
                    nameAsTitle: !!formData.get('nameAsTitle'),
                    title: formData.get('title') as string,
                };

                project = await api.folder.renameProject(options);
                setDirty(false);
                onSuccess();
            } catch (e) {
                setError(resolveErrorMessage(e) ?? 'Failed to update project settings');
            } finally {
                setIsSaving(false);
            }

            // If this change has been made to the current folder then dispatch a
            // context update of the container's name and title.
            if (project?.id === container.id) {
                dispatch({
                    container: new Container({
                        ...container,
                        name: project.name,
                        title: project.title,
                    }),
                });
            }
        },
        [api.folder, container, dispatch, isSaving, onSuccess]
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

    if (container.isProject || !user.isAdmin) {
        return null;
    }

    return (
        <div className="project-settings panel panel-default">
            <div className="panel-heading">Project Settings</div>
            <div className="panel-body">
                {!!error && <Alert>{error}</Alert>}

                <form className="project-settings-form form-horizontal" onSubmit={onSubmit}>
                    <ProjectProperties
                        defaultName={container.name}
                        defaultTitle={container.title}
                        onChange={onChange_}
                    />

                    <div className="pull-right">
                        <Button
                            className="btn btn-default delete-project-button"
                            type="button"
                            onClick={openModalHandler}
                        >
                            <i className="fa fa-trash" /> Delete
                        </Button>

                        <button className="btn btn-success" disabled={isSaving || !dirty} type="submit">
                            {isSaving ? 'Saving' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>

            {showModal && (
                <DeleteProjectModal projectName={container.name} onCancel={closeModalHandler} onError={onDeleteError} />
            )}
        </div>
    );
});