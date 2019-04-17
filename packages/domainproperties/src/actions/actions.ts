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
    PropDescTypes
} from "../constants";
import {DomainDesign} from "../models";

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
                resolve(data);
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
export function saveDomain(domain: DomainDesign) : Promise<DomainDesign> {
    return new Promise((resolve, reject) => {
        Domain.save({
            domainDesign: domain,
            domainId: domain.domainId,
            success: (data) => {
                resolve(data);
            },
            failure: (error) => {
                reject(error);
            }
        })
    })
}

/**
 *
 * @param domain: DomainDesign to update
 * @param fieldId: Field Id to update
 * @param value: New value
 * @return copy of domain with updated field
 */
export function updateDomainField(domain: DomainDesign, fieldId: string, value: any) {
    const idType = fieldId.split(DOMAIN_FIELD_PREFIX)[1];
    const type = idType.split("-")[0];
    const id = idType.split("-")[1];

    const newFields = domain.fields.map((field) => {

        if (field.propertyId.toString() === id) {
            field.updatedField = true;  // Set for field details in DomainRow
            field.renderUpdate = true;  // Set for render optimization in DomainRow
            switch (type) {
                case DOMAIN_FIELD_NAME:
                    field.name = value;
                    break;
                case DOMAIN_FIELD_TYPE:
                    PropDescTypes.map((type) => {
                        if (type.name === value) {
                            field.rangeURI = type.rangeURI;
                            field.conceptURI = type.conceptURI;
                        }
                    });
                    break;
                case DOMAIN_FIELD_REQ:
                    field.required = value;
                    break;
            }
        }
        else {
            field.renderUpdate = false;
        }

        return field;
    });

    return Object.assign({}, domain, {fields: List(newFields)});
}

/**
 * @param domain: DomainDesign to clear
 * @return copy of domain with details cleared
 */
export function clearFieldDetails(domain: DomainDesign) {

    const newFields = domain.fields.map((field) => {
        field.updatedField = false;
        field.newField = false;

        return field;
    });

    return Object.assign({}, domain, {fields: List(newFields)});
}
