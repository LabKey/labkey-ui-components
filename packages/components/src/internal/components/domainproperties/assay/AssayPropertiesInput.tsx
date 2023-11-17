import React, { FC, memo } from 'react';
import { Col, FormControl, Row } from 'react-bootstrap';
import { List, Map } from 'immutable';
import { getServerContext } from '@labkey/api';

import {
    ASSAY_EDIT_PLATE_TEMPLATE_TOPIC,
    CONFIGURE_SCRIPTING_TOPIC,
    helpLinkNode,
    PROGRAMMATIC_QC_TOPIC,
} from '../../../util/helpLinks';
import { DomainFieldLabel, DomainFieldLabelProps } from '../DomainFieldLabel';

import { AutoLinkToStudyDropdown } from '../AutoLinkToStudyDropdown';

import { buildURL } from '../../../url/AppURL';
import { Container } from '../../base/models/Container';
import { AddEntityButton } from '../../buttons/AddEntityButton';
import { RemoveEntityButton } from '../../buttons/RemoveEntityButton';

import { FileAttachmentForm } from '../../../../public/files/FileAttachmentForm';
import { getWebDavFiles, getWebDavUrl, uploadWebDavFileToUrl } from '../../../../public/files/WebDav';

import { Alert } from '../../base/Alert';

import { AttachmentCard, IAttachment } from '../../../renderers/AttachmentCard';

import { getAttachmentTitleFromName } from '../../../renderers/FileColumnRenderer';

import { setCopyValue } from '../../../events';

import { AssayProtocolModel } from './models';
import { FORM_IDS, SCRIPTS_DIR } from './constants';
import { getValidPublishTargets } from './actions';

interface AssayPropertiesInputProps extends DomainFieldLabelProps {
    appPropertiesOnly?: boolean;
    colSize?: number;
}

export const AssayPropertiesInput: FC<AssayPropertiesInputProps> = memo(props => {
    const { appPropertiesOnly, children, colSize, ...domainFieldProps } = props;

    return (
        <Row className="margin-top">
            <Col xs={3} lg={appPropertiesOnly ? 2 : 4}>
                <DomainFieldLabel {...domainFieldProps} />
            </Col>
            <Col xs={colSize} lg={appPropertiesOnly ? 10 : 8}>
                {children}
            </Col>
        </Row>
    );
});

AssayPropertiesInput.displayName = 'AssayPropertiesInput';

AssayPropertiesInput.defaultProps = {
    colSize: 9,
};

interface InputProps {
    appPropertiesOnly?: boolean;
    model: AssayProtocolModel;
    onChange: (evt) => void;
    canRename?: boolean;
}

export function NameInput(props: InputProps) {
    return (
        <AssayPropertiesInput label="Name" required={true} appPropertiesOnly={props.appPropertiesOnly}>
            <FormControl
                id={FORM_IDS.ASSAY_NAME}
                type="text"
                placeholder="Enter a name for this assay"
                value={props.model.name || ''}
                onChange={props.onChange}
                disabled={!props.model.isNew() && !props.canRename}
            />
        </AssayPropertiesInput>
    );
}

export function DescriptionInput(props: InputProps) {
    return (
        <AssayPropertiesInput
            label="Description"
            appPropertiesOnly={props.appPropertiesOnly}
            helpTipBody={<p>A short description for this assay design.</p>}
        >
            <textarea
                className="form-control"
                id={FORM_IDS.ASSAY_DESCRIPTION}
                value={props.model.description || ''}
                onChange={props.onChange}
            />
        </AssayPropertiesInput>
    );
}

export const QCStatesInput: FC<InputProps> = props => {
    return (
        <AssayPropertiesInput
            label="QC States"
            helpTipBody={
                <p>
                    If enabled, QC states can be configured and assigned on a per run basis to control the visibility of
                    imported run data. Users not in the QC Analyst role will not be able to view non-public data.
                </p>
            }
        >
            <input type="checkbox" id={FORM_IDS.QC_ENABLED} checked={props.model.qcEnabled} onChange={props.onChange} />
        </AssayPropertiesInput>
    );
};

export function PlateTemplatesInput(props: InputProps) {
    return (
        <AssayPropertiesInput
            label="Plate Template"
            required={true}
            colSize={6}
            appPropertiesOnly={props.appPropertiesOnly}
            helpTipBody={
                <p>
                    Specify the plate template definition used to map spots or wells on the plate to data fields in this
                    assay design. For additional information refer to the{' '}
                    {helpLinkNode(ASSAY_EDIT_PLATE_TEMPLATE_TOPIC, 'help documentation')}.
                </p>
            }
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
            <a className="labkey-text-link" href={buildURL('plate', 'plateTemplateList')}>
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
            helpTipBody={
                <>
                    <p>
                        <strong>Manual: </strong> Metadata is provided as form based manual entry.
                    </p>
                    <p>
                        <strong>File Upload (metadata only): </strong> Metadata is provided from a file upload (separate
                        from the run data file).
                    </p>
                    <p>
                        <strong>Combined File Upload (metadata & run data): </strong> Metadata and run data are combined
                        into a single file upload.
                    </p>
                </>
            }
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

export const AssayStatusInput = props => {
    return (
        <AssayPropertiesInput
            label="Active"
            appPropertiesOnly={props.appPropertiesOnly}
            helpTipBody={
                <p>If disabled, this assay design will be considered archived, and will be hidden in certain views.</p>
            }
        >
            <input type="checkbox" id={FORM_IDS.STATUS} checked={props.model.isActive()} onChange={props.onChange} />
        </AssayPropertiesInput>
    );
};

export function EditableRunsInput(props: InputProps) {
    return (
        <AssayPropertiesInput
            label="Editable Runs"
            appPropertiesOnly={props.appPropertiesOnly}
            helpTipBody={
                <p>
                    If enabled, users with sufficient permissions can edit values at the run level after the initial
                    import is complete. These changes will be audited.
                </p>
            }
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
            helpTipBody={
                <p>
                    If enabled, users with sufficient permissions can edit and delete at the individual results row
                    level after the initial import is complete. New result rows cannot be added to existing runs. These
                    changes will be audited.
                </p>
            }
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
            helpTipBody={
                <p>
                    If enabled, assay imports will be processed as jobs in the data pipeline. If there are any errors
                    during the import, they can be viewed from the log file for that job.
                </p>
            }
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

interface AutoLinkDataInputState {
    containers: List<Container>;
}

export class AutoLinkDataInput extends React.PureComponent<InputProps, AutoLinkDataInputState> {
    constructor(props) {
        super(props);

        this.state = {
            containers: undefined,
        };
    }

    componentDidMount(): void {
        getValidPublishTargets(this.props.model.container)
            .then(containers => {
                this.setState(() => ({ containers }));
            })
            .catch(response => {
                console.error('Unable to load valid study targets for Auto-Link Data to Study input.');
                this.setState(() => ({ containers: List<Container>() }));
            });
    }

    render() {
        const { model, onChange } = this.props;
        const { containers } = this.state;

        return (
            <AssayPropertiesInput
                label="Auto-Link Data to Study"
                helpTipBody={
                    <>
                        <p>
                            When new runs are imported, automatically link their data rows to the specified target
                            study. Only rows that include subject and visit/date information will be linked.
                        </p>
                        <p>
                            The user performing the import must have insert permission in the target study and the
                            corresponding dataset.
                        </p>
                    </>
                }
            >
                <AutoLinkToStudyDropdown
                    containers={containers}
                    onChange={onChange}
                    autoLinkTarget={FORM_IDS.AUTO_LINK_TARGET}
                    value={model.autoCopyTargetContainerId}
                />
            </AssayPropertiesInput>
        );
    }
}

export const AutoLinkCategoryInput: FC<InputProps> = memo(props => {
    const { model, onChange } = props;

    return (
        <AssayPropertiesInput
            label="Linked Dataset Category"
            helpTipBody={
                <>
                    <p>
                        Specify the desired category for the Assay Dataset that will be created (or appended to) in the
                        target study when rows are linked. If the category you specify does not exist, it will be
                        created.
                    </p>
                    <p>
                        If the Assay Dataset already exists, this setting will not overwrite a previously assigned
                        category. Leave blank to use the default category of "Uncategorized".
                    </p>
                </>
            }
        >
            <FormControl
                id={FORM_IDS.AUTO_LINK_CATEGORY}
                type="text"
                value={model.autoLinkCategory}
                onChange={onChange}
            />
        </AssayPropertiesInput>
    );
});

interface ModuleProvidedScriptsInputProps {
    model: AssayProtocolModel;
}

export function ModuleProvidedScriptsInput(props: ModuleProvidedScriptsInputProps) {
    return (
        <AssayPropertiesInput
            label="Module-Provided Scripts"
            helpTipBody={
                <>
                    <p>
                        These scripts are part of the assay type and cannot be removed. They will run after any custom
                        scripts configured above.
                    </p>
                    <p>
                        The extension of the script file identifies the script engine that will be used to run the
                        validation script. For example, a script named test.pl will be run with the Perl scripting
                        engine. The scripting engine must be configured on the Views and Scripting page in the Admin
                        Console. For additional information refer to the{' '}
                        {helpLinkNode(CONFIGURE_SCRIPTING_TOPIC, 'help documentation')}.
                    </p>
                </>
            }
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

enum AddingScriptType {
    file,
    path,
}

interface TransformScriptsInputProps {
    model: AssayProtocolModel;
    onChange: (id: string, value: any) => void;
}

interface TransformScriptsInputState {
    addingScript: AddingScriptType;
    addingScriptPath: string;
    error: string;
}

export class TransformScriptsInput extends React.PureComponent<TransformScriptsInputProps, TransformScriptsInputState> {
    readonly state = { error: undefined, addingScript: undefined, addingScriptPath: '' };

    toggleAddingScript = (): void => {
        this.setState(state => ({
            addingScript: state.addingScript === undefined ? AddingScriptType.file : undefined,
            addingScriptPath: '',
            error: undefined,
        }));
    };

    onChangeAddingScriptType = (evt: any): void => {
        const value = evt.target.value ?? evt.target.getAttribute('data-value');
        this.setState({ addingScript: value === 'file' ? AddingScriptType.file : AddingScriptType.path });
    };

    addScript = (path?: string) => {
        const scripts = this.props.model.protocolTransformScripts
            ? this.props.model.protocolTransformScripts
            : List<string>();
        this.applyChanges(scripts.push(path ?? ''));
        this.toggleAddingScript();
    };

    removeScript = (index: number) => {
        this.applyChanges(this.props.model.protocolTransformScripts.filter((script, i) => i !== index));
    };

    applyChanges(updatedScripts: any) {
        this.props.onChange(FORM_IDS.PROTOCOL_TRANSFORM_SCRIPTS, updatedScripts);
    }

    onScriptPathChange = (evt: any): void => {
        this.setState({ addingScriptPath: evt.target.value });
    };

    onAddScriptPath = (): void => {
        if (this.state.addingScript !== AddingScriptType.path) return;
        const value = this.state.addingScriptPath?.trim() ?? '';
        if (value.length > 0) {
            this.addScript(value);
        }
    };

    onAddScriptFile = async (files: Map<string, File>): Promise<void> => {
        if (this.state.addingScript !== AddingScriptType.file) return;

        this.setState({ error: undefined });

        // TODO validate valid script engine before uploading
        try {
            const url = getWebDavUrl(getServerContext().container.path, SCRIPTS_DIR, false, true);
            const fileName = await uploadWebDavFileToUrl(files.first(), url, false);
            const scriptFiles = await getWebDavFiles(getServerContext().container.path, SCRIPTS_DIR, false, true);
            const filePath = scriptFiles.get('files')?.get(fileName)?.dataFileUrl;

            // dataFileUrl comes back encoded and with a "file://" prefix
            if (filePath) {
                this.addScript(decodeURIComponent(filePath.replace('file://', '')));
            }
        } catch (e) {
            this.setState({ error: e });
        }
    };

    onRemoveScript = (attachment: IAttachment): void => {
        this.applyChanges(
            this.props.model.protocolTransformScripts.filter(script => script !== attachment.description)
        );
    };

    onCopyScriptPath = (attachment: IAttachment): void => {
        const handleCopy = (event: ClipboardEvent): void => {
            setCopyValue(event, attachment.description);
            event.preventDefault();
            document.removeEventListener('copy', handleCopy, true);
        };
        document.addEventListener('copy', handleCopy, true);
        document.execCommand('copy');
    };

    renderLabel() {
        return (
            <Col xs={3} lg={4}>
                <DomainFieldLabel
                    label="Transform Scripts"
                    helpTipBody={
                        <>
                            <p>
                                The full path to the transform script file. Transform scripts run before the assay data
                                is imported and can reshape the data file to match the expected import format. For help
                                writing a transform script refer to the{' '}
                                {helpLinkNode(PROGRAMMATIC_QC_TOPIC, 'Programmatic Quality Control & Transformations')}{' '}
                                guide.
                            </p>
                            <p>
                                The extension of the script file identifies the script engine that will be used to run
                                the validation script. For example, a script named test.pl will be run with the Perl
                                scripting engine. The scripting engine must be configured on the Views and Scripting
                                page in the Admin Console. For additional information refer to the{' '}
                                {helpLinkNode(CONFIGURE_SCRIPTING_TOPIC, 'help documentation')}.
                            </p>
                        </>
                    }
                />
            </Col>
        );
    }

    render() {
        const { model } = this.props;
        const { error, addingScript, addingScriptPath } = this.state;
        const protocolTransformScripts = model.protocolTransformScripts || List<string>();
        const protocolTransformAttachments = protocolTransformScripts.map(script => {
            return { name: getAttachmentTitleFromName(script), description: script };
        });

        return (
            <>
                {protocolTransformAttachments.map((attachment, i) => {
                    return (
                        <Row key={attachment.description} className="margin-top">
                            {i === 0 ? this.renderLabel() : <Col xs={3} lg={4} />}
                            <Col xs={9} lg={8}>
                                <AttachmentCard
                                    outerCls="transform-script-card"
                                    allowRemove
                                    allowDownload={false}
                                    attachment={attachment}
                                    copyNoun="path"
                                    noun="file"
                                    onRemove={this.onRemoveScript}
                                    onCopyLink={this.onCopyScriptPath}
                                />
                            </Col>
                        </Row>
                    );
                })}
                {addingScript !== undefined && (
                    <Row className="transform-script-add">
                        {protocolTransformScripts.size === 0 ? this.renderLabel() : <Col xs={3} lg={4} />}
                        <Col xs={8} lg={8}>
                            <input
                                className="transform-script-add--radio"
                                checked={addingScript === AddingScriptType.file}
                                type="radio"
                                value="file"
                                onChange={this.onChangeAddingScriptType}
                            />
                            <div
                                className="transform-script-add--label"
                                data-value="file"
                                onClick={this.onChangeAddingScriptType}
                            >
                                Upload file
                            </div>
                            <input
                                className="transform-script-add--radio"
                                checked={addingScript === AddingScriptType.path}
                                type="radio"
                                value="path"
                                onChange={this.onChangeAddingScriptType}
                            />
                            <div
                                className="transform-script-add--label"
                                data-value="path"
                                onClick={this.onChangeAddingScriptType}
                            >
                                Enter file path
                            </div>
                            <RemoveEntityButton
                                labelClass="domain-remove-icon pull-right"
                                onClick={this.toggleAddingScript}
                            />
                            {addingScript === AddingScriptType.file && (
                                <FileAttachmentForm
                                    allowDirectories={false}
                                    allowMultiple={false}
                                    compact
                                    showLabel={false}
                                    onFileChange={this.onAddScriptFile}
                                />
                            )}
                            {addingScript === AddingScriptType.path && (
                                <div className="transform-script-add--path">
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={addingScriptPath}
                                        onChange={this.onScriptPathChange}
                                    />
                                    <button type="button" className="btn btn-primary" onClick={this.onAddScriptPath}>
                                        Apply
                                    </button>
                                </div>
                            )}
                            {error && <Alert>{error}</Alert>}
                        </Col>
                    </Row>
                )}
                <Row className="margin-top">
                    {protocolTransformScripts.size === 0 && addingScript === undefined ? (
                        this.renderLabel()
                    ) : (
                        <Col xs={3} lg={4} />
                    )}
                    <Col xs={3} lg={4}>
                        <AddEntityButton
                            entity="Script"
                            containerClass=""
                            onClick={this.toggleAddingScript}
                            disabled={addingScript !== undefined}
                        />
                    </Col>
                    {(protocolTransformScripts.size > 0 || addingScript !== undefined) && !model.isNew() && (
                        <Col xs={5} lg={4}>
                            <span className="pull-right">
                                <a
                                    href={buildURL('assay', 'downloadSampleQCData', {
                                        rowId: model.protocolId,
                                    })}
                                    target="_blank"
                                    className="labkey-text-link"
                                    rel="noopener noreferrer"
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
            helpTipBody={
                <>
                    <p>
                        Typically transform and validation script data files are deleted on script completion. For debug
                        purposes, it can be helpful to be able to view the files generated by the server that are passed
                        to the script.
                    </p>
                    <p>
                        If this checkbox is checked, files will be saved to a subfolder named:
                        "TransformAndValidationFiles", located in the same folder that the original script is located.
                    </p>
                </>
            }
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
            helpTipBody={
                <p>
                    If enabled, plate template metadata can be added on a per run basis to combine tabular data that has
                    well location information with plate based data.
                </p>
            }
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
