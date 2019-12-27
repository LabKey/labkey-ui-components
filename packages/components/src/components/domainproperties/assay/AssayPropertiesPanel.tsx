import React from 'react';
import { Col, Form, Panel, Row } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationCircle, faMinusSquare, faPlusSquare } from '@fortawesome/free-solid-svg-icons';
import { Utils } from '@labkey/api';

import { AssayProtocolModel, DomainPanelStatus } from '../models';
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
import { createFormInputName } from '../actions';
import { LabelHelpTip } from '../../base/LabelHelpTip';
import { Alert } from '../../base/Alert';
import { DEFINE_ASSAY_SCHEMA_TOPIC, getHelpLink } from '../../../util/helpLinks';

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
    onChange: (model: any) => any
    basePropertiesOnly: boolean
    asPanel: boolean
    initCollapsed: boolean
    collapsible?: boolean
    controlledCollapse?: boolean
    validate?: boolean
    useTheme?: boolean
    panelStatus?: DomainPanelStatus
    helpURL?: string
    onToggle?: (collapsed: boolean, callback: () => any) => any
}

interface State {
    collapsed: boolean
    validProperties: boolean
}

export class AssayPropertiesPanel extends React.PureComponent<Props, State> {

    static defaultProps = {
        basePropertiesOnly: false,
        asPanel: true,
        initCollapsed: false,
        validate: false,
        helpURL: getHelpLink(DEFINE_ASSAY_SCHEMA_TOPIC)
    };

    constructor(props) {
        super(props);

        this.state = {
            collapsed: props.initCollapsed,
            validProperties: true
        };
    }

    componentWillReceiveProps(nextProps: Readonly<Props>, nextContext: any): void {
        const { controlledCollapse, initCollapsed, validate, model, onChange } = this.props;

        // if controlled collapse, allow the prop change to update the collapsed state
        if (controlledCollapse && nextProps.initCollapsed !== initCollapsed) {
            this.toggleLocalPanel(nextProps.initCollapsed);
        }

        if (nextProps.validate && validate !== nextProps.validate) {
            const valid = model.hasValidProperties();
            this.setState(() => ({validProperties: (model && valid)}), () => {
                if (onChange)
                {
                    onChange(model);
                }
            })
        }
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any): void {
        // This is kind of a hacky way to remove a class from core css so we can set the color of the panel hdr to match the theme
        if (prevProps.useTheme) {
            const el = document.getElementById(createFormInputName('assay-properties-hdr'));
            el.classList.remove("panel-heading");
        }
    }

    componentDidMount(): void {
        if (this.props.useTheme) {
            const el = document.getElementById(createFormInputName('assay-properties-hdr'));
            el.classList.remove("panel-heading");
        }
    }

    toggleLocalPanel = (collapsed?: boolean): void => {
        const { model } = this.props;

        this.setState((state) => ({
            collapsed: collapsed !== undefined ? collapsed : !state.collapsed,
            validProperties: model && model.hasValidProperties()
        }));
    };

    togglePanel = (evt: any, collapsed?: boolean): void => {
        const { onToggle, collapsible, controlledCollapse } = this.props;

        if (collapsible || controlledCollapse) {
            if (onToggle) {
                onToggle((collapsed !== undefined ? collapsed : !this.state.collapsed), this.toggleLocalPanel);
            }
            else {
                this.toggleLocalPanel(collapsed)
            }
        }
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

        this.setState((state) => (
                // Only clear validation errors here. New errors found on collapse or submit.
                {validProperties: valid}),
            () => {
                this.props.onChange(newModel);
            });

    };

    getPanelHeaderClass(): string {
        const { collapsible, controlledCollapse, useTheme } = this.props;
        const { collapsed } = this.state;

        let classes = 'domain-panel-header ' + ((collapsible || controlledCollapse) ? 'domain-heading-collapsible' : '');
        classes += (!collapsed ? ' domain-panel-header-expanded' : ' domain-panel-header-collapsed');
        if (!collapsed) {
            classes += (useTheme ? ' labkey-page-nav' : ' domain-panel-header-no-theme');
        }

        return classes;
    }

    renderBasicProperties() {
        const { model, basePropertiesOnly, helpURL } = this.props;

        return (
            <>
                <div className='domain-field-padding-bottom'>
                    <SectionHeading title={'Basic Properties'} helpURL={helpURL}/>
                    <NameInput model={model} onChange={this.onInputChange} basePropertiesOnly={basePropertiesOnly}/>
                    <DescriptionInput model={model} onChange={this.onInputChange} basePropertiesOnly={basePropertiesOnly}/>
                    {model.allowPlateTemplateSelection() && <PlateTemplatesInput model={model} onChange={this.onInputChange} basePropertiesOnly={basePropertiesOnly}/>}
                    {model.allowDetectionMethodSelection() && <DetectionMethodsInput model={model} onChange={this.onInputChange} basePropertiesOnly={basePropertiesOnly}/>}
                    {model.allowMetadataInputFormatSelection() && <MetadataInputFormatsInput model={model} onChange={this.onInputChange} basePropertiesOnly={basePropertiesOnly}/>}
                    {!basePropertiesOnly && model.allowQCStates && <QCStatesInput model={model} onChange={this.onInputChange}/>}
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
        const { model, basePropertiesOnly } = this.props;

        return (
            <>
                <div className="domain-field-padding-bottom">
                    <SectionHeading title={'Editing Settings'}/>
                    {<EditableRunsInput model={model} onChange={this.onInputChange} basePropertiesOnly={basePropertiesOnly}/>}
                    {model.allowEditableResults && <EditableResultsInput model={model} onChange={this.onInputChange} basePropertiesOnly={basePropertiesOnly}/>}
                </div>
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
                <Col xs={12} lg={basePropertiesOnly ? 12 : 6}>
                    {this.renderBasicProperties()}
                    {this.renderEditSettings()}
                </Col>
                <Col xs={12} lg={6}>
                    {!basePropertiesOnly && this.renderImportSettings()}
                </Col>
            </Form>
        )
    }

    getHeaderIconClass = () => {
        const { panelStatus } = this.props;
        const { collapsed, validProperties } = this.state;
        let classes = 'domain-panel-status-icon';

        if (collapsed) {
            if (validProperties && panelStatus === 'COMPLETE') {
                return classes + ' domain-panel-status-icon-green';
            }
            return (classes + ' domain-panel-status-icon-blue');
        }

        return classes;
    };

    getHeaderIcon = () => {
        const { panelStatus } = this.props;
        const { validProperties } = this.state;

        if (!validProperties || panelStatus === 'TODO') {
            return faExclamationCircle;
        }

        return faCheckCircle;
    };

    getHeaderIconComponent = () => {

        return (
            <span className={this.getHeaderIconClass()}>
                <FontAwesomeIcon icon={this.getHeaderIcon()}/>
            </span>
        )
    };

    getHeaderIconHelpMsg = () => {
        const { panelStatus } = this.props;
        const { validProperties } = this.state;

        if (!validProperties) {
            return "This section has errors."
        }

        if (panelStatus === 'TODO') {
            return "This section does not contain any user defined fields.  You may want to review."
        }

        return undefined;
    };

    getPanelClass = () => {
        const { collapsed } = this.state;
        const { useTheme } = this.props;

        let classes = 'domain-form-panel';

        if (!collapsed) {
            if (useTheme) {
                classes += ' lk-border-theme-light';
            }
            else {
                classes += ' domain-panel-no-theme';
            }
        }

        return classes;
    };

    getAlertClasses = () => {
        const { collapsed } = this.state;
        const { useTheme } = this.props;

        let classes = 'domain-bottom-alert panel-default';

        if (!collapsed) {
            if (useTheme) {
                classes += ' lk-border-theme-light';
            }
            else {
                classes += ' domain-bottom-alert-expanded';
            }
        }
        else {
            classes += ' panel-default';
        }

        if (!collapsed)
            classes += ' domain-bottom-alert-top';

        return classes;
    };

    renderHeader() {
        const { name } = this.props.model;
        const { panelStatus, controlledCollapse, collapsible } = this.props;
        const { collapsed } = this.state;

        const iconHelpMsg = ((panelStatus && panelStatus !== 'NONE') ? this.getHeaderIconHelpMsg() : undefined);

        return (
            <>
                {/*Setup header help icon if applicable*/}
                {iconHelpMsg &&
                    <LabelHelpTip title={'Assay Properties'} body={() => (iconHelpMsg)} placement="top" iconComponent={this.getHeaderIconComponent}/>
                }
                {panelStatus && panelStatus !== 'NONE' && !iconHelpMsg && this.getHeaderIconComponent()}

                <span className={'domain-panel-title'}>{(name ? name + ' - ' : '') + 'Assay Properties'}</span>
                {(controlledCollapse || collapsible) && collapsed &&
                <span className={'pull-right'}>
                            <FontAwesomeIcon size={'lg'} icon={faPlusSquare} className={"domain-form-expand-btn"}/>
                        </span>
                }
                {(controlledCollapse || collapsible) && !collapsed &&
                <span className={'pull-right'}>
                            <FontAwesomeIcon size={'lg'} icon={faMinusSquare} className={"domain-form-collapse-btn"}/>
                        </span>
                }
            </>
        )
    }

    renderPanel() {
        const { collapsible, controlledCollapse } = this.props;
        const { collapsed, validProperties } = this.state;

        return (
            <>
            <Panel className={this.getPanelClass()} expanded={!collapsed} onToggle={function(){}}>
                <Panel.Heading onClick={this.togglePanel} className={this.getPanelHeaderClass()} id={createFormInputName('assay-properties-hdr')}>
                    {this.renderHeader()}
                </Panel.Heading>
                <Panel.Body collapsible={collapsible || controlledCollapse}>
                    {this.props.helpURL && <HelpURL helpURL={this.props.helpURL}/>}
                    {this.renderForm()}
                </Panel.Body>
            </Panel>
            {!validProperties &&
                <div onClick={this.togglePanel} className={this.getAlertClasses()}>
                    <Alert bsStyle="danger">Contains errors or is missing required values.</Alert>
                </div>
            }
            </>
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
                <div className={'domain-field-section-heading'}>
                    {props.title}
                </div>
            </Col>
        </Row>
    )
}

interface HelpURLProps {
    helpURL: string
}

function HelpURL(props: HelpURLProps) {
    return (
        <Row>
            <Col xs={12}>
                <a className='domain-field-float-right' target="_blank" href={props.helpURL}>Learn more about designing assays</a>
            </Col>
        </Row>
    )
}
