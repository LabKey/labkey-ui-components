import { List } from 'immutable'
import { Ajax, Utils, Assay } from '@labkey/api'

import { AssayDefinitionModel, AssayProtocolModel } from "../models/model";
import { buildURL } from "../url/ActionURL";

export function fetchProtocol(protocolId: number): Promise<AssayProtocolModel> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('assay', 'getProtocol.api', { protocolId }),
            success: Utils.getCallbackWrapper((data) => {
                resolve(new AssayProtocolModel(data.data));
            }),
            failure: Utils.getCallbackWrapper((error) => {
                reject(error);
            })
        })
    });
}

export function fetchAllAssays(): Promise<List<AssayDefinitionModel>> {
    return new Promise((res, rej) => {
        Assay.getAll({
            success: (rawModels: Array<any>) => {
                let models = List<AssayDefinitionModel>().asMutable();
                rawModels.forEach(rawModel => {
                    models.push(AssayDefinitionModel.create(rawModel));
                });
                res(models.asImmutable());
            },
            failure: (error) => {
                rej(error);
            }
        });
    })
}