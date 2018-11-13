/*
 * Copyright (c) 2018 LabKey Corporation
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
// Type definitions for react-input-autosize v1.0.0
// Project: https://github.com/JedWatson/react-input-autosize
// Definitions by: Nick Kerr <https://github.com/labkey-nicka>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

declare module "react-input-autosize" {

    import { Component, InputHTMLAttributes } from 'react';

    interface AutosizeInputProps extends InputHTMLAttributes<AutosizeInput> {
        /**
         * className for the outer element.
         */
        className?: string

        /**
         * default field value
         */
        defaultValue?: any

        /**
         * className for the input element
         */
        inputClassName?: string

        /**
         * ref callback for the input element
         */
        inputRef?: Function

        /**
         * css styles for the input element
         */
        inputStyle?: {}

        /**
         * minimum width for input element
         */
        minWidth?: number | string

        /**
         * onAutosize handler: function(newWidth) {}
         */
        onAutosize?: (newWidth?: number | string) => any

        /**
         * placeholder text
         */
        placeholder?: string

        /**
         * don't collapse size to less than the placeholder
         */
        placeholderIsMinWidth?: string

        /**
         * css styles for the outer element
         */
        style?: {}

        /**
         * field value
         */
        value?: any
    }

    interface AutosizeInputState {
        /**
         * Internally generated identifier
         */
        inputId?: string

        /**
         * The current width of the input. Initially set to props.minWidth.
         */
        inputWidth?: number
    }

    export default class AutosizeInput extends Component<AutosizeInputProps, AutosizeInputState> { }
}