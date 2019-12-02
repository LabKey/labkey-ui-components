import React from 'react';
import { Button } from 'react-bootstrap';
import { List, Map, Set } from 'immutable';
import { IFile } from './models';
import { FileAttachmentForm } from './FileAttachmentForm';

interface Props {
    files: List<IFile>
    addFileText: string
    noFilesMessage: string

    handleUpload?: (files: Map<string, File>, cb: () => any) => any
    handleDelete?: (file: string) => any
    handleDownload?: (files: Set<string>) => any
    canInsert?: boolean
    canDelete?: boolean
    useFilePropertiesEditTrigger?: boolean
    onPropertyUpdate?: () => any
    onSubmit?: () => any
    onUploadFiles?: () => any
    getFilePropertiesEditTrigger?: (file :IFile) => React.ReactNode
}

interface State {
    selectedFiles?: Set<string>
    confirmDeletionSet: Set<string>
    showFileUploadPanel?: boolean
}

export class FilesListing extends React.Component<Props, State> {

    static defaultProps = {
        addFileText: "Attach File",
        noFilesMessage: "No files currently attached."
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
            showFileUploadPanel: false
        }
    }

    toggleUploadSection() {
        this.setState({showFileUploadPanel: !this.state.showFileUploadPanel})
    }

    toggleFileSelection(event) {
        const target = event.target;
        const name = target.name;
        this.setState( {
            selectedFiles: target.checked? this.state.selectedFiles.add(name) : this.state.selectedFiles.delete(name)
        });
    }

    onFinishUploadFiles() {
        const { onUploadFiles } = this.props;
        if (onUploadFiles)
            onUploadFiles();
        this.toggleUploadSection();
    }

    uploadAttachedFiles(files: Map<string, File>) {
        const { handleUpload, onSubmit } = this.props;

        if (onSubmit)
            onSubmit();

        if (handleUpload)
            handleUpload(files, this.onFinishUploadFiles);
    }

    downloadSelectedFiles() {
        const { handleDownload } = this.props;

        if (handleDownload)
            handleDownload(this.state.selectedFiles);
    }

    renderButtons() {
        const { addFileText, canInsert } = this.props;

        return (
            <div className="row bottom-spacing">
                <div className="col-md-7">
                    {
                        canInsert &&
                        <Button
                            onClick={this.toggleUploadSection}
                            bsStyle="primary"
                            title={addFileText}>
                            {addFileText}
                        </Button>
                    }
                </div>
                <div className="col-md-5">
                    <div className="pull-right">
                        <Button disabled={this.state.selectedFiles.size == 0} onClick={this.downloadSelectedFiles} title="Download selected files">
                            <i className="fa fa-download"/>
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    toggleDeleteConfirmation(fileName: string) {
        const { confirmDeletionSet } = this.state;

        this.setState({
            confirmDeletionSet: confirmDeletionSet.has(fileName) ? confirmDeletionSet.delete(fileName) : confirmDeletionSet.add(fileName)
        })
    }

    deleteFile(fileName: string) {
        const { handleDelete } = this.props;
        this.setState( {
            confirmDeletionSet: this.state.confirmDeletionSet.delete(fileName),
            selectedFiles: this.state.selectedFiles.delete(fileName)
        });
        handleDelete(fileName);
    }

    renderFileListing() {
        const { files, noFilesMessage, useFilePropertiesEditTrigger, getFilePropertiesEditTrigger, canDelete } = this.props;

        if (files && files.size > 0) {
            return (
                <div>
                    {files.map((file: IFile, key) => {
                        const {description, downloadUrl, name} = file;
                        const confirmDelete = this.state.confirmDeletionSet.has(name);

                        return (
                            <div className="component file-listing-row--container" key={key}>
                                <div className="detail-component">
                                    <div className="row" key={key}>
                                        <div className="col-xs-4 file-listing-icon--container">
                                            <input checked={this.state.selectedFiles.contains(name)}
                                                   name={name}
                                                   onClick={this.toggleFileSelection}
                                                   type="checkbox"/>
                                            <i className={file.iconFontCls + " file-listing-icon"}/>
                                        </div>
                                        <div className="col-xs-3 file-listing-info">
                                            <strong><a href={downloadUrl} title={name}>
                                                <div className={"file-listing-filename"}>{name}</div>
                                            </a></strong><br/>
                                            <span className={'file-listing-info-light'}>
                                                <span className={"test-loc-file-created-by"}>{file.createdBy}</span>
                                                <span className={"test-loc-file-created"}>{file.created}</span>
                                            </span>
                                        </div>

                                        <div className="col-xs-5">
                                            {description}
                                        </div>

                                        <span className="pull-right">
                                            {useFilePropertiesEditTrigger && getFilePropertiesEditTrigger(file)}
                                            {canDelete && confirmDelete ?
                                                <span>
                                                    <div className="pull-right">Permanently delete?</div><br/>
                                                    <span className={'file-listing-canceldel-icon'}>
                                                        <Button bsStyle="default"
                                                                onClick={() => this.toggleDeleteConfirmation(name)}>Cancel</Button>
                                                    </span>
                                                    <Button bsStyle="danger" onClick={() => this.deleteFile(name)}>Delete File</Button>
                                                </span>
                                                :
                                                canDelete && <span className="pull-right file-listing-delete"
                                                      onClick={() => this.toggleDeleteConfirmation(name)}>
                                                    <i className="fa fa-times-circle file-listing-delete-icon"/>
                                                </span>
                                            }
                                            </span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            );
        }

        return <div>{noFilesMessage}</div>;
    }

    render() {
        const { showFileUploadPanel } = this.state;

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
                        showProgressBar={true}/>
                )}
                {this.renderFileListing()}
            </>
        )
    }
}
