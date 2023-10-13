import React, { FC, memo, useCallback, useState } from 'react';
import { Col, Form, Row } from 'react-bootstrap';
import { Utils } from '@labkey/api';

import { DEFINE_ASSAY_SCHEMA_TOPIC } from '../../../util/helpLinks';
import { HelpTopicURL } from '../HelpTopicURL';
import {
    InjectedDomainPropertiesPanelCollapseProps,
    withDomainPropertiesPanelCollapse,
} from '../DomainPropertiesPanelCollapse';
import { SectionHeading } from '../SectionHeading';
import { BasePropertiesPanel, BasePropertiesPanelProps } from '../BasePropertiesPanel';

import { hasModule, isAssayQCEnabled, isPremiumProductEnabled } from '../../../app/utils';

import { useServerContext } from '../../base/ServerContext';

import { AssayProtocolModel, Status } from './models';
import {
    AssayStatusInput,
    AutoLinkCategoryInput,
    AutoLinkDataInput,
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
import { BOOLEAN_FIELDS, FORM_ID_PREFIX, PROPERTIES_HEADER_ID } from './constants';

interface AssayPropertiesFormProps {
    appPropertiesOnly?: boolean;
    hideStudyProperties?: boolean;
    model: AssayProtocolModel;
    onChange: (model: AssayProtocolModel) => void;
}

const AssayPropertiesForm: FC<AssayPropertiesFormProps> = memo(props => {
    const { appPropertiesOnly, children, hideStudyProperties, model, onChange } = props;
    const { moduleContext } = useServerContext();

    const onValueChange = useCallback(
        (id, value): void => {
            const newModel = model.merge({
                [id.replace(FORM_ID_PREFIX, '')]: value?.trimStart(),
            }) as AssayProtocolModel;

            onChange(newModel);
        },
        [model, onChange]
    );

    const onInputChange = useCallback(
        (evt): void => {
            const id = evt.target.id;
            let value = evt.target.value;

            // special case for checkboxes to use "checked" property of target
            if (BOOLEAN_FIELDS.indexOf(id) > -1) {
                value = evt.target.checked;
            }

            // special case for empty string, set as null instead
            if (Utils.isString(value) && value?.trimStart().length === 0) {
                value = null;
            }

            onValueChange(id, value);
        },
        [onValueChange]
    );

    const onStatusChange = useCallback(
        (evt): void => {
            const id = evt.target.id;
            const value = evt.target.checked ? Status.Active : Status.Archived;

            const newModel = model.merge({
                [id.replace(FORM_ID_PREFIX, '')]: value,
            }) as AssayProtocolModel;

            onChange(newModel);
        },
        [model, onChange]
    );

    return (
        <Form>
            {children && (
                <Row>
                    <Col xs={12}>{children}</Col>
                </Row>
            )}

            <Col xs={12} lg={appPropertiesOnly ? 12 : 6}>
                <div className="domain-field-padding-bottom">
                    <SectionHeading title="Basic Properties" />
                    <NameInput model={model} onChange={onInputChange} appPropertiesOnly={appPropertiesOnly} />
                    <DescriptionInput model={model} onChange={onInputChange} appPropertiesOnly={appPropertiesOnly} />
                    {model.allowPlateTemplateSelection() && (
                        <PlateTemplatesInput
                            model={model}
                            onChange={onInputChange}
                            appPropertiesOnly={appPropertiesOnly}
                        />
                    )}
                    {model.allowDetectionMethodSelection() && (
                        <DetectionMethodsInput
                            model={model}
                            onChange={onInputChange}
                            appPropertiesOnly={appPropertiesOnly}
                        />
                    )}
                    {model.allowMetadataInputFormatSelection() && (
                        <MetadataInputFormatsInput
                            model={model}
                            onChange={onInputChange}
                            appPropertiesOnly={appPropertiesOnly}
                        />
                    )}
                    {!appPropertiesOnly && model.allowQCStates && isAssayQCEnabled(moduleContext) && (
                        <QCStatesInput model={model} onChange={onInputChange} />
                    )}
                    {!appPropertiesOnly && model.allowPlateMetadata && (
                        <PlateMetadataInput model={model} onChange={onInputChange} />
                    )}
                    {isPremiumProductEnabled(moduleContext) && (
                        <AssayStatusInput
                            model={model}
                            onChange={onStatusChange}
                            appPropertiesOnly={appPropertiesOnly}
                        />
                    )}
                </div>
                <div className="domain-field-padding-bottom">
                    <SectionHeading title="Editing Settings" />
                    <EditableRunsInput model={model} onChange={onInputChange} appPropertiesOnly={appPropertiesOnly} />
                    {model.allowEditableResults && (
                        <EditableResultsInput
                            model={model}
                            onChange={onInputChange}
                            appPropertiesOnly={appPropertiesOnly}
                        />
                    )}
                </div>
            </Col>

            {!appPropertiesOnly && (
                <Col xs={12} lg={6}>
                    <div className="domain-field-padding-bottom">
                        <SectionHeading title="Import Settings" />
                        {model.allowBackgroundUpload && (
                            <BackgroundUploadInput model={model} onChange={onInputChange} />
                        )}
                        {model.allowTransformationScript && (
                            <TransformScriptsInput model={model} onChange={onValueChange} />
                        )}
                        {model.allowTransformationScript && (
                            <SaveScriptDataInput model={model} onChange={onInputChange} />
                        )}
                        {model.moduleTransformScripts?.size > 0 && <ModuleProvidedScriptsInput model={model} />}
                    </div>
                </Col>
            )}

            {!appPropertiesOnly && !hideStudyProperties && hasModule('study', moduleContext) && (
                <Col xs={12} lg={6}>
                    <div className="domain-field-padding-bottom">
                        <SectionHeading title="Link to Study Settings" />
                        <AutoLinkDataInput model={model} onChange={onInputChange} />
                        <AutoLinkCategoryInput model={model} onChange={onInputChange} />
                    </div>
                </Col>
            )}
        </Form>
    );
});

AssayPropertiesForm.displayName = 'AssayPropertiesForm';

interface OwnProps extends AssayPropertiesFormProps {
    asPanel?: boolean;
    helpTopic?: string;
}

type Props = OwnProps & BasePropertiesPanelProps;

const AssayPropertiesPanelImpl: FC<Props & InjectedDomainPropertiesPanelCollapseProps> = memo(props => {
    const { appPropertiesOnly, asPanel, children, helpTopic, hideStudyProperties, model, onChange } = props;
    const [isValid, setIsValid] = useState<boolean>(true);

    const updateValidStatus = useCallback(
        (newModel?: AssayProtocolModel): void => {
            const updatedModel = newModel || model;
            setIsValid(!!updatedModel?.hasValidProperties());

            // Issue 39918: only consider the model changed if there is a newModel param
            if (newModel) {
                onChange(updatedModel);
            }
        },
        [model, onChange]
    );

    const form = (
        <AssayPropertiesForm
            appPropertiesOnly={appPropertiesOnly}
            hideStudyProperties={hideStudyProperties}
            model={model}
            onChange={updateValidStatus}
        >
            {children}
        </AssayPropertiesForm>
    );

    if (asPanel) {
        return (
            <BasePropertiesPanel
                {...props}
                headerId={PROPERTIES_HEADER_ID}
                isValid={isValid}
                title="Assay Properties"
                updateValidStatus={updateValidStatus}
            >
                {helpTopic && <HelpTopicURL nounPlural="assays" helpTopic={helpTopic} />}
                {form}
            </BasePropertiesPanel>
        );
    }

    return form;
});

AssayPropertiesPanelImpl.defaultProps = {
    appPropertiesOnly: false,
    hideStudyProperties: false,
    asPanel: true,
    helpTopic: DEFINE_ASSAY_SCHEMA_TOPIC,
};

AssayPropertiesPanelImpl.displayName = 'AssayPropertiesPanelImpl';

export const AssayPropertiesPanel = withDomainPropertiesPanelCollapse<Props>(AssayPropertiesPanelImpl);
