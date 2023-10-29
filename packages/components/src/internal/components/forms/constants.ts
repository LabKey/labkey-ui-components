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
export const DETAIL_TABLE_CLASSES = 'table table-responsive table-condensed detail-component--table__fixed';

export const DELIMITER = ',';

// Interface for components that support the withFormsy() component wrapper.
export interface WithFormsyProps {
    getErrorMessage?: Function;
    getErrorMessages?: Function;
    getValue?: Function;
    hasValue?: Function;
    isFormDisabled?: Function;
    isFormSubmitted?: Function;
    isPristine?: Function;
    isRequired?: () => boolean;
    isValid?: Function;
    isValidValue?: Function;
    resetValue?: Function;
    setValidations?: Function;
    setValue?: Function;
    showError?: () => boolean;
    showRequired?: Function;
    validationError?: string;
    validationErrors?: string;
    validations?: any; // Record<string, any> | string;
}
