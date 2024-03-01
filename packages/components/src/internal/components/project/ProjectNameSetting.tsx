import React, { FC, memo, useCallback, useState } from 'react';
import { Col, ControlLabel, FormControl, FormGroup } from 'react-bootstrap';
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
            <FormGroup controlId="project-name-prop-name">
                <Col componentClass={ControlLabel} xs={12} sm={2} className="text-left" required>
                    Project Name <span className="required-symbol">*</span>
                </Col>

                <Col sm={10} md={5}>
                    <FormControl
                        autoComplete="off"
                        autoFocus={autoFocus}
                        defaultValue={defaultName}
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
                </Col>
            </FormGroup>

            <FormGroup controlId="project-name-prop-title">
                <Col componentClass={ControlLabel} xs={12} sm={2} className="text-left">
                    Project Label
                </Col>

                <Col sm={10} md={5}>
                    {nameIsTitle ? (
                        <FormControl
                            autoComplete="off"
                            disabled={nameIsTitle}
                            key="controlled"
                            name="title"
                            type="text"
                            value={nameIsTitle ? name : undefined}
                        />
                    ) : (
                        <FormControl
                            autoComplete="off"
                            defaultValue={nameIsTitle ? name : defaultTitle}
                            key="uncontrolled"
                            name="title"
                            onChange={_onTitleChange}
                            type="text"
                        />
                    )}
                </Col>
            </FormGroup>
        </div>
    );
});
