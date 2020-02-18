import React from 'react';
import { Col, Form, Panel, Row } from 'react-bootstrap';
import { Utils } from '@labkey/api';
import { DomainPanelStatus } from '../models';
import { AssayProtocolModel } from '../assay/models';
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
    TransformScriptsInput,
} from './AssayPropertiesInput';
import { getDomainAlertClasses, getDomainPanelClass, updateDomainPanelClassList } from '../actions';
import { Alert } from '../../base/Alert';
import { DEFINE_ASSAY_SCHEMA_TOPIC } from '../../../util/helpLinks';
import { CollapsiblePanelHeader } from "../CollapsiblePanelHeader";
import { HelpTopicURL } from "../HelpTopicURL";
import {
    DomainPropertiesPanelContext,
    DomainPropertiesPanelProvider,
    IDomainPropertiesPanelContext
} from "../DomainPropertiesPanelContext";

const ERROR_MSG = 'Contains errors or is missing required values.';

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
    onChange: (model: AssayProtocolModel) => any
    appPropertiesOnly?: boolean
    asPanel?: boolean
    initCollapsed?: boolean
    collapsible?: boolean
    controlledCollapse?: boolean
    validate?: boolean
    useTheme?: boolean
    panelStatus?: DomainPanelStatus
    helpTopic?: string
    onToggle?: (collapsed: boolean, callback: () => any) => any
}

interface State {
    validProperties: boolean
}

export class AssayPropertiesPanel extends React.PureComponent<Props> {
    render() {
        const { controlledCollapse, collapsible, initCollapsed, onToggle } = this.props;

        return (
            <DomainPropertiesPanelProvider
                controlledCollapse={controlledCollapse}
                collapsible={collapsible}
                initCollapsed={initCollapsed}
                onToggle={onToggle}
            >
                <AssayPropertiesPanelImpl {...this.props} />
            </DomainPropertiesPanelProvider>
        )
    }
}

class AssayPropertiesPanelImpl extends React.PureComponent<Props, State> {

    static defaultProps = {
        appPropertiesOnly: false,
        asPanel: true,
        initCollapsed: false,
        validate: false,
        helpTopic: DEFINE_ASSAY_SCHEMA_TOPIC,
    };

    constructor(props) {
        super(props);

        this.state = {
            validProperties: true
        };
    }

    componentWillReceiveProps(nextProps: Readonly<Props>, nextContext: any): void {
        const { validate } = this.props;
        if (nextProps.validate && validate !== nextProps.validate) {
            this.setValidProperties();
        }
    }

    componentDidMount(): void {
        updateDomainPanelClassList(this.props.useTheme, undefined, 'assay-properties-hdr');
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any): void {
        updateDomainPanelClassList(prevProps.useTheme, undefined, 'assay-properties-hdr');
    }

    setValidProperties() {
        const { model, onChange } = this.props;
        const validProperties = model && model.hasValidProperties();
        this.setState(() => ({validProperties}), () => onChange(model));
    }

    toggleLocalPanel = (evt: any, context: IDomainPropertiesPanelContext): void => {
        this.setValidProperties();
        context.togglePanel(evt, !context.collapsed);
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
        const { model } = this.props;

        const newModel = model.merge({
            [id.replace(FORM_ID_PREFIX, '')]: value
        }) as AssayProtocolModel;

        const valid = (newModel.hasValidProperties() === true ? true : this.state.validProperties);

        this.setState(() => (
            // Only clear validation errors here. New errors found on collapse or submit.
            {validProperties: valid}),
        () => {
            this.props.onChange(newModel);
        });
    };

    renderBasicProperties() {
        const { model, appPropertiesOnly, helpTopic } = this.props;

        return (
            <>
                <div className='domain-field-padding-bottom'>
                    <SectionHeading title={'Basic Properties'} helpTopic={helpTopic}/>
                    <NameInput model={model} onChange={this.onInputChange} appPropertiesOnly={appPropertiesOnly}/>
                    <DescriptionInput model={model} onChange={this.onInputChange} appPropertiesOnly={appPropertiesOnly}/>
                    {model.allowPlateTemplateSelection() && <PlateTemplatesInput model={model} onChange={this.onInputChange} appPropertiesOnly={appPropertiesOnly}/>}
                    {model.allowDetectionMethodSelection() && <DetectionMethodsInput model={model} onChange={this.onInputChange} appPropertiesOnly={appPropertiesOnly}/>}
                    {model.allowMetadataInputFormatSelection() && <MetadataInputFormatsInput model={model} onChange={this.onInputChange} appPropertiesOnly={appPropertiesOnly}/>}
                    {!appPropertiesOnly && model.allowQCStates && <QCStatesInput model={model} onChange={this.onInputChange}/>}
                </div>
            </>
        )
    }

    renderImportSettings() {
        const { model } = this.props;

        return (
            <>
                <div className='domain-field-padding-bottom'>
                    <SectionHeading title={'Import Settings'}/>
                    {<AutoCopyDataInput model={model} onChange={this.onInputChange}/>}
                    {model.allowBackgroundUpload && <BackgroundUploadInput model={model} onChange={this.onInputChange}/>}
                    {model.allowTransformationScript && <TransformScriptsInput model={model} onChange={this.onValueChange}/>}
                    {model.allowTransformationScript && <SaveScriptDataInput model={model} onChange={this.onInputChange}/>}
                    {model.moduleTransformScripts && model.moduleTransformScripts.size > 0 && <ModuleProvidedScriptsInput model={model}/>}
                </div>
            </>
        )
    }

    renderEditSettings() {
        const { model, appPropertiesOnly } = this.props;

        return (
            <>
                <div className="domain-field-padding-bottom">
                    <SectionHeading title={'Editing Settings'}/>
                    {<EditableRunsInput model={model} onChange={this.onInputChange} appPropertiesOnly={appPropertiesOnly}/>}
                    {model.allowEditableResults && <EditableResultsInput model={model} onChange={this.onInputChange} appPropertiesOnly={appPropertiesOnly}/>}
                </div>
            </>
        )
    }

    renderForm() {
        const { appPropertiesOnly, children } = this.props;

        return (
            <Form>
                {children &&
                    <Row>
                        <Col xs={12}>{children}</Col>
                    </Row>
                }
                <Col xs={12} lg={appPropertiesOnly ? 12 : 6}>
                    {this.renderBasicProperties()}
                    {this.renderEditSettings()}
                </Col>
                <Col xs={12} lg={6}>
                    {!appPropertiesOnly && this.renderImportSettings()}
                </Col>
            </Form>
        )
    }

    renderPanel() {
        const { collapsible, controlledCollapse, model, panelStatus, useTheme, helpTopic } = this.props;
        const { validProperties } = this.state;

        return (
            <DomainPropertiesPanelContext.Consumer>
                {(context) =>
                    <>
                        <Panel className={getDomainPanelClass(context.collapsed, true, useTheme)} expanded={!context.collapsed} onToggle={function(){}}>
                            <CollapsiblePanelHeader
                                id={'assay-properties-hdr'}
                                title={'Assay Properties'}
                                titlePrefix={model.name}
                                collapsed={context.collapsed}
                                collapsible={collapsible}
                                controlledCollapse={controlledCollapse}
                                panelStatus={panelStatus}
                                togglePanel={(evt: any) => this.toggleLocalPanel(evt, context)}
                                useTheme={useTheme}
                                isValid={validProperties}
                                iconHelpMsg={ERROR_MSG}
                            />
                            <Panel.Body collapsible={collapsible || controlledCollapse}>
                                {helpTopic && <HelpTopicURL nounPlural={'assays'} helpTopic={helpTopic}/>}
                                {this.renderForm()}
                            </Panel.Body>
                        </Panel>
                        {!validProperties &&
                            <div
                                onClick={(evt: any) => this.toggleLocalPanel(evt, context)}
                                className={getDomainAlertClasses(context.collapsed, true, useTheme)}
                            >
                                <Alert bsStyle="danger">{ERROR_MSG}</Alert>
                            </div>
                        }
                    </>
                }
            </DomainPropertiesPanelContext.Consumer>
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
    helpTopic?: string
}

function SectionHeading(props: SectionHeadingProps) {
    return (
        <Row>
            <Col xs={props.helpTopic ? 9 : 12}>
                <div className={'domain-field-section-heading'}>
                    {props.title}
                </div>
            </Col>
        </Row>
    )
}
