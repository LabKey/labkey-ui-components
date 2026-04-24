import React, { FC, memo, PropsWithChildren, ReactNode, useCallback, useMemo } from 'react';
import { List, Map } from 'immutable';

import classNames from 'classnames';

import {
    ASSAY_EDIT_PLATE_TEMPLATE_TOPIC,
    CONFIGURE_SCRIPTING_TOPIC,
    HelpLink,
    PROGRAMMATIC_QC_TOPIC,
    RUN_PROPERTIES_TOPIC,
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
import { getFileExtension } from '../../files/actions';
import { resolveErrorMessage } from '../../../util/messaging';
import { FilterCriteriaRenderer } from '../../../FilterCriteriaRenderer';
import { DisableableButton } from '../../buttons/DisableableButton';

import { InternalSpacesWarning } from '../../forms/InternalSpacesWarning';

import { AssayProtocolModel, ProtocolTransformScript } from './models';
import { FORM_IDS, SCRIPTS_DIR } from './constants';
import { getScriptEngineForExtension, getValidPublishTargets } from './actions';
import { useFilterCriteriaContext } from './FilterCriteriaContext';
import { fetchContainers } from '../../permissions/actions';

interface AssayPropertiesInputProps extends DomainFieldLabelProps, PropsWithChildren {
    colSize?: number;
    hideAdvancedProperties?: boolean;
}

export const AssayPropertiesInput: FC<AssayPropertiesInputProps> = memo(props => {
    const { hideAdvancedProperties, children, colSize = 9, ...domainFieldProps } = props;
    const colXs = colSize ? 'col-xs-' + colSize : undefined;

    return (
        <div className="row margin-top">
            <div
                className={classNames('col col-xs-3', {
                    'col-lg-2': hideAdvancedProperties,
                    'col-lg-4': !hideAdvancedProperties,
                })}
            >
                <DomainFieldLabel {...domainFieldProps} />
            </div>
            <div
                className={classNames('col', colXs, {
                    'col-lg-10': hideAdvancedProperties,
                    'col-lg-8': !hideAdvancedProperties,
                })}
            >
                {children}
            </div>
        </div>
    );
});

AssayPropertiesInput.displayName = 'AssayPropertiesInput';

interface InputProps {
    canRename?: boolean;
    hideAdvancedProperties?: boolean;
    model: AssayProtocolModel;
    onChange: (evt) => void;
}

export const NameInput: FC<InputProps> = memo(props => (
    <AssayPropertiesInput hideAdvancedProperties={props.hideAdvancedProperties} label="Name" required={true}>
        <input
            aria-label="Name"
            className="form-control"
            disabled={!props.model.isNew() && !props.canRename}
            id={FORM_IDS.ASSAY_NAME}
            onChange={props.onChange}
            placeholder="Enter a name for this assay"
            type="text"
            value={props.model.name || ''}
        />
        <InternalSpacesWarning fieldName="name" value={props.model.name} />
    </AssayPropertiesInput>
));
NameInput.displayName = 'NameInput';

export const DescriptionInput: FC<InputProps> = memo(props => (
    <AssayPropertiesInput
        helpTipBody={<p>A short description for this assay design.</p>}
        hideAdvancedProperties={props.hideAdvancedProperties}
        label="Description"
    >
        <textarea
            aria-label="Description"
            className="form-control"
            id={FORM_IDS.ASSAY_DESCRIPTION}
            onChange={props.onChange}
            value={props.model.description || ''}
        />
    </AssayPropertiesInput>
));
DescriptionInput.displayName = 'DescriptionInput';

export const QCStatesInput: FC<InputProps> = memo(props => (
    <AssayPropertiesInput
        helpTipBody={
            <p>
                If enabled, QC states can be configured and assigned on a per run basis to control the visibility of
                imported run data. Users not in the QC Analyst role will not be able to view non-public data.
            </p>
        }
        label="QC States"
    >
        <input aria-label="QC States" checked={props.model.qcEnabled} id={FORM_IDS.QC_ENABLED} onChange={props.onChange} type="checkbox" />
    </AssayPropertiesInput>
));
QCStatesInput.displayName = 'QCStatesInput';

export const PlateTemplatesInput: FC<InputProps> = memo(props => (
    <AssayPropertiesInput
        colSize={6}
        helpTipBody={
            <p>
                Specify the plate template definition used to map spots or wells on the plate to data fields in this
                assay design. <HelpLink topic={ASSAY_EDIT_PLATE_TEMPLATE_TOPIC}>More info</HelpLink>
            </p>
        }
        hideAdvancedProperties={props.hideAdvancedProperties}
        label="Plate Template"
        required={true}
    >
        <select
            className="form-control"
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
        </select>
        <a className="labkey-text-link" href={buildURL('plate', 'plateTemplateList')}>
            Configure Templates
        </a>
    </AssayPropertiesInput>
));
PlateTemplatesInput.displayName = 'PlateTemplatesInput';

export const DetectionMethodsInput: FC<InputProps> = memo(props => (
    <AssayPropertiesInput
        colSize={6}
        hideAdvancedProperties={props.hideAdvancedProperties}
        label="Detection Method"
        required
    >
        <select
            className="form-control"
            id={FORM_IDS.DETECTION_METHOD}
            onChange={props.onChange}
            value={props.model.selectedDetectionMethod}
        >
            <option key="_empty" value={null} />
            {props.model.availableDetectionMethods.map(method => (
                <option key={method} value={method}>
                    {method}
                </option>
            ))}
        </select>
    </AssayPropertiesInput>
));
DetectionMethodsInput.displayName = 'DetectionMethodsInput';

export const MetadataInputFormatsInput: FC<InputProps> = memo(props => (
    <AssayPropertiesInput
        colSize={6}
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
        hideAdvancedProperties={props.hideAdvancedProperties}
        label="Metadata Input Format"
        required={true}
    >
        <select
            className="form-control"
            id={FORM_IDS.METADATA_INPUT_FORMAT}
            onChange={props.onChange}
            value={props.model.selectedMetadataInputFormat}
        >
            {Object.keys(props.model.availableMetadataInputFormats).map((key, i) => (
                <option key={i} value={key}>
                    {props.model.availableMetadataInputFormats[key]}
                </option>
            ))}
        </select>
    </AssayPropertiesInput>
));
MetadataInputFormatsInput.displayName = 'MetadataInputFormatsInput';

export const AssayStatusInput: FC<InputProps> = memo(props => (
    <AssayPropertiesInput
        helpTipBody={
            <p>If disabled, this assay design will be considered archived, and will be hidden in certain views.</p>
        }
        hideAdvancedProperties={props.hideAdvancedProperties}
        label="Active"
    >
        <input aria-label="Active" checked={props.model.isActive()} id={FORM_IDS.STATUS} onChange={props.onChange} type="checkbox" />
    </AssayPropertiesInput>
));
AssayStatusInput.displayName = 'AssayStatusInput';

export const EditableRunsInput: FC<InputProps> = memo((props: InputProps) => (
    <AssayPropertiesInput
        helpTipBody={
            <p>
                If enabled, users with sufficient permissions can edit values at the run level after the initial import
                is complete. These changes will be audited.
            </p>
        }
        hideAdvancedProperties={props.hideAdvancedProperties}
        label="Editable Runs"
    >
        <input
            aria-label="Editable Runs"
            checked={props.model.editableRuns}
            id={FORM_IDS.EDITABLE_RUNS}
            onChange={props.onChange}
            type="checkbox"
        />
    </AssayPropertiesInput>
));
EditableRunsInput.displayName = 'EditableRunsInput';

export const EditableResultsInput: FC<InputProps> = memo(props => (
    <AssayPropertiesInput
        helpTipBody={
            <>
                <p>
                    If enabled, users with sufficient permissions can edit and delete at the individual results row
                    level after the initial import is complete. New result rows cannot be added to existing runs. These
                    changes will be audited.
                </p>
                <p>
                    {' '}
                    Disabling this option will set the Transform Script 'Run on Edit' values to be unchecked and
                    disabled.{' '}
                </p>
            </>
        }
        hideAdvancedProperties={props.hideAdvancedProperties}
        label="Editable Results"
    >
        <input
            aria-label="Editable Results"
            checked={props.model.editableResults}
            id={FORM_IDS.EDITABLE_RESULTS}
            onChange={props.onChange}
            type="checkbox"
        />
    </AssayPropertiesInput>
));
EditableResultsInput.displayName = 'EditableResultsInput';

export const BackgroundUploadInput: FC<InputProps> = memo(props => (
    <AssayPropertiesInput
        helpTipBody={
            <p>
                If enabled, assay imports will be processed as jobs in the data pipeline. If there are any errors during
                the import, they can be viewed from the log file for that job.
            </p>
        }
        label="Import in Background"
    >
        <input
            aria-label="Import in Background"
            checked={props.model.backgroundUpload}
            id={FORM_IDS.BACKGROUND_UPLOAD}
            onChange={props.onChange}
            type="checkbox"
        />
    </AssayPropertiesInput>
));
BackgroundUploadInput.displayName = 'BackgroundUploadInput';

interface AutoLinkDataInputState {
    containers: Container[];
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
                this.setState({ containers });
            })
            .catch(response => {
                this.setState({ containers: [] });
            });
    }

    render() {
        const { model, onChange } = this.props;
        const { containers } = this.state;

        return (
            <AssayPropertiesInput
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
                label="Auto-Link Data to Study"
            >
                <AutoLinkToStudyDropdown
                    autoLinkTarget={FORM_IDS.AUTO_LINK_TARGET}
                    containers={containers}
                    onChange={onChange}
                    value={model.autoCopyTargetContainerId}
                />
            </AssayPropertiesInput>
        );
    }
}

export const AutoLinkCategoryInput: FC<InputProps> = memo(({ model, onChange }) => (
    <AssayPropertiesInput
        helpTipBody={
            <>
                <p>
                    Specify the desired category for the Assay Dataset that will be created (or appended to) in the
                    target study when rows are linked. If the category you specify does not exist, it will be created.
                </p>
                <p>
                    If the Assay Dataset already exists, this setting will not overwrite a previously assigned category.
                    Leave blank to use the default category of "Uncategorized".
                </p>
            </>
        }
        label="Linked Dataset Category"
    >
        <input
            aria-label="Linked Dataset Category"
            className="form-control"
            id={FORM_IDS.AUTO_LINK_CATEGORY}
            onChange={onChange}
            type="text"
            value={model.autoLinkCategory}
        />
    </AssayPropertiesInput>
));
AutoLinkCategoryInput.displayName = 'AutoLinkCategoryInput';

interface ModuleProvidedScriptsInputProps {
    model: AssayProtocolModel;
}

export const ModuleProvidedScriptsInput: FC<ModuleProvidedScriptsInputProps> = props => (
    <AssayPropertiesInput
        helpTipBody={
            <>
                <p>
                    These scripts are part of the assay type and cannot be removed. They will run after any custom
                    scripts configured above.
                </p>
                <p>
                    The extension of the script file identifies the scripting engine that will be used to run the
                    validation script. For example, a script named test.pl will be run with the Perl scripting engine.
                    The scripting engine must be configured on the Views and Scripting page in the Admin Console.{' '}
                    <HelpLink topic={CONFIGURE_SCRIPTING_TOPIC}>More info</HelpLink>
                </p>
            </>
        }
        label="Module-Provided Scripts"
    >
        {props.model.moduleTransformScripts
            .map((script, i) => (
                <div className="module-transform-script" key={i} style={{ overflowWrap: 'break-word' }}>
                    {script}
                </div>
            ))
            .toArray()}
    </AssayPropertiesInput>
);
ModuleProvidedScriptsInput.displayName = 'ModuleProvidedScriptsInput';

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
    assayContainerPath: string;
    error: string;
}

export class TransformScriptsInput extends React.PureComponent<TransformScriptsInputProps, TransformScriptsInputState> {
    readonly state = {
        error: undefined,
        addingScript: undefined,
        addingScriptPath: '',
        assayContainerPath: this.props.model.container,
    };

    async componentDidMount() {
        const { model } = this.props;

        // GitHub Issue 830: resolve the domain containerId to the containerPath to use for webdav operations
        let assayContainerPath = model.container;
        try {
            const assayContainer = await fetchContainers({
                container: assayContainerPath,
                includeEffectivePermissions: false,
                includeSubfolders: false,
                includeStandardProperties: false,
            });
            if (assayContainer?.length === 1) {
                assayContainerPath = assayContainer[0].path;
            }
        } catch (error) {
            console.error(error);
        } finally {
            this.setState({ assayContainerPath });
        }
    }

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
        const scriptConfigs = this.props.model.protocolTransformScripts
            ? this.props.model.protocolTransformScripts
            : List<ProtocolTransformScript>();
        this.applyChanges(scriptConfigs.push({ scriptPath: path ?? '', runOnImport: true, runOnEdit: false }));
        this.toggleAddingScript();
    };

    applyChanges(updatedScripts: any) {
        this.props.onChange(FORM_IDS.PROTOCOL_TRANSFORM_SCRIPTS, updatedScripts);
    }

    onScriptPathChange = (evt: any): void => {
        this.setState({ addingScriptPath: evt.target.value });
    };

    onAddScriptPath = async (): Promise<void> => {
        if (this.state.addingScript !== AddingScriptType.path) return;

        const { assayContainerPath } = this.state;
        this.setState({ error: undefined });

        try {
            const value = this.state.addingScriptPath?.trim() ?? '';
            if (value.length > 0) {
                await getScriptEngineForExtension(getFileExtension(value), assayContainerPath);
                this.addScript(value);
            }
        } catch (e) {
            this.setState({ error: resolveErrorMessage(e) });
        }
    };

    onAddScriptFile = async (files: Map<string, File>): Promise<void> => {
        if (this.state.addingScript !== AddingScriptType.file) return;

        const { assayContainerPath } = this.state;
        this.setState({ error: undefined });

        try {
            await getScriptEngineForExtension(getFileExtension(files.first()?.name), assayContainerPath);
            const url = getWebDavUrl(assayContainerPath, SCRIPTS_DIR, false, true);
            const fileName = await uploadWebDavFileToUrl(files.first(), url, false);
            const scriptFiles = await getWebDavFiles(assayContainerPath, SCRIPTS_DIR, false, true);
            const filePath = scriptFiles.get('files')?.get(fileName)?.dataFileUrl;

            // dataFileUrl comes back encoded and with a "file://" prefix
            if (filePath) {
                this.addScript(decodeURIComponent(filePath.replace('file://', '')));
            }
        } catch (e) {
            this.setState({ error: resolveErrorMessage(e) });
        }
    };

    onRemoveScript = (attachment: IAttachment): void => {
        this.applyChanges(
            this.props.model.protocolTransformScripts.filter(
                scriptConfig => scriptConfig.scriptPath !== attachment.description
            )
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

    renderLabel(): ReactNode {
        return (
            <div className="col col-xs-3 col-lg-4">
                <DomainFieldLabel
                    helpTipBody={
                        <>
                            <p>Upload a transform script file or enter the full path to an existing file.</p>
                            <p>
                                Transform scripts run before the assay data is imported and can reshape the data file to
                                match the expected import format.{' '}
                                <HelpLink topic={PROGRAMMATIC_QC_TOPIC} useDefaultUrl>
                                    More info
                                </HelpLink>
                            </p>
                            <p>
                                The extension of the script file identifies the scripting engine that will be used. The
                                scripting engine must be configured on the Views and Scripting page in the Admin
                                Console.{' '}
                                <HelpLink topic={CONFIGURE_SCRIPTING_TOPIC} useDefaultUrl>
                                    More info
                                </HelpLink>
                            </p>
                        </>
                    }
                    label="Transform Scripts"
                />
            </div>
        );
    }

    toggleRunOnCheckboxes = (e: React.ChangeEvent<HTMLInputElement>, field: string): void => {
        const { model } = this.props;
        const index = parseInt(e.target.id.split(FORM_IDS.PROTOCOL_TRANSFORM_SCRIPTS).pop(), 10);
        const curr = model.protocolTransformScripts.get(index);

        this.props.onChange(
            FORM_IDS.PROTOCOL_TRANSFORM_SCRIPTS,
            model.protocolTransformScripts.set(index, { ...curr, [field]: !curr[field] })
        );
    };

    onCheckRunOnImport = (e: React.ChangeEvent<HTMLInputElement>): void => {
        this.toggleRunOnCheckboxes(e, 'runOnImport');
    };

    onCheckRunOnEdit = (e: React.ChangeEvent<HTMLInputElement>): void => {
        this.toggleRunOnCheckboxes(e, 'runOnEdit');
    };

    render(): ReactNode {
        const { model } = this.props;
        const { error, addingScript, addingScriptPath, assayContainerPath } = this.state;
        const protocolTransformScripts = model.protocolTransformScripts || List<ProtocolTransformScript>();
        const protocolTransformAttachments = protocolTransformScripts
            .map(config => ({
                name: getAttachmentTitleFromName(config.scriptPath),
                description: config.scriptPath,
                runOnImport: config.runOnImport,
                runOnEdit: config.runOnEdit,
            }))
            .toArray();

        return (
            <>
                {protocolTransformAttachments.map((attachment, i) => {
                    return (
                        <div className="row margin-top" key={i}>
                            {i === 0 ? this.renderLabel() : <div className="col col-xs-3 col-lg-4" />}
                            <div className="col col-xs-9 col-lg-8">
                                <div className="transform-script-configuration">
                                    <AttachmentCard
                                        allowDownload={false}
                                        allowRemove
                                        attachment={attachment}
                                        copyNoun="path"
                                        noun="path"
                                        onCopyLink={this.onCopyScriptPath}
                                        onRemove={this.onRemoveScript}
                                        outerCls="transform-script-card"
                                    />
                                    <div className="margin-bottom small-margin-top">
                                        <span className="margin-right-more">
                                            <input
                                                aria-label="Run on Import"
                                                checked={attachment.runOnImport}
                                                id={FORM_IDS.PROTOCOL_TRANSFORM_SCRIPTS + i}
                                                onChange={this.onCheckRunOnImport}
                                                type="checkbox"
                                            />
                                            Run on Import
                                        </span>

                                        <span>
                                            <input
                                                aria-label="Run on Edit"
                                                checked={attachment.runOnEdit}
                                                disabled={!model.editableResults}
                                                id={FORM_IDS.PROTOCOL_TRANSFORM_SCRIPTS + i}
                                                onChange={this.onCheckRunOnEdit}
                                                type="checkbox"
                                            />
                                            Run on Edit
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {addingScript !== undefined && (
                    <div className="row transform-script-add">
                        {protocolTransformScripts.size === 0 ? (
                            this.renderLabel()
                        ) : (
                            <div className="col col-xs-3 col-lg-4" />
                        )}
                        <div className="col col-xs-8 col-lg-8">
                            <input
                                aria-labelledby="transform-script-file-label"
                                checked={addingScript === AddingScriptType.file}
                                className="transform-script-add--radio"
                                name="transformScriptAddType"
                                onChange={this.onChangeAddingScriptType}
                                type="radio"
                                value="file"
                            />
                            <div
                                className="transform-script-add--label"
                                data-value="file"
                                id="transform-script-file-label"
                                onClick={this.onChangeAddingScriptType}
                            >
                                Upload file
                            </div>
                            <input
                                aria-labelledby="transform-script-path-label"
                                checked={addingScript === AddingScriptType.path}
                                className="transform-script-add--radio"
                                name="transformScriptAddType"
                                onChange={this.onChangeAddingScriptType}
                                type="radio"
                                value="path"
                            />
                            <div
                                className="transform-script-add--label"
                                data-value="path"
                                id="transform-script-path-label"
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
                                    onFileChange={this.onAddScriptFile}
                                    showLabel={false}
                                />
                            )}
                            {addingScript === AddingScriptType.path && (
                                <div className="transform-script-add--path">
                                    <input
                                        aria-label="Script path"
                                        className="form-control"
                                        onChange={this.onScriptPathChange}
                                        type="text"
                                        value={addingScriptPath}
                                    />
                                    <button className="btn btn-primary" onClick={this.onAddScriptPath} type="button">
                                        Apply
                                    </button>
                                </div>
                            )}
                            {error && <Alert>{error}</Alert>}
                        </div>
                    </div>
                )}
                <div className="row margin-top">
                    {protocolTransformScripts.size === 0 && addingScript === undefined ? (
                        this.renderLabel()
                    ) : (
                        <div className="col col-xs-3 col-lg-4" />
                    )}
                    <div className="col col-xs-9 col-lg-8">
                        <AddEntityButton
                            containerClass="transform-script--add-button"
                            disabled={addingScript !== undefined}
                            entity="Script"
                            onClick={this.toggleAddingScript}
                        />
                        <div className="transform-script--manage-link">
                            <a
                                className="labkey-text-link"
                                href={getWebDavUrl(assayContainerPath, SCRIPTS_DIR, false, true)}
                                rel="noopener noreferrer"
                                target="_blank"
                            >
                                Manage script files
                            </a>
                        </div>
                    </div>
                </div>
            </>
        );
    }
}

export const SaveScriptDataInput: FC<InputProps> = memo(({ model, onChange }) => (
    <AssayPropertiesInput
        helpTipBody={
            <>
                <p>
                    Typically transform and validation script data files are deleted on script completion. For debug
                    purposes, it can be helpful to be able to view the files generated by the server that are passed to
                    the script.
                </p>
                <p>
                    If this checkbox is checked, files will be saved to a subfolder named:
                    "TransformAndValidationFiles", located in the same folder that the original script is located.
                </p>
                {!model.isNew() && (
                    <p>
                        Use the "Download template files" link to get example files for your assay design.{' '}
                        <HelpLink topic={RUN_PROPERTIES_TOPIC} useDefaultUrl>
                            More info
                        </HelpLink>
                    </p>
                )}
            </>
        }
        label="Save Script Data for Debugging"
    >
        <input
            aria-label="Save Script Data for Debugging"
            checked={model.saveScriptFiles}
            id={FORM_IDS.SAVE_SCRIPT_FILES}
            onChange={onChange}
            type="checkbox"
        />
        {!model.isNew() && (
            <div className="transform-script--download-link">
                <a
                    className="labkey-text-link"
                    href={buildURL('assay', 'downloadSampleQCData', {
                        rowId: model.protocolId,
                    })}
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    Download template files
                </a>
            </div>
        )}
    </AssayPropertiesInput>
));
SaveScriptDataInput.displayName = 'SaveScriptDataInput';

export const PlateMetadataInput: FC<InputProps> = memo(({ model, onChange }) => (
    <AssayPropertiesInput
        helpTipBody={
            <p>
                If enabled, plate template metadata can be added on a per run basis to combine tabular data that has
                well location information with plate based data.
            </p>
        }
        label="Plate Metadata"
    >
        <input
            aria-label="Plate Metadata"
            checked={model.plateMetadata}
            id={FORM_IDS.PLATE_METADATA}
            onChange={onChange}
            type="checkbox"
        />
    </AssayPropertiesInput>
));
PlateMetadataInput.displayName = 'PlateMetadataInput';

export const FilterCriteriaInput: FC<InputProps> = memo(({ model }) => {
    const context = useFilterCriteriaContext();
    const onClick = useCallback(() => context.openModal(), [context?.openModal]);
    const domain = useMemo(() => model.domains.find(domain => domain.isNameSuffixMatch('Data')), [model.domains]);
    const fields = useMemo(() => {
        return domain?.fields.filter(df => df.isFilterCriteriaField()).toArray() ?? [];
    }, [domain]);

    if (!domain || !context) return null;

    const disabledMsg = model.plateMetadata ? undefined : 'Plate Metadata must be enabled';

    return (
        <AssayPropertiesInput label="Hit Selection Criteria">
            <div className="filter-criteria-input">
                <div className="filter-criteria-input__button">
                    <DisableableButton disabledMsg={disabledMsg} onClick={onClick}>
                        Edit Criteria
                    </DisableableButton>
                </div>
                <div className="filter-criteria-input__criteria">
                    <FilterCriteriaRenderer fields={fields} renderEmptyMessage={false} />
                </div>
            </div>
        </AssayPropertiesInput>
    );
});
FilterCriteriaInput.displayName = 'FilterCriteriaInput';
