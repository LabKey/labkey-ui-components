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
import { List } from "immutable";
import { Domain, Query, Security } from "@labkey/api";
import { Container, naturalSort, SchemaDetails } from "@glass/base";

import { DOMAIN_FIELD_PREFIX, DOMAIN_FIELD_TYPE } from "../constants";
import { DomainDesign, DomainField, PROP_DESC_TYPES, PropDescType, QueryInfoLite } from "../models";

export function fetchContainers(): Promise<List<Container>> {
    return new Promise((resolve) => {
        let success: any = (data) => {
            resolve(processContainers(data));
        };

        Security.getContainers({
            containerPath: '/',
            includeSubfolders: true,
            includeEffectivePermissions: false,
            success
        });
    });
}

export function processContainers(payload: any): List<Container> {
    // Depth first
    const { children } = payload;
    let containers = List<Container>();

    for (let i=0; i < children.length; i++) {
        processContainer(children[i]).forEach((c) => {
            containers = containers.push(c);
        });
    }

    return containers;
}

function processContainer(rawContainer: any): List<Container> {
    let containers = List<Container>([
        new Container(rawContainer)
    ]);

    let { children } = rawContainer;

    for (let i=0; i < children.length; i++) {
        processContainer(children[i]).forEach((c) => {
            containers = containers.push(c);
        });
    }

    return containers;
}

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

export function fetchQueries(containerPath: string, schemaName: string): Promise<List<QueryInfoLite>> {
    return new Promise((resolve) => {
        Query.getQueries({
            containerPath,
            includeColumns: false,
            schemaName,
            success: (data) => {
                resolve(processQueries(data));
            }
        });
    });
}

export function processQueries(payload: any): List<QueryInfoLite> {
    let queries = List<QueryInfoLite>();

    if (payload) {
        payload.queries.forEach((qi) => {
            queries = queries.push(QueryInfoLite.create(qi));
        });
    }

    return queries;
}

export function fetchSchemas(containerPath: string): Promise<List<SchemaDetails>> {
    return new Promise((resolve) => {
        Query.getSchemas({
            apiVersion: 17.1,
            containerPath,
            includeHidden: false,
            success: (data) => {
                resolve(processSchemas(data));
            }
        });
    });
}

export function processSchemas(payload: any): List<SchemaDetails> {
    let schemas = List<SchemaDetails>();

    for (const k in payload) {
        if (payload.hasOwnProperty(k)) {
            schemas = schemas.push(SchemaDetails.create(payload[k]));
        }
    }

    return schemas
        .sort((a, b) => naturalSort(a.getLabel(), b.getLabel()))
        .toList();
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

export function createFormInputId(name: string, index: any): string {
    return [DOMAIN_FIELD_PREFIX, name, index].join('-');
}

function getNameFromId(id: string): string {
    const parts = id.split('-');
    if (parts.length === 3) {
        return parts[1];
    }

    return undefined;
}

export function getIndexFromId(id: string): number {
    const parts = id.split('-');
    if (parts.length === 3) {
        return parseInt(parts[2]);
    }

    return -1;
}

export function addField(domain: DomainDesign): DomainDesign {
    return domain.merge({
        fields: domain.fields.push(new DomainField({
            newField: true
        }))
    }) as DomainDesign;
}

export function removeField(domain: DomainDesign, index: number): DomainDesign {
    return domain.merge({
        fields: domain.fields.delete(index)
    }) as DomainDesign
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

        let newField;
        if (i === index) {
            newField = field.set('updatedField', true); // Set for field details in DomainRow

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
            newField = field;
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

