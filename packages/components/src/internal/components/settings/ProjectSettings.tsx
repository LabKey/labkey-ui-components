import React, { FC, memo, useCallback, useState } from 'react';

import { useAppContext } from '../../AppContext';
import { useServerContext } from '../base/ServerContext';
import { ProjectProperties } from '../administration/ProjectProperties';
import { ProjectSettingsOptions } from '../security/APIWrapper';
import { resolveErrorMessage } from '../../util/messaging';
import { Alert } from '../base/Alert';

interface Props {
    onChange: () => void;
    onSuccess: () => void;
}

export const ProjectSettings: FC<Props> = memo(({ onChange, onSuccess }) => {
    const [dirty, setDirty] = useState<boolean>(false);
    const [error, setError] = useState<string>();
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const { api } = useAppContext();
    const { container, user } = useServerContext();

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

            const formData = new FormData(evt.target);
            const options: ProjectSettingsOptions = {
                label: formData.get('label') as string,
                name: formData.get('name') as string,
                nameAsLabel: !!formData.get('nameAsLabel'),
            };

            try {
                await api.security.renameProject(options);
                setDirty(false);
                onSuccess();
            } catch (e) {
                setError(resolveErrorMessage(e));
            }

            setIsSaving(false);
        },
        [api, onSuccess, isSaving]
    );

    if (container.isProject || !user.isAdmin) {
        return null;
    }

    return (
        <div className="project-settings panel">
            <div className="panel-body">
                <h4 className="settings-panel-title">Project Settings</h4>

                {!!error && <Alert>{error}</Alert>}

                <form className="form-horizontal" onSubmit={onSubmit}>
                    <ProjectProperties
                        defaultLabel={container.title}
                        defaultName={container.name}
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
