/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { ActionURL, Ajax, Utils } from '@labkey/api';

import { SEVERITY_LEVEL_ERROR } from '../constants';
import { DomainException } from '../models';

import { setDomainException } from '../actions';

import { Container } from '../../base/models/Container';
import { isAssayEnabled } from '../../../app/utils';

import { handleRequestFailure } from '../../../request';

import { AssayProtocolModel } from './models';

export function saveAssayDesign(model: AssayProtocolModel, auditUserComment?: string): Promise<AssayProtocolModel> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL('assay', 'saveProtocol.api', model.container),
            jsonData: AssayProtocolModel.serialize(model, auditUserComment),
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
            failure: handleRequestFailure(
                reject,
                'Unable to load valid study targets for Auto-Link Data to Study input.'
            ),
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
