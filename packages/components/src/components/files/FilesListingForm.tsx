import * as React from 'react';
import { Button } from 'react-bootstrap';
import { Map, Set, List } from 'immutable';

import { IFile } from './models';
import { FileAttachmentForm } from './FileAttachmentForm';
import { FilesListing } from './FilesListing';

interface Props {
    files?: List<IFile>;
    headerText?: string;
    readOnlyFiles?: List<IFile>;
    readOnlyHeaderText?: string;
    addFileText?: string;
    noFilesMessage?: string;
    noReadOnlyFilesMessage?: string;

    handleUpload?: (files: Map<string, File>, cb: () => any) => any;
    handleDelete?: (file: string) => any;
    handleDownload?: (files: Set<string>) => any;
    canInsert?: boolean;
    canDelete?: boolean;
    useFilePropertiesEditTrigger?: boolean;
    onPropertyUpdate?: () => any;
    onSubmit?: () => any;
    onUploadFiles?: () => any;
    getFilePropertiesEditTrigger?: (file: IFile) => React.ReactNode;
}

interface State {
    selectedFiles?: Set<string>;
    confirmDeletionSet: Set<string>;
    showFileUploadPanel?: boolean;
}

export class FilesListingForm extends React.Component<Props, State> {
    static defaultProps = {
        addFileText: 'Attach File',
    };

    constructor(props: Props) {
        super(props);

        this.downloadSelectedFiles = this.downloadSelectedFiles.bind(this);
        this.onFinishUploadFiles = this.onFinishUploadFiles.bind(this);
        this.toggleUploadSection = this.toggleUploadSection.bind(this);
        this.toggleFileSelection = this.toggleFileSelection.bind(this);
        this.uploadAttachedFiles = this.uploadAttachedFiles.bind(this);

        this.state = {
            selectedFiles: Set<string>(),
            confirmDeletionSet: Set<string>(),
            showFileUploadPanel: false,
        };
    }

    toggleUploadSection() {
        this.setState({ showFileUploadPanel: !this.state.showFileUploadPanel });
    }

    toggleFileSelection(event) {
        const target = event.target;
        const name = target.name;
        this.setState({
            selectedFiles: target.checked ? this.state.selectedFiles.add(name) : this.state.selectedFiles.delete(name),
        });
    }

    onFinishUploadFiles() {
        const { onUploadFiles } = this.props;
        if (onUploadFiles) onUploadFiles();
        this.toggleUploadSection();
    }

    uploadAttachedFiles(files: Map<string, File>) {
        const { handleUpload, onSubmit } = this.props;

        if (onSubmit) onSubmit();

        if (handleUpload) handleUpload(files, this.onFinishUploadFiles);
    }

    downloadSelectedFiles() {
        const { handleDownload } = this.props;

        if (handleDownload) handleDownload(this.state.selectedFiles);
    }

    renderButtons() {
        const { addFileText, canInsert, files, readOnlyFiles } = this.props;
        const haveFiles = (files && files.size > 0) || (readOnlyFiles && readOnlyFiles.size > 0);
        return (
            <div className="row bottom-spacing">
                <div className="col-md-7">
                    {canInsert && (
                        <Button onClick={this.toggleUploadSection} bsStyle="primary" title={addFileText}>
                            {addFileText}
                        </Button>
                    )}
                </div>
                <div className="col-md-5">
                    {haveFiles && (
                        <div className="pull-right">
                            <Button
                                disabled={this.state.selectedFiles.size == 0}
                                onClick={this.downloadSelectedFiles}
                                title="Download selected files"
                            >
                                <i className="fa fa-download" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    toggleDeleteConfirmation(fileName: string) {
        const { confirmDeletionSet } = this.state;

        this.setState({
            confirmDeletionSet: confirmDeletionSet.has(fileName)
                ? confirmDeletionSet.delete(fileName)
                : confirmDeletionSet.add(fileName),
        });
    }

    deleteFile = (fileName: string) => {
        const { handleDelete } = this.props;
        this.setState({
            selectedFiles: this.state.selectedFiles.delete(fileName),
        });
        handleDelete(fileName);
    };

    render() {
        const {
            files,
            headerText,
            noFilesMessage,
            noReadOnlyFilesMessage,
            useFilePropertiesEditTrigger,
            getFilePropertiesEditTrigger,
            canDelete,
        } = this.props;
        const { selectedFiles, showFileUploadPanel } = this.state;

        const hasReadOnly = this.props.readOnlyFiles && !this.props.readOnlyFiles.isEmpty();
        const hasEditable = this.props.files && !this.props.files.isEmpty();
        return (
            <>
                {this.renderButtons()}
                {showFileUploadPanel && (
                    <FileAttachmentForm
                        allowDirectories={false}
                        allowMultiple={true}
                        onCancel={this.toggleUploadSection}
                        onSubmit={this.uploadAttachedFiles}
                        showButtons={true}
                        showLabel={false}
                        showProgressBar={true}
                    />
                )}
                {(hasReadOnly || noReadOnlyFilesMessage) && (
                    <>
                        {hasEditable && <hr />}
                        <FilesListing
                            files={this.props.readOnlyFiles}
                            headerText={this.props.readOnlyHeaderText}
                            noFilesMessage={noReadOnlyFilesMessage}
                            onFileSelection={this.toggleFileSelection}
                            selectedFiles={selectedFiles}
                            canDelete={false}
                        />
                        {hasEditable && <hr />}
                    </>
                )}
                {(hasEditable || noFilesMessage) && (
                    <FilesListing
                        files={files}
                        headerText={headerText}
                        noFilesMessage={noFilesMessage}
                        useFilePropertiesEditTrigger={useFilePropertiesEditTrigger}
                        getFilePropertiesEditTrigger={getFilePropertiesEditTrigger}
                        canDelete={canDelete}
                        onDelete={this.deleteFile}
                        onFileSelection={this.toggleFileSelection}
                        selectedFiles={selectedFiles}
                    />
                )}
            </>
        );
    }
}
