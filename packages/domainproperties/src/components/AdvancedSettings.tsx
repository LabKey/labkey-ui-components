
import * as React from 'react';
import {List} from "immutable";
import {Button, Checkbox, Col, FormControl, Modal, Row} from "react-bootstrap";
import {
    DomainField,
    IFieldChange,
    PropDescType
} from "../models";
import {createFormInputId, createFormInputName, getCheckedValue, getNameFromId} from "../actions/actions";
import { ActionURL } from "@labkey/api";
import {
    DOMAIN_DEFAULT_TYPES,
    DOMAIN_EDITABLE_DEFAULT,
    DOMAIN_FIELD_DEFAULT_VALUE,
    DOMAIN_FIELD_DEFAULT_VALUE_TYPE,
    DOMAIN_FIELD_DIMENSION,
    DOMAIN_FIELD_HIDDEN,
    DOMAIN_FIELD_MEASURE,
    DOMAIN_FIELD_MVENABLED,
    DOMAIN_FIELD_PHI,
    DOMAIN_FIELD_RECOMMENDEDVARIABLE,
    DOMAIN_FIELD_SHOWNINDETAILSVIEW,
    DOMAIN_FIELD_SHOWNININSERTVIEW,
    DOMAIN_FIELD_SHOWNINUPDATESVIEW,
    DOMAIN_PHI_LEVELS
} from "../constants";
import {Alert, ConfirmModal, LabelHelpTip} from "@glass/base";

interface AdvancedSettingsProps {
    domainId?: number
    helpNoun: string
    defaultDefaultValueType: string
    defaultValueOptions: List<string>
    label: string
    index: number
    show: boolean
    maxPhiLevel: string
    field: DomainField
    onHide: () => any
    onApply: (any) => any
}

interface AdvancedSettingsState {
    hidden?: boolean
    shownInDetailsView?: boolean
    shownInInsertView?: boolean
    shownInUpdateView?: boolean
    defaultValueType?: string
    defaultValue?: string
    defaultDisplayValue?: string
    dimension?: boolean
    measure?: boolean
    mvEnabled?: boolean
    recommendedVariable?: boolean
    PHI?: string
    phiLevels?: List<any>
    defaultUrl?: string
}

export class AdvancedSettings extends React.PureComponent<AdvancedSettingsProps, AdvancedSettingsState> {

    constructor(props) {
        super(props);

        // Filter phi levels available
        const phiIndex = this.getMaxPhiLevelIndex(props.maxPhiLevel);
        const phiLevels = DOMAIN_PHI_LEVELS.filter( (value, index) => {
            return index <= phiIndex;
        }) as List<any>;

        this.state = this.getInitialState(this.props.field, phiLevels, this.props.domainId, this.props.defaultDefaultValueType);
    }

    initializeState = () => {
        this.setState(this.getInitialState(this.props.field, this.state.phiLevels, this.props.domainId, this.props.defaultDefaultValueType));
    };

    getInitialState = (field: DomainField, phiLevels, domainId: number, defaultDefaultValueType: string) => {
        return ({
            hidden: field.hidden,
            shownInDetailsView: field.shownInDetailsView,
            shownInInsertView: field.shownInInsertView,
            shownInUpdateView: field.shownInUpdateView,
            defaultValueType: (field.defaultValueType ? field.defaultValueType : (defaultDefaultValueType ? defaultDefaultValueType : DOMAIN_EDITABLE_DEFAULT)),
            defaultValue: field.defaultValue,
            defaultDisplayValue: field.defaultDisplayValue,
            dimension: field.dimension,
            measure: field.measure,
            mvEnabled: field.mvEnabled,
            recommendedVariable: field.recommendedVariable,
            PHI: field.PHI,
            phiLevels: phiLevels,
            defaultUrl: (domainId === undefined ? '' : ActionURL.buildURL(ActionURL.getController(), 'setDefaultValuesList', ActionURL.getContainer(), {returnUrl:window.location, domainId: domainId}))
        })
    };

    handleClose = () => {
        const { onHide } = this.props;

        onHide();
    };

    handleApply = () => {
        const { index, onApply, onHide } = this.props;

        if (onApply) {

            let changes = List<IFieldChange>().asMutable();

            // Iterate over state values and put into list of changes
            Object.keys(this.state).forEach(function (key, i) {
                if (key !== 'phiLevels' && key !== 'defaultUrl') {
                    changes.push({id: createFormInputId(key, index), value: this.state[key]} as IFieldChange)
                }
            }, this);

            onApply(changes.asImmutable());
        }

        if (onHide) {
            onHide();
        }
    };

    handleCheckbox = (evt) => {
        let value = getCheckedValue(evt);
        let fieldName = getNameFromId(evt.target.id);

        // Show in default view
        if (fieldName === DOMAIN_FIELD_HIDDEN) {
            value = !value;
        }

        this.setState({
            [fieldName]: value
        })
    };

    handleChange = (evt) => {
        let fieldName = getNameFromId(evt.target.id);

        this.setState({
            [fieldName]: evt.target.value
        })
    };

    handleSetDefaultValues = (evt) => {
        const { domainId, helpNoun } = this.props;

        if (domainId === undefined || domainId === null) {
            alert("Must save " + helpNoun + " before you can set default values.")
        }
        else {
            let controller = ActionURL.getController();
            if (controller !== 'assay') {
                controller = 'list';
            }
            window.location.href = ActionURL.buildURL(controller, 'setDefaultValuesList', ActionURL.getContainer(), {returnUrl:window.location, domainId: domainId});
        }
    };

    getMeasureHelpText = () => {
        return(
            <div>
                <p>Indicates fields that contain data subject to charting and other analysis. These are typically numeric results.</p>
                <p>Learn more about using <a target='_blank' href="https://www.labkey.org/Documentation/wiki-page.view?name=chartTrouble">Measures and Dimensions</a> for analysis.</p>
            </div>
        )
    };

    getDimensionHelpText = () => {
        return(
            <div>
                <p>Indicates a column of non-numerical categories that can be included in a chart. Dimensions define logical groupings of measures.</p>
                <p>Learn more about using <a target='_blank' href="https://www.labkey.org/Documentation/wiki-page.view?name=chartTrouble">Measures and Dimensions</a> for analysis.</p>
            </div>
        )
    };

    getMissingValueHelpText = () => {
        return(
            <div>
                <p>Fields using this can hold special values to indicate data that has failed review or was originally missing. Administrators can set custom Missing Value indicators at the site and folder levels.</p>
                <p>Learn more about using <a target='_blank' href="https://www.labkey.org/Documentation/wiki-page.view?name=manageMissing">Missing Value Indicators</a></p>
            </div>
        )
    };

    getRecommendedVariableHelpText = () => {
        return(
            <div>
                Indicates that this is an important variable. These variables will be displayed as recommended when creating new charts or reports.
            </div>
        )
    };

    getPhiHelpText = () => {
        return(
            <div>
                <p>Sets Protected Health Information (PHI) level for this field. This is a premium LabKey feature.</p>
                <p>Learn more about <a target='_blank' href="https://www.labkey.org/Documentation/wiki-page.view?name=compliancePHI">PHI Compliance</a> in LabKey.</p>
            </div>
        )
    };

    getDefaultTypeHelpText = () => {
        return(
            <div>
                <p>Editable default: Provides the same default value for every user, which allows editing.</p>
                <p>Fixed value: Provides fixed data with each inserted data row that cannot be edited.</p>
                <p>Last entered: An editable default value is provided on first use. The last value entered will be provided on later imports.</p>
                <p>Learn more about using <a target='_blank' href="https://www.labkey.org/Documentation/wiki-page.view?name=propertyFields#advanced">Default Type</a> settings.</p>
            </div>
        )
    };

    getMaxPhiLevelIndex = (phi: string): number => {
        return DOMAIN_PHI_LEVELS.findIndex((level) => {
            return level.value === phi;
        });
    };

    showDefaultValues = () => {
        const { field } = this.props;

        // Not shown for file types
        if (field.dataType.isFileType())
            return false;

        return !this.props.defaultValueOptions.isEmpty();
    }

    renderDefaultValues = () => {
        const { index, defaultValueOptions, defaultDefaultValueType } = this.props;
        const { defaultValueType, defaultValue } = this.state;


        return (
            <>
                <div className='domain-adv-misc-options'>Default Value Options</div>
                <Row className='domain-adv-thick-row'>
                    <Col xs={3}>
                                <span>Default Type<LabelHelpTip title='Default Type'
                                                                body={this.getDefaultTypeHelpText}/></span>
                    </Col>
                    <Col xs={6}>
                        <FormControl
                            componentClass="select"
                            name={createFormInputName(DOMAIN_FIELD_DEFAULT_VALUE_TYPE)}
                            id={createFormInputId(DOMAIN_FIELD_DEFAULT_VALUE_TYPE, index)}
                            onChange={this.handleChange}
                            value={defaultValueType}
                        >
                            {
                                defaultValueOptions.map((level, i) => (
                                    <option key={i} value={level}>{DOMAIN_DEFAULT_TYPES[level]}</option>
                                ))
                            }
                        </FormControl>
                    </Col>
                    <Col xs={3}/>
                </Row>
                <Row>
                    <Col xs={3}>
                        <span>Default Value</span>
                    </Col>
                    <Col xs={5}>
                        <FormControl
                            type='text'
                            name={createFormInputName(DOMAIN_FIELD_DEFAULT_VALUE)}
                            id={createFormInputId(DOMAIN_FIELD_DEFAULT_VALUE, index)}
                            onChange={this.handleChange}
                            value={defaultValue !== undefined && defaultValue !== null ? defaultValue : ''}
                            disabled={true}
                        />
                    </Col>
                    <Col xs={4} className='domain-adv-default-link'>
                        <a onClick={this.handleSetDefaultValues}>Set Default Values</a>
                    </Col>
                </Row>
            </>
        )

    };

    render() {
        const { show, label, index, maxPhiLevel, field, defaultValueOptions } = this.props;
        const { hidden, shownInDetailsView, shownInInsertView, shownInUpdateView, measure, dimension, mvEnabled,
            recommendedVariable, PHI } = this.state;

        // Filter phi levels available
        const phiIndex = this.getMaxPhiLevelIndex(maxPhiLevel);
        const phiLevels = DOMAIN_PHI_LEVELS.filter( (value, index) => {
            return index <= phiIndex;
        });

        const showDefault = (this.props.defaultValueOptions as List<string>).size > 0;

        return (
            <>
                <Modal show={show}
                       onHide={this.handleClose}
                       onEnter={this.initializeState}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>{'Advanced Settings and Properties' + (label ? (' for ' + label) : '')}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className='domain-adv-display-options'>Display Options</div>
                        <div>These options configure how and in which views this field will be visible.</div>
                        <Checkbox checked={hidden === false} onChange={this.handleCheckbox}
                                  name={createFormInputName(DOMAIN_FIELD_HIDDEN)}
                                  id={createFormInputId(DOMAIN_FIELD_HIDDEN, index)}>Show field on default view of the
                            grid</Checkbox>
                        <Checkbox checked={shownInUpdateView === true} onChange={this.handleCheckbox}
                                  name={createFormInputName(DOMAIN_FIELD_SHOWNINUPDATESVIEW)}
                                  id={createFormInputId(DOMAIN_FIELD_SHOWNINUPDATESVIEW, index)}>Show on update form
                            when updating a single row of data</Checkbox>
                        <Checkbox checked={shownInInsertView === true} onChange={this.handleCheckbox}
                                  name={createFormInputName(DOMAIN_FIELD_SHOWNININSERTVIEW)}
                                  id={createFormInputId(DOMAIN_FIELD_SHOWNININSERTVIEW, index)}>Show on insert form when
                            updating a single row of data</Checkbox>
                        <Checkbox checked={shownInDetailsView === true} onChange={this.handleCheckbox}
                                  name={createFormInputName(DOMAIN_FIELD_SHOWNINDETAILSVIEW)}
                                  id={createFormInputId(DOMAIN_FIELD_SHOWNINDETAILSVIEW, index)}>Show on details page
                            for a single row</Checkbox>
                        {this.showDefaultValues() &&
                            this.renderDefaultValues()
                        }
                        <div className='domain-adv-misc-options'>Miscellaneous Options</div>
                        <Row>
                            <Col xs={3}>
                                <span>PHI Level<LabelHelpTip title='PHI Level' body={this.getPhiHelpText}/></span>
                            </Col>
                            <Col xs={6}>
                                <FormControl
                                    componentClass="select"
                                    name={createFormInputName(DOMAIN_FIELD_PHI)}
                                    id={createFormInputId(DOMAIN_FIELD_PHI, index)}
                                    onChange={this.handleChange}
                                    value={PHI}
                                >
                                    {
                                        phiLevels.map((level, i) => (
                                            <option key={i} value={level.value}>{level.label}</option>
                                        ))
                                    }
                                </FormControl>
                            </Col>
                            <Col xs={3}/>
                        </Row>
                        {PropDescType.isMeasureDimension(field.rangeURI) &&
                        <>
                            <Checkbox
                                    checked={measure === true}
                                    onChange={this.handleCheckbox}
                                    name={createFormInputName(DOMAIN_FIELD_MEASURE)}
                                    id={createFormInputId(DOMAIN_FIELD_MEASURE, index)}
                            >
                                Make this field available as a measure<LabelHelpTip title='Measure'
                                                                                    body={this.getMeasureHelpText}/>
                            </Checkbox>
                            <Checkbox
                                    checked={dimension === true}
                                    onChange={this.handleCheckbox}
                                    name={createFormInputName(DOMAIN_FIELD_DIMENSION)}
                                    id={createFormInputId(DOMAIN_FIELD_DIMENSION, index)}
                            >
                                Make this field available as a dimension<LabelHelpTip title='Data Dimension'
                                                                                      body={this.getDimensionHelpText}/>
                            </Checkbox>
                        </>
                        }
                        <Checkbox
                            checked={recommendedVariable === true}
                            onChange={this.handleCheckbox}
                            name={createFormInputName(DOMAIN_FIELD_RECOMMENDEDVARIABLE)}
                            id={createFormInputId(DOMAIN_FIELD_RECOMMENDEDVARIABLE, index)}
                        >
                            Make this field a recommended variable<LabelHelpTip title='Recommended Variable'
                                                                                body={this.getRecommendedVariableHelpText}/>
                        </Checkbox>

                        {PropDescType.isMvEnableable(field.rangeURI) &&
                        <Checkbox
                                checked={mvEnabled === true}
                                onChange={this.handleCheckbox}
                                name={createFormInputName(DOMAIN_FIELD_MVENABLED)}
                                id={createFormInputId(DOMAIN_FIELD_MVENABLED, index)}
                        >
                            Track reason for missing data values<LabelHelpTip title='Missing Value Indicators'
                                                                              body={this.getMissingValueHelpText}/>
                        </Checkbox>
                        }
                    </Modal.Body>
                    <Modal.Footer>
                        <Button onClick={this.handleClose} bsClass='btn'
                                className='domain-adv-footer domain-adv-cancel-btn'>
                            Cancel
                        </Button>
                        <a target='_blank'
                           href="https://www.labkey.org/Documentation/wiki-page.view?name=propertyFields"
                           className='domain-adv-footer domain-adv-link'>Get Help With Domain Settings</a>
                        <Button onClick={this.handleApply} bsClass='btn btn-success'
                                className='domain-adv-footer domain-adv-apply-btn'>
                            Apply
                        </Button>
                    </Modal.Footer>
                </Modal>

            </>
        )
    }
}