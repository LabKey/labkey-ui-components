/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { immerable, produce } from 'immer';

import { AssayDefinitionModel } from '../../AssayDefinitionModel';
import { LoadingState } from '../../../public/LoadingState';
import { DomainField } from '../domainproperties/models';

export class AssayUploadResultModel {
    [immerable] = true;

    readonly assayId: number;
    readonly batchId: number;
    readonly runId: number;
    readonly success: boolean;
    readonly successurl?: string;
    readonly jobId?: number;

    constructor(values?: Partial<AssayUploadResultModel>) {
        Object.assign(this, values);
    }
}

export class AssayStateModel {
    [immerable] = true;

    readonly definitions: AssayDefinitionModel[];
    readonly definitionsError: string;
    readonly definitionsLoadingState: LoadingState;
    readonly protocolError: string;
    readonly protocolLoadingState: LoadingState;

    constructor(values?: Partial<AssayStateModel>) {
        Object.assign(this, values);

        this.definitions = this.definitions ?? [];
        this.definitionsLoadingState = this.definitionsLoadingState ?? LoadingState.INITIALIZED;
        this.protocolLoadingState = this.protocolLoadingState ?? LoadingState.INITIALIZED;
    }

    getById(assayRowId: number): AssayDefinitionModel {
        return this.definitions.find(def => def.id === assayRowId);
    }

    getByName(assayName: string): AssayDefinitionModel {
        const lowerName = assayName.toLowerCase();
        return this.definitions.find(def => def.name.toLowerCase() === lowerName);
    }

    getDefinitionsByTypes(included?: string[], excluded?: string[]): AssayDefinitionModel[] {
        if (!included && !excluded) return this.definitions;

        const lowerIncluded = included?.join('|').toLowerCase().split('|');
        const lowerExcluded = excluded?.join('|').toLowerCase().split('|');

        return this.definitions.filter(def => {
            let include = true;
            if (included?.length > 0) {
                include = lowerIncluded.indexOf(def.type.toLowerCase()) !== -1;
            }
            if (excluded?.length > 0) {
                include = lowerExcluded.indexOf(def.type.toLowerCase()) === -1;
            }
            return include;
        });
    }

    mutate(props: Partial<AssayStateModel>): AssayStateModel {
        return produce<AssayStateModel>(this, draft => {
            Object.assign(draft, props);
        });
    }
}

export type FilterCriteriaColumns = Record<string, DomainField[]>;
