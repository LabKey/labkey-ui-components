import * as React from "react";
import {Col, FormControl, Row} from "react-bootstrap";
import {createFormInputId, createFormInputName, getNameFromId} from "../../actions/actions";
import {
    DOMAIN_FIRST_FILTER_TYPE,
    DOMAIN_FIRST_FILTER_VALUE,
    DOMAIN_SECOND_FILTER_TYPE, DOMAIN_SECOND_FILTER_VALUE,
} from "../../constants";

import { Filter } from '@labkey/api';
import {ReactElement} from "react";

interface FiltersProps {
    validatorIndex: number
    expression?: string
    mvEnabled: boolean
    type: string
    range?: boolean
    prefix?: string
    firstFilterTypeLabel?: string
    firstFilterValueLabel?: string
    secondFilterTypeLabel?: string
    secondFilterValueLabel?: string
    firstFilterTooltip?: ReactElement
    secondFilterTooltip?: ReactElement
    onChange: (expression: string) => any
}

interface FiltersState {
    filterSet: FilterSet
    firstFilterTypes: Array<{name: string, value: string}>
    secondFilterTypes: Array<{name: string, value: string}>
}

interface FilterSet {
    firstFilterType?: string
    firstFilterValue?: string
    secondFilterType?: string
    secondFilterValue?: string
}

// TODO make this type available from @labkey/api Filter
export type JsonType = 'boolean' | 'date' | 'float' | 'int' | 'string';

export class Filters extends React.PureComponent<FiltersProps, FiltersState> {

    labelWidth = 4;
    fieldWidth = 8;

    constructor(props) {
        super(props);

        this.state = {
            filterSet: Filters.parseFilterString(props.expression, props.prefix),
            firstFilterTypes: this.getFilterTypes(true),
            secondFilterTypes: this.getFilterTypes(false),
        };
    }

    // TODO: put these in our Filter API
    getRangeFilters = (): Array<any> => {
        const { type } = this.props;

        const filterTypes = Array<any>();

        if (type === 'date') {
            filterTypes.push(Filter.Types.DATE_EQUAL);
            filterTypes.push(Filter.Types.DATE_NOT_EQUAL);
            filterTypes.push(Filter.Types.DATE_GREATER_THAN);
            filterTypes.push(Filter.Types.DATE_GREATER_THAN_OR_EQUAL);
            filterTypes.push(Filter.Types.DATE_LESS_THAN);
            filterTypes.push(Filter.Types.DATE_LESS_THAN_OR_EQUAL);
        }
        else {
            filterTypes.push(Filter.Types.EQUAL);
            filterTypes.push(Filter.Types.NOT_EQUAL);
            filterTypes.push(Filter.Types.GREATER_THAN);
            filterTypes.push(Filter.Types.GREATER_THAN_OR_EQUAL);
            filterTypes.push(Filter.Types.LESS_THAN);
            filterTypes.push(Filter.Types.LESS_THAN_OR_EQUAL);
        }

        return filterTypes;
    };

    getFilterTypes = (first: boolean): Array<{name: string, value: string}> => {
        const { type, range, mvEnabled } = this.props;

        let filterTypes = Array<{name: string, value: string}>();
        if (!first) {
            filterTypes.push({name: 'No other filter', value: 'None'})
        }

        let filters;
        if (!range) {
            filters = Filter.getFilterTypesForType(type as JsonType, mvEnabled);
        }
        else {
            filters = this.getRangeFilters();
        }

        filterTypes = filterTypes.concat(filters.map((type) => {
            return {name: type.getLongDisplayText(), value: type.getURLSuffix()}
        }));

        return filterTypes;
    };

    static describeExpression = (expression: string, prefix?: string): string => {
        const filterSet = Filters.parseFilterString(expression, prefix);

        let expressionString = '';
        if (filterSet.firstFilterType) {
            const firstType = Filter.getFilterTypeForURLSuffix(filterSet.firstFilterType);
            expressionString = firstType.getDisplayText();

            if (filterSet.firstFilterValue) {
                expressionString += ' ' + filterSet.firstFilterValue;
            }
        }

        if (filterSet.secondFilterType) {
            const secondType = Filter.getFilterTypeForURLSuffix(filterSet.secondFilterType);
            expressionString += ' and ' + secondType.getDisplayText();

            if (filterSet.secondFilterValue) {
                expressionString += ' ' + filterSet.secondFilterValue;
            }
        }

        return expressionString;
    }

    static parseSingleFilter = (filterString: string, prefix?: string): {type: string, value: string} => {
        const parts = filterString.split('=');

        let returnVal = {type: undefined, value: undefined};

        if (parts.length > 0 && parts[0].length > 0) {
            returnVal.type = parts[0].substring(1 + (prefix ? prefix.length : 0)); // remove ~
        }

        if (parts.length > 1) {
            returnVal.value = parts[1];
        }

        return returnVal;
    };

    static parseFilterString = (expression: string, prefix?: string): FilterSet => {

        let parts;

        if (expression) {
            parts = expression.split('&');
        }

        if (!parts || parts.length < 1) {
            return ({
                firstFilterType: '',
                firstFilterValue: '',
                secondFilterType: '',
                secondFilterValue: ''
            } as FilterSet)
        }

        const firstFilter = Filters.parseSingleFilter(parts[0], prefix);

        let secondFilter;
        if ( parts.length > 1) {
            secondFilter = Filters.parseSingleFilter(parts[1], prefix);
        }

        return ({
                firstFilterType: firstFilter.type,
                firstFilterValue: firstFilter.value,
                secondFilterType: (secondFilter ? secondFilter.type : undefined),
                secondFilterValue: (secondFilter ? secondFilter.value : undefined)
            })
    };

    getFilterString = (filters: FilterSet): string => {
        const { prefix } = this.props;

        let filterString = (prefix ? prefix : '') + '~' + filters.firstFilterType + '=' + filters.firstFilterValue;

        if (filters.secondFilterType) {
            filterString = filterString.concat('&' + (prefix ? prefix : '') + '~' + filters.secondFilterType + '=' + filters.secondFilterValue);
        }

        return filterString;
    };

    onChange = (evt) => {
        const { onChange } = this.props;

        let value = evt.target.value;
        let name = getNameFromId(evt.target.id);

        const updatedFilters = {...this.state['filterSet'], [name]: value};
        this.setState(() => ({filterSet: updatedFilters}));

        onChange(this.getFilterString(updatedFilters));

    };

    getFormControlType = (): string => {
        const { type } = this.props;

        if (type === 'date') {
            return 'date';
        }

        if (type === 'int' || type === 'float') {
            return 'number'
        }

        return 'text';
    }

    render() {
        const { validatorIndex, type, firstFilterTypeLabel, firstFilterValueLabel, secondFilterTypeLabel, secondFilterValueLabel,
            firstFilterTooltip, secondFilterTooltip } = this.props;
        const { firstFilterTypes, secondFilterTypes, filterSet } = this.state;

        return(
            <>
                <Row className='domain-validator-filter-type-row'>
                    <Col xs={this.labelWidth}>
                        <div>
                            {firstFilterTypeLabel !== undefined ? firstFilterTypeLabel : 'Filter Type:'}
                            {firstFilterTooltip ? firstFilterTooltip : ''}
                        </div>
                    </Col>
                    <Col xs={this.fieldWidth}>
                        <div>
                            <FormControl
                                componentClass="select"
                                id={createFormInputId(DOMAIN_FIRST_FILTER_TYPE, validatorIndex)}
                                name={createFormInputName(DOMAIN_FIRST_FILTER_TYPE)}
                                value={filterSet.firstFilterType ? filterSet.firstFilterType : (type === 'date' ? 'dateeq' : 'eq')}
                                onChange={this.onChange}
                                required
                            >
                                {
                                    firstFilterTypes.map(
                                        (type, i) => (<option key={i} value={type.value}>{type.name}</option>
                                        ))
                                }
                            </FormControl>
                        </div>
                    </Col>
                </Row>
                <Row className='domain-validator-filter-row'>
                    <Col xs={this.labelWidth}>
                        <div>
                            {firstFilterValueLabel !== undefined ? firstFilterValueLabel : 'Filter Value:'}
                        </div>
                    </Col>
                    <Col xs={this.fieldWidth}>
                        <div>
                            <FormControl
                                type={this.getFormControlType()}
                                id={createFormInputId(DOMAIN_FIRST_FILTER_VALUE, validatorIndex)}
                                name={createFormInputName(DOMAIN_FIRST_FILTER_VALUE)}
                                value={filterSet.firstFilterValue}
                                required
                                onChange={this.onChange}
                            />
                        </div>
                    </Col>
                </Row>
                <Row className='domain-validator-filter-type-row'>
                    <Col xs={this.labelWidth}>
                        <div>
                            {secondFilterTypeLabel !== undefined ? secondFilterTypeLabel : 'and:'}
                            {secondFilterTooltip ? secondFilterTooltip : ''}
                        </div>
                    </Col>
                    <Col xs={this.fieldWidth}>
                        <div>
                            <FormControl
                                componentClass="select"
                                id={createFormInputId(DOMAIN_SECOND_FILTER_TYPE, validatorIndex)}
                                name={createFormInputName(DOMAIN_SECOND_FILTER_TYPE)}
                                value={filterSet.secondFilterType}
                                onChange={this.onChange}
                            >
                                {
                                    secondFilterTypes.map(
                                        (type, i) => (<option key={i} value={type.value}>{type.name}</option>
                                        ))
                                }
                            </FormControl>
                        </div>
                    </Col>
                </Row>
                <Row className='domain-validator-filter-bottom'>
                    <Col xs={this.labelWidth}>
                        <div>
                            {secondFilterValueLabel !== undefined ? secondFilterValueLabel : 'Filter Value:'}
                        </div>
                    </Col>
                    <Col xs={this.fieldWidth}>
                        <div>
                            <FormControl
                                type={this.getFormControlType()}
                                id={createFormInputId(DOMAIN_SECOND_FILTER_VALUE, validatorIndex)}
                                name={createFormInputName(DOMAIN_SECOND_FILTER_VALUE)}
                                value={filterSet.secondFilterValue}
                                onChange={this.onChange}
                            />
                        </div>
                    </Col>
                </Row>
            </>
        )
    }
}