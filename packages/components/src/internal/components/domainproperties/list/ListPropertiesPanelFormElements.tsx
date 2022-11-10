import classNames from 'classnames';
import React, { FC, memo, useCallback } from 'react';
import { Col, FormControl, Row } from 'react-bootstrap';

import { SectionHeading } from '../SectionHeading';
import { DomainFieldLabel } from '../DomainFieldLabel';

import { ListModel } from './models';

interface BasicPropertiesInputsProps {
    model: ListModel;
    onInputChange: (any) => void;
}

export const NameInput: FC<BasicPropertiesInputsProps> = memo(({ model, onInputChange }) => (
    <Row className="margin-top">
        <Col xs={3} lg={2}>
            <DomainFieldLabel
                label="Name"
                required={true}
                helpTipBody="The name for this list. Note that this can be changed after list creation."
            />
        </Col>

        <Col xs={9} lg={8}>
            <FormControl
                id="name"
                type="text"
                placeholder="Enter a name for this list"
                value={model.name === null ? '' : model.name}
                onChange={onInputChange}
            />
        </Col>

        <Col lg={2} />
    </Row>
));

export const DescriptionInput: FC<BasicPropertiesInputsProps> = memo(({ model, onInputChange }) => (
    <Row className="margin-top">
        <Col xs={3} lg={2}>
            <DomainFieldLabel label="Description" />
        </Col>

        <Col xs={9} lg={8}>
            <textarea
                className="form-control textarea-noresize"
                id="description"
                value={model.description === null ? '' : model.description}
                onChange={onInputChange}
            />
        </Col>

        <Col lg={2} />
    </Row>
));

export const BasicPropertiesFields: FC<BasicPropertiesInputsProps> = memo(({ model, onInputChange }) => (
    <Col xs={12} md={7}>
        <SectionHeading title="Basic Properties" />

        <NameInput model={model} onInputChange={onInputChange} />

        <DescriptionInput model={model} onInputChange={onInputChange} />
    </Col>
));

interface CheckBoxProps {
    checked: boolean;
    onClick: () => void;
}

export const CheckBox: FC<CheckBoxProps> = memo(({ checked, onClick }) => (
    <span className="list__properties__no-highlight" onClick={onClick}>
        <span
            className={classNames('fa', 'fa-lg', { 'fa-check-square': checked, 'fa-square': !checked })}
            style={{ color: checked ? '#0073BB' : '#ADADAD' }}
        />
    </span>
));

interface CheckBoxRowProps {
    checked: boolean;
    name: string;
    onCheckBoxChange: (name, checked) => void;
    text: string;
}

export const CheckBoxRow: FC<CheckBoxRowProps> = memo(({ checked, onCheckBoxChange, name, text }) => {
    const onClick = useCallback(() => onCheckBoxChange(name, checked), [checked, name, onCheckBoxChange]);
    return (
        <div className="list__properties__checkbox-row">
            <CheckBox checked={checked} onClick={onClick} />
            <span className="list__properties__checkbox-text">{text}</span>
        </div>
    );
});
CheckBoxRow.displayName = 'CheckBoxRow';

interface AllowableActionContainerProps {
    model: ListModel;
    onCheckBoxChange: (name, checked) => void;
}
const AllowableActionContainer: FC<AllowableActionContainerProps> = memo(({ model, onCheckBoxChange }) => (
    <div className="list__properties__allowable-actions">
        <CheckBoxRow text="Delete" checked={model.allowDelete} onCheckBoxChange={onCheckBoxChange} name="allowDelete" />
        <CheckBoxRow text="Upload" checked={model.allowUpload} onCheckBoxChange={onCheckBoxChange} name="allowUpload" />
        <CheckBoxRow
            text="Export & Print"
            checked={model.allowExport}
            onCheckBoxChange={onCheckBoxChange}
            name="allowExport"
        />
    </div>
));

interface AllowableActionsProps {
    model: ListModel;
    onCheckBoxChange: (name: string, checked: boolean) => void;
}
export const AllowableActions: FC<AllowableActionsProps> = memo(({ model, onCheckBoxChange }) => (
    <Col xs={12} md={3}>
        <SectionHeading title="Allow these Actions" />
        <AllowableActionContainer model={model} onCheckBoxChange={onCheckBoxChange} />
    </Col>
));
AllowableActions.displayName = 'AllowableActions';
