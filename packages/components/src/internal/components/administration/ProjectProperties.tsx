import React, { FC, memo, useCallback, useState } from 'react';
import { Col, ControlLabel, FormControl, FormGroup } from 'react-bootstrap';

interface Props {
    autoFocus?: boolean;
    defaultLabel?: string;
    defaultName?: string;
    onChange?: () => void;
}

export const ProjectProperties: FC<Props> = memo(props => {
    const { autoFocus, defaultLabel, defaultName, onChange } = props;
    const [name, setName] = useState<string>(defaultName);
    const [nameIsLabel, setNameIsLabel] = useState<boolean>(defaultName ? defaultName === defaultLabel : true);
    const toggleLabel = 'Use Project Name for Project Label';

    const onNameChange = useCallback(
        evt => {
            setName(evt.target.value);
            onChange?.();
        },
        [onChange]
    );

    const onTitleChange = useCallback(() => {
        onChange?.();
    }, [onChange]);

    const toggleNameIsTitle = useCallback(() => {
        setNameIsLabel(_nameIsLabel => !_nameIsLabel);
        onChange?.();
    }, [onChange]);

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
                        onChange={onNameChange}
                        required
                        type="text"
                    />
                    <span className="help-block">
                        <label className="checkbox-inline" title={toggleLabel}>
                            <input
                                id="project-name-prop-nameIsLabel"
                                defaultChecked={nameIsLabel}
                                style={{ marginRight: '8px' }}
                                name="nameAsLabel"
                                onChange={toggleNameIsTitle}
                                type="checkbox"
                            />
                            <span className="checkbox-inline-label">{toggleLabel}</span>
                        </label>
                    </span>
                </Col>
            </FormGroup>

            <FormGroup controlId="project-name-prop-label">
                <Col componentClass={ControlLabel} xs={12} sm={2} className="text-left">
                    Project Label
                </Col>

                <Col sm={10} md={5}>
                    {nameIsLabel ? (
                        <FormControl
                            autoComplete="off"
                            disabled={nameIsLabel}
                            key="controlled"
                            name="label"
                            type="text"
                            value={nameIsLabel ? name : undefined}
                        />
                    ) : (
                        <FormControl
                            autoComplete="off"
                            defaultValue={nameIsLabel ? name : defaultLabel}
                            key="uncontrolled"
                            name="label"
                            onChange={onTitleChange}
                            type="text"
                        />
                    )}
                </Col>
            </FormGroup>
        </div>
    );
});
