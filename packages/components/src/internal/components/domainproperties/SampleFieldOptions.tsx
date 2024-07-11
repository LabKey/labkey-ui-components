import React, { PureComponent } from 'react';

import { List } from 'immutable';

import { FIELD_EDITOR_SAMPLE_TYPES_TOPIC, helpLinkNode } from '../../util/helpLinks';

import { isLoading, LoadingState } from '../../../public/LoadingState';

import { LabelHelpTip } from '../base/LabelHelpTip';

import { isFieldFullyLocked } from './propertiesUtil';
import { fetchQueries } from './actions';
import { createFormInputId, createFormInputName } from './utils';
import { ALL_SAMPLES_DISPLAY_TEXT, DOMAIN_FIELD_SAMPLE_TYPE } from './constants';
import { encodeLookup, IDomainField, ITypeDependentProps, LookupInfo, SAMPLE_TYPE_OPTION_VALUE } from './models';

import { SectionHeading } from './SectionHeading';

interface SampleFieldProps extends ITypeDependentProps {
    container: string;
    original: Partial<IDomainField>;
    value?: string;
}

interface State {
    loadingState: LoadingState;
    sampleTypes: List<LookupInfo>;
}

export class SampleFieldOptions extends PureComponent<SampleFieldProps, State> {
    state: Readonly<State> = {
        loadingState: LoadingState.INITIALIZED,
        sampleTypes: List(),
    };

    onFieldChange = (evt: any): void => {
        this.props.onChange?.(evt.target.id, evt.target.value);
    };

    componentDidMount = async (): Promise<void> => {
        const { original } = this.props;

        this.setState({ loadingState: LoadingState.LOADING });

        try {
            const queries = await fetchQueries(undefined, 'samples');

            const sampleTypes = queries
                .reduce((list, q) => list.concat(q.getLookupInfo(original.rangeURI)).toList(), List<LookupInfo>())
                .filter(st => st.type.isInteger()) // Remove rowId duplicates
                .toList();

            this.setState({ loadingState: LoadingState.LOADED, sampleTypes });
        } catch (e) {
            console.error('Failed to load sample field information', e);
            this.setState({ loadingState: LoadingState.LOADED });
        }
    };

    render() {
        const { index, label, lockType, value, domainIndex } = this.props;
        const { loadingState, sampleTypes } = this.state;
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
                                    {helpLinkNode(FIELD_EDITOR_SAMPLE_TYPES_TOPIC, 'sample fields')} in LabKey.
                                </p>{' '}
                                {/* TODO: contextualize help link based on app (SM, LKS, etc.)*/}
                            </LabelHelpTip>
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-xs-5">
                        <select
                            className="form-control"
                            id={id}
                            key={id}
                            disabled={isFieldFullyLocked(lockType)}
                            name={createFormInputName(DOMAIN_FIELD_SAMPLE_TYPE)}
                            onChange={this.onFieldChange}
                            value={value || ALL_SAMPLES_DISPLAY_TEXT}
                        >
                            {!isLoaded && (
                                <option disabled key="_loading" value={value}>
                                    Loading...
                                </option>
                            )}
                            {isLoaded && (
                                <option
                                    key={createFormInputId(
                                        DOMAIN_FIELD_SAMPLE_TYPE + '-option-' + index,
                                        domainIndex,
                                        index
                                    )}
                                    value={SAMPLE_TYPE_OPTION_VALUE}
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
                </div>
            </div>
        );
    }
}
