/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import {Domain} from "@labkey/api";
import {List} from "immutable";
import {DOMAIN_FIELD_PREFIX, DOMAIN_FIELD_TYPE} from "../constants";
import {DomainDesign, DomainField, PropDescType, PROP_DESC_TYPES} from "../models";

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
 * @param kind: DomainKind if creating new Domain
 * @param options: Options for creating new Domain
 * @param name: Name of new Domain
 * @return Promise wrapped Domain API call.
 */
export function saveDomain(domain: DomainDesign, kind?: string, options?: any, name?: string) : Promise<DomainDesign> {
    return new Promise((resolve, reject) => {
        if (domain.domainId) {
            Domain.save({
                domainDesign: domain,
                domainId: domain.domainId,
                success: (success) => {
                    resolve(domain);
                },
                failure: (error) => {
                    reject(error);
                }
            })
        }
        else {
            Domain.create({
                kind,
                options,
                domainDesign: domain.set('name', name),
                success: (data) => {
                    resolve(DomainDesign.create(data));
                },
                failure: (error) => {
                    reject(error);
                }
            })
        }
    })
}

export function createFormInputId(name: string, index: any) {
    return DOMAIN_FIELD_PREFIX + '-' + name + '-' + index;
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

export function getIndexFromId(id: string): string {
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
    const index = parseInt(getIndexFromId(fieldId));

    const newFields = domain.fields.map((field, i) => {

        let newField;
        if (i === index) {
            newField = field.set('updatedField', true); // Set for field details in DomainRow
            newField = newField.set('renderUpdate', true); // Set for render optimization in DomainRow

            switch (type) {
                case DOMAIN_FIELD_TYPE:
                    PROP_DESC_TYPES.map((type) => {
                        if (type.name === value) {
                            newField = newField.set('rangeURI', type.rangeURI);
                            newField = newField.set('conceptURI', type.conceptURI);
                        }
                    });
                    break;
                default:
                    newField = newField.set(type, value);
                    break;
            }
        }
        else {
            newField = field.set('renderUpdate', false); // Do not re-render
        }

        return newField;
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
export function getDataType(field: DomainField): PropDescType {
    const types = PROP_DESC_TYPES.filter((value) => {

        // handle matching rangeURI and conceptURI
        if (value.rangeURI === field.rangeURI)
        {
            if (!field.lookupQuery &&
                ((!value.conceptURI && !field.conceptURI) || (value.conceptURI === field.conceptURI)))
            {
                return true;
            }
        }
        // handle selected lookup option
        else if (value.name === 'lookup' && field.lookupQuery && field.lookupQuery !== 'users')
        {
            return true;
        }
        // handle selected users option
        else if (value.name === 'users' && field.lookupQuery && field.lookupQuery === 'users')
        {
            return true;
        }

        return false;
    });

    // If found return type
    if (types.size > 0)
    {
        return types.get(0);
    }

    // default to the text type
    return PROP_DESC_TYPES.get(0);
}
