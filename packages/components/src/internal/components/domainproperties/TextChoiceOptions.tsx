import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { Button, Col, Row } from 'react-bootstrap';
import classNames from 'classnames';
import { Query } from '@labkey/api';

import { ChoicesListItem } from '../base/ChoicesListItem';

import { AddEntityButton } from '../buttons/AddEntityButton';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { LockIcon } from '../base/LockIcon';

import { DOMAIN_VALIDATOR_TEXTCHOICE, MAX_VALID_TEXT_CHOICES } from './constants';
import {
    DEFAULT_TEXT_CHOICE_VALIDATOR,
    DomainField,
    getValidValuesFromArray,
    ITypeDependentProps,
    PropertyValidator,
} from './models';
import { SectionHeading } from './SectionHeading';
import { DomainFieldLabel } from './DomainFieldLabel';

import { TextChoiceAddValuesModal } from './TextChoiceAddValuesModal';
import { createFormInputId } from './actions';

const HELP_TIP_BODY = (
    <p>Add a set of text choice values to be used as drop-down options to restrict data entry into this field.</p>
);

const VALUE_IN_USE = (
    <LockIcon
        iconCls="pull-right choices-list__locked"
        body={<p>This text choice value cannot be changed or deleted because it is in use.</p>}
        id="text-choice-value-lock-icon"
        title="Text Choice In Use"
    />
);

interface Props extends ITypeDependentProps {
    field: DomainField;
    queryName?: string;
    schemaName?: string;
}

interface ImplProps extends Props {
    fieldValues: string[];
    loading: boolean;
    replaceValues: (newValues: string[]) => void;
    validValues: string[];
    maxValueCount?: number;
}

// exported for jest testing
export const TextChoiceOptionsImpl: FC<ImplProps> = memo(props => {
    const {
        label,
        field,
        loading,
        fieldValues,
        validValues,
        replaceValues,
        maxValueCount = MAX_VALID_TEXT_CHOICES,
    } = props;
    const [selectedIndex, setSelectedIndex] = useState<number>();
    const [currentValue, setCurrentValue] = useState<string>();
    const [showAddValuesModal, setShowAddValuesModal] = useState<boolean>();
    const currentInUse = fieldValues.indexOf(currentValue) > -1;

    const onSelect = useCallback(
        ind => {
            setSelectedIndex(ind);
            setCurrentValue(validValues?.[ind]);
        },
        [validValues]
    );

    const onValueChange = useCallback(evt => {
        setCurrentValue(evt.target.value);
    }, []);

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
        const val = currentValue.trim();
        updateValue(val);
        setCurrentValue(val);
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
            {loading && (
                <Row>
                    <Col xs={12}>
                        <LoadingSpinner />
                    </Col>
                </Row>
            )}
            {!loading && (
                <Row>
                    <Col
                        xs={6}
                        lg={4}
                        className={classNames({ 'domain-text-choices-left-panel': validValues.length > 0 })}
                    >
                        <div className="list-group domain-text-choices-list">
                            {validValues.map((value, ind) => {
                                const inUse = fieldValues.indexOf(value) > -1;
                                return (
                                    <ChoicesListItem
                                        active={ind === selectedIndex}
                                        index={ind}
                                        key={ind}
                                        label={value}
                                        subLabel={value === '' ? 'Empty Value' : undefined}
                                        onSelect={onSelect}
                                        componentRight={inUse && VALUE_IN_USE}
                                    />
                                );
                            })}
                        </div>
                        <AddEntityButton
                            disabled={validValues.length >= maxValueCount}
                            entity="Values"
                            onClick={toggleAddValues}
                            title={`Add Values (max ${maxValueCount})`}
                        />
                    </Col>
                    <Col xs={6} lg={4}>
                        {validValues.length > 0 && selectedIndex === undefined && (
                            <p className="choices-detail__empty-message">
                                Select a value from the list on the left to view details.
                            </p>
                        )}
                        {selectedIndex !== undefined && (
                            <>
                                <div className="domain-field-label">
                                    <DomainFieldLabel label="Value" required />
                                </div>
                                <div className="domain-field-padding-bottom">
                                    <input
                                        className="form-control full-width"
                                        disabled={currentInUse}
                                        name="value"
                                        onChange={onValueChange}
                                        placeholder="Enter a text choice value"
                                        type="text"
                                        value={currentValue ?? ''}
                                    />
                                </div>
                                <div>
                                    <Button bsStyle="default" disabled={currentInUse} onClick={onDelete}>
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
                            </>
                        )}
                    </Col>
                </Row>
            )}
            {showAddValuesModal && (
                <TextChoiceAddValuesModal
                    fieldName={field.name}
                    onCancel={toggleAddValues}
                    onApply={onApplyAddValues}
                    initialValueCount={validValues.length}
                />
            )}
        </div>
    );
});

export const TextChoiceOptions: FC<Props> = memo(props => {
    const { field, onChange, domainIndex, index, schemaName, queryName } = props;
    const [loading, setLoading] = useState<boolean>(true);
    const [fieldValues, setFieldValues] = useState<string[]>([]);
    const [validValues, setValidValues] = useState<string[]>(field.textChoiceValidator?.properties.validValues ?? []);
    const fieldId = createFormInputId(DOMAIN_VALIDATOR_TEXTCHOICE, domainIndex, index);

    const replaceValues = useCallback(
        (newValues: string[]) => {
            setValidValues(newValues);
            onChange(
                fieldId,
                new PropertyValidator({
                    // keep the existing validator Id/props, if present, and override the expression / properties
                    ...field.textChoiceValidator,
                    ...DEFAULT_TEXT_CHOICE_VALIDATOR.toJS(),
                    shouldShowWarning: true,
                    expression: newValues.join('|'),
                    properties: { validValues: newValues },
                })
            );
        },
        [field.textChoiceValidator, fieldId, onChange]
    );

    useEffect(
        () => {
            // for an existing field, we query for the distinct set of values in the Text column to be used for
            // the initial set of values and/or setting fields as locked (i.e. in use)
            if (!field.isNew() && schemaName && queryName) {
                const fieldName = field.original?.name ?? field.name;
                Query.selectDistinctRows({
                    containerFilter: Query.ContainerFilter.allFolders, // to account for a shared domain at project or /Shared
                    schemaName,
                    queryName,
                    column: fieldName,
                    sort: fieldName,
                    success: result => {
                        const values = getValidValuesFromArray(result.values);
                        setFieldValues(values);

                        // if this is new text choice validator (i.e. does not have a rowId) for an existing field
                        // that is being changed to data type = Text Choice (that "is new field" check is above),
                        // then we will use the existing distinct values for that field as the initial options
                        if (!field.textChoiceValidator?.rowId) {
                            replaceValues(values);
                        }

                        setLoading(false);
                    },
                    failure: error => {
                        console.error('Error fetching distinct values for the text field: ', error);
                        setLoading(false);
                    },
                });
            } else {
                setLoading(false);
            }
        }, [/* none, only call once on mount*/]
    );

    return (
        <TextChoiceOptionsImpl
            {...props}
            fieldValues={fieldValues}
            loading={loading}
            replaceValues={replaceValues}
            validValues={validValues}
        />
    );
});
