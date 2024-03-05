import React, { ReactNode } from 'react';
import { Col, FormControl, Row } from 'react-bootstrap';

import { Filter, Utils } from '@labkey/api';

import { createFormInputId, createFormInputName, getNameFromId } from '../utils';
import {
    DOMAIN_FILTER_HASANYVALUE,
    DOMAIN_FIRST_FILTER_TYPE,
    DOMAIN_FIRST_FILTER_VALUE,
    DOMAIN_SECOND_FILTER_TYPE,
    DOMAIN_SECOND_FILTER_VALUE,
} from '../constants';

import { JsonType } from '../PropDescType';

export const NO_FILTER_TYPE = 'None';

interface FiltersProps {
    domainIndex: number;
    expression?: string;
    firstFilterTooltip?: ReactNode;
    firstFilterTypeLabel?: string;
    firstFilterValueLabel?: string;
    mvEnabled: boolean;
    onChange: (expression: string) => any;
    prefix?: string;
    range?: boolean;
    secondFilterTooltip?: ReactNode;
    secondFilterTypeLabel?: string;
    secondFilterValueLabel?: string;
    type: JsonType;
    validatorIndex: number;
}

interface FiltersState {
    filterSet: FilterSet;
    firstFilterTypes: Array<{ name: string; value: string }>;
    secondFilterTypes: Array<{ name: string; value: string }>;
}

interface FilterSet {
    firstFilterType?: string;
    firstFilterValue?: string;
    secondFilterType?: string;
    secondFilterValue?: string;
}

export class Filters extends React.PureComponent<FiltersProps, FiltersState> {
    labelWidth = 4;
    fieldWidth = 8;

    static defaultProps = {
        firstFilterTypeLabel: 'First Condition *',
        firstFilterValueLabel: '',
        secondFilterTypeLabel: 'Second Condition',
        secondFilterValueLabel: '',
    };

    constructor(props) {
        super(props);

        this.state = {
            filterSet: Filters.parseFilterString(props.expression, props.prefix),
            firstFilterTypes: this.getFilterTypes(true),
            secondFilterTypes: this.getFilterTypes(false),
        };
    }

    // TODO: put these in our Filter API
    getRangeFilters = (): any[] => {
        const { type } = this.props;

        const filterTypes = Array<any>();

        if (type === 'date') {
            filterTypes.push(Filter.Types.DATE_EQUAL);
            filterTypes.push(Filter.Types.DATE_NOT_EQUAL);
            filterTypes.push(Filter.Types.DATE_GREATER_THAN);
            filterTypes.push(Filter.Types.DATE_GREATER_THAN_OR_EQUAL);
            filterTypes.push(Filter.Types.DATE_LESS_THAN);
            filterTypes.push(Filter.Types.DATE_LESS_THAN_OR_EQUAL);
        } else {
            filterTypes.push(Filter.Types.EQUAL);
            filterTypes.push(Filter.Types.NOT_EQUAL);
            filterTypes.push(Filter.Types.GREATER_THAN);
            filterTypes.push(Filter.Types.GREATER_THAN_OR_EQUAL);
            filterTypes.push(Filter.Types.LESS_THAN);
            filterTypes.push(Filter.Types.LESS_THAN_OR_EQUAL);
        }

        return filterTypes;
    };

    getFilterTypes = (first: boolean): Array<{ name: string; value: string }> => {
        const { type, range, mvEnabled } = this.props;

        let filterTypes = Array<{ name: string; value: string }>();
        if (!first) {
            filterTypes.push({ name: 'No other filter', value: NO_FILTER_TYPE });
        }

        let filters;
        if (!range) {
            filters = Filter.getFilterTypesForType(type, mvEnabled);
        } else {
            filters = this.getRangeFilters();
        }

        filterTypes = filterTypes.concat(
            filters.map(type => {
                const suffix = type.getURLSuffix();
                return { name: type.getLongDisplayText(), value: suffix ? suffix : DOMAIN_FILTER_HASANYVALUE };
            })
        );

        return filterTypes;
    };

    static isValid = (expression: string, prefix?: string) => {
        const filterSet = Filters.parseFilterString(expression, prefix);

        let valid = false;
        if (Filters.hasFilterType(filterSet.firstFilterType)) {
            valid = !!Filters.validFilter(filterSet.firstFilterType, filterSet.firstFilterValue);
        }

        if (valid && Filters.hasFilterType(filterSet.secondFilterType)) {
            valid = !!Filters.validFilter(filterSet.secondFilterType, filterSet.secondFilterValue);
        }

        return valid;
    };

    static hasFilterType = (type: string) => {
        return type && Utils.isString(type) && type.length > 0 && type !== NO_FILTER_TYPE;
    };

    static validFilter = (type: string, value: string) => {
        return type && (value || !Filters.isDataValueRequiredForType(type));
    };

    static describeExpression = (expression: string, prefix?: string): string => {
        const filterSet = Filters.parseFilterString(expression, prefix);

        let expressionString = 'Invalid expression';
        if (Filters.validFilter(filterSet.firstFilterType, filterSet.firstFilterValue)) {
            const firstType = Filters.getFilterFromPrefix(filterSet.firstFilterType);
            expressionString = firstType.getDisplayText();

            if (filterSet.firstFilterValue) {
                expressionString += ' ' + filterSet.firstFilterValue;
            }
        }

        if (
            Filters.hasFilterType(filterSet.secondFilterType) &&
            Filters.validFilter(filterSet.secondFilterType, filterSet.secondFilterValue)
        ) {
            const secondType = Filters.getFilterFromPrefix(filterSet.secondFilterType);
            expressionString += ' and ' + secondType.getDisplayText();

            if (filterSet.secondFilterValue) {
                expressionString += ' ' + filterSet.secondFilterValue;
            }
        }

        return expressionString;
    };

    static parseSingleFilter = (filterString: string, prefix?: string): { type: string; value: string } => {
        const parts = filterString.split('=');

        const returnVal = { type: undefined, value: undefined };

        if (parts.length > 0 && parts[0].length > 0) {
            returnVal.type = decodeURIComponent(parts[0]).substring(1 + (prefix ? prefix.length : 0)); // remove ~
        }

        if (parts.length > 1) {
            returnVal.value = decodeURIComponent(parts[1]);
        }

        return returnVal;
    };

    static parseFilterString = (expression: string, prefix?: string): FilterSet => {
        let parts;

        if (expression) {
            parts = expression.split('&');
        }

        if (!parts || parts.length < 1) {
            return {
                firstFilterType: 'eq',
                firstFilterValue: '',
                secondFilterType: NO_FILTER_TYPE,
                secondFilterValue: '',
            } as FilterSet;
        }

        const firstFilter = Filters.parseSingleFilter(parts[0], prefix);

        let secondFilter;
        if (parts.length > 1) {
            secondFilter = Filters.parseSingleFilter(parts[1], prefix);
        }

        return {
            firstFilterType: firstFilter.type,
            firstFilterValue: firstFilter.value,
            secondFilterType: secondFilter ? secondFilter.type : undefined,
            secondFilterValue: secondFilter ? secondFilter.value : undefined,
        };
    };

    getFilterString = (filters: FilterSet): string => {
        const { prefix } = this.props;
        const encodedPrefix = encodeURIComponent(prefix ? prefix : '') + '~';

        let filterString = encodedPrefix + filters.firstFilterType + '=' + encodeURIComponent(filters.firstFilterValue);
        if (Filters.hasFilterType(filters.secondFilterType)) {
            filterString = filterString.concat(
                '&' + encodedPrefix + filters.secondFilterType + '=' + encodeURIComponent(filters.secondFilterValue)
            );
        }

        return filterString;
    };

    static getFilterFromPrefix = (type: string) => {
        let filter;

        // Has Any Value has a value of "", which doesn't seem to resolve well in the api
        if (type === DOMAIN_FILTER_HASANYVALUE) {
            filter = Filter.Types.HAS_ANY_VALUE;
        } else if (type) {
            filter = Filter.getFilterTypeForURLSuffix(type);
        }

        return filter;
    };

    static isDataValueRequiredForType = (type?: string) => {
        const filter = Filters.getFilterFromPrefix(type);
        if (filter) {
            return filter.isDataValueRequired();
        }

        return false;
    };

    isDataValueRequired = (second?: boolean) => {
        const { filterSet } = this.state;
        const type = filterSet[second ? 'secondFilterType' : 'firstFilterType'];

        return Filters.isDataValueRequiredForType(type);
    };

    onChange = evt => {
        const { onChange } = this.props;

        const value = evt.target.value;
        const name = getNameFromId(evt.target.id);

        let updatedFilters = { ...this.state['filterSet'], [name]: value };

        // Clear filter value for value not required types
        if (name === DOMAIN_FIRST_FILTER_TYPE || name === DOMAIN_SECOND_FILTER_TYPE) {
            if (!Filters.isDataValueRequiredForType(value)) {
                updatedFilters = {
                    ...updatedFilters,
                    [name === DOMAIN_FIRST_FILTER_TYPE ? DOMAIN_FIRST_FILTER_VALUE : DOMAIN_SECOND_FILTER_VALUE]: '',
                };
            }
        }

        this.setState(() => ({ filterSet: updatedFilters }));

        onChange(this.getFilterString(updatedFilters));
    };

    getFormControlType = (): string => {
        const { type } = this.props;

        if (type === 'date') {
            return 'date';
        }

        if (type === 'int' || type === 'float') {
            return 'number';
        }

        return 'text';
    };

    render() {
        const {
            validatorIndex,
            type,
            firstFilterTypeLabel,
            firstFilterValueLabel,
            secondFilterTypeLabel,
            secondFilterValueLabel,
            firstFilterTooltip,
            secondFilterTooltip,
            domainIndex,
        } = this.props;
        const { firstFilterTypes, secondFilterTypes, filterSet } = this.state;

        return (
            <>
                <div className="row domain-validator-filter-type-row">
                    <Col xs={this.labelWidth}>
                        <div id="domain-filter-type-label-1">
                            {firstFilterTypeLabel}
                            {firstFilterTooltip ? firstFilterTooltip : ''}
                        </div>
                    </Col>
                    <Col xs={this.fieldWidth}>
                        <div>
                            <FormControl
                                componentClass="select"
                                id={createFormInputId(DOMAIN_FIRST_FILTER_TYPE, domainIndex, validatorIndex)}
                                name={createFormInputName(DOMAIN_FIRST_FILTER_TYPE)}
                                value={
                                    filterSet.firstFilterType !== undefined
                                        ? filterSet.firstFilterType
                                        : type === 'date'
                                        ? 'dateeq'
                                        : 'eq'
                                }
                                onChange={this.onChange}
                                required
                            >
                                {firstFilterTypes.map((type, i) => (
                                    <option key={i} value={type.value}>
                                        {type.name}
                                    </option>
                                ))}
                            </FormControl>
                        </div>
                    </Col>
                </div>
                <div className="row domain-validator-filter-row">
                    <Col xs={this.labelWidth}>
                        <div id="domain-filter-value-label-1">
                            {firstFilterValueLabel !== undefined ? firstFilterValueLabel : 'Filter Value'}
                        </div>
                    </Col>
                    <Col xs={this.fieldWidth}>
                        <div>
                            <FormControl
                                type={this.getFormControlType()}
                                id={createFormInputId(DOMAIN_FIRST_FILTER_VALUE, domainIndex, validatorIndex)}
                                name={createFormInputName(DOMAIN_FIRST_FILTER_VALUE)}
                                value={filterSet.firstFilterValue !== undefined ? filterSet.firstFilterValue : ''}
                                disabled={!this.isDataValueRequired(false)}
                                required
                                onChange={this.onChange}
                            />
                        </div>
                    </Col>
                </div>
                <div className="row domain-validator-filter-type-row">
                    <Col xs={this.labelWidth}>
                        <div id="domain-filter-type-label-2">
                            {secondFilterTypeLabel}
                            {secondFilterTooltip ? secondFilterTooltip : ''}
                        </div>
                    </Col>
                    <Col xs={this.fieldWidth}>
                        <div>
                            <FormControl
                                componentClass="select"
                                id={createFormInputId(DOMAIN_SECOND_FILTER_TYPE, domainIndex, validatorIndex)}
                                name={createFormInputName(DOMAIN_SECOND_FILTER_TYPE)}
                                value={filterSet.secondFilterType ? filterSet.secondFilterType : NO_FILTER_TYPE}
                                onChange={this.onChange}
                            >
                                {secondFilterTypes.map((type, i) => (
                                    <option key={i} value={type.value}>
                                        {type.name}
                                    </option>
                                ))}
                            </FormControl>
                        </div>
                    </Col>
                </div>
                <div className="row domain-validator-filter-bottom">
                    <Col xs={this.labelWidth}>
                        <div id="domain-filter-value-label-2">
                            {secondFilterValueLabel !== undefined ? secondFilterValueLabel : 'Filter Value'}
                        </div>
                    </Col>
                    <Col xs={this.fieldWidth}>
                        <div>
                            <FormControl
                                type={this.getFormControlType()}
                                id={createFormInputId(DOMAIN_SECOND_FILTER_VALUE, domainIndex, validatorIndex)}
                                name={createFormInputName(DOMAIN_SECOND_FILTER_VALUE)}
                                value={filterSet.secondFilterValue !== undefined ? filterSet.secondFilterValue : ''}
                                disabled={!this.isDataValueRequired(true)}
                                onChange={this.onChange}
                            />
                        </div>
                    </Col>
                </div>
            </>
        );
    }
}
