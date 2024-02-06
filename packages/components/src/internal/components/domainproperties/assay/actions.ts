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
import { ActionURL, Ajax, Utils } from '@labkey/api';

import { SEVERITY_LEVEL_ERROR } from '../constants';
import { DomainException } from '../models';

import { setDomainException } from '../actions';

import { Container } from '../../base/models/Container';
import { isAssayEnabled } from '../../../app/utils';

import { AssayProtocolModel } from './models';
import { handleRequestFailure } from '../../../util/utils';

export function saveAssayDesign(model: AssayProtocolModel): Promise<AssayProtocolModel> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL('assay', 'saveProtocol.api', model.container),
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

function setAssayDomainException(model: AssayProtocolModel, exception: DomainException): AssayProtocolModel {
    let updatedModel: AssayProtocolModel;

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

export function getValidPublishTargets(containerPath?: string): Promise<Container[]> {
    if (!isAssayEnabled()) {
        return Promise.resolve([]);
    }
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL('assay', 'getValidPublishTargets.api', containerPath),
            success: Utils.getCallbackWrapper(response => {
                resolve(response.containers.map(c => new Container(c)));
            }),
            failure: handleRequestFailure(reject, 'Unable to load valid study targets for Auto-Link Data to Study input.'),
        });
    });
}

export function getScriptEngineForExtension(extension: string, containerPath?: string): Promise<Record<string, any>> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL('core', 'getScriptEngineForExtension.api', containerPath),
            params: { extension },
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: handleRequestFailure(reject, `Failed to get script engine for extension "${extension}".`),
        });
    });
}
