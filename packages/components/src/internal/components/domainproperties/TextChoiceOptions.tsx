import React, { FC, memo, useCallback, useState } from 'react';
import { Button, Col, FormGroup, Row } from 'react-bootstrap';
import classNames from 'classnames';

import { ChoicesListItem } from '../base/ChoicesListItem';

import { AddEntityButton } from '../buttons/AddEntityButton';

import { DOMAIN_VALIDATOR_TEXTCHOICE, MAX_VALID_TEXT_CHOICES } from './constants';
import { DEFAULT_TEXT_CHOICE_VALIDATOR, DomainField, ITypeDependentProps, PropertyValidator } from './models';
import { SectionHeading } from './SectionHeading';
import { DomainFieldLabel } from './DomainFieldLabel';

import { TextChoiceAddValuesModal } from './TextChoiceAddValuesModal';
import { createFormInputId } from './actions';

const HELP_TIP_BODY = (
    <p>Add a set of text choice values to be used as drop-down options to restrict data entry into this field.</p>
);

interface TextChoiceProps extends ITypeDependentProps {
    field: DomainField;
    queryName?: string;
    schemaName?: string;
}

export const TextChoiceOptions: FC<TextChoiceProps> = memo(props => {
    const { label, field, onChange, domainIndex, index } = props;
    const [validValues, setValidValues] = useState<string[]>(field.textChoiceValidator?.properties.validValues ?? []);
    const [selectedIndex, setSelectedIndex] = useState<number>();
    const [currentValue, setCurrentValue] = useState<string>();
    const [showAddValuesModal, setShowAddValuesModal] = useState<boolean>();
    const fieldId = createFormInputId(DOMAIN_VALIDATOR_TEXTCHOICE, domainIndex, index);

    const onSelect = useCallback(
        index => {
            setSelectedIndex(index);
            setCurrentValue(validValues[index]);
        },
        [validValues]
    );

    const onValueChange = useCallback(evt => {
        setCurrentValue(evt.target.value);
    }, []);

    const replaceValues = useCallback(
        (newValues?: string[]) => {
            setValidValues(newValues);
            onChange(
                fieldId,
                new PropertyValidator({
                    ...field.textChoiceValidator,
                    ...DEFAULT_TEXT_CHOICE_VALIDATOR.toJS(),
                    expression: newValues.join('|'),
                    properties: { validValues: newValues },
                })
            );
        },
        [field.textChoiceValidator, fieldId, onChange]
    );

    const updateValue = useCallback(
        (updatedValue?: string) => {
            const newValues = [...validValues];
            if (updatedValue !== undefined) {
                newValues.splice(selectedIndex, 1, updatedValue);
            } else {
                newValues.splice(selectedIndex, 1);
                onSelect(undefined); // clear selected index and value
            }
            replaceValues(newValues);
        },
        [validValues, replaceValues, selectedIndex, onSelect]
    );

    const onApply = useCallback(() => {
        updateValue(currentValue);
    }, [updateValue, currentValue]);

    const onDelete = useCallback(() => {
        updateValue(); // calling without updatedValue will remove instead of replace
    }, [updateValue]);

    const toggleAddValues = useCallback(() => {
        setShowAddValuesModal(!showAddValuesModal);
    }, [showAddValuesModal]);

    const onApplyAddValues = useCallback(
        (values: string[]) => {
            replaceValues(validValues.concat(values));
            toggleAddValues();
        },
        [replaceValues, validValues, toggleAddValues]
    );

    return (
        <div>
            <Row>
                <Col xs={12}>
                    <SectionHeading title={label} />
                </Col>
            </Row>
            <Row>
                <Col xs={12}>
                    <div className="domain-field-label">
                        <DomainFieldLabel label="Drop-down Values" helpTipBody={HELP_TIP_BODY} />
                    </div>
                </Col>
            </Row>
            <Row>
                <Col xs={6} lg={4} className={classNames({ 'domain-text-choices-left-panel': validValues.length > 0 })}>
                    <div className="list-group domain-text-choices-list">
                        {validValues.map((value, index) => {
                            return (
                                <ChoicesListItem
                                    active={index === selectedIndex}
                                    index={index}
                                    key={index}
                                    label={value}
                                    itemType={value === '' && 'Empty Value'}
                                    onSelect={onSelect}
                                />
                            );
                        })}
                    </div>
                    <AddEntityButton
                        disabled={validValues.length >= MAX_VALID_TEXT_CHOICES}
                        entity="Values"
                        onClick={toggleAddValues}
                        title={`Add Values (max ${MAX_VALID_TEXT_CHOICES})`}
                    />
                </Col>
                <Col xs={6} lg={8}>
                    {validValues.length > 0 && selectedIndex === undefined && (
                        <p className="choices-detail__empty-message">
                            Select a value from the list on the left to view details.
                        </p>
                    )}
                    {selectedIndex !== undefined && (
                        <form className="form-horizontal content-form">
                            <FormGroup>
                                <div className="col-sm-4">
                                    <DomainFieldLabel label="Value" required />
                                </div>
                                <div className="col-sm-8">
                                    <input
                                        className="form-control"
                                        // disabled={isUse}
                                        name="value"
                                        onChange={onValueChange}
                                        placeholder="Enter a text choice value"
                                        type="text"
                                        value={currentValue ?? ''}
                                    />
                                </div>
                            </FormGroup>
                            <div>
                                <Button
                                    bsStyle="default"
                                    // disabled={inUse}
                                    onClick={onDelete}
                                >
                                    <span className="fa fa-trash" />
                                    <span>&nbsp;Delete</span>
                                </Button>
                                <Button
                                    bsStyle="success"
                                    className="pull-right"
                                    disabled={currentValue === validValues[selectedIndex]}
                                    onClick={onApply}
                                >
                                    Apply
                                </Button>
                            </div>
                        </form>
                    )}
                </Col>
            </Row>
            {showAddValuesModal && (
                <TextChoiceAddValuesModal
                    title={field.name}
                    onCancel={toggleAddValues}
                    onApply={onApplyAddValues}
                    initialValueCount={validValues.length}
                />
            )}
        </div>
    );
});
