import React from 'react';
import { Col, FormControl, Row } from 'react-bootstrap';
import { List } from 'immutable';
import { ActionURL } from '@labkey/api';

import { Container } from '../../base/models/model';
import { LoadingSpinner } from '../../base/LoadingSpinner';
import { RemoveEntityButton } from '../../buttons/RemoveEntityButton';
import { AddEntityButton } from '../../buttons/AddEntityButton';
import {
    ASSAY_EDIT_PLATE_TEMPLATE_TOPIC,
    CONFIGURE_SCRIPTING_TOPIC,
    helpLinkNode,
    PROGRAMMATIC_QC_TOPIC,
} from '../../../util/helpLinks';
import { DomainFieldLabel } from '../DomainFieldLabel';

import { getValidPublishTargets } from './actions';

import { AssayProtocolModel } from './models';
import { FORM_IDS } from './AssayPropertiesPanel';

interface AssayPropertiesInputProps {
    label: string;
    required?: boolean;
    colSize?: number;
    helpTipBody?: () => any;
    appPropertiesOnly?: boolean;
}

export class AssayPropertiesInput extends React.PureComponent<AssayPropertiesInputProps, any> {
    render() {
        const { label, required, helpTipBody, colSize, appPropertiesOnly, children } = this.props;

        return (
            <Row className="margin-top">
                <Col xs={3} lg={appPropertiesOnly ? 2 : 4}>
                    <DomainFieldLabel label={label} required={required} helpTipBody={helpTipBody} />
                </Col>
                <Col xs={colSize || 9} lg={appPropertiesOnly ? 10 : 8}>
                    {children}
                </Col>
            </Row>
        );
    }
}

interface InputProps {
    model: AssayProtocolModel;
    onChange: (evt) => void;
    appPropertiesOnly?: boolean;
}

export function NameInput(props: InputProps) {
    return (
        <AssayPropertiesInput
            label="Name"
            required={true}
            appPropertiesOnly={props.appPropertiesOnly}
            helpTipBody={() => {
                return (
                    <>
                        <p>
                            The name for this assay design. Note that this can't be changed after the assay design is
                            created.
                        </p>
                    </>
                );
            }}
        >
            <FormControl
                id={FORM_IDS.ASSAY_NAME}
                type="text"
                placeholder="Enter a name for this assay"
                value={props.model.name || ''}
                onChange={props.onChange}
                disabled={!props.model.isNew()}
            />
        </AssayPropertiesInput>
    );
}

export function DescriptionInput(props: InputProps) {
    return (
        <AssayPropertiesInput
            label="Description"
            appPropertiesOnly={props.appPropertiesOnly}
            helpTipBody={() => {
                return <p>A short description for this assay design.</p>;
            }}
        >
            <textarea
                className="form-control textarea-noresize"
                id={FORM_IDS.ASSAY_DESCRIPTION}
                value={props.model.description || ''}
                onChange={props.onChange}
            />
        </AssayPropertiesInput>
    );
}

export function QCStatesInput(props: InputProps) {
    return (
        <AssayPropertiesInput
            label="QC States"
            helpTipBody={() => {
                return (
                    <p>
                        If enabled, QC states can be configured and assigned on a per run basis to control the
                        visibility of imported run data. Users not in the QC Analyst role will not be able to view
                        non-public data.
                    </p>
                );
            }}
        >
            <input type="checkbox" id={FORM_IDS.QC_ENABLED} checked={props.model.qcEnabled} onChange={props.onChange} />
        </AssayPropertiesInput>
    );
}

export function PlateTemplatesInput(props: InputProps) {
    return (
        <AssayPropertiesInput
            label="Plate Template"
            required={true}
            colSize={6}
            appPropertiesOnly={props.appPropertiesOnly}
            helpTipBody={() => {
                return (
                    <>
                        <p>
                            Specify the plate template definition used to map spots or wells on the plate to data fields
                            in this assay design. For additional information refer to the{' '}
                            {helpLinkNode(ASSAY_EDIT_PLATE_TEMPLATE_TOPIC, 'help documentation')}.
                        </p>
                    </>
                );
            }}
        >
            <FormControl
                componentClass="select"
                id={FORM_IDS.PLATE_TEMPLATE}
                onChange={props.onChange}
                value={props.model.selectedPlateTemplate}
            >
                <option key="_empty" value={null} />
                {props.model.availablePlateTemplates.map((type, i) => (
                    <option key={i} value={type}>
                        {type}
                    </option>
                ))}
            </FormControl>
            <a
                href={ActionURL.buildURL('plate', 'plateTemplateList', LABKEY.container.path)}
                className="labkey-text-link"
            >
                Configure Templates
            </a>
        </AssayPropertiesInput>
    );
}

export function DetectionMethodsInput(props: InputProps) {
    return (
        <AssayPropertiesInput
            label="Detection Method"
            required={true}
            colSize={6}
            appPropertiesOnly={props.appPropertiesOnly}
        >
            <FormControl
                componentClass="select"
                id={FORM_IDS.DETECTION_METHOD}
                onChange={props.onChange}
                value={props.model.selectedDetectionMethod}
            >
                <option key="_empty" value={null} />
                {props.model.availableDetectionMethods.map((method, i) => (
                    <option key={i} value={method}>
                        {method}
                    </option>
                ))}
            </FormControl>
        </AssayPropertiesInput>
    );
}

export function MetadataInputFormatsInput(props: InputProps) {
    return (
        <AssayPropertiesInput
            label="Metadata Input Format"
            required={true}
            colSize={6}
            appPropertiesOnly={props.appPropertiesOnly}
            helpTipBody={() => {
                return (
                    <>
                        <p>
                            <strong>Manual: </strong> Metadata is provided as form based manual entry.
                        </p>
                        <p>
                            <strong>File Upload (metadata only): </strong> Metadata is provided from a file upload
                            (separate from the run data file).
                        </p>
                        <p>
                            <strong>Combined File Upload (metadata & run data): </strong> Metadata and run data are
                            combined into a single file upload.
                        </p>
                    </>
                );
            }}
        >
            <FormControl
                componentClass="select"
                id={FORM_IDS.METADATA_INPUT_FORMAT}
                onChange={props.onChange}
                value={props.model.selectedMetadataInputFormat}
            >
                {Object.keys(props.model.availableMetadataInputFormats).map((key, i) => (
                    <option key={i} value={key}>
                        {props.model.availableMetadataInputFormats[key]}
                    </option>
                ))}
            </FormControl>
        </AssayPropertiesInput>
    );
}

export function EditableRunsInput(props: InputProps) {
    return (
        <AssayPropertiesInput
            label="Editable Runs"
            appPropertiesOnly={props.appPropertiesOnly}
            helpTipBody={() => {
                return (
                    <p>
                        If enabled, users with sufficient permissions can edit values at the run level after the initial
                        import is complete. These changes will be audited.
                    </p>
                );
            }}
        >
            <input
                type="checkbox"
                id={FORM_IDS.EDITABLE_RUNS}
                checked={props.model.editableRuns}
                onChange={props.onChange}
            />
        </AssayPropertiesInput>
    );
}

export function EditableResultsInput(props: InputProps) {
    return (
        <AssayPropertiesInput
            label="Editable Results"
            appPropertiesOnly={props.appPropertiesOnly}
            helpTipBody={() => {
                return (
                    <p>
                        If enabled, users with sufficient permissions can edit and delete at the individual results row
                        level after the initial import is complete. New result rows cannot be added to existing runs.
                        These changes will be audited.
                    </p>
                );
            }}
        >
            <input
                type="checkbox"
                id={FORM_IDS.EDITABLE_RESULTS}
                checked={props.model.editableResults}
                onChange={props.onChange}
            />
        </AssayPropertiesInput>
    );
}

export function BackgroundUploadInput(props: InputProps) {
    return (
        <AssayPropertiesInput
            label="Import in Background"
            helpTipBody={() => {
                return (
                    <p>
                        If enabled, assay imports will be processed as jobs in the data pipeline. If there are any
                        errors during the import, they can be viewed from the log file for that job.
                    </p>
                );
            }}
        >
            <input
                type="checkbox"
                id={FORM_IDS.BACKGROUND_UPLOAD}
                checked={props.model.backgroundUpload}
                onChange={props.onChange}
            />
        </AssayPropertiesInput>
    );
}

interface AutoCopyDataInputState {
    containers: List<Container>;
}

export class AutoCopyDataInput extends React.PureComponent<InputProps, AutoCopyDataInputState> {
    constructor(props) {
        super(props);

        this.state = {
            containers: undefined,
        };
    }

    UNSAFE_componentWillMount(): void {
        getValidPublishTargets()
            .then(containers => {
                this.setState(() => ({ containers }));
            })
            .catch(response => {
                console.error('Unable to load valid study targets for Auto-Copy Data to Study input.');
                this.setState(() => ({ containers: List<Container>() }));
            });
    }

    render() {
        const { model, onChange } = this.props;
        const { containers } = this.state;

        return (
            <AssayPropertiesInput
                label="Auto-Copy Data to Study"
                helpTipBody={() => {
                    return (
                        <>
                            <p>
                                When new runs are imported, automatically copy their data rows to the specified target
                                study. Only rows that include subject and visit/date information will be copied.
                            </p>
                            <p>
                                The user performing the import must have insert permission in the target study and the
                                corresponding dataset.
                            </p>
                        </>
                    );
                }}
            >
                {containers === undefined ? (
                    <LoadingSpinner />
                ) : (
                    <FormControl
                        componentClass="select"
                        id={FORM_IDS.AUTO_COPY_TARGET}
                        onChange={onChange}
                        value={model.autoCopyTargetContainerId || ''}
                    >
                        <option key="_empty" value={null} />
                        {containers.map((container, i) => (
                            <option key={i} value={container.id}>
                                {container.path}
                            </option>
                        ))}
                    </FormControl>
                )}
            </AssayPropertiesInput>
        );
    }
}

interface ModuleProvidedScriptsInputProps {
    model: AssayProtocolModel;
}

export function ModuleProvidedScriptsInput(props: ModuleProvidedScriptsInputProps) {
    return (
        <AssayPropertiesInput
            label="Module-Provided Scripts"
            helpTipBody={() => {
                return (
                    <>
                        <p>
                            These scripts are part of the assay type and cannot be removed. They will run after any
                            custom scripts configured above.
                        </p>
                        <p>
                            The extension of the script file identifies the script engine that will be used to run the
                            validation script. For example, a script named test.pl will be run with the Perl scripting
                            engine. The scripting engine must be configured on the Views and Scripting page in the Admin
                            Console. For additional information refer to the{' '}
                            {helpLinkNode(CONFIGURE_SCRIPTING_TOPIC, 'help documentation')}.
                        </p>
                    </>
                );
            }}
        >
            {props.model.moduleTransformScripts.map((script, i) => {
                return (
                    <div key={i} style={{ overflowWrap: 'break-word' }}>
                        {script}
                    </div>
                );
            })}
        </AssayPropertiesInput>
    );
}

interface TransformScriptsInputProps {
    model: AssayProtocolModel;
    onChange: (id: string, value: any) => void;
}

export class TransformScriptsInput extends React.PureComponent<TransformScriptsInputProps, any> {
    onChange = evt => {
        const id = evt.target.id;
        const index = parseInt(id.replace(FORM_IDS.PROTOCOL_TRANSFORM_SCRIPTS, ''));
        const value = evt.target.value;
        this.applyChanges(
            this.props.model.protocolTransformScripts.map((currentVal, i) => (i === index ? value : currentVal))
        );
    };

    addScript = () => {
        const scripts = this.props.model.protocolTransformScripts
            ? this.props.model.protocolTransformScripts
            : List<string>();
        this.applyChanges(scripts.push(''));
    };

    removeScript = (index: number) => {
        this.applyChanges(this.props.model.protocolTransformScripts.filter((script, i) => i !== index));
    };

    applyChanges(updatedScripts: any) {
        this.props.onChange(FORM_IDS.PROTOCOL_TRANSFORM_SCRIPTS, updatedScripts);
    }

    renderLabel() {
        const label = 'Transform Scripts';

        return (
            <Col xs={3} lg={4}>
                <DomainFieldLabel
                    label={label}
                    helpTipBody={() => {
                        return (
                            <>
                                <p>
                                    The full path to the transform script file. Transform scripts run before the assay
                                    data is imported and can reshape the data file to match the expected import format.
                                    For help writing a transform script refer to the{' '}
                                    {helpLinkNode(
                                        PROGRAMMATIC_QC_TOPIC,
                                        'Programmatic Quality Control & Transformations'
                                    )}{' '}
                                    guide.
                                </p>
                                <p>
                                    The extension of the script file identifies the script engine that will be used to
                                    run the validation script. For example, a script named test.pl will be run with the
                                    Perl scripting engine. The scripting engine must be configured on the Views and
                                    Scripting page in the Admin Console. For additional information refer to the{' '}
                                    {helpLinkNode(CONFIGURE_SCRIPTING_TOPIC, 'help documentation')}.
                                </p>
                            </>
                        );
                    }}
                />
            </Col>
        );
    }

    render() {
        const { model } = this.props;
        const protocolTransformScripts = model.protocolTransformScripts || List<string>();

        return (
            <>
                {protocolTransformScripts.map((scriptPath, i) => {
                    return (
                        <Row key={'scriptrow-' + i} className="margin-top">
                            {i === 0 ? this.renderLabel() : <Col xs={3} lg={4} />}
                            <Col xs={8} lg={7}>
                                <FormControl
                                    key={'scriptinput-' + i}
                                    id={FORM_IDS.PROTOCOL_TRANSFORM_SCRIPTS + i}
                                    type="text"
                                    value={scriptPath}
                                    onChange={this.onChange}
                                />
                            </Col>
                            <Col xs={1}>
                                <RemoveEntityButton
                                    key={'scriptremove-' + i}
                                    labelClass="domain-remove-icon"
                                    onClick={() => {
                                        this.removeScript(i);
                                    }}
                                />
                            </Col>
                        </Row>
                    );
                })}
                <Row className="margin-top">
                    {protocolTransformScripts.size === 0 ? this.renderLabel() : <Col xs={3} lg={4} />}
                    <Col xs={3} lg={4}>
                        <AddEntityButton entity="Script" containerClass="" onClick={this.addScript} />
                    </Col>
                    {protocolTransformScripts.size > 0 && !model.isNew() && (
                        <Col xs={5} lg={4}>
                            <span className="pull-right">
                                <a
                                    href={ActionURL.buildURL('assay', 'downloadSampleQCData', LABKEY.container.path, {
                                        rowId: model.protocolId,
                                    })}
                                    target="_blank"
                                    className="labkey-text-link"
                                >
                                    Download sample file
                                </a>
                            </span>
                        </Col>
                    )}
                </Row>
            </>
        );
    }
}

export function SaveScriptDataInput(props: InputProps) {
    return (
        <AssayPropertiesInput
            label="Save Script Data for Debugging"
            helpTipBody={() => {
                return (
                    <>
                        <p>
                            Typically transform and validation script data files are deleted on script completion. For
                            debug purposes, it can be helpful to be able to view the files generated by the server that
                            are passed to the script.
                        </p>
                        <p>
                            If this checkbox is checked, files will be saved to a subfolder named:
                            "TransformAndValidationFiles", located in the same folder that the original script is
                            located.
                        </p>
                    </>
                );
            }}
        >
            <input
                type="checkbox"
                id={FORM_IDS.SAVE_SCRIPT_FILES}
                checked={props.model.saveScriptFiles}
                onChange={props.onChange}
            />
        </AssayPropertiesInput>
    );
}

export function PlateMetadataInput(props: InputProps) {
    return (
        <AssayPropertiesInput
            label="Plate Metadata"
            helpTipBody={() => {
                return (
                    <p>
                        If enabled, plate template metadata can be added on a per run basis to combine tabular data that
                        has well location information with plate based data.
                    </p>
                );
            }}
        >
            <input
                type="checkbox"
                id={FORM_IDS.PLATE_METADATA}
                checked={props.model.plateMetadata}
                onChange={props.onChange}
            />
        </AssayPropertiesInput>
    );
}
