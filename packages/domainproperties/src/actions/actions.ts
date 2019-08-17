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
    SEVERITY_LEVEL_ERROR, SEVERITY_LEVEL_WARN
} from "../constants";
import {
    decodeLookup,
    DomainDesign,
    DomainField,
    PROP_DESC_TYPES,
    QueryInfoLite,
    DomainException,
    DomainFieldError,
    IFieldChange,
    IBannerMessage
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
                success: (data) => {
                    resolve(DomainDesign.create(data));
                },
                failure: (error) => {
                    let exceptionWithServerSideErrors = DomainException.create(error, SEVERITY_LEVEL_ERROR);
                    let exceptionWithRowIndexes = DomainException.addRowIndexesToErrors(domain, exceptionWithServerSideErrors);
                    let exceptionWithAllErrors = DomainException.mergeWarnings(domain, exceptionWithRowIndexes);
                    let badDomain = domain.set('domainException', (exceptionWithAllErrors ? exceptionWithAllErrors : exceptionWithServerSideErrors));
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
                    resolve(DomainDesign.create(data));
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

function updateErrorIndexes(removedFieldIndex: number, domainException: DomainException) {

    let errorsWithNewIndex = domainException.errors.map(error => {
        let newRowIndexes = error.rowIndexes.map((rowIndex) => {
            if (rowIndex > removedFieldIndex) {
                return rowIndex-1;
            }
        });
        return error.set("rowIndexes", newRowIndexes);
    });

    return domainException.set('errors', errorsWithNewIndex);
}

export function removeField(domain: DomainDesign, index: number): DomainDesign {

    let de;

    //clear field error on a removed field
    if (domain.hasException()) {
        const updatedErrors = clearFieldError(domain, index);
        de = domain.domainException.merge({errors: updatedErrors}) as DomainException;
    }

    let newDomain = domain.merge({
        fields: domain.fields.delete(index),
        domainException: de
    }) as DomainDesign;

    //"move up" the indexes of the fields with error, i.e. the fields that are below the removed field
    if (newDomain.hasException()) {
        return newDomain.set('domainException', updateErrorIndexes(index, newDomain.domainException)) as DomainDesign;
    }
    return newDomain;
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
            domain = updateDomainException(domain, getIndexFromId(change.id), change.value);
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
    if (evt.target.type === "checkbox") {
        return evt.target.checked;
    }

    return undefined;
}

 function clearFieldError (domain: DomainDesign, rowIndex: any) {

    let allErrors = domain.domainException.get('errors');

    //filter errors where rowIndexes size > 2
    let filteredErrors = allErrors.filter(error => {

        if (error.rowIndexes.includes(rowIndex)) {
            return error.rowIndexes.size > 2;
        }
        return true;

    });

    //find an index of an error to remove from the list of errors
     return filteredErrors.map((error) => {
         return error.set('rowIndexes', error.rowIndexes.filter(idx => { return idx !== rowIndex }));
     });
}

/**
 *
 * @param domain: DomainDesign to update with Field level error, in this case, set DomainException property which will carry field level error
 * @param domainFieldError: Field level error with message and severity
 * @return copy of domain with exception set on a field
 */
export function updateDomainException(domain: DomainDesign, index: any, domainFieldError: any): DomainDesign {

    let domainExceptionObj;

    //new error on a field at a given index
    if (domainFieldError)
    {
        //add incoming field error to a previously existing domainException object
        if (domain.hasException())
        {
            const updatedErrors = clearFieldError(domain, index); //clear previously present error on a given row index
            const newErrors = updatedErrors.push(domainFieldError);
            domainExceptionObj = domain.domainException.merge({errors: newErrors})
        }
        //domainException is not defined yet/doesn't have field errors, so create a new domainException object
        else
        {
            const exception = domainFieldError.fieldName + " : " + domainFieldError.message;
            const errors = List<DomainFieldError>().asMutable();
            errors.push(domainFieldError);

            domainExceptionObj = new DomainException({exception, success: undefined, severity: domainFieldError.severity, errors: errors.asImmutable()});
        }
    }
    //no error on a field at a given index
    else {
        //clear out an old error on a field, ex. if the client side error is fixed on a field then its previous error needs to be cleared out from the error set
        if (domain && domain.hasException()) {

            const updatedErrors = clearFieldError(domain, index);

            //reset domainException obj with an updated set of errors
            if (updatedErrors && updatedErrors.size > 0) {

                const exception = updatedErrors.get(0).fieldName + " : " + updatedErrors.get(0).message; //create exception message based on the first error, to be consistent with how server side errors are created

                domainExceptionObj = new DomainException({exception, success: undefined, severity: updatedErrors.get(0).severity, errors: updatedErrors})
            }
            //previous/old error on an incoming field was the last error to clear out, so no more errors
            else {
                domainExceptionObj = undefined;
            }
        }
    }
    return domain.merge({
        domainException: domainExceptionObj
    }) as DomainDesign;
}

export function getBannerMessages (domain: any) : List<IBannerMessage> {

    if (domain && domain.hasException()) {

        let msgList = List<IBannerMessage>().asMutable();
        let errMsg = getErrorBannerMessage(domain);
        if (errMsg !== undefined) {
            msgList.push({message: errMsg, messageType: 'danger'});
        }

        let warnMsg = getWarningBannerMessage(domain);
        if (warnMsg !== undefined) {
            msgList.push({message: warnMsg, messageType: 'warning'})
        }

        return msgList.asImmutable();

    }
    else {
        return List<IBannerMessage>();
    }
}

function getErrorBannerMessage (domain: any) : any {

    if (domain && domain.hasException()) {
        let errors = domain.domainException.get('errors').filter(e => {
            return e && (e.severity === SEVERITY_LEVEL_ERROR)
        });

        if (errors && errors.size > 0) {
            if (errors.size > 1) {
                return "Multiple fields contain issues that need to be fixed. Review the red highlighted fields below for more information.";
            }
            else {
                return errors.get(0).message;
            }
        }
    }
    return undefined;
}

function getWarningBannerMessage (domain: any) : any {

    if (domain && domain.hasException()) {
        let warnings = domain.domainException.get('errors').filter(e => {return e && (e.severity === SEVERITY_LEVEL_WARN)});

        if (warnings && warnings.size > 0) {
            if (warnings.size > 1) {
                return "Multiple fields may require your attention. Review the yellow highlighted fields below for more information.";
            }
            else {
                return (warnings.get(0).fieldName + " : " + warnings.get(0).message);
            }
        }
    }
    return undefined;
};