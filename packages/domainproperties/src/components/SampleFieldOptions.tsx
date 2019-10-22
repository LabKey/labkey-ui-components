

import * as React from 'react'
import {Col, FormControl, Row} from "react-bootstrap";
import {isFieldFullyLocked} from "../propertiesUtil";
import {createFormInputId, createFormInputName, fetchQueries, getIndexFromId, getNameFromId} from "../actions/actions";
import {ALL_SAMPLES_DISPLAY_TEXT, DOMAIN_FIELD_SAMPLE_TYPE} from "../constants";
import {LabelHelpTip} from "@glass/base";
import {
    encodeLookup,
    IDomainField,
    IFieldChange,
    ITypeDependentProps,
    PropDescType,
    QueryInfoLite
} from "../models";
import {List} from "immutable";

interface SampleFieldProps extends ITypeDependentProps {
    original: Partial<IDomainField>
    value?: string
    container:string,
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
        let helpPrefix = "https://www.labkey.org/Documentation/wiki-page.view?name=";
        return (
            <>
                Some static help text that should be something else TODO: Change this.
                <br/><br/>
                Learn more about using <a target='_blank'
                                          href={helpPrefix + 'dateFormats#number'}>Number formats</a> in LabKey.
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
        const { index, label, lockType, container, value } = this.props;
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
                                title='Format Strings'
                                body={this.getHelpText} />
                        </div>
                    </Col>
                    <Col xs={6}>
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
                                .filter(st=>st.type.isString())  //Remove rowId duplicates
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