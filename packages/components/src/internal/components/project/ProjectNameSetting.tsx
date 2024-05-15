import React, { FC, memo, useCallback, useState } from 'react';

import { InjectedRouteLeaveProps } from '../../util/RouteLeave';

interface Props extends InjectedRouteLeaveProps {
    autoFocus?: boolean;
    defaultName?: string;
    defaultTitle?: string;
    onNameChange?: (name?: string) => void;
    onTitleChange?: () => void;
}

const MAX_FOLDER_NAME_LENGTH = 255;

export const ProjectNameSetting: FC<Props> = memo(props => {
    const { autoFocus, defaultTitle, defaultName, onNameChange, onTitleChange, setIsDirty } = props;
    const [name, setName] = useState<string>(defaultName);
    const [nameIsTitle, setNameIsTitle] = useState<boolean>(defaultName ? defaultName === defaultTitle : true);
    const toggleLabel = 'Use Project Name for Project Label';

    const _onNameChange = useCallback(
        evt => {
            const _name = evt.target.value;
            setName(_name);
            setIsDirty(true);
            onNameChange?.(_name);
        },
        [onNameChange, setIsDirty]
    );

    const _onTitleChange = useCallback(() => {
        setIsDirty(true);
        onTitleChange?.();
    }, [onTitleChange, setIsDirty]);

    const toggleNameIsTitle = useCallback(() => {
        setNameIsTitle(_nameIsTitle => !_nameIsTitle);
        setIsDirty(true);
    }, [setIsDirty]);

    return (
        <div className="project-name-properties">
            <div className="form-group">
                <label className="control-label col-xs-12 col-sm-2 text-left" htmlFor="project-name">
                    Project Name <span className="required-symbol">*</span>
                </label>

                <div className="col-sm-10 col-md-5">
                    <input
                        autoComplete="off"
                        autoFocus={autoFocus}
                        className="form-control"
                        defaultValue={defaultName}
                        id="project-name"
                        name="name"
                        onChange={_onNameChange}
                        required
                        type="text"
                        maxLength={MAX_FOLDER_NAME_LENGTH}
                    />

                    <span className="help-block">
                        <label className="checkbox-inline" title={toggleLabel}>
                            <input
                                id="project-name-prop-nameIsTitle"
                                defaultChecked={nameIsTitle}
                                style={{ marginRight: '8px' }}
                                name="nameAsTitle"
                                onChange={toggleNameIsTitle}
                                type="checkbox"
                            />
                            <span className="checkbox-inline-label">{toggleLabel}</span>
                        </label>
                    </span>
                </div>
            </div>

            <div className="form-group">
                <label className="control-label col-xs-12 col-sm-2 text-left" htmlFor="project-label">
                    Project Label
                </label>

                <div className="col-sm-10 col-md-5">
                    {nameIsTitle && (
                        <input
                            autoComplete="off"
                            className="form-control"
                            disabled
                            key="controlled"
                            name="title"
                            type="text"
                            value={name ?? ''}
                        />
                    )}
                    {!nameIsTitle && (
                        <input
                            autoComplete="off"
                            className="form-control"
                            defaultValue={defaultTitle}
                            key="uncontrolled"
                            name="title"
                            onChange={_onTitleChange}
                            type="text"
                        />
                    )}
                </div>
            </div>
        </div>
    );
});
