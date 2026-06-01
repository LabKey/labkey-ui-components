/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { ReactNode } from 'react';

import { List } from 'immutable';

import { OntologyLookupOptions } from '../ontology/OntologyLookupOptions';

import { DomainField, GetDomainFields, IDomainFormDisplayOptions, IFieldChange } from './models';
import { NameAndLinkingOptions } from './NameAndLinkingOptions';
import { TextFieldOptions } from './TextFieldOptions';
import { BooleanFieldOptions } from './BooleanFieldOptions';
import { NumericFieldOptions } from './NumericFieldOptions';
import { DateTimeFieldOptions } from './DateTimeFieldOptions';
import { LookupFieldOptions } from './LookupFieldOptions';
import { ConditionalFormattingAndValidation } from './ConditionalFormattingAndValidation';
import { isFieldFullyLocked } from './propertiesUtil';
import { SampleFieldOptions } from './SampleFieldOptions';
import { DerivationDataScopeFieldOptions } from './DerivationDataScopeFieldOptions';
import { TextChoiceOptions } from './TextChoiceOptions';
import { FileAttachmentOptions } from './FileAttachmentOptions';
import { CalculatedFieldOptions } from './CalculatedFieldOptions';
import { CALCULATED_TYPE } from './PropDescType';
import { FieldFilterCriteria } from './FieldFilterCriteria';

interface Props {
    allowMultiChoiceField: boolean;
    appPropertiesOnly?: boolean;
    domainContainerPath?: string;
    domainFormDisplayOptions?: IDomainFormDisplayOptions;
    domainIndex: number;
    field: DomainField;
    getDomainFields?: GetDomainFields;
    handleDataTypeChange: (targetId: string, value: any) => void;
    index: number;
    onChange: (fieldId: string, value: any, index?: number, expand?: boolean, skipDirtyCheck?: boolean) => void;
    onMultiChange: (changes: List<IFieldChange>) => void;
    queryName?: string;
    schemaName?: string;
    showingModal: (boolean) => void;
}

export class DomainRowExpandedOptions extends React.Component<Props> {
    typeDependentOptions = (): ReactNode => {
        const {
            field,
            index,
            onChange,
            onMultiChange,
            domainIndex,
            domainFormDisplayOptions,
            getDomainFields,
            appPropertiesOnly,
            domainContainerPath,
            schemaName,
            queryName,
            handleDataTypeChange,
            allowMultiChoiceField,
        } = this.props;

        // In most cases we will use the selected data type to determine which field options to show,
        // however in the calculated field data type case, we need to use the rangeURI.
        let dataTypeName = field.dataType.name;
        if (dataTypeName === CALCULATED_TYPE.name && field?.rangeURI) {
            dataTypeName = field?.rangeURI.substring(field?.rangeURI.lastIndexOf('#') + 1);
        }

        switch (dataTypeName) {
            case 'attachment':
            case 'fileLink':
                // Remove when this is supported in apps. Issue 46476
                if (appPropertiesOnly) return null;

                return (
                    <FileAttachmentOptions
                        displayOption={field.format}
                        domainIndex={domainIndex}
                        index={index}
                        label={dataTypeName === 'fileLink' ? 'File' : 'Attachment'}
                        lockType={field.lockType}
                        onChange={onChange}
                    />
                );
            case 'boolean':
                return (
                    <BooleanFieldOptions
                        domainIndex={domainIndex}
                        format={field.format}
                        index={index}
                        label="Boolean Field Options"
                        lockType={field.lockType}
                        onChange={onChange}
                    />
                );
            case 'date':
            case 'dateTime':
            case 'time':
                return (
                    <DateTimeFieldOptions
                        domainIndex={domainIndex}
                        format={field.format}
                        index={index}
                        label="Date and Time Options"
                        lockType={field.lockType}
                        onChange={onChange}
                        type={dataTypeName}
                    />
                );
            case 'decimal':
            case 'double':
                return (
                    <NumericFieldOptions
                        defaultScale={field.defaultScale}
                        domainIndex={domainIndex}
                        format={field.format}
                        index={index}
                        label="Decimal Options"
                        lockType={field.lockType}
                        onChange={onChange}
                        // Issue #44567: Hide scannable option due to matching issues with floating point representation.
                        showScannableOption={false}
                    />
                );
            case 'int':
                return (
                    <NumericFieldOptions
                        appPropertiesOnly={appPropertiesOnly}
                        defaultScale={field.defaultScale}
                        domainIndex={domainIndex}
                        format={field.format}
                        index={index}
                        label="Integer Options"
                        lockType={field.lockType}
                        onChange={onChange}
                        scannable={field.scannable}
                        showScannableOption={
                            domainFormDisplayOptions?.showScannableOption && !field.isCalculatedField()
                        }
                    />
                );
            case 'lookup':
                return (
                    <LookupFieldOptions
                        domainIndex={domainIndex}
                        field={field}
                        index={index}
                        label="Lookup Definition Options"
                        lockType={field.lockType}
                        lookupContainer={field.lookupContainer ?? domainContainerPath}
                        onChange={onChange}
                        onMultiChange={onMultiChange}
                    />
                );
            case 'multiChoice':
            case 'textChoice':
                // don't show Text Choice options for query metadata editor
                if (domainFormDisplayOptions?.hideValidators) return null;

                return (
                    <TextChoiceOptions
                        allowMultiChoice={allowMultiChoiceField}
                        domainIndex={domainIndex}
                        field={field}
                        handleDataTypeChange={handleDataTypeChange}
                        index={index}
                        key={index + '-' + field?.propertyId} // drag-drop to reorder column result in wrong options displayed
                        label="Text Choice Options"
                        lockedForDomain={domainFormDisplayOptions.textChoiceLockedForDomain}
                        lockedSqlFragment={domainFormDisplayOptions.textChoiceLockedSqlFragment}
                        lockType={field.lockType}
                        onChange={onChange}
                        queryName={queryName}
                        schemaName={schemaName}
                    />
                );
            case 'multiLine':
                return (
                    <TextFieldOptions
                        domainIndex={domainIndex}
                        index={index}
                        label="Multi-line Text Field Options"
                        lockType={field.lockType}
                        onChange={onChange}
                        scale={field.scale}
                    />
                );
            case 'ontologyLookup':
                const domainFields = getDomainFields ? getDomainFields().domainFields : List<DomainField>();

                return (
                    <OntologyLookupOptions
                        domainContainerPath={domainContainerPath}
                        domainFields={domainFields}
                        domainIndex={domainIndex}
                        field={field}
                        index={index}
                        label="Ontology Lookup Options"
                        lockType={field.lockType}
                        onChange={onChange}
                        onMultiChange={onMultiChange}
                    />
                );
            case 'sample':
                return (
                    <SampleFieldOptions
                        container={field.lookupContainer}
                        domainIndex={domainIndex}
                        field={field}
                        index={index}
                        label="Sample Options"
                        lockType={field.lockType}
                        onChange={onChange}
                        onMultiChange={onMultiChange}
                        original={field.original}
                        value={field.lookupQueryValue}
                    />
                );
            case 'string':
                if (domainFormDisplayOptions && !domainFormDisplayOptions.hideTextOptions) {
                    // Issue 39877: Max text length options should not be visible for text key field of list
                    // Also, don't show max text length options for calculated fields
                    if (field.isPrimaryKey || field.isCalculatedField()) {
                        return;
                    }

                    return (
                        <TextFieldOptions
                            appPropertiesOnly={appPropertiesOnly}
                            domainIndex={domainIndex}
                            index={index}
                            label="Text Options"
                            lockType={field.lockType}
                            onChange={onChange}
                            scale={field.scale}
                            scannable={field.scannable}
                            showScannableOption={domainFormDisplayOptions?.showScannableOption}
                        />
                    );
                } else {
                    return null;
                }
            case 'flag':
                return (
                    <TextFieldOptions
                        domainIndex={domainIndex}
                        index={index}
                        label="Flag Options"
                        lockType={field.lockType}
                        onChange={onChange}
                        scale={field.scale}
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
            onMultiChange,
            showingModal,
            appPropertiesOnly,
            domainIndex,
            domainFormDisplayOptions,
            getDomainFields,
        } = this.props;
        const showFilterCriteria = domainFormDisplayOptions.showFilterCriteria && field.isFilterCriteriaField();

        return (
            <div className="domain-row-container">
                <div className="domain-row-container-expand-spacer" />
                <div className="domain-row-container-expanded">
                    {domainFormDisplayOptions?.derivationDataScopeConfig?.show && !field.isCalculatedField() && (
                        <div className="col-xs-12">
                            <DerivationDataScopeFieldOptions
                                config={domainFormDisplayOptions?.derivationDataScopeConfig}
                                domainIndex={domainIndex}
                                fieldDataType={field.dataType}
                                index={index}
                                isExistingField={!field.isNew()}
                                isRequiredField={field.required}
                                label={domainFormDisplayOptions?.derivationDataScopeConfig?.sectionTitle}
                                lockType={field.lockType}
                                onChange={onChange}
                                value={field.derivationDataScope}
                            />
                        </div>
                    )}
                    {field.isCalculatedField() && (
                        <div className="col-xs-12">
                            <CalculatedFieldOptions
                                domainIndex={domainIndex}
                                field={field}
                                getDomainFields={getDomainFields}
                                index={index}
                                onChange={onChange}
                            />
                        </div>
                    )}
                    <div className="col-xs-12">{this.typeDependentOptions()}</div>
                    <div className="col-xs-12">
                        <NameAndLinkingOptions
                            appPropertiesOnly={appPropertiesOnly}
                            domainFormDisplayOptions={domainFormDisplayOptions}
                            domainIndex={domainIndex}
                            field={field}
                            index={index}
                            onChange={onChange}
                            onMultiChange={onMultiChange}
                        />
                    </div>
                    {!isFieldFullyLocked(field.lockType) && (
                        <div className="col-xs-12">
                            <ConditionalFormattingAndValidation
                                domainFormDisplayOptions={domainFormDisplayOptions}
                                domainIndex={domainIndex}
                                field={field}
                                index={index}
                                onChange={onChange}
                                showingModal={showingModal}
                            />
                        </div>
                    )}
                    {showFilterCriteria && <FieldFilterCriteria field={field} />}
                </div>
            </div>
        );
    }
}
