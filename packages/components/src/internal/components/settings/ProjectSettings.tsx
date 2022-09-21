import React, { FC, memo, useCallback, useState } from 'react';

import { useAppContext } from '../../AppContext';
import { useServerContext, useServerContextDispatch } from '../base/ServerContext';
import { ProjectProperties } from '../administration/ProjectProperties';
import { ProjectSettingsOptions } from '../container/FolderAPIWrapper';
import { resolveErrorMessage } from '../../util/messaging';
import { Alert } from '../base/Alert';
import { Container } from '../base/models/Container';

export interface ProjectSettingsProps {
    onChange: () => void;
    onSuccess: () => void;
}

export const ProjectSettings: FC<ProjectSettingsProps> = memo(({ onChange, onSuccess }) => {
    const [dirty, setDirty] = useState<boolean>(false);
    const [error, setError] = useState<string>();
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const { api } = useAppContext();
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
                    container: container.merge({
                        name: project.name,
                        title: project.title,
                    }) as Container,
                });
            }
        },
        [api, container, dispatch, isSaving, onSuccess]
    );

    if (container.isProject || !user.isAdmin) {
        return null;
    }

    return (
        <div className="project-settings panel">
            <div className="panel-body">
                <h4 className="settings-panel-title">Project Settings</h4>

                {!!error && <Alert>{error}</Alert>}

                <form className="project-settings-form form-horizontal" onSubmit={onSubmit}>
                    <ProjectProperties
                        defaultName={container.name}
                        defaultTitle={container.title}
                        onChange={onChange_}
                    />

                    <div className="pull-right">
                        <button className="btn btn-success" disabled={!dirty} type="submit">
                            {isSaving ? 'Saving' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
});
