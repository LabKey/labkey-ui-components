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
import { List, Map } from "immutable";
import { Domain, Query, Security } from "@labkey/api";
import { Container, naturalSort, SchemaDetails, processSchemas } from "@glass/base";

import {
    DOMAIN_FIELD_CLIENT_SIDE_ERROR,
    DOMAIN_FIELD_LOOKUP_CONTAINER,
    DOMAIN_FIELD_LOOKUP_QUERY,
    DOMAIN_FIELD_LOOKUP_SCHEMA,
    DOMAIN_FIELD_PREFIX,
    DOMAIN_FIELD_TYPE,
    SEVERITY_LEVEL_ERROR
} from "../constants";
import {
    decodeLookup,
    DomainDesign,
    DomainField,
    PropDescType,
    PROP_DESC_TYPES,
    QueryInfoLite,
    DomainException,
    DomainFieldError,
    IFieldChange
} from "../models";

let sharedCache = Map<string, Promise<any>>();

function cache<T>(prefix: string, key: string, miss: () => Promise<T>): Promise<T> {
    let cacheKey = [prefix, key].join('|');
    let promise = sharedCache.get(cacheKey);

    if (!promise) {
        promise = miss();
        sharedCache = sharedCache.set(cacheKey, promise);
    }

    return promise;
}

export function fetchContainers(): Promise<List<Container>> {
    return cache<List<Container>>('container-cache', 'containers', () => (
        new Promise((resolve) => {
            let success: any = (data) => {
                resolve(processContainers(data));
            };

            Security.getContainers({
                containerPath: '/',
                includeSubfolders: true,
                includeEffectivePermissions: false,
                success
            });
        })
    ));
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
                resolve(DomainDesign.create(data, undefined));
            },
            failure: (error) => {
                reject(error);
            }
        })
    });
}

export function fetchQueries(containerPath: string, schemaName: string): Promise<List<QueryInfoLite>> {
    const key = [containerPath, schemaName].join('|').toLowerCase();

    return cache<List<QueryInfoLite>>('query-cache', key, () => (
        new Promise((resolve) => {
            if (schemaName) {
                Query.getQueries({
                    containerPath,
                    schemaName,
                    queryDetailColumns: true,
                    success: (data) => {
                        resolve(processQueries(data));
                    }
                });
            }
            else {
                resolve(List());
            }
        })
    ));
}

export function processQueries(payload: any): List<QueryInfoLite> {
    if (!payload || !payload.queries) {
        return List();
    }

    return List<QueryInfoLite>(payload.queries.map((qi) => QueryInfoLite.create(qi, payload.schemaName)))
        .sort((a, b) => naturalSort(a.name, b.name))
        .toList();
}

export function fetchSchemas(containerPath: string): Promise<List<SchemaDetails>> {
    return cache<List<SchemaDetails>>('schema-cache', containerPath, () => (
        new Promise((resolve) => {
            Query.getSchemas({
                apiVersion: 17.1,
                containerPath,
                includeHidden: false,
                success: (data) => {
                    resolve(handleSchemas(data));
                }
            })
        })
    ));
}

export function handleSchemas(payload: any): List<SchemaDetails> {
    return processSchemas(payload)
        .valueSeq()
        .sort((a, b) => naturalSort(a.fullyQualifiedName, b.fullyQualifiedName))
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
        if (domain.hasErrors()) {
            reject('Unable to save domain. Fix fields before saving.');
        }
        else if (domain.domainId) {
            Domain.save({
                domainDesign: DomainDesign.serialize(domain),
                domainId: domain.domainId,
                success: (success) => {
                    resolve(clearFieldDetails(domain));
                    // resolve(DomainDesign.create(data, undefined));
                },
                    failure: (error) => {
                    let domainException = DomainException.create(error, SEVERITY_LEVEL_ERROR);
                    let badDomain = domain.set('domainException', domainException);
                    reject(badDomain);
                }
            })
        }
        else {
            Domain.create({
                kind,
                options,
                domainDesign: DomainDesign.serialize(domain.set('name', name) as DomainDesign),
                success: (data) => {
                    resolve(DomainDesign.create(data, undefined));
                },
                failure: (error) => {
                    let domainException = DomainException.create(error, SEVERITY_LEVEL_ERROR);
                    let badDomain = domain.set('domainException', domainException);
                    reject(badDomain);
                }
            })
        }
    })
}

// This is used for testing
export function createFormInputName(name: string): string {
    return [DOMAIN_FIELD_PREFIX, name].join('-');
}

export function createFormInputId(name: string, index: number): string {
    return [DOMAIN_FIELD_PREFIX, name, index].join('-');
}

export function getNameFromId(id: string) : string {
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
 * @param changes: List of ids and values describing changes
 * @return copy of domain with updated fields
 */
export function handleDomainUpdates(domain: DomainDesign, changes: List<IFieldChange>): DomainDesign {
    let type;

    changes.forEach((change) => {

        type = getNameFromId(change.id);
        if (type === DOMAIN_FIELD_CLIENT_SIDE_ERROR) {
            domain = addDomainException(domain, change.value);
        }
        else {
            domain = updateDomainField(domain, change)
        }
    });
    return domain;
}

export function updateDomainField(domain: DomainDesign, change: IFieldChange): DomainDesign {
    const type = getNameFromId(change.id);
    const index = getIndexFromId(change.id);

    let field = domain.fields.get(index);

    if (field) {
        let newField = field.set('updatedField', true) as DomainField;

        switch (type) {
            case DOMAIN_FIELD_TYPE:
                newField = updateDataType(newField, change.value);
                break;
            case DOMAIN_FIELD_LOOKUP_CONTAINER:
                newField = updateLookup(newField, change.value);
                break;
            case DOMAIN_FIELD_LOOKUP_SCHEMA:
                newField = updateLookup(newField, newField.lookupContainer, change.value);
                break;
            case DOMAIN_FIELD_LOOKUP_QUERY:
                const { queryName, rangeURI } = decodeLookup(change.value);
                newField = newField.merge({
                    lookupQuery: queryName,
                    lookupQueryValue: change.value,
                    lookupType: newField.lookupType.set('rangeURI', rangeURI),
                    rangeURI
                }) as DomainField;
                break;
            default:
                newField = newField.set(type, change.value) as DomainField;
                break;
        }

        domain = domain.merge({
            fields: domain.fields.set(index, newField)
        }) as DomainDesign;
    }

    return domain;
}

function updateDataType(field: DomainField, value: any): DomainField {
    let propType = PROP_DESC_TYPES.find(pt => pt.name === value);

    if (propType) {
        const dataType = propType.isLookup() ? field.lookupType : propType;

        field = field.merge({
            dataType,
            conceptURI: dataType.conceptURI,
            rangeURI: dataType.rangeURI
        }) as DomainField;
    }

    return field;
}

function updateLookup(field: DomainField, lookupContainer?: string, lookupSchema?: string): DomainField {
    return field.merge({
        lookupContainer,
        lookupQuery: undefined,
        lookupQueryValue: undefined,
        lookupSchema
    }) as DomainField;
}

export function clearFieldDetails(domain: DomainDesign): DomainDesign {
    return domain.merge({
        fields: domain.fields.map(f => f.set('updatedField', false)).toList()
    }) as DomainDesign;
}

export function getCheckedValue(evt) {
    if (evt.target.type === "checkbox")
    {
        return evt.target.checked;
    }

    return undefined;
}

/**
 *
 * @param domain: DomainDesign to update with Field level error, in this case, set DomainException property which will carry field level error
 * @param domainFieldError: Field level error with message and severity
 * @return copy of domain with exception set on a field
 */
export function addDomainException(domain: DomainDesign, domainFieldError: any): DomainDesign {

    let domainExceptionObj;
    if (domain.domainException && domain.domainException.errors) {
        let newErrors = domain.domainException.errors.push(domainFieldError);
        domainExceptionObj = domain.domainException.merge({errors: newErrors})
    }
    else {
        let exception = domainFieldError.field + " :" + domainFieldError.message;
        let success = undefined;
        let severity = domainFieldError.severity;
        let errors = List<DomainFieldError>().asMutable();
        errors.push(domainFieldError);
        let errorsImmutable = errors.asImmutable();

        domainExceptionObj = new DomainException({exception, success, severity, errorsImmutable});
    }

    return domain.merge({
        domainException: domainExceptionObj
    }) as DomainDesign;
};