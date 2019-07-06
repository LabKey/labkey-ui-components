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

import {
    DOMAIN_FIELD_LOOKUP_CONTAINER,
    DOMAIN_FIELD_LOOKUP_SCHEMA,
    DOMAIN_FIELD_PREFIX,
    DOMAIN_FIELD_TYPE
} from "../constants";
import { DomainDesign, DomainField, PROP_DESC_TYPES, QueryInfoLite } from "../models";

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

export function processContainers(payload: any, container?: Container): List<Container> {
    let containers = List<Container>();

    // Depth first
    if (container) {
        containers = containers.push(container);
    }

    payload.children.forEach((c) => {
        containers = containers
            .concat(processContainers(c, new Container(c)))
            .toList();
    });

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
    if (!schemaName) {
        return Promise.resolve(List());
    }

    return new Promise((resolve) => {
        Query.getQueries({
            containerPath,
            schemaName,
            queryDetailColumns: true,
            success: (data) => {
                resolve(processQueries(data));
            }
        });
    });
}

export function processQueries(payload: any): List<QueryInfoLite> {
    if (!payload || !payload.queries) {
        return List();
    }

    return List<QueryInfoLite>(payload.queries.map((qi) => QueryInfoLite.create(qi)))
        .sort((a, b) => naturalSort(a.name, b.name))
        .toList();
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
    return List<SchemaDetails>(Object.keys(payload).map((k) => SchemaDetails.create(payload[k])))
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
                domainDesign: DomainDesign.serialize(domain),
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
        fields: domain.fields.push(DomainField.create({}))
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

    let field = domain.fields.get(index);

    if (field) {
        let newField = field.set('updatedField', true) as DomainField;

        switch (type) {
            case DOMAIN_FIELD_TYPE:
                PROP_DESC_TYPES.map((type) => {
                    if (type.name === value) {
                        newField = newField.merge({
                            dataType: type,
                            conceptURI: type.conceptURI,
                            rangeURI: type.rangeURI
                        }) as DomainField;
                    }
                });
                break;
            case DOMAIN_FIELD_LOOKUP_CONTAINER:
                newField = updateLookup(newField, value);
                break;
            case DOMAIN_FIELD_LOOKUP_SCHEMA:
                newField = updateLookup(newField, newField.lookupContainer, value);
                break;
            default:
                newField = newField.set(type, value) as DomainField;
                break;
        }

        domain = domain.merge({
            fields: domain.fields.set(index, newField)
        }) as DomainDesign;
    }

    return domain;
}

function updateLookup(field: DomainField, lookupContainer?: string, lookupSchema?: string, lookupQuery?: string): DomainField {
    return field.merge({
        lookupContainer,
        lookupQuery,
        lookupSchema
    }) as DomainField;
}

/**
 * @param domain: DomainDesign to clear
 * @return copy of domain with details cleared
 */
export function clearFieldDetails(domain: DomainDesign): DomainDesign {
    return domain.merge({
        fields: domain.fields.map(f => f.set('updatedField', false)).toList()
    }) as DomainDesign;
}

