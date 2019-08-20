import * as React from 'react';
import { Col, Form, FormControl, Row, Panel } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlusSquare, faMinusSquare } from "@fortawesome/free-solid-svg-icons";
import { LabelHelpTip, Tip } from "@glass/base";

import { AssayProtocolModel } from "../../models";

const FORM_ID_PREFIX = 'assay-design-';
const FORM_IDS = {
    ASSAY_NAME: FORM_ID_PREFIX + 'name',
    ASSAY_DESCRIPTION: FORM_ID_PREFIX + 'description',
    EDITABLE_RUNS: FORM_ID_PREFIX + 'editableRuns',
    EDITABLE_RESULTS: FORM_ID_PREFIX + 'editableResults'
};

interface Props {
    model: AssayProtocolModel
    onChange: (evt: any) => any
    showEditSettings: boolean
    asPanel: boolean
    initCollapsed: boolean
    collapsible?: boolean
}

interface State {
    collapsed: boolean
}

export class AssayPropertiesPanel extends React.PureComponent<Props, State> {

    static defaultProps = {
        model: new AssayProtocolModel(),
        showEditSettings: true,
        asPanel: true,
        initCollapsed: false
    };

    constructor(props) {
        super(props);

        this.state = {
            collapsed: props.initCollapsed
        };
    }

    componentWillReceiveProps(nextProps: Readonly<Props>, nextContext: any): void {
        // if not collapsible, allow the prop change to update the collapsed state
        if (!this.props.collapsible && nextProps.initCollapsed !== this.props.initCollapsed) {
            this.togglePanel(null, nextProps.initCollapsed);
        }
    }

    togglePanel = (evt: any, collapsed?: boolean): void => {
        this.setState((state) => ({
            collapsed: collapsed !== undefined ? collapsed : !state.collapsed
        }));
    };

    onChange = (evt) => {
        const { model } = this.props;
        const id = evt.target.id;
        let value = evt.target.value;

        // special case for checkboxes to use "checked" property of target
        if (id === FORM_IDS.EDITABLE_RUNS || id === FORM_IDS.EDITABLE_RESULTS) {
            value = evt.target.checked;
        }

        this.props.onChange(model.merge({
            [id.replace(FORM_ID_PREFIX, '')]: value
        }));
    };

    nameHelpTip() {
        return (
            <>
                <p>The name for this assay design. Note that this can't be changed after the assay design is created.</p>
                <p><small><i>This field is required.</i></small></p>
            </>
        )
    }

    descriptionHelpTip() {
        return (
            <>
                <p>A short description for this assay design.</p>
            </>
        )
    }

    editableRunsHelpTip() {
        return (
            <>
                <p>If enabled, users with sufficient permissions can edit values at the run level after the initial import is complete.</p>
                <p>These changes will be audited.</p>
            </>
        )
    }

    editableResultsHelpTip() {
        return (
            <>
                <p>If enabled, users with sufficient permissions can edit and delete at the individual
                    results row level after the initial import is complete.
                    New result rows cannot be added to existing runs.</p>
                <p>These changes will be audited.</p>
            </>
        )
    }

    renderBasicProperties() {
        const { model, showEditSettings } = this.props;

        return (
            <>
                {showEditSettings &&
                    <Row>
                        <Col xs={12}>
                            <div className={'domain-field-section-heading'}>Basic Properties</div>
                        </Col>
                    </Row>
                }
                <Row className={'margin-top'}>
                    <Col xs={3}>
                        Name (Required)
                        <LabelHelpTip
                            title='Name'
                            body={this.nameHelpTip}
                        />
                    </Col>
                    <Col xs={9}>
                        <FormControl
                            id={FORM_IDS.ASSAY_NAME}
                            type="text"
                            placeholder={'Enter a name for this assay'}
                            value={model.name || ''}
                            onChange={this.onChange}
                        />
                    </Col>
                </Row>
                <Row className={'margin-top'}>
                    <Col xs={3}>
                        Description
                        <LabelHelpTip
                            title='Description'
                            body={this.descriptionHelpTip}
                        />
                    </Col>
                    <Col xs={9}>
                        <textarea
                            className="form-control domain-field-textarea"
                            id={FORM_IDS.ASSAY_DESCRIPTION}
                            placeholder={'Add a description'}
                            value={model.description || ''}
                            onChange={this.onChange}
                        />
                    </Col>
                </Row>
            </>
        )
    }

    renderEditSettings() {
        const { model } = this.props;

        return (
            <>
                <Row className={'margin-top'}>
                    <Col xs={12}>
                        <div style={{color: '#555555', fontWeight: 'bold'}}>Edit Settings</div>
                    </Col>
                </Row>
                <Row className={'margin-top'}>
                    <Col xs={3}>
                        Editable Runs
                        <LabelHelpTip
                            title='Editable Runs'
                            body={this.editableRunsHelpTip}
                        />
                    </Col>
                    <Col xs={9}>
                        <input
                            type='checkbox'
                            id={FORM_IDS.EDITABLE_RUNS}
                            checked={model.editableRuns}
                            onChange={this.onChange}
                        />
                    </Col>
                </Row>
                <Row className={'margin-top'}>
                    <Col xs={3}>
                        Editable Results
                        <LabelHelpTip
                            title='Editable Results'
                            body={this.editableResultsHelpTip}
                        />
                    </Col>
                    <Col xs={9}>
                        <input
                            type='checkbox'
                            id={FORM_IDS.EDITABLE_RESULTS}
                            checked={model.editableResults}
                            onChange={this.onChange}
                        />
                    </Col>
                </Row>
            </>
        )
    }

    renderForm() {
        const { showEditSettings, children } = this.props;

        return (
            <Form>
                {children}
                {this.renderBasicProperties()}
                {showEditSettings && this.renderEditSettings()}
            </Form>
        )
    }

    renderPanel() {
        const { collapsible } = this.props;
        const { collapsed } = this.state;

        return (
            <Panel className={"domain-form-panel"}>
                <Panel.Heading>
                    <span>Assay Properties</span>
                    {collapsible && collapsed &&
                        <Tip caption="Expand Panel">
                            <span className={'pull-right'} onClick={this.togglePanel}>
                                <FontAwesomeIcon icon={faPlusSquare} className={"domain-form-expand-btn"}/>
                            </span>
                        </Tip>
                    }
                    {collapsible && !collapsed &&
                        <Tip caption="Collapse Panel">
                            <span className={'pull-right'} onClick={this.togglePanel}>
                                <FontAwesomeIcon icon={faMinusSquare} className={"domain-form-expand-btn"}/>
                            </span>
                        </Tip>
                    }
                </Panel.Heading>
                {!collapsed &&
                    <Panel.Body>
                        {this.renderForm()}
                    </Panel.Body>
                }
            </Panel>
        )
    }

    render() {
        return (
            <>
                {this.props.asPanel ? this.renderPanel() : this.renderForm()}
            </>
        )
    }
}