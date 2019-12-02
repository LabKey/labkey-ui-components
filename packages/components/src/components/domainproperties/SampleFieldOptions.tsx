import * as React from 'react'
import { Col, FormControl, Row } from 'react-bootstrap';
import { isFieldFullyLocked } from './propertiesUtil';
import { createFormInputId, createFormInputName, fetchQueries } from './actions';
import {
    ALL_SAMPLES_DISPLAY_TEXT,
    DOMAIN_FIELD_SAMPLE_TYPE,
    SAMPLE_TYPE_HELP_ANCHOR,
    SM_BASE_HELP_URL,
} from './constants';
import { encodeLookup, IDomainField, ITypeDependentProps, PropDescType, QueryInfoLite } from './models';
import { List } from 'immutable';
import { LabelHelpTip } from '../base/LabelHelpTip';

interface SampleFieldProps extends ITypeDependentProps {
    original: Partial<IDomainField>
    value?: string
    container: string
}

export class SampleFieldOptions extends React.PureComponent<SampleFieldProps, any> {
    constructor (props) {
        super(props);

        this.state = {
            loading: false,
            sampleTypes: List(),
        };
    }

    onFieldChange = (evt) => {
        const { onChange } = this.props;

        let value = evt.target.value;

        if (onChange) {
            onChange(evt.target.id, value);
        }
    };

    getHelpText = () => {
        return (
            <>
                <p>Select the sample reference for this field. You can choose to reference all available samples or select a specific sample type to filter by.</p>
                <p>This selection will be used to validate and link incoming data, populate lists for data entry, etc.</p>
                <p>Learn more about using <a target='_blank' href={SM_BASE_HELP_URL + SAMPLE_TYPE_HELP_ANCHOR}>sample types</a> in LabKey.</p> {/*TODO: contextualize help link based on app (SM, LKS, etc.)*/}
            </>
        );
    };

    componentDidMount(): void {
        this.loadData();
    }

    loadData = () => {
        const {} = this.props;

        this.setState({
            loading: true
        });

        fetchQueries(null,'samples').then((sampleTypes: List<QueryInfoLite>): void => {

            let infos = List<{name: string, type: PropDescType}>();

            sampleTypes.forEach((q) => {
                infos = infos.concat(q.getLookupInfo(this.props.original.rangeURI)).toList();
            });


            this.setState({
                loading: false,
                sampleTypes: infos
            });
        });
    };

    render() {
        const { index, label, lockType, value } = this.props;
        const {loading, sampleTypes} = this.state;

        const id = createFormInputId( DOMAIN_FIELD_SAMPLE_TYPE, index);

        return (
            <div>
                <Row className='domain-row-expanded'>
                    <Col xs={12}>
                        <div className={'domain-field-section-heading margin-top'}>{label}</div>
                    </Col>
                </Row>
                <Row className='domain-row-expanded'>
                    <Col xs={2}>
                        <div className={'domain-field-label'}>
                            Sample lookup to
                            <LabelHelpTip
                                title='Sample Reference'
                                body={this.getHelpText} />
                        </div>
                    </Col>
                </Row>
                <Row>
                    <Col xs={5}>
                        <FormControl componentClass="select"
                                     id={id}
                                     key={id}
                                     disabled={isFieldFullyLocked(lockType)}
                                     name={createFormInputName(DOMAIN_FIELD_SAMPLE_TYPE)}
                                     onChange={this.onFieldChange}
                                     value={value || ALL_SAMPLES_DISPLAY_TEXT}>
                            {loading && <option disabled key="_loading" value={value}>Loading...</option>}
                            {!loading && <option
                                key={createFormInputId( DOMAIN_FIELD_SAMPLE_TYPE + '-option-' + index, index)}
                                value={'all'}>All Samples</option>}
                            {sampleTypes
                                .filter(st=>st.type.isInteger())  //Remove rowId duplicates
                                .map((st) => {
                                let encoded = encodeLookup(st.name, st.type);
                                return (
                                    <option key={encoded} value={encoded}>{st.name}</option>
                                );
                            }).toArray()}
                        </FormControl>
                    </Col>
                </Row>
            </div>
        )
    }
}
