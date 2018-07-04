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