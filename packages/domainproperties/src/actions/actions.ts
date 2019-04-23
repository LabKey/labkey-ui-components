/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import {Domain} from "@labkey/api";
import {List} from "immutable";
import {
    DOMAIN_FIELD_NAME,
    DOMAIN_FIELD_PREFIX,
    DOMAIN_FIELD_REQ,
    DOMAIN_FIELD_TYPE,
    PROP_DESC_TYPES
} from "../constants";
import {DomainDesign, DomainField, PropDescType} from "../models";

/**
 * @param domainId: Fetch domain by Id. Priority param over schema and query name.
 * @param schemaName: Schema of domain.
 * @param queryName: Query of domain.
 * @return Promise wrapped Domain API call.
 */
export function fetchDomain(domainId: number, schemaName: string, queryName: string): Promise<DomainDesign> {
    return new Promise((resolve, reject) => {
        Domain.get({
            domainId,
            schemaName,
            queryName,
            success: (data) => {
                resolve(DomainDesign.create(data));
            },
            failure: (error) => {
                reject(error);
            }
        })
    });
}

/**
 * @param domain: DomainDesign to save
 * @return Promise wrapped Domain API call.
 */
export function saveDomain(domain: DomainDesign) : Promise<boolean> {
    return new Promise((resolve, reject) => {
        Domain.save({
            domainDesign: domain,
            domainId: domain.domainId,
            success: (data) => {
                resolve(data.success);
            },
            failure: (error) => {
                reject(error);
            }
        })
    })
}

export function createId(prefix: string, name: string, index: any) {
    return prefix + '-' + name + '-' + index;
}

function getNameFromId(id: string) : string {
    const parts = id.split('-');
    if (parts.length === 3) {
        return parts[1];
    }
    else {
        return null;
    }
}

function getIndexFromId(id: string): string {
    const parts = id.split('-');
    if (parts.length === 3) {
        return parts[2];
    }
    else {
        return null;
    }
}

/**
 *
 * @param domain: DomainDesign to update
 * @param fieldId: Field Id to update
 * @param value: New value
 * @return copy of domain with updated field
 */
export function updateDomainField(domain: DomainDesign, fieldId: string, value: any): DomainDesign {
    const type = getNameFromId(fieldId);
    const index = getIndexFromId(fieldId);

    const newFields = domain.fields.map((field, i) => {

        if (i.toString() === index) {
            let newField = field.set('updatedField', true); // Set for field details in DomainRow
            newField = newField.set('renderUpdate', true); // Set for render optimization in DomainRow

            switch (type) {
                case DOMAIN_FIELD_NAME:
                    newField = newField.set('name', value);
                    break;
                case DOMAIN_FIELD_TYPE:
                    PROP_DESC_TYPES.map((type) => {
                        if (type.name === value) {
                            newField = newField.set('rangeURI', type.rangeURI);
                            newField = newField.set('conceptURI', type.conceptURI);
                        }
                    });
                    break;
                case DOMAIN_FIELD_REQ:
                    newField = newField.set('required', value);
                    break;
            }

            return newField;
        }

        return field;
    });

    return domain.merge({
        fields: List<DomainField>(newFields)
    }) as DomainDesign;
}

/**
 * @param domain: DomainDesign to clear
 * @return copy of domain with details cleared
 */
export function clearFieldDetails(domain: DomainDesign): DomainDesign {

    const newFields = domain.fields.map((field) => {
        let newField = field.set('updatedField', false);
        newField = newField.set('newField', false);
        return newField;
    });

    return domain.merge({
        fields: List<DomainField>(newFields)
    }) as DomainDesign;
}

/**
 * Gets display datatype from rangeURI, conceptURI and lookup values
 */
export function getDataType(): PropDescType {
    const types = PROP_DESC_TYPES.filter((value) => {

        // handle matching rangeURI and conceptURI
        if (value.rangeURI === this.props.field.rangeURI)
        {
            if (!this.props.field.lookupQuery &&
                ((!value.conceptURI && !this.props.field.conceptURI) || (value.conceptURI === this.props.field.conceptURI)))
            {
                return true;
            }
        }
        // handle selected lookup option
        else if (value.name === 'lookup' && this.props.field.lookupQuery && this.props.field.lookupQuery !== 'users')
        {
            return true;
        }
        // handle selected users option
        else if (value.name === 'users' && this.props.field.lookupQuery && this.props.field.lookupQuery === 'users')
        {
            return true;
        }

        return false;
    });

    // If found return name
    if (types.size > 0)
    {
        return types.get(0);
    }

    // default to the text type
    return PROP_DESC_TYPES.get(0);
}
