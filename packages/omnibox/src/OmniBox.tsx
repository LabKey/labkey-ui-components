/*
 * Copyright (c) 2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import $ from 'jquery'
import classNames from 'classnames'
import AutosizeInput from 'react-input-autosize'

import { Action, ActionOption, ActionValue, ActionValueCollection } from './actions/Action'
import { Option } from './Option'
import { Value, valueClassName } from './Value'

import './theme/index.scss'

// Export for type declarations (.d.ts)
export {
    Option,
    Value
}

interface OmniBoxProps {
    actions: Array<Action>
    backspaceRemoves?: boolean
    className?: string
    closeOnComplete?: boolean
    disabled?: boolean
    inputProps?: {
        className?: string
    }
    onChange?: (actionValueCollection: Array<ActionValueCollection>, actions?: Array<Action>) => any
    onInputChange?: Function
    openAfterFocus?: boolean
    placeholder?: string
    tabSelectsValue?: boolean
    values?: Array<ActionValue>
}

interface OmniBoxState {
    actionValues?: Array<ActionValue>
    activeAction?: Action
    focusedIndex?: number
    inputValue?: string
    isFocused?: boolean
    isOpen?: boolean
    options?: Array<ActionOption>
    previewInputValue?: string
}

let instanceId = 1;

export class OmniBox extends React.Component<OmniBoxProps, OmniBoxState> {
    static defaultProps = {
        backspaceRemoves: true,
        closeOnComplete: true,
        disabled: false,
        inputProps: {},
        openAfterFocus: true,
        placeholder: 'Select...',
        tabSelectsValue: true
    };

    static defaultTokenizer(inputValue: string): Array<string> {
        let tokens = [];
        if (inputValue) {
            let subTokens = inputValue.split(/[^\S|\-"']+|"([^"]*)"|'([^']*)'/);
            for (let i=0; i < subTokens.length; i++) {
                if (subTokens[i] && subTokens[i].replace(/"|'/g, '').length > 0) {
                    tokens.push(subTokens[i].replace(/"|'/g, ''));
                }
            }
        }
        return tokens;
    }

    static stripKeyword(inputValue: string, action: Action): string {
        let value = inputValue || '';
        if (action && value && action.keyword && value.length > 0) {
            if (value.toLowerCase().indexOf(action.keyword.toLowerCase()) === 0) {
                let newInputArray = value.split(' ');
                newInputArray.shift(); // remove keyword
                value = newInputArray.join(' ');
            }
        }
        return value;
    }

    static stripLastToken(inputValue: string): string {
        if (!inputValue) {
            // null, undefined, ''
            return '';
        }

        const lastQuote = inputValue.lastIndexOf('"');
        const lastSpace = inputValue.lastIndexOf(' ');

        if (lastSpace == -1 && lastQuote == -1) {
            // 'filter', <keyword>
            return inputValue;
        }

        const numQuotes = (inputValue.match(/"/g) || '').length;
        let respectQuote = false;
        let respectSpace = false;

        if (lastSpace > lastQuote) {
            if (numQuotes % 2 === 0) {
                // 'filter "Molecule Set" '
                if (lastSpace !== inputValue.length-1) {
                    respectSpace = true;
                }
            }
            else {
                // 'filter "Molecule S'
                respectQuote = true;
            }
        }
        else {
            // last quote is after last space
            if (numQuotes % 2 === 1) {
                respectQuote = true;
            }
        }

        if (!respectQuote && !respectSpace) {
            return inputValue;
        }

        if (respectSpace && respectQuote) {
            console.warn('Invalid state. Parser must choose space/quote.');
            return inputValue;
        }

        if (respectSpace) {
            const includeSpace = lastSpace !== inputValue.length-1;
            return inputValue.substr(0, lastSpace + (includeSpace ? 1 : 0));
        }
        else if (respectQuote) {
            return inputValue.substr(0, lastQuote);
        }

        return inputValue;
    }

    refs: {
        control: any
        input: any
        menu: any
        menuContainer: any
        wrapper: any
    };

    _blurTimeout: number = undefined;
    _instancePrefix: string = undefined;

    constructor(props: OmniBoxProps) {
        super(props);

        this._handleInputBlur = this._handleInputBlur.bind(this);
        this.handleClickValue = this.handleClickValue.bind(this);
        this.handleInputBlur = this.handleInputBlur.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleInputFocus = this.handleInputFocus.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleOptionClick = this.handleOptionClick.bind(this);
        this.handleOptionFocus = this.handleOptionFocus.bind(this);
        this.removeActionValue = this.removeActionValue.bind(this);
        this.renderMenuOption = this.renderMenuOption.bind(this);

        this.state = {
            actionValues: props.values ? props.values : [],
            activeAction: undefined,
            focusedIndex: -1,
            inputValue: '',
            isFocused: false,
            isOpen: false,
            options: [],
            previewInputValue: ''
        };
    }

    componentWillMount() {
        this._instancePrefix = 'omnibox-' + (++instanceId) + '-';
    }

    componentWillReceiveProps(nextProps: OmniBoxProps) {
        this.setState({
            actionValues: nextProps.values ? nextProps.values : []
        });
    }

    // This method can/will be used in the future if it
    // is desired to activate an ActionValue at any index.
    activateActionValue(index: number) {

        let newActionValues = [];
        let actionValue;
        let actionValues = this.state.actionValues;

        for (let i=0; i < actionValues.length; i++) {
            if (index === i) {
                actionValue = actionValues[i];
            }
            else {
                newActionValues.push(actionValues[i]);
            }
        }

        let inputValue = actionValue.value;
        if (actionValue.action.keyword && inputValue.indexOf(actionValue.action.keyword) !== 0) {
            inputValue = actionValue.action.keyword + ' ' + inputValue;
        }

        this.setState({
            activeAction: actionValue.action,
            actionValues: newActionValues,
            inputValue
        });

        this.fetchOptions(actionValue.action, inputValue);
    }

    activateValue(value: ActionValue) {
        let newInputValue;
        let newActionValues = [];
        let actionValues = this.state.actionValues;

        for (let i=actionValues.length-1; i >= 0; i--) {
            if (value && value.value === actionValues[i].value) {
                newInputValue = actionValues[i].action.keyword + ' ' + actionValues[i].value;
            }
            else {
                newActionValues.push(actionValues[i]);
            }
        }

        if (this.state.inputValue.length > 0) {
            newActionValues.push(this.state.inputValue);
        }

        if (newInputValue) {

            const matches = this.getMatchingActions(newInputValue);

            this.setState({
                activeAction: matches.activeAction,
                inputValue: newInputValue,
                actionValues: newActionValues
            });

            this.fetchOptions(matches.matchingActions, newInputValue);
        }
    }

    cancelBlur() {
        if (this._blurTimeout) {
            clearTimeout(this._blurTimeout);
            this._blurTimeout = undefined;
        }
    }

    cancelEvent(event) {
        event.stopPropagation();
        event.preventDefault();
    }

    completeAction(lastInputValue?: string, optionAction?: Action): boolean {

        let action = optionAction ? optionAction : this.state.activeAction,
            completed = false,
            value = lastInputValue || this.state.inputValue;

        if (value && action) {

            let newActionValues = this.state.actionValues;
            let newInputValue = OmniBox.stripKeyword(value, action);

            newInputValue = newInputValue.trim();

            let tokenize = this.resolveTokenizer(action);

            completed = true;
            action.completeAction(tokenize(newInputValue)).then((result) => {

                if (result.isValid !== false) {
                    newActionValues.push({
                        action,
                        displayValue: result.displayValue,
                        param: result.param,
                        value: result.value
                    });
                }

                let newState: OmniBoxState = {
                    actionValues: newActionValues,
                    activeAction: undefined,
                    focusedIndex: -1,
                    inputValue: '',
                    previewInputValue: ''
                };

                if (this.props.closeOnComplete) {
                    newState.isFocused = false;
                    newState.isOpen = false;
                    newState.options = [];
                }

                this.setState(newState);

                this.fireOnChange(newActionValues);

                if (!this.props.closeOnComplete) {
                    this.fetchOptions(undefined, '');
                }
            });
        }

        return completed;
    }

    fetchOptions(activeActions: Array<Action>, inputValue: string) {
        const { actions } = this.props;

        if (inputValue && activeActions && activeActions.length > 0) {
            if (activeActions.length === 1) {
                const activeAction = activeActions[0];
                const tokenize = this.resolveTokenizer(activeAction);

                activeAction.fetchOptions(tokenize(OmniBox.stripKeyword(inputValue, activeAction)))
                    .then((options) => {

                        let _options = [];
                        for (let i=0; i < options.length; i++) {
                            _options.push(Object.assign({
                                action: activeAction
                            }, options[i]));
                        }

                        this.setState({
                            // auto-focus first option iff one option available
                            focusedIndex: _options.length === 1 ? 0 : -1,
                            options: _options
                        });
                    });
            }
            else {
                // more than one active action, fetch only for default
                let defaultAction: Action,
                    options = [];

                activeActions.forEach(action => {
                    if (action.keyword !== '') {
                        options.push({
                            action,
                            isAction: true,
                            label: '',
                            nextLabel: action.optionalLabel,
                            value: action.keyword
                        });
                    }
                    else {
                        defaultAction = action;
                    }
                });

                if (defaultAction) {
                    let tokenize = this.resolveTokenizer(defaultAction);

                    defaultAction
                        .fetchOptions(tokenize(OmniBox.stripKeyword(inputValue, defaultAction)))
                        .then((defaultOptions) => {

                            defaultOptions.forEach((defaultOption) => {
                                options.push(Object.assign({
                                    action: defaultAction
                                }, defaultOption));
                            });

                            this.setState({
                                options
                            })
                        });
                }
                else {
                    this.setState({
                        options
                    });
                }
            }
        }
        else {
            // show all available actions
            this.setState({
                options: actions.map((action: Action) => {
                    return {
                        action,
                        isAction: true,
                        label: '',
                        nextLabel: action.optionalLabel,
                        value: action.keyword
                    }
                })
            })
        }
    }

    fireOnChange(actionValues: Array<ActionValue>) {
        if (this.props.onChange) {
            this.props.onChange(this.mergeActionValues(actionValues), this.props.actions);
        }
    }

    focus() {
        if (!this.refs.input) return;
        this.refs.input.focus();

        if (this.props.openAfterFocus) {
            this.setState({
                isOpen: true
            });

            this.fetchOptions(this.state.activeAction ? [this.state.activeAction] : undefined, this.state.inputValue);
        }
    }

    focusAdjacentOption(dir: 'next' | 'previous') {
        const { focusedIndex, isOpen, options } = this.state;

        if (isOpen) {

            let index = -1;
            if (dir === 'next') {
                index = focusedIndex + 1;
            }
            else if (dir === 'previous') {
                index = focusedIndex - 1 > -2 ? focusedIndex - 1 : options.length - 1;
            }

            index = index % options.length;
            const previewInputValue = options[index] && options[index].value !== undefined ? options[index].value : '';

            this.setState({
                focusedIndex: index,
                previewInputValue
            })
        }
    }

    focusNextOption() {
        this.focusAdjacentOption('next');
    }

    focusPreviousOption() {
        this.focusAdjacentOption('previous');
    }

    getMatchingActions(inputValue: string): {activeAction?: Action, matchingActions: Array<Action>} {
        const { actions } = this.props;

        if (inputValue) {

            let defaultAction: Action,
                exactAction: Action,
                matchingActions: Array<Action> = [];

            // determine active keyword
            const inputKeyword = inputValue ? inputValue.toLowerCase().split(' ')[0] : '';

            for (let a=0; a < actions.length; a++) {
                let actionKeyword = actions[a].keyword.toLowerCase();

                if (actionKeyword === '') {
                    defaultAction = actions[a];
                    matchingActions.push(actions[a]);
                }
                else if (actionKeyword === inputKeyword) {
                    exactAction = actions[a];
                    matchingActions.push(actions[a]);
                }
                else if (actionKeyword.indexOf(inputKeyword) === 0) {
                    matchingActions.push(actions[a]);
                }
            }

            if (exactAction) {
                return {
                    activeAction: exactAction,
                    matchingActions: [exactAction]
                };
            }

            return {
                activeAction: defaultAction,
                matchingActions
            };
        }

        return {
            matchingActions: actions
        };
    }

    handleBackspace(event) {
        if (this.state.inputValue.length > 0) {
            return;
        }

        // if 'backspace' removal is allowed and there are actionValues present, activate the last actionValue
        if (this.props.backspaceRemoves && this.state.actionValues.length > 0) {
            this.cancelEvent(event);
            this.removeActionValue(this.state.actionValues.length - 1);
        }
    }

    handleClickValue(value: ActionValue, event) {
        this.cancelBlur();
        this.cancelEvent(event);
        this.activateValue(value);
        this.focus();
    }

    _handleInputBlur() {
        // completeAction will handle resets, however, it may not be able to complete an invalid
        // action. Therefore, set the state according to blur.
        if (!this.completeAction()) {
            this.setState({
                activeAction: undefined,
                focusedIndex: -1,
                isFocused: false,
                isOpen: false,
                options: []
            });
        }
    }

    handleInputBlur() {
        if (this.state.inputValue.length) {
            this._blurTimeout = setTimeout(this._handleInputBlur, 200);
        }
        else {
            this._handleInputBlur();
        }
    }

    handleInputChange(event) {
        let newInputValue = event.target.value;
        if (this.state.inputValue !== event.target.value && this.props.onInputChange) {
            let nextState = this.props.onInputChange(newInputValue);
            // Note: != used deliberately here to catch undefined and null
            if (nextState != null && typeof nextState !== 'object') {
                newInputValue = '' + nextState;
            }
        }

        let trimmed = newInputValue.trim();

        // Once a user clears the inputValue the onChange should be fired since clearing an action is the same
        // as completing an action.
        let requireOnChange = false;
        if (trimmed.length == 0 && this.state.inputValue.length > 0) {
            requireOnChange = true;
        }

        const matches = this.getMatchingActions(trimmed);

        this.setState({
            activeAction: matches.activeAction,
            isOpen: true,
            inputValue: newInputValue,
            previewInputValue: ''
        });

        if (requireOnChange) {
            this.fireOnChange(this.state.actionValues);
        }

        this.fetchOptions(matches.matchingActions, newInputValue);
    }

    handleInputFocus(event) {
        if (this.props.disabled || this.state.isFocused) {
            return;
        }

        this.focus();
    }

    handleKeyDown(event) {
        if (this.props.disabled) return;

        switch (event.keyCode) {
            case 8: // backspace
                this.handleBackspace(event);
                return;
            case 9: // tab
                if (event.shiftKey || !this.state.isOpen || !this.props.tabSelectsValue) {
                    return;
                }

                if (this.state.inputValue || this.state.activeAction) {
                    this.cancelEvent(event);
                    this.selectFocusedOption(false /* canComplete */);
                }
                break;
            case 13: // enter key
                this.cancelEvent(event);
                this.selectFocusedOption();
                break;
            case 27: // escape
                if (!this.state.isOpen) return;
                this.cancelEvent(event);
                this.setState({
                    isOpen: false
                });
                break;
            case 38: // up
                this.cancelEvent(event);
                this.focusPreviousOption();
                break;
            case 40: // down
                this.cancelEvent(event);
                this.focusNextOption();
                break;
            default:
                return;
        }
    }

    handleMouseDown(event) {
        // if the event was triggered by a mousedown and not the primary
        // button, or if the component is disabled, ignore it.
        if (this.props.disabled || (event.type === 'mousedown' && event.button !== 0)) {
            return;
        }

        if (event.target.tagName === 'INPUT') {
            return;
        }
        else if ($(event.target).closest('.' + valueClassName).length > 0) {
            return;
        }

        this.cancelEvent(event);

        this.handleInputFocus(event);
    }

    handleOptionClick(option: ActionOption) {
        this.cancelBlur();

        if (option.selectable !== false) {
            let newInputValue = this.resolveInputValue(option);

            if (option.isComplete) {
                this.completeAction(newInputValue, option.action);
            }
            else {
                const nextState: OmniBoxState = {
                    activeAction: option.action,
                    focusedIndex: -1,
                    inputValue: newInputValue,
                    previewInputValue: ''
                };

                this.setState(nextState);

                this.fetchOptions([nextState.activeAction], nextState.inputValue);
            }
        }
    }

    handleOptionFocus(option: ActionOption, index: number) {
        this.setState({
            focusedIndex: index
        })
    }

    mergeActionValues(actionValues: Array<ActionValue>): Array<ActionValueCollection> {
        let newActionValueCollection: Array<ActionValueCollection> = [];

        for (let a=0; a < actionValues.length; a++) {
            let found = false;
            for (let i=0; i < newActionValueCollection.length; i++) {
                if (newActionValueCollection[i].action.isEqual(actionValues[a].action)) {
                    newActionValueCollection[i].values.push(actionValues[a]);
                    found = true;
                }
            }

            if (!found) {
                newActionValueCollection.push({
                    action: actionValues[a].action,
                    values: [actionValues[a]]
                });
            }
        }

        return newActionValueCollection;
    }

    removeActionValue(actionValueIndex: number) {
        const { actionValues } = this.state;

        if (actionValueIndex < actionValues.length) {

            let newActionValues = [];
            for (let i=0; i < actionValues.length; i++) {
                if (i !== actionValueIndex) {
                    newActionValues.push(actionValues[i]);
                }
            }

            this.setState({
                actionValues: newActionValues
            });

            this.fireOnChange(newActionValues);
        }
    }

    resolveInputValue(option: ActionOption): string {
        let newInputValue = this.state.inputValue;

        if (option.isAction) {
            let keyword = option.action.keyword;
            return keyword + (keyword.length > 0 ? ' ' : '');
        }

        if (option.value !== undefined) {

            newInputValue = OmniBox.stripLastToken(newInputValue);
            const sep = newInputValue.length > 0 ? (newInputValue[newInputValue.length - 1] == ' ' ? '' : ' ') : '';
            const value = sep + option.value + (option.isComplete || newInputValue.length == 0 ? '' : ' ');

            if (option.appendValue !== false) {
                newInputValue += value;
            }
            else {
                newInputValue = value;
            }
        }

        return newInputValue;
    }

    resolveTokenizer(action?: Action): Function {
        // In the future, could possibly ask actions for their tokenizer to allow them
        // to parse input differently.
        return OmniBox.defaultTokenizer;
    }

    selectFocusedOption(canComplete: boolean = true) {
        const { focusedIndex, options } = this.state;

        if (focusedIndex > -1) {
            this.handleOptionClick(options[focusedIndex]);
        }
        else if (canComplete !== false) {
            this.completeAction();
        }
    }

    renderInput() {

        const inputProps = Object.assign({}, this.props.inputProps, {
            className: classNames('OmniBox-input', this.props.inputProps.className),
            minWidth: '5px',
            onBlur: this.handleInputBlur,
            onChange: this.handleInputChange,
            onFocus: this.handleInputFocus,
            ref: 'input',
            value: this.renderInputValue()
        });

        return <AutosizeInput {...inputProps} />;
    }

    renderInputValue(): string {
        const { inputValue, previewInputValue } = this.state;
        let value = inputValue;

        if (previewInputValue) {
            if (value && value.length > 0) {
                if (value[value.length-1] === ' ') {
                    value += previewInputValue.trim();
                }
            }
            else {
                value = previewInputValue.trim();
            }
        }

        return value;
    }

    renderMenu() {

        return (
            <div ref="menuContainer">
                <ul ref="menu" className="OmniBox-autocomplete">
                    {this.state.options.map(this.renderMenuOption)}
                </ul>
            </div>
        );
    }

    renderMenuOption(option, i) {
        const isFocused = this.state.focusedIndex === i;

        return (
            <Option actionOption={option}
                    text={option.label}
                    nextText={option.nextLabel}
                    key={`action-option-${i}`}
                    index={i}
                    isAction={option.isAction}
                    isFocused={isFocused}
                    isSelected={isFocused}
                    onFocus={this.handleOptionFocus}
                    onOptionClick={this.handleOptionClick} />
        );
    }

    renderValue(): any {
        const { actionValues, inputValue, isOpen, previewInputValue } = this.state;

        // empty
        if (!isOpen && actionValues.length === 0 && inputValue.length === 0 && previewInputValue.length === 0) {
            return <div className="OmniBox-placeholder">{this.props.placeholder}</div>;
        }

        if (actionValues.length > 0) {
            return actionValues.map((actionValue: ActionValue, i): any => (
                <Value
                    key={`value-${i}`}
                    index={i}
                    actionValue={actionValue}
                    onClick={this.handleClickValue}
                    onRemove={this.removeActionValue} />
            ));
        }

        return null;
    }

    render() {

        let className = classNames('OmniBox', 'OmniBox--multi', this.props.className, {
            'is-disabled': this.props.disabled,
            'is-focused': this.state.isFocused,
            'is-open': this.state.isOpen
        });

        return (
            <div ref="wrapper"
                 className={className}>
                <div ref="control"
                     className="OmniBox-control"
                     onKeyDown={this.handleKeyDown}
                     onMouseDown={this.handleMouseDown}>
                    <span className="OmniBox-multi-value-wrapper">
                        {this.renderValue()}
                        {this.renderInput()}
                    </span>
                </div>
                {this.state.isOpen && this.renderMenu()}
            </div>
        )
    }
}