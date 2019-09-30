import * as React from 'react';
import { Col, Form, FormControl, Row, Panel, Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlusSquare, faMinusSquare } from "@fortawesome/free-solid-svg-icons";
import { Utils, ActionURL } from "@labkey/api";
import { Tip } from "@glass/base";

import { AssayProtocolModel } from "../../models";
import { AssayPropertiesInput } from "./AssayPropertiesInput";

const FORM_ID_PREFIX = 'assay-design-';
const FORM_IDS = {
    ASSAY_NAME: FORM_ID_PREFIX + 'name',
    ASSAY_DESCRIPTION: FORM_ID_PREFIX + 'description',
    BACKGROUND_UPLOAD: FORM_ID_PREFIX + 'backgroundUpload',
    DETECTION_METHOD: FORM_ID_PREFIX + 'selectedDetectionMethod',
    EDITABLE_RUNS: FORM_ID_PREFIX + 'editableRuns',
    EDITABLE_RESULTS: FORM_ID_PREFIX + 'editableResults',
    METADATA_INPUT_FORMAT: FORM_ID_PREFIX + 'selectedMetadataInputFormat',
    PLATE_TEMPLATE: FORM_ID_PREFIX + 'selectedPlateTemplate',
    QC_ENABLED: FORM_ID_PREFIX + 'qcEnabled'
};

interface Props {
    model: AssayProtocolModel
    onChange: (evt: any) => any
    basePropertiesOnly: boolean
    asPanel: boolean
    initCollapsed: boolean
    collapsible?: boolean
    markComplete?: boolean
    panelCls?: string
}

interface State {
    collapsed: boolean
}

export class AssayPropertiesPanel extends React.PureComponent<Props, State> {

    static defaultProps = {
        basePropertiesOnly: false,
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

    renderSectionHeading(title: string, paddingTop?: boolean) {
        return (
            <Row>
                <Col xs={12}>
                    <div className={'domain-field-section-heading' + (paddingTop ? ' domain-field-padding-top' : '')}>{title}</div>
                </Col>
            </Row>
        )
    }

    renderBasicProperties() {
        const { model, basePropertiesOnly } = this.props;

        return (
            <>
                {!basePropertiesOnly && this.renderSectionHeading('Basic Properties')}
                {this.renderNameInput()}
                {this.renderDescriptionInput()}
                {model.availablePlateTemplates && model.availablePlateTemplates.length > 0 && this.renderPlateTemplatesInput()}
                {model.availableDetectionMethods && model.availableDetectionMethods.length > 0 && this.renderDetectionMethodsInput()}
                {model.availableMetadataInputFormats && !Utils.isEmptyObj(model.availableMetadataInputFormats) && this.renderMetadataInputFormatsInput()}
                {!basePropertiesOnly && model.allowQCStates && this.renderQCStatesInput()}
            </>
        )
    }

    renderImportSettings() {
        const { model } = this.props;

        return (
            <>
                {this.renderSectionHeading('Import Settings', true)}
                {model.allowTransformationScript && this.renderTransformScriptsInput()}
                {this.renderAutoCopyDataInput()}
                {model.allowBackgroundUpload && this.renderBackgroundUploadInput()}
            </>
        )
    }

    renderEditSettings() {
        const { model } = this.props;

        return (
            <>
                {this.renderSectionHeading('Edit Settings', true)}
                {this.renderEditableRunsInput()}
                {model.allowEditableResults && this.renderEditableResultsInput()}
            </>
        )
    }

    renderNameInput() {
        return (
            <AssayPropertiesInput
                label={'Name'}
                required={true}
                helpTipBody={() => {
                    return (
                        <>
                            <p>The name for this assay design. Note that this can't be changed after the assay design is created.</p>
                            <p><small><i>This field is required.</i></small></p>
                        </>
                    )
                }}
            >
                <FormControl
                    id={FORM_IDS.ASSAY_NAME}
                    type="text"
                    placeholder={'Enter a name for this assay'}
                    value={this.props.model.name || ''}
                    onChange={this.onChange}
                    disabled={!this.props.model.isNew()}
                />
            </AssayPropertiesInput>
        )
    }

    renderDescriptionInput() {
        return (
            <AssayPropertiesInput
                label={'Description'}
                helpTipBody={() => {
                    return (
                        <p>A short description for this assay design.</p>
                    )
                }}
            >
                    <textarea
                        className="form-control domain-field-textarea"
                        id={FORM_IDS.ASSAY_DESCRIPTION}
                        placeholder={'Add a description'}
                        value={this.props.model.description || ''}
                        onChange={this.onChange}
                    />
            </AssayPropertiesInput>
        )
    }

    renderEditableRunsInput() {
        return (
            <AssayPropertiesInput
                label={'Editable Runs'}
                helpTipBody={() => {
                    return (
                        <p>
                            If enabled, users with sufficient permissions can edit values at the run level
                            after the initial import is complete.
                            These changes will be audited.
                        </p>
                    )
                }}
            >
                <input
                    type='checkbox'
                    id={FORM_IDS.EDITABLE_RUNS}
                    checked={this.props.model.editableRuns}
                    onChange={this.onChange}
                />
            </AssayPropertiesInput>
        )
    }

    renderEditableResultsInput() {
        return (
            <AssayPropertiesInput
                label={'Editable Results'}
                helpTipBody={() => {
                    return (
                        <p>
                            If enabled, users with sufficient permissions can edit and delete at the individual results row level after the initial import is complete.
                            New result rows cannot be added to existing runs. These changes will be audited.
                        </p>
                    )
                }}
            >
                <input
                    type='checkbox'
                    id={FORM_IDS.EDITABLE_RESULTS}
                    checked={this.props.model.editableResults}
                    onChange={this.onChange}
                />
            </AssayPropertiesInput>
        )
    }

    renderBackgroundUploadInput() {
        return (
            <AssayPropertiesInput
                label={'Import in Background'}
                helpTipBody={() => {
                    return (
                        <p>
                            If enabled, assay imports will be processed as jobs in the data pipeline.
                            If there are any errors during the import, they can be viewed from the log file for that job.
                        </p>
                    )
                }}
            >
                <input
                    type='checkbox'
                    id={FORM_IDS.BACKGROUND_UPLOAD}
                    checked={this.props.model.backgroundUpload}
                    onChange={this.onChange}
                />
            </AssayPropertiesInput>
        )
    }

    renderQCStatesInput() {
        return (
            <AssayPropertiesInput
                label={'QC States'}
                helpTipBody={() => {
                    return (
                        <p>
                            If enabled, QC states can be configured and assigned on a per run basis to control the visibility of imported run data.
                            Users not in the QC Analyst role will not be able to view non-public data.
                        </p>
                    )
                }}
            >
                <input
                    type='checkbox'
                    id={FORM_IDS.QC_ENABLED}
                    checked={this.props.model.qcEnabled}
                    onChange={this.onChange}
                />
            </AssayPropertiesInput>
        )
    }

    renderAutoCopyDataInput() {
        const { autoCopyTargetContainer } = this.props.model;

        return (
            <AssayPropertiesInput
                label={'Auto-Copy Data to Study'}
                helpTipBody={() => {
                    return (
                        <p>
                            When new runs are imported, automatically copy their data rows to the specified target study.
                            Only rows that include subject and visit/date information will be copied.
                        </p>
                    )
                }}
            >
                <div style={{opacity: 0.5}}>Coming soon</div>
            </AssayPropertiesInput>
        )
    }

    renderPlateTemplatesInput() {
        const { availablePlateTemplates, selectedPlateTemplate } = this.props.model;

        return (
            <AssayPropertiesInput
                label={'Plate Template'}
                required={true}
                colSize={4}
                helpTipBody={() => {
                    return (
                        <p>
                            Specify the plate template definition used to map spots or wells on the plate to data fields in this assay design.
                            For additional information refer to the <a href="https://www.labkey.org/Documentation/wiki-page.view?name=editPlateTemplate" target="_blank">help documentation</a>.
                        </p>
                    )
                }}
            >
                <FormControl
                    componentClass="select"
                    id={FORM_IDS.PLATE_TEMPLATE}
                    onChange={this.onChange}
                    value={selectedPlateTemplate}
                >
                    {
                        availablePlateTemplates.map((type, i) => (
                            <option key={i} value={type}>{type}</option>
                        ))
                    }
                </FormControl>
                <a href={ActionURL.buildURL('plate', 'plateTemplateList')} className={'labkey-text-link'}>Configure Templates</a>
            </AssayPropertiesInput>
        )
    }

    renderDetectionMethodsInput() {
        const { availableDetectionMethods, selectedDetectionMethod } = this.props.model;

        return (
            <AssayPropertiesInput
                label={'Detection Method'}
                required={true}
                colSize={4}
            >
                <FormControl
                    componentClass="select"
                    id={FORM_IDS.DETECTION_METHOD}
                    onChange={this.onChange}
                    value={selectedDetectionMethod}
                >
                    {
                        availableDetectionMethods.map((method, i) => (
                            <option key={i} value={method}>{method}</option>
                        ))
                    }
                </FormControl>
            </AssayPropertiesInput>
        )
    }

    renderTransformScriptsInput() {
        return (
            <AssayPropertiesInput
                label={'Transform Scripts'}
                helpTipBody={() => {
                    return (
                        <>
                            <p>
                                The full path to the transform script file. Transform scripts run before the assay data is imported and can reshape the data file to match
                                the expected import format. For help writing a transform script refer to
                                the <a href="https://www.labkey.org/Documentation/wiki-page.view?name=programmaticQC" target="_blank">Programmatic Quality Control & Transformations</a> guide.
                            </p>
                            <p>
                                The extension of the script file identifies the script engine that will be used to run the validation script. For example,
                                a script named test.pl will be run with the Perl scripting engine. The scripting engine must be
                                configured on the Views and Scripting page in the Admin Console. For additional information refer to
                                the <a href="https://www.labkey.org/Documentation/wiki-page.view?name=configureScripting" target="_blank">help documentation</a>.
                            </p>
                        </>
                    )
                }}
            >
                <div style={{opacity: 0.5}}>Coming soon</div>
            </AssayPropertiesInput>
        )
    }

    renderMetadataInputFormatsInput() {
        const { availableMetadataInputFormats, selectedMetadataInputFormat } = this.props.model;

        return (
            <AssayPropertiesInput
                label={'Metadata Input Format'}
                required={true}
                colSize={4}
                helpTipBody={() => {
                    return (
                        <>
                            <p>
                                <strong>Manual: </strong> Metadata is provided as form based manual entry.
                            </p>
                            <p>
                                <strong>File Upload (metadata only): </strong> Metadata is provided from a file upload (separate from the run data file).
                            </p>
                            <p>
                                <strong>Combined File Upload (metadata & run data): </strong> Metadata and run data are combined into a single file upload.
                            </p>
                        </>
                    )
                }}
            >
                <FormControl
                    componentClass="select"
                    id={FORM_IDS.METADATA_INPUT_FORMAT}
                    onChange={this.onChange}
                    value={selectedMetadataInputFormat}
                >
                    {
                        Object.keys(availableMetadataInputFormats).map((key, i) => (
                            <option key={i} value={key}>{availableMetadataInputFormats[key]}</option>
                        ))
                    }
                </FormControl>
            </AssayPropertiesInput>
        )
    }

    renderForm() {
        const { basePropertiesOnly, children } = this.props;

        return (
            <Form>
                {children}
                {this.renderBasicProperties()}
                {!basePropertiesOnly && this.renderImportSettings()}
                {this.renderEditSettings()}
            </Form>
        )
    }

    renderHeader() {
        const { name } = this.props.model;

        return (
            <span>Assay Properties {this.state.collapsed && name ? ' (' + name + ')' : ''}</span>
        )
    }

    renderPanel() {
        const { collapsible, markComplete, panelCls } = this.props;
        const { collapsed } = this.state;

        return (
            <Panel className={"domain-form-panel" + (panelCls ? ' ' + panelCls : '')}>
                <Panel.Heading>
                    {this.renderHeader()}
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
                    {!collapsible && collapsed && markComplete &&
                        <span className={'pull-right'} onClick={this.togglePanel}>
                            <i className={'fa fa-check-square-o as-secondary-color'}/>
                        </span>
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