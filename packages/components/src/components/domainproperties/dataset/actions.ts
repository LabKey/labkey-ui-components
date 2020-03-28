/*
 * Copyright (c) 2020 LabKey Corporation
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

export const fetchCategories = async () => {
    // TODO: Replace this with server side call
    return {
        'categories': [
            {label: 'A', value: 20},
            {label: 'B', value: 21},
            {label: 'C', value: 22}]
    };
};

export const fetchCohorts = async () => {
    // TODO: Replace this with server side call
    return {
        'cohorts': [
            {label: 'Cohort1', value: 1},
            {label: 'Cohort2', value: 2},
            {label: 'Cohort3', value: 3}]
    };
};


export const fetchVisitDateColumns = async () => {
    // TODO: Keeping this action until next story in which visitDateColumns will be pulled from state change (for date fields) in the Domain Form.
    return {
        'visitDateColumns': [
            {label: 'Date', value: 'date'},
            {label: 'Arrival Date', value: 'arrivalDate'}]
    };
};
