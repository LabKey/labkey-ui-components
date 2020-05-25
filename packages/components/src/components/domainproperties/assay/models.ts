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
import { List, Record } from 'immutable';

import { Utils } from '@labkey/api';

import { DomainDesign, FieldErrors } from '../models';

export class AssayProtocolModel extends Record({
    allowBackgroundUpload: false,
    allowEditableResults: false,
    allowQCStates: false,
    allowSpacesInPath: false,
    allowTransformationScript: false,
    allowPlateMetadata: false,
    autoCopyTargetContainer: undefined,
    autoCopyTargetContainerId: undefined,
    availableDetectionMethods: undefined,
    availableMetadataInputFormats: undefined,
    availablePlateTemplates: undefined,
    backgroundUpload: false,
    description: undefined,
    domains: undefined,
    editableResults: false,
    editableRuns: false,
    exception: undefined,
    metadataInputFormatHelp: undefined,
    moduleTransformScripts: undefined,
    name: undefined,
    plateMetadata: undefined,
    protocolId: undefined,
    protocolParameters: undefined,
    protocolTransformScripts: undefined,
    providerName: undefined,
    saveScriptFiles: false,
    selectedDetectionMethod: undefined,
    selectedMetadataInputFormat: undefined,
    selectedPlateTemplate: undefined,
    qcEnabled: undefined,
}) {
    allowBackgroundUpload: boolean;
    allowEditableResults: boolean;
    allowQCStates: boolean;
    allowSpacesInPath: boolean;
    allowTransformationScript: boolean;
    allowPlateMetadata: boolean;
    autoCopyTargetContainer: {};
    autoCopyTargetContainerId: string;
    availableDetectionMethods: [];
    availableMetadataInputFormats: {};
    availablePlateTemplates: [];
    backgroundUpload: boolean;
    description: string;
    domains: List<DomainDesign>;
    editableResults: boolean;
    editableRuns: boolean;
    exception: string;
    metadataInputFormatHelp: any;
    moduleTransformScripts: List<string>;
    name: string;
    plateMetadata: boolean;
    protocolId: number;
    protocolParameters: any;
    protocolTransformScripts: List<string>;
    providerName: string;
    saveScriptFiles: boolean;
    selectedDetectionMethod: string;
    selectedMetadataInputFormat: string;
    selectedPlateTemplate: string;
    qcEnabled: boolean;

    constructor(values?: { [key: string]: any }) {
        super(values);
    }

    static create(raw: any): AssayProtocolModel {
        let domains = raw.domains || List<DomainDesign>();
        if (raw.domains && Utils.isArray(raw.domains)) {
            domains = List<DomainDesign>(
                raw.domains.map(domain => {
                    return DomainDesign.create(domain);
                })
            );
        }

        if (raw.protocolTransformScripts && Utils.isArray(raw.protocolTransformScripts)) {
            raw.protocolTransformScripts = List<string>(raw.protocolTransformScripts);
        }
        if (raw.moduleTransformScripts && Utils.isArray(raw.moduleTransformScripts)) {
            raw.moduleTransformScripts = List<string>(raw.moduleTransformScripts);
        }

        // if this is not an existing assay, clear the name property so the user must set it
        const name = !raw.protocolId ? undefined : raw.name;

        // Issue 38685: for new assays, pre-select some required assay properties
        const model = new AssayProtocolModel({ ...raw, name, domains });
        if (model.isNew()) {
            if (model.allowDetectionMethodSelection() && model.availableDetectionMethods.length > 0) {
                raw.selectedDetectionMethod = List<string>(model.availableDetectionMethods).get(0);
            }
            if (model.allowPlateTemplateSelection() && model.availablePlateTemplates.length > 0) {
                raw.selectedPlateTemplate = List<string>(model.availablePlateTemplates).get(0);
            }
        }

        return new AssayProtocolModel({ ...raw, name, domains });
    }

    static serialize(model: AssayProtocolModel): any {
        // need to serialize the DomainDesign objects to remove the unrecognized fields
        const domains = model.domains.map(domain => {
            return DomainDesign.serialize(domain);
        });

        const json = model.merge({ domains }).toJS();

        // only need to serialize the id and not the autoCopyTargetContainer object
        delete json.autoCopyTargetContainer;
        delete json.exception;

        return json;
    }

    getDomainByNameSuffix(name: string): DomainDesign {
        if (this.domains.size > 0) {
            return this.domains.find(domain => {
                return domain.isNameSuffixMatch(name);
            });
        }
    }

    get container() {
        return this.getIn(['domains', 0, 'container']);
    }

    isNew(): boolean {
        return !this.protocolId;
    }

    allowPlateTemplateSelection(): boolean {
        return this.availablePlateTemplates && Utils.isArray(this.availablePlateTemplates);
    }

    allowDetectionMethodSelection(): boolean {
        return this.availableDetectionMethods && Utils.isArray(this.availableDetectionMethods);
    }

    allowMetadataInputFormatSelection(): boolean {
        return (
            this.availableMetadataInputFormats &&
            Utils.isObject(this.availableMetadataInputFormats) &&
            !Utils.isEmptyObj(this.availableMetadataInputFormats)
        );
    }

    validateTransformScripts(): string {
        if (this.protocolTransformScripts === undefined || this.protocolTransformScripts.size === 0) {
            return undefined;
        }

        // make sure we don't have any script inputs that are empty strings
        const hasEmptyScript = this.protocolTransformScripts.some(
            (script, i) => script === undefined || script === null || script.length === 0
        );
        if (hasEmptyScript) {
            return 'Missing required transform script path.';
        }

        // if not allowSpacesInPath, the path to the script should not contain spaces when the Save Script Data check box is selected
        if (!this.allowSpacesInPath && this.saveScriptFiles) {
            const hasSpacedScript = this.protocolTransformScripts.some((script, i) => script.indexOf(' ') > -1);
            if (hasSpacedScript) {
                return 'The path to the transform script should not contain spaces when the \'Save Script Data for Debugging\' check box is selected.';
            }
        }
    }

    getFirstDomainFieldError(): FieldErrors {
        const firstErrantDomain = this.domains.find(domain => domain.hasInValidFields());
        return firstErrantDomain !== undefined ? firstErrantDomain.getInvalidFields().first().getErrors() : undefined;
    }

    isValid(): boolean {
        return this.hasValidProperties() && this.getFirstDomainFieldError() === undefined;
    }

    hasValidProperties(): boolean {
        return (
            this.name !== undefined &&
            this.name !== null &&
            this.name.trim().length > 0 &&
            (!this.allowMetadataInputFormatSelection() || Utils.isString(this.selectedMetadataInputFormat)) &&
            (!this.allowDetectionMethodSelection() || Utils.isString(this.selectedDetectionMethod)) &&
            (!this.allowPlateTemplateSelection() || Utils.isString(this.selectedPlateTemplate)) &&
            this.validateTransformScripts() === undefined
        );
    }
}
