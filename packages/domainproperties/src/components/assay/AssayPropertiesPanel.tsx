import * as React from 'react';
import { Col, Form, Row, Panel } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlusSquare, faMinusSquare } from "@fortawesome/free-solid-svg-icons";
import { Utils } from "@labkey/api";

import { AssayProtocolModel } from "../../models";
import { LK_ASSAY_DESIGNER_HELP_URL } from "../../constants";
import {
    AutoCopyDataInput,
    BackgroundUploadInput,
    DescriptionInput,
    DetectionMethodsInput,
    EditableResultsInput,
    EditableRunsInput,
    MetadataInputFormatsInput,
    ModuleProvidedScriptsInput,
    NameInput,
    PlateTemplatesInput,
    QCStatesInput,
    SaveScriptDataInput,
    TransformScriptsInput
} from "./AssayPropertiesInput";

const FORM_ID_PREFIX = 'assay-design-';
export const FORM_IDS = {
    ASSAY_NAME: FORM_ID_PREFIX + 'name',
    ASSAY_DESCRIPTION: FORM_ID_PREFIX + 'description',
    AUTO_COPY_TARGET: FORM_ID_PREFIX + 'autoCopyTargetContainerId',
    BACKGROUND_UPLOAD: FORM_ID_PREFIX + 'backgroundUpload',
    DETECTION_METHOD: FORM_ID_PREFIX + 'selectedDetectionMethod',
    EDITABLE_RUNS: FORM_ID_PREFIX + 'editableRuns',
    EDITABLE_RESULTS: FORM_ID_PREFIX + 'editableResults',
    METADATA_INPUT_FORMAT: FORM_ID_PREFIX + 'selectedMetadataInputFormat',
    PLATE_TEMPLATE: FORM_ID_PREFIX + 'selectedPlateTemplate',
    PROTOCOL_TRANSFORM_SCRIPTS: FORM_ID_PREFIX + 'protocolTransformScripts',
    QC_ENABLED: FORM_ID_PREFIX + 'qcEnabled',
    SAVE_SCRIPT_FILES: FORM_ID_PREFIX + 'saveScriptFiles'
};
const BOOLEAN_FIELDS = [
    FORM_IDS.BACKGROUND_UPLOAD, FORM_IDS.EDITABLE_RUNS, FORM_IDS.EDITABLE_RESULTS,
    FORM_IDS.QC_ENABLED, FORM_IDS.SAVE_SCRIPT_FILES
];

interface Props {
    model: AssayProtocolModel
    onChange: (evt: any) => any
    basePropertiesOnly: boolean
    asPanel: boolean
    initCollapsed: boolean
    collapsible?: boolean
    markComplete?: boolean
    panelCls?: string
    helpURL?: string
}

interface State {
    collapsed: boolean
}

export class AssayPropertiesPanel extends React.PureComponent<Props, State> {

    static defaultProps = {
        basePropertiesOnly: false,
        asPanel: true,
        initCollapsed: false,
        helpURL: LK_ASSAY_DESIGNER_HELP_URL
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

    onPanelHeaderClick = (evt: any) => {
        if (this.props.collapsible) {
            this.togglePanel(null);
        }
    };

    togglePanel = (evt: any, collapsed?: boolean): void => {
        this.setState((state) => ({
            collapsed: collapsed !== undefined ? collapsed : !state.collapsed
        }));
    };

    onInputChange = (evt) => {
        const id = evt.target.id;
        let value = evt.target.value;

        // special case for checkboxes to use "checked" property of target
        if (BOOLEAN_FIELDS.indexOf(id) > -1) {
            value = evt.target.checked;
        }

        // special case for empty string, set as null instead
        if (Utils.isString(value) && value.length === 0) {
            value = null;
        }

        this.onValueChange(id, value);
    };

    onValueChange = (id, value) => {
        this.props.onChange(this.props.model.merge({
            [id.replace(FORM_ID_PREFIX, '')]: value
        }));
    };

    renderBasicProperties() {
        const { model, basePropertiesOnly, helpURL } = this.props;

        return (
            <>
                <SectionHeading title={'Basic Properties'} helpURL={helpURL}/>
                <NameInput model={model} onChange={this.onInputChange}/>
                <DescriptionInput model={model} onChange={this.onInputChange}/>
                {model.allowPlateTemplateSelection() && <PlateTemplatesInput model={model} onChange={this.onInputChange}/>}
                {model.allowDetectionMethodSelection() && <DetectionMethodsInput model={model} onChange={this.onInputChange}/>}
                {model.allowMetadataInputFormatSelection() && <MetadataInputFormatsInput model={model} onChange={this.onInputChange}/>}
                {!basePropertiesOnly && model.allowQCStates && <QCStatesInput model={model} onChange={this.onInputChange}/>}
            </>
        )
    }

    renderImportSettings() {
        const { model } = this.props;

        return (
            <>
                <SectionHeading title={'Import Settings'} paddingTop={true}/>
                {<AutoCopyDataInput model={model} onChange={this.onInputChange}/>}
                {model.allowBackgroundUpload && <BackgroundUploadInput model={model} onChange={this.onInputChange}/>}
                {model.allowTransformationScript && <TransformScriptsInput model={model} onChange={this.onValueChange}/>}
                {model.allowTransformationScript && <SaveScriptDataInput model={model} onChange={this.onInputChange}/>}
                {model.moduleTransformScripts && model.moduleTransformScripts.size > 0 && <ModuleProvidedScriptsInput model={model}/>}
            </>
        )
    }

    renderEditSettings() {
        const { model } = this.props;

        return (
            <>
                <SectionHeading title={'Editing Settings'} paddingTop={true}/>
                {<EditableRunsInput model={model} onChange={this.onInputChange}/>}
                {model.allowEditableResults && <EditableResultsInput model={model} onChange={this.onInputChange}/>}
            </>
        )
    }

    renderForm() {
        const { basePropertiesOnly, children } = this.props;

        return (
            <Form>
                {children &&
                    <Row>
                        <Col xs={12}>{children}</Col>
                    </Row>
                }
                {this.renderBasicProperties()}
                {!basePropertiesOnly && this.renderImportSettings()}
                {this.renderEditSettings()}
            </Form>
        )
    }

    renderHeader() {
        const { name } = this.props.model;

        return (
            <span>Assay Properties{this.state.collapsed && name ? ' (' + name + ')' : ''}</span>
        )
    }

    renderPanel() {
        const { collapsible, markComplete, panelCls } = this.props;
        const { collapsed } = this.state;

        return (
            <Panel className={"domain-form-panel" + (panelCls ? ' ' + panelCls : '')}>
                <Panel.Heading onClick={this.onPanelHeaderClick} className={collapsible ? 'domain-heading-collapsible' : ''}>
                    {this.renderHeader()}
                    {collapsible && collapsed &&
                        <span className={'pull-right'}>
                            <FontAwesomeIcon size={'lg'} icon={faPlusSquare} className={"domain-form-expand-btn"}/>
                        </span>
                    }
                    {collapsible && !collapsed &&
                        <span className={'pull-right'}>
                            <FontAwesomeIcon size={'lg'} icon={faMinusSquare} className={"domain-form-expand-btn"}/>
                        </span>
                    }
                    {!collapsible && collapsed && markComplete &&
                        <span className={'pull-right'}>
                            <i className={'fa fa-check-square-o fa-lg as-secondary-color'}/>
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

interface SectionHeadingProps {
    title: string
    paddingTop?: boolean
    helpURL?: string
}

function SectionHeading(props: SectionHeadingProps) {
    return (
        <Row>
            <Col xs={props.helpURL ? 9 : 12}>
                <div className={'domain-field-section-heading' + (props.paddingTop ? ' domain-field-padding-top' : '')}>
                    {props.title}
                </div>
            </Col>
            {props.helpURL && <HelpURL helpURL={props.helpURL}/>}
        </Row>
    )
}

interface HelpURLProps {
    helpURL: string
}

function HelpURL(props: HelpURLProps) {
    return (
        <Col xs={3}>
            <a className='domain-field-float-right' target="_blank" href={props.helpURL}>Learn more about designing assays</a>
        </Col>
    )
}