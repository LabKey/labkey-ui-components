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
import {fetchDomain, fetchProtocol, saveAssayDesign, saveDomain, getBannerMessages, setDomainFields, createFormInputId} from "./actions/actions";
import {AssayProtocolModel, DomainDesign, IBannerMessage, DomainField, IAppDomainHeader, SAMPLE_TYPE} from "./models";
import DomainForm from "./components/DomainForm";
import {DomainFieldsDisplay} from "./components/DomainFieldsDisplay";
import {AssayPropertiesPanel} from "./components/assay/AssayPropertiesPanel";
import {AssayDesignerPanels} from "./components/assay/AssayDesignerPanels";
import {SEVERITY_LEVEL_WARN, SEVERITY_LEVEL_ERROR, DOMAIN_FIELD_REQUIRED, DOMAIN_FIELD_TYPE, STRING_RANGE_URI} from "./constants";

import './theme/index.scss'

export {
    // components
    DomainForm,
    DomainFieldsDisplay,
    AssayPropertiesPanel,
    AssayDesignerPanels,

    // functions
    fetchDomain,
    saveDomain,
    getBannerMessages,
    fetchProtocol,
    createFormInputId,
    saveAssayDesign,
    setDomainFields,

    // models
    AssayProtocolModel,
    DomainDesign,
    DomainField,
    IBannerMessage,
    IAppDomainHeader,

    // constants
    SEVERITY_LEVEL_ERROR,
    SEVERITY_LEVEL_WARN,
    SAMPLE_TYPE,
    DOMAIN_FIELD_REQUIRED,
    DOMAIN_FIELD_TYPE,
    STRING_RANGE_URI,

}