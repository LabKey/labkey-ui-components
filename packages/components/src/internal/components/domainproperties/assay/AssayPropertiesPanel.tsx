import React from 'react';
import { Col, Form, Row } from 'react-bootstrap';
import { Utils } from '@labkey/api';

import { DEFINE_ASSAY_SCHEMA_TOPIC } from '../../../../util/helpLinks';
import { HelpTopicURL } from '../HelpTopicURL';
import {
    InjectedDomainPropertiesPanelCollapseProps,
    withDomainPropertiesPanelCollapse,
} from '../DomainPropertiesPanelCollapse';
import { SectionHeading } from '../SectionHeading';
import { BasePropertiesPanel, BasePropertiesPanelProps } from '../BasePropertiesPanel';

import { AssayProtocolModel } from './models';
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
    PlateMetadataInput,
    PlateTemplatesInput,
    QCStatesInput,
    SaveScriptDataInput,
    TransformScriptsInput,
} from './AssayPropertiesInput';

const PROPERTIES_HEADER_ID = 'assay-properties-hdr';
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
    SAVE_SCRIPT_FILES: FORM_ID_PREFIX + 'saveScriptFiles',
    PLATE_METADATA: FORM_ID_PREFIX + 'plateMetadata',
};
const BOOLEAN_FIELDS = [
    FORM_IDS.BACKGROUND_UPLOAD,
    FORM_IDS.EDITABLE_RUNS,
    FORM_IDS.EDITABLE_RESULTS,
    FORM_IDS.QC_ENABLED,
    FORM_IDS.SAVE_SCRIPT_FILES,
    FORM_IDS.PLATE_METADATA,
];

interface OwnProps {
    model: AssayProtocolModel;
    onChange: (model: AssayProtocolModel) => any;
    appPropertiesOnly?: boolean;
    asPanel?: boolean;
    helpTopic?: string;
}

type Props = OwnProps & BasePropertiesPanelProps;

interface State {
    isValid: boolean;
}

class AssayPropertiesPanelImpl extends React.PureComponent<Props & InjectedDomainPropertiesPanelCollapseProps, State> {
    static defaultProps = {
        appPropertiesOnly: false,
        asPanel: true,
        helpTopic: DEFINE_ASSAY_SCHEMA_TOPIC,
    };

    constructor(props) {
        super(props);

        this.state = {
            isValid: true,
        };
    }

    updateValidStatus = (newModel?: AssayProtocolModel) => {
        const { model, onChange } = this.props;
        const updatedModel = newModel || model;
        const isValid = updatedModel && updatedModel.hasValidProperties();
        this.setState(
            () => ({ isValid }),
            () => {
                // Issue 39918: only consider the model changed if there is a newModel param
                if (newModel) {
                    onChange(updatedModel);
                }
            }
        );
    };

    onInputChange = evt => {
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
            [id.replace(FORM_ID_PREFIX, '')]: value,
        }) as AssayProtocolModel;

        this.updateValidStatus(newModel);
    };

    renderBasicProperties() {
        const { model, appPropertiesOnly } = this.props;

        return (
            <>
                <div className="domain-field-padding-bottom">
                    <SectionHeading title="Basic Properties" />
                    <NameInput model={model} onChange={this.onInputChange} appPropertiesOnly={appPropertiesOnly} />
                    <DescriptionInput
                        model={model}
                        onChange={this.onInputChange}
                        appPropertiesOnly={appPropertiesOnly}
                    />
                    {model.allowPlateTemplateSelection() && (
                        <PlateTemplatesInput
                            model={model}
                            onChange={this.onInputChange}
                            appPropertiesOnly={appPropertiesOnly}
                        />
                    )}
                    {model.allowDetectionMethodSelection() && (
                        <DetectionMethodsInput
                            model={model}
                            onChange={this.onInputChange}
                            appPropertiesOnly={appPropertiesOnly}
                        />
                    )}
                    {model.allowMetadataInputFormatSelection() && (
                        <MetadataInputFormatsInput
                            model={model}
                            onChange={this.onInputChange}
                            appPropertiesOnly={appPropertiesOnly}
                        />
                    )}
                    {!appPropertiesOnly && model.allowQCStates && (
                        <QCStatesInput model={model} onChange={this.onInputChange} />
                    )}
                    {!appPropertiesOnly && model.allowPlateMetadata && (
                        <PlateMetadataInput model={model} onChange={this.onInputChange} />
                    )}
                </div>
            </>
        );
    }

    renderImportSettings() {
        const { model } = this.props;

        return (
            <>
                <div className="domain-field-padding-bottom">
                    <SectionHeading title="Import Settings" />
                    <AutoCopyDataInput model={model} onChange={this.onInputChange} />
                    {model.allowBackgroundUpload && (
                        <BackgroundUploadInput model={model} onChange={this.onInputChange} />
                    )}
                    {model.allowTransformationScript && (
                        <TransformScriptsInput model={model} onChange={this.onValueChange} />
                    )}
                    {model.allowTransformationScript && (
                        <SaveScriptDataInput model={model} onChange={this.onInputChange} />
                    )}
                    {model.moduleTransformScripts && model.moduleTransformScripts.size > 0 && (
                        <ModuleProvidedScriptsInput model={model} />
                    )}
                </div>
            </>
        );
    }

    renderEditSettings() {
        const { model, appPropertiesOnly } = this.props;

        return (
            <>
                <div className="domain-field-padding-bottom">
                    <SectionHeading title="Editing Settings" />
                    <EditableRunsInput
                        model={model}
                        onChange={this.onInputChange}
                        appPropertiesOnly={appPropertiesOnly}
                    />
                    {model.allowEditableResults && (
                        <EditableResultsInput
                            model={model}
                            onChange={this.onInputChange}
                            appPropertiesOnly={appPropertiesOnly}
                        />
                    )}
                </div>
            </>
        );
    }

    renderForm() {
        const { appPropertiesOnly, children } = this.props;

        return (
            <Form>
                {children && (
                    <Row>
                        <Col xs={12}>{children}</Col>
                    </Row>
                )}
                <Col xs={12} lg={appPropertiesOnly ? 12 : 6}>
                    {this.renderBasicProperties()}
                    {this.renderEditSettings()}
                </Col>
                <Col xs={12} lg={6}>
                    {!appPropertiesOnly && this.renderImportSettings()}
                </Col>
            </Form>
        );
    }

    renderPanel() {
        const { model, helpTopic } = this.props;
        const { isValid } = this.state;

        return (
            <BasePropertiesPanel
                {...this.props}
                headerId={PROPERTIES_HEADER_ID}
                title="Assay Properties"
                titlePrefix={model.name}
                updateValidStatus={this.updateValidStatus}
                isValid={isValid}
            >
                {helpTopic && <HelpTopicURL nounPlural="assays" helpTopic={helpTopic} />}
                {this.renderForm()}
            </BasePropertiesPanel>
        );
    }

    render() {
        return <>{this.props.asPanel ? this.renderPanel() : this.renderForm()}</>;
    }
}

export const AssayPropertiesPanel = withDomainPropertiesPanelCollapse<Props>(AssayPropertiesPanelImpl);
