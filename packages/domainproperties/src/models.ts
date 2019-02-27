/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import {List, Record, fromJS} from "immutable";
import {QueryColumn, SchemaQuery} from "@glass/models";

interface IDomainDesign {
    name: string
    description?: string
    domainURI: string
    fields?: List<DomainField>
    indices?: List<DomainIndex>
}

export class DomainDesign extends Record({
    name: '',
    description: '',
    domainURI: undefined,
    fields: List<DomainField>(),
    indices: List<DomainIndex>()
}) implements IDomainDesign {
    name: string;
    description: string;
    domainURI: string;
    fields: List<DomainField>;
    indices: List<DomainIndex>;

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
}

class DomainField extends Record({
    name: undefined,
    description: undefined,
    label: undefined,
    rangeURI: undefined,
    conceptURI: undefined,
    required: false,
    lookupContainer: undefined,
    lookupSchema: undefined,
    lookupQuery: undefined,
    scale: undefined
}) implements IDomainField {
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