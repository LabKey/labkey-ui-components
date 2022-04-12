/*
 * Copyright (c) 2018-2019 LabKey Corporation
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

/**
 * The Action interface specifies the functionality that must be implemented for an Action to participate
 * in the grid panel action framework. Action's are considered stateless so a given instance of a type of Action
 * may be transient.
 */
export interface Action {
    /**
     * Special case to allow an action to be the default if no keyword is provided. Note the first action with this
     * set, if there are multiple, will be the default.
     */
    isDefaultAction?: boolean;

    /**
     * This is the keyword the user uses to activate this action. This should consist of one word
     * with no spaces.
     */
    keyword: string;

    /**
     * This is a shorthand font awesome icon class. E.g. "globe" would apply the icon fa-globe.
     * http://fontawesome.io/icons
     */
    iconCls: string;
}

export interface Value {
    value: string;
    valueObject?: any;
    displayValue?: string;
    isReadOnly?: boolean;
    isRemovable?: boolean;
    isValid?: boolean;
    param?: any;
}

export interface ActionValue extends Value {
    action: Action;
}

export interface ActionOption {
    label: string;

    action?: Action;
    value?: string;
    appendValue?: boolean;
    isAction?: boolean;
    isComplete?: boolean;
    isSelected?: boolean;
    isOverwrite?: boolean;
    nextLabel?: string;
    selectable?: boolean;
}
