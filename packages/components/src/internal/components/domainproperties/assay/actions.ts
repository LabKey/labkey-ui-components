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
import { List } from 'immutable';
import { Ajax, Utils } from '@labkey/api';

import { SEVERITY_LEVEL_ERROR } from '../constants';
import { DomainException } from '../models';

import { buildURL } from '../../../url/ActionURL';
import { setDomainException } from '../actions';
import { Container } from '../../base/models/model';

import { AssayProtocolModel } from './models';

export function fetchProtocol(protocolId?: number, providerName?: string, copy?: boolean): Promise<AssayProtocolModel> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('assay', 'getProtocol.api', {
                // give precedence to the protocolId if both are provided
                protocolId,
                providerName: protocolId !== undefined ? undefined : providerName,
                copy: copy || false,
            }),
            success: Utils.getCallbackWrapper(data => {
                resolve(AssayProtocolModel.create(data.data));
            }),
            failure: Utils.getCallbackWrapper(error => {
                reject(error);
            }),
        });
    });
}

export function saveAssayDesign(model: AssayProtocolModel): Promise<AssayProtocolModel> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('assay', 'saveProtocol.api'),
            jsonData: AssayProtocolModel.serialize(model),
            success: Utils.getCallbackWrapper(response => {
                resolve(AssayProtocolModel.create(response.data));
            }),
            failure: Utils.getCallbackWrapper(
                error => {
                    // clear any previous exception at the model level
                    let updatedModel = model.set('exception', undefined) as AssayProtocolModel;

                    // Check for validation exception
                    const exception = DomainException.create(error, SEVERITY_LEVEL_ERROR);
                    if (exception) {
                        if (exception.domainName) {
                            updatedModel = setAssayDomainException(updatedModel, exception);
                        } else {
                            updatedModel = updatedModel.set('exception', exception.exception) as AssayProtocolModel;
                        }
                    } else {
                        updatedModel = updatedModel.set('exception', error.exception || error) as AssayProtocolModel;
                    }

                    reject(updatedModel);
                },
                this,
                false
            ),
        });
    });
}

export function setAssayDomainException(model: AssayProtocolModel, exception: DomainException): AssayProtocolModel {
    let updatedModel;

    // If a domain is identified in the exception, attach to that domain
    if (exception.domainName) {
        const exceptionDomains = model.domains.map(domain => {
            if (exception.domainName.endsWith(domain.get('name'))) {
                return setDomainException(domain, exception);
            }

            return domain;
        });

        updatedModel = model.set('domains', exceptionDomains) as AssayProtocolModel;
    }
    // otherwise attach to whole assay
    else {
        updatedModel = model.set('exception', exception.exception) as AssayProtocolModel;
    }

    return updatedModel;
}

export function getValidPublishTargets(): Promise<List<Container>> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('assay', 'getValidPublishTargets.api'),
            success: Utils.getCallbackWrapper(response => {
                resolve(List<Container>(response.containers.map(container => new Container(container))));
            }),
            failure: Utils.getCallbackWrapper(error => {
                reject(error);
            }),
        });
    });
}
