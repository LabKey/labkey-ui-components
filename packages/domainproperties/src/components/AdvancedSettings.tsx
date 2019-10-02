
import * as React from 'react';
import {List} from "immutable";
import {Button, Checkbox, Col, FormControl, Modal, Row} from "react-bootstrap";
import {
    DomainField,
    IFieldChange,
    ITypeDependentProps,
    PROP_DESC_TYPES,
    PropDescType,
    resolveAvailableTypes
} from "../models";
import {createFormInputId, createFormInputName, getCheckedValue, getNameFromId} from "../actions/actions";
import {
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
import {LabelHelpTip} from "@glass/base";

interface AdvancedSettingsProps {
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
    dimension?: boolean
    measure?: boolean
    mvEnabled?: boolean
    recommendedVariable?: boolean
    PHI?: string
    phiLevels?: List<any>
}

export class AdvancedSettings extends React.PureComponent<AdvancedSettingsProps, AdvancedSettingsState> {

    constructor(props) {
        super(props);

        // Filter phi levels available
        const phiIndex = this.getMaxPhiLevelIndex(props.maxPhiLevel);
        const phiLevels = DOMAIN_PHI_LEVELS.filter( (value, index) => {
            return index <= phiIndex;
        }) as List<any>;

        this.state = this.getInitialState(this.props.field, phiLevels);
    }

    initializeState = () => {
        this.setState(this.getInitialState(this.props.field, this.state.phiLevels));
    };

    getInitialState = (field, phiLevels) => {
        return ({
            hidden: field.hidden,
            shownInDetailsView: field.shownInDetailsView,
            shownInInsertView: field.shownInInsertView,
            shownInUpdateView: field.shownInUpdateView,
            dimension: field.dimension,
            measure: field.measure,
            mvEnabled: field.mvEnabled,
            recommendedVariable: field.recommendedVariable,
            PHI: field.PHI,
            phiLevels: phiLevels
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
                if (key !== 'phiLevels') {
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

    handlePhiChange = (evt) => {
        let fieldName = getNameFromId(evt.target.id);

        this.setState({
            [fieldName]: evt.target.value
        })
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

    getMaxPhiLevelIndex = (phi: string): number => {
        return DOMAIN_PHI_LEVELS.findIndex((level) => {
            return level.value === phi;
        });
    };

    render() {
        const { show, label, index, maxPhiLevel, field } = this.props;
        const { hidden, shownInDetailsView, shownInInsertView, shownInUpdateView, measure, dimension, mvEnabled, recommendedVariable, PHI } = this.state;

        // Filter phi levels available
        const phiIndex = this.getMaxPhiLevelIndex(maxPhiLevel);
        const phiLevels = DOMAIN_PHI_LEVELS.filter( (value, index) => {
            return index <= phiIndex;
        });

        return (
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
                    <Checkbox checked={hidden === false} onChange={this.handleCheckbox} name={createFormInputName(DOMAIN_FIELD_HIDDEN)} id={createFormInputId(DOMAIN_FIELD_HIDDEN, index)}>Show field on default view of the grid</Checkbox>
                    <Checkbox checked={shownInUpdateView === true} onChange={this.handleCheckbox} name={createFormInputName(DOMAIN_FIELD_SHOWNINUPDATESVIEW)} id={createFormInputId(DOMAIN_FIELD_SHOWNINUPDATESVIEW, index)}>Show on update form when updating a single row of data</Checkbox>
                    <Checkbox checked={shownInInsertView === true} onChange={this.handleCheckbox} name={createFormInputName(DOMAIN_FIELD_SHOWNININSERTVIEW)} id={createFormInputId(DOMAIN_FIELD_SHOWNININSERTVIEW, index)}>Show on insert form when updating a single row of data</Checkbox>
                    <Checkbox checked={shownInDetailsView === true} onChange={this.handleCheckbox} name={createFormInputName(DOMAIN_FIELD_SHOWNINDETAILSVIEW)} id={createFormInputId(DOMAIN_FIELD_SHOWNINDETAILSVIEW, index)}>Show on details page for a single row</Checkbox>
                    <div className='domain-adv-misc-options'>Miscellaneous Options</div>
                    <div className='domain-adv-phi-row'>
                        <span className='domain-adv-phi'>PHI Level<LabelHelpTip title='PHI Level' body={this.getPhiHelpText} /></span>
                        <FormControl
                            componentClass="select"
                            className="domain-adv-phi"
                            name={createFormInputName(DOMAIN_FIELD_PHI)}
                            id={createFormInputId(DOMAIN_FIELD_PHI, index)}
                            onChange={this.handlePhiChange}
                            value={PHI}
                        >
                            {
                                phiLevels.map((level, i) => (
                                    <option key={i} value={level.value}>{level.label}</option>
                                ))
                            }
                        </FormControl>
                    </div>
                    {PropDescType.isMeasureDimension(field.rangeURI) &&
                    <>
                        <Checkbox
                                checked={measure === true}
                                onChange={this.handleCheckbox}
                                name={createFormInputName(DOMAIN_FIELD_MEASURE)}
                                id={createFormInputId(DOMAIN_FIELD_MEASURE, index)}
                        >
                            Make this field available as a measure<LabelHelpTip title='Measure' body={this.getMeasureHelpText}/>
                        </Checkbox>
                        <Checkbox
                                checked={dimension === true}
                                onChange={this.handleCheckbox}
                                name={createFormInputName(DOMAIN_FIELD_DIMENSION)}
                                id={createFormInputId(DOMAIN_FIELD_DIMENSION, index)}
                        >
                            Make this field available as a dimension<LabelHelpTip title='Data Dimension' body={this.getDimensionHelpText}/>
                        </Checkbox>
                    </>
                    }
                    <Checkbox
                        checked={recommendedVariable === true}
                        onChange={this.handleCheckbox}
                        name={createFormInputName(DOMAIN_FIELD_RECOMMENDEDVARIABLE)}
                        id={createFormInputId(DOMAIN_FIELD_RECOMMENDEDVARIABLE, index)}
                    >
                        Make this field a recommended variable<LabelHelpTip title='Recommended Variable' body={this.getRecommendedVariableHelpText} />
                    </Checkbox>

                    {PropDescType.isMvEnableable(field.rangeURI) &&
                        <Checkbox
                                checked={mvEnabled === true}
                                onChange={this.handleCheckbox}
                                name={createFormInputName(DOMAIN_FIELD_MVENABLED)}
                                id={createFormInputId(DOMAIN_FIELD_MVENABLED, index)}
                        >
                            Track reason for missing data values<LabelHelpTip title='Missing Value Indicators' body={this.getMissingValueHelpText}/>
                        </Checkbox>
                    }
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.handleClose} bsClass='btn' className='domain-adv-footer domain-adv-cancel-btn'>
                        Cancel
                    </Button>
                    <a target='_blank' href="https://www.labkey.org/Documentation/wiki-page.view?name=propertyFields"
                       className='domain-adv-footer domain-adv-link'>Get Help With Domain Settings</a>
                    <Button onClick={this.handleApply} bsClass='btn btn-success' className='domain-adv-footer domain-adv-apply-btn'>
                        Apply
                    </Button>
                </Modal.Footer>
            </Modal>
        )
    }
}