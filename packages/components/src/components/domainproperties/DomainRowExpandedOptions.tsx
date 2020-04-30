/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';

import { List } from 'immutable';

import { Col } from 'react-bootstrap';

import { DomainField, IDomainFormDisplayOptions, IFieldChange } from './models';
import { NameAndLinkingOptions } from './NameAndLinkingOptions';
import { TextFieldOptions } from './TextFieldOptions';
import { BooleanFieldOptions } from './BooleanFieldOptions';
import { NumericFieldOptions } from './NumericFieldOptions';
import { DateTimeFieldOptions } from './DateTimeFieldOptions';
import { LookupFieldOptions } from './LookupFieldOptions';
import { ConditionalFormattingAndValidation } from './ConditionalFormattingAndValidation';
import { isFieldFullyLocked } from './propertiesUtil';
import { SampleFieldOptions } from './SampleFieldOptions';

interface IDomainRowExpandedOptionsProps {
    field: DomainField;
    index: number;
    onChange: (fieldId: string, value: any, index?: number, expand?: boolean) => any;
    onMultiChange: (changes: List<IFieldChange>) => void;
    showingModal: (boolean) => any;
    appPropertiesOnly?: boolean;
    domainIndex: number;
    successBsStyle?: string;
    domainFormDisplayOptions?: IDomainFormDisplayOptions;
}

export class DomainRowExpandedOptions extends React.Component<IDomainRowExpandedOptionsProps, any> {
    typeDependentOptions = () => {
        const { field, index, onChange, onMultiChange, domainIndex, domainFormDisplayOptions } = this.props;

        switch (field.dataType.name) {
            case 'string':
                if (domainFormDisplayOptions && domainFormDisplayOptions.showTextOptions) {
                    if (field.isPrimaryKey)
                        // Issue39877: Max text length options should not be visible for text key field of list
                        return;
                    return (
                        <TextFieldOptions
                            index={index}
                            domainIndex={domainIndex}
                            label="Text Options"
                            scale={field.scale}
                            onChange={onChange}
                            lockType={field.lockType}
                        />
                    );
                } else {
                    return null;
                }
            case 'flag':
                return (
                    <TextFieldOptions
                        index={index}
                        domainIndex={domainIndex}
                        label="Flag Options"
                        scale={field.scale}
                        onChange={onChange}
                        lockType={field.lockType}
                    />
                );
            case 'multiLine':
                return (
                    <TextFieldOptions
                        index={index}
                        domainIndex={domainIndex}
                        label="Multi-line Text Field Options"
                        scale={field.scale}
                        onChange={onChange}
                        lockType={field.lockType}
                    />
                );
            case 'boolean':
                return (
                    <BooleanFieldOptions
                        index={index}
                        domainIndex={domainIndex}
                        label="Boolean Field Options"
                        format={field.format}
                        onChange={onChange}
                        lockType={field.lockType}
                    />
                );
            case 'dateTime':
                return (
                    <DateTimeFieldOptions
                        index={index}
                        domainIndex={domainIndex}
                        label="Date and Time Options"
                        format={field.format}
                        excludeFromShifting={field.excludeFromShifting}
                        onChange={onChange}
                        lockType={field.lockType}
                    />
                );
            case 'int':
                return (
                    <NumericFieldOptions
                        index={index}
                        domainIndex={domainIndex}
                        label="Integer Options"
                        format={field.format}
                        defaultScale={field.defaultScale}
                        onChange={onChange}
                        lockType={field.lockType}
                    />
                );
            case 'double':
                return (
                    <NumericFieldOptions
                        index={index}
                        domainIndex={domainIndex}
                        label="Decimal Options"
                        format={field.format}
                        defaultScale={field.defaultScale}
                        onChange={onChange}
                        lockType={field.lockType}
                    />
                );
            case 'lookup':
                return (
                    <LookupFieldOptions
                        index={index}
                        domainIndex={domainIndex}
                        label="Lookup Definition Options"
                        lookupContainer={field.lookupContainer}
                        lookupSchema={field.lookupSchema}
                        lookupQueryValue={field.lookupQueryValue}
                        lookupValidator={field.lookupValidator}
                        original={field.original}
                        onChange={onChange}
                        onMultiChange={onMultiChange}
                        lockType={field.lockType}
                    />
                );
            case 'sample':
                return (
                    <SampleFieldOptions
                        index={index}
                        domainIndex={domainIndex}
                        label="Sample Options"
                        value={field.lookupQueryValue}
                        original={field.original}
                        container={field.lookupContainer}
                        onChange={onChange}
                        lockType={field.lockType}
                    />
                );
        }

        return null;
    };

    render() {
        const {
            field,
            index,
            onChange,
            showingModal,
            appPropertiesOnly,
            domainIndex,
            successBsStyle,
            domainFormDisplayOptions,
        } = this.props;

        return (
            <div className="domain-row-container">
                <div className="domain-row-handle" />
                <div className="domain-row-container-expanded">
                    <Col xs={12}>{this.typeDependentOptions()}</Col>
                    <Col xs={12} lg={10}>
                        <NameAndLinkingOptions
                            index={index}
                            domainIndex={domainIndex}
                            field={field}
                            onChange={onChange}
                        />
                    </Col>
                    {!isFieldFullyLocked(field.lockType) && (
                        <Col xs={12}>
                            <ConditionalFormattingAndValidation
                                index={index}
                                domainIndex={domainIndex}
                                field={field}
                                onChange={onChange}
                                showingModal={showingModal}
                                hideConditionalFormatting={appPropertiesOnly}
                                successBsStyle={successBsStyle}
                                domainFormDisplayOptions={domainFormDisplayOptions}
                            />
                        </Col>
                    )}
                </div>
            </div>
        );
    }
}
