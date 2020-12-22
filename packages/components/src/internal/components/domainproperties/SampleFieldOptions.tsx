import React from 'react';
import { Col, FormControl, Row } from 'react-bootstrap';

import { List } from 'immutable';

import { LabelHelpTip } from '../../..';

import { FIELD_EDITOR_SAMPLE_TYPES_TOPIC, helpLinkNode } from '../../util/helpLinks';

import { isFieldFullyLocked } from './propertiesUtil';
import { createFormInputId, createFormInputName, fetchQueries } from './actions';
import { ALL_SAMPLES_DISPLAY_TEXT, DOMAIN_FIELD_SAMPLE_TYPE } from './constants';
import { encodeLookup, IDomainField, ITypeDependentProps, QueryInfoLite, SAMPLE_TYPE_OPTION_VALUE } from './models';
import { PropDescType } from './PropDescType';

import { SectionHeading } from './SectionHeading';

interface SampleFieldProps extends ITypeDependentProps {
    original: Partial<IDomainField>;
    value?: string;
    container: string;
}

export class SampleFieldOptions extends React.PureComponent<SampleFieldProps, any> {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            sampleTypes: List(),
        };
    }

    onFieldChange = evt => {
        const { onChange } = this.props;

        const value = evt.target.value;

        if (onChange) {
            onChange(evt.target.id, value);
        }
    };

    componentDidMount(): void {
        this.loadData();
    }

    loadData = () => {
        const {} = this.props;

        this.setState({
            loading: true,
        });

        fetchQueries(null, 'samples').then((sampleTypes: List<QueryInfoLite>): void => {
            let infos = List<{ name: string; type: PropDescType }>();

            sampleTypes.forEach(q => {
                infos = infos.concat(q.getLookupInfo(this.props.original.rangeURI)).toList();
            });

            this.setState({
                loading: false,
                sampleTypes: infos,
            });
        });
    };

    render() {
        const { index, label, lockType, value, domainIndex } = this.props;
        const { loading, sampleTypes } = this.state;

        const id = createFormInputId(DOMAIN_FIELD_SAMPLE_TYPE, domainIndex, index);

        return (
            <div>
                <Row className="domain-row-expanded">
                    <Col xs={12}>
                        <SectionHeading title={label} />
                    </Col>
                </Row>
                <Row className="domain-row-expanded">
                    <Col xs={5}>
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
                                    {helpLinkNode(FIELD_EDITOR_SAMPLE_TYPES_TOPIC, 'sample types')} in LabKey.
                                </p>{' '}
                                {/* TODO: contextualize help link based on app (SM, LKS, etc.)*/}
                            </LabelHelpTip>
                        </div>
                    </Col>
                </Row>
                <Row>
                    <Col xs={5}>
                        <FormControl
                            componentClass="select"
                            id={id}
                            key={id}
                            disabled={isFieldFullyLocked(lockType)}
                            name={createFormInputName(DOMAIN_FIELD_SAMPLE_TYPE)}
                            onChange={this.onFieldChange}
                            value={value || ALL_SAMPLES_DISPLAY_TEXT}
                        >
                            {loading && (
                                <option disabled key="_loading" value={value}>
                                    Loading...
                                </option>
                            )}
                            {!loading && (
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
                            {sampleTypes
                                .filter(st => st.type.isInteger()) // Remove rowId duplicates
                                .map(st => {
                                    const encoded = encodeLookup(st.name, st.type);
                                    return (
                                        <option key={encoded} value={encoded}>
                                            {st.name}
                                        </option>
                                    );
                                })
                                .toArray()}
                        </FormControl>
                    </Col>
                </Row>
            </div>
        );
    }
}
