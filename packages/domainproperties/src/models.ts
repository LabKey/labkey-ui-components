/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import {List, Record, fromJS} from "immutable";

interface IPropDescType{
    name: string,
    display?: string,
    rangeURI?: string,
    conceptURI?: string
}

export class PropDescType extends Record({
    name: '',
    display: '',
    rangeURI: '',
    conceptURI: ''
}) implements IPropDescType {
    name: string;
    display: string;
    rangeURI: string;
    conceptURI: string;

    constructor(values?: {[key:string]: any}) {
        super(values);
    }
}

export interface IDomainFormInput {
    domain: DomainDesign
    onChange?: (evt: any) => any
    onSubmit?: () => any
}

export class DomainFormInput extends Record({
    domain: undefined,
    onChange: undefined,
    onSubmit: undefined,
}) implements IDomainFormInput {
    domain: undefined;
    onChange: undefined;
    onSubmit: undefined;

    constructor(values?: {[key:string]: any}) {
        super(values);
    }
}

interface IDomainDesign {
    name: string
    description?: string
    domainURI: string
    domainId: number
    fields?: List<DomainField>
    indices?: List<DomainIndex>
}

export class DomainDesign extends Record({
    name: undefined,
    description: undefined,
    domainURI: undefined,
    domainId: null,
    fields: List<DomainField>(),
    indices: List<DomainIndex>()
}) implements IDomainDesign {
    name: string;
    description: string;
    domainURI: string;
    domainId: number;
    fields: List<DomainField>;
    indices: List<DomainIndex>;

    static create(rawModel): DomainDesign {
        let fields = List<DomainField>();
        let indices = List<DomainIndex>();

        if (rawModel) {
            if (rawModel.fields) {
                fields = DomainField.fromJS(rawModel.fields);
            }

            if (rawModel.indices) {
                indices = DomainIndex.fromJS(rawModel.indices);
            }
        }

        return new DomainDesign({
            ...rawModel,
            fields,
            indices
        })
    }

    constructor(values?: {[key:string]: any}) {
        super(values);
    }
}

interface IDomainIndex {
    columns: Array<string> | List<string>
    type: 'primary' | 'unique'
}

class DomainIndex extends Record({
    columns: List<string>(),
    type: undefined
}) implements IDomainIndex {
    columns: List<string>;
    type: 'primary' | 'unique';

    static fromJS(rawIndices: Array<IDomainIndex>): List<DomainIndex> {
        let indices = List<DomainIndex>().asMutable();

        for (let i=0; i < rawIndices.length; i++) {
            indices.push(new DomainIndex(fromJS(rawIndices[i])));
        }

        return indices.asImmutable();
    }

    constructor(values?: {[key:string]: any}) {
        super(values);
    }
}

interface IDomainField {
    name: string
    rangeURI: string
    propertyId: number
    propertyURI: string
    description?: string
    label?: string
    conceptURI?: string
    required?: boolean
    lookupContainer?: string
    lookupSchema?: string
    lookupQuery?: string
    scale?: number
    hidden?: boolean
    userEditable?: boolean
    shownInInsertView?: boolean
    shownInUpdateView?: boolean

    updatedField?: boolean
    newField?: boolean
    renderUpdate?: boolean
}

export class DomainField extends Record({
    propertyId: undefined,
    propertyURI: undefined,
    name: undefined,
    description: undefined,
    label: undefined,
    rangeURI: undefined,
    conceptURI: undefined,
    required: false,
    lookupContainer: undefined,
    lookupSchema: undefined,
    lookupQuery: undefined,
    scale: undefined,

    updatedField: undefined,
    newField: undefined,
    renderUpdate: undefined
}) implements IDomainField {
    propertyId: number;
    propertyURI: string;
    name: string;
    description: string;
    label: string;
    rangeURI: string;
    conceptURI: string;
    required: boolean;
    lookupContainer: string;
    lookupSchema: string;
    lookupQuery: string;
    scale: number;

    updatedField: boolean;
    newField: boolean;
    renderUpdate: boolean;

    static fromJS(rawFields: Array<IDomainField>): List<DomainField> {
        let fields = List<DomainField>().asMutable();

        for (let i=0; i < rawFields.length; i++) {
            fields.push(new DomainField(rawFields[i]));
        }

        return fields.asImmutable();
    }

    constructor(values?: {[key:string]: any}) {
        super(values);
    }
}