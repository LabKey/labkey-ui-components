
import {Ajax, Utils} from '@labkey/api'

import {AssayProtocolModel} from "../models/model";
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