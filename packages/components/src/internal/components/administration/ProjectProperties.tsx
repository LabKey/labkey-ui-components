import React, { FC, memo, useCallback, useState } from 'react';
import { Col, ControlLabel, FormControl, FormGroup } from 'react-bootstrap';

interface Props {}

export const ProjectProperties: FC<Props> = memo(() => {
    const [name, setName] = useState<string>();
    const [nameIsLabel, setNameIsLabel] = useState<boolean>(true);
    const toggleLabel = 'Use Project Name for Project Label';

    const onNameChange = useCallback(evt => {
        setName(evt.target.value);
    }, []);

    const onTitleChange = useCallback(() => {}, []);

    const toggleNameIsTitle = useCallback(() => {
        setNameIsLabel(_nameIsLabel => !_nameIsLabel);
    }, []);

    return (
        <div className="project-name-properties">
            <FormGroup controlId="project-name-prop-name">
                <Col componentClass={ControlLabel} xs={12} sm={2} className="text-left" required>
                    Project Name <span className="required-symbol">*</span>
                </Col>

                <Col sm={10} md={5}>
                    <FormControl
                        autoComplete="off"
                        autoFocus
                        type="text"
                        name="name"
                        onChange={onNameChange}
                        required
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
                    <FormControl
                        autoComplete="off"
                        defaultValue={nameIsLabel ? name : undefined}
                        disabled={nameIsLabel}
                        type="text"
                        name="label"
                        onChange={onTitleChange}
                    />
                </Col>
            </FormGroup>
        </div>
    );
});
