import React, { PureComponent } from 'react';

import { List } from 'immutable';

import { FIELD_EDITOR_SAMPLE_TYPES_TOPIC, HelpLink } from '../../util/helpLinks';

import { isLoading, LoadingState } from '../../../public/LoadingState';

import { LabelHelpTip } from '../base/LabelHelpTip';

import { isFieldFullyLocked } from './propertiesUtil';
import { fetchQueries } from './actions';
import { createFormInputId, createFormInputName } from './utils';
import { DOMAIN_FIELD_SAMPLE_TYPE, DOMAIN_VALIDATOR_LOOKUP } from './constants';
import {
    DomainField,
    encodeLookup,
    IDomainField,
    IFieldChange,
    ITypeDependentProps,
    LOOKUP_VALIDATOR,
    LookupInfo,
    SAMPLE_TYPE_ALL_OPTION_VALUE,
} from './models';

import { SectionHeading } from './SectionHeading';
import { DomainDesignerCheckbox } from './DomainDesignerCheckbox';

interface SampleFieldProps extends ITypeDependentProps {
    container: string;
    field: DomainField;
    onMultiChange: (changes: List<IFieldChange>) => void;
    original: Partial<IDomainField>;
    value?: string;
}

interface State {
    loadingState: LoadingState;
    sampleTypes: List<LookupInfo>;
    validateLookup: boolean;
}

export class SampleFieldOptions extends PureComponent<SampleFieldProps, State> {
    state: Readonly<State> = {
        loadingState: LoadingState.INITIALIZED,
        sampleTypes: List(),
        validateLookup: false,
    };

    componentDidMount = async (): Promise<void> => {
        const { original, field } = this.props;

        this.setState({ loadingState: LoadingState.LOADING });

        try {
            const queries = await fetchQueries(undefined, 'samples');

            const sampleTypes = queries
                .reduce((list, q) => list.concat(q.getLookupInfo(original.rangeURI)).toList(), List<LookupInfo>())
                .filter(st => st.type.isInteger()) // Remove rowId duplicates
                .toList();

            this.setState({
                loadingState: LoadingState.LOADED,
                sampleTypes,
                validateLookup: field.isNew() || !!field.lookupValidator,
            });
        } catch (e) {
            console.error('Failed to load sample field information', e);
            this.setState({ loadingState: LoadingState.LOADED });
        }
    };

    onFieldChange = (evt): void => {
        this.props.onChange(evt.target.id, evt.target.value);
    };

    addLookupValidator = (evt): void => {
        let newLookupValidator;
        if (evt.target.checked) {
            newLookupValidator = LOOKUP_VALIDATOR;
            this.setState({ validateLookup: true });
        } else {
            this.setState({ validateLookup: false });
        }

        this.props.onMultiChange(List<IFieldChange>([{ id: evt.target.id, value: newLookupValidator }]));
    };

    render() {
        const { index, label, lockType, value, domainIndex, field } = this.props;
        const { loadingState, sampleTypes, validateLookup } = this.state;
        const isLoaded = !isLoading(loadingState);

        const id = createFormInputId(DOMAIN_FIELD_SAMPLE_TYPE, domainIndex, index);

        return (
            <div>
                <div className="row">
                    <div className="col-xs-12">
                        <SectionHeading title={label} />
                    </div>
                </div>
                <div className="row">
                    <div className="col-xs-5">
                        <div className="domain-field-label">
                            Sample lookup to
                            <LabelHelpTip title="Sample Reference">
                                <p>
                                    Select the sample reference for this field. You can choose to reference all
                                    available samples or select a specific sample type to filter by.
                                </p>
                                <p>
                                    This selection will be used to validate and link incoming data, populate lists for
                                    data entry, etc.
                                </p>
                                <p>
                                    Learn more about using{' '}
                                    <HelpLink topic={FIELD_EDITOR_SAMPLE_TYPES_TOPIC}>sample fields</HelpLink>
                                    in LabKey.
                                </p>{' '}
                            </LabelHelpTip>
                        </div>
                        <select
                            className="form-control"
                            id={id}
                            key={id}
                            disabled={isFieldFullyLocked(lockType)}
                            name={createFormInputName(DOMAIN_FIELD_SAMPLE_TYPE)}
                            onChange={this.onFieldChange}
                            value={value || SAMPLE_TYPE_ALL_OPTION_VALUE}
                        >
                            {!isLoaded && (
                                <option disabled key="_loading" value={value}>
                                    Loading...
                                </option>
                            )}
                            {field && !field.lookupIsValid && (
                                <option
                                    key={createFormInputId(
                                        DOMAIN_FIELD_SAMPLE_TYPE + '-empty-' + index,
                                        domainIndex,
                                        index
                                    )}
                                    value={undefined}
                                >
                                    &lt;Invalid sample type: {field?.lookupQuery}&gt;
                                </option>
                            )}
                            {isLoaded && (
                                <option
                                    key={createFormInputId(
                                        DOMAIN_FIELD_SAMPLE_TYPE + '-option-' + index,
                                        domainIndex,
                                        index
                                    )}
                                    value={SAMPLE_TYPE_ALL_OPTION_VALUE}
                                >
                                    All Samples
                                </option>
                            )}
                            {isLoaded &&
                                sampleTypes
                                    .map(st => {
                                        const encoded = encodeLookup(st.name, st.type);
                                        return (
                                            <option key={encoded} value={encoded}>
                                                {st.name}
                                            </option>
                                        );
                                    })
                                    .toArray()}
                        </select>
                    </div>
                    <div className="col-xs-6">
                        <div className="domain-field-label">Lookup Validator</div>
                        <DomainDesignerCheckbox
                            className="domain-field-checkbox-margin"
                            id={createFormInputId(DOMAIN_VALIDATOR_LOOKUP, domainIndex, index)}
                            name={createFormInputName(DOMAIN_VALIDATOR_LOOKUP)}
                            checked={validateLookup}
                            onChange={this.addLookupValidator}
                        >
                            <span className="domain-lookup-validator-text">Ensure Value Exists in Lookup Target</span>
                            <LabelHelpTip title="Lookup Validator">
                                <div>
                                    Lookup validators allow you to require that any value is present in the lookup's
                                    target table or query.
                                </div>
                            </LabelHelpTip>
                        </DomainDesignerCheckbox>
                    </div>
                </div>
            </div>
        );
    }
}
