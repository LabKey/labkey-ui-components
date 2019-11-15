import * as React from 'react';
import { Button } from 'react-bootstrap';
import { Map, Set, List } from 'immutable';
import { IFile } from "./models";
import { FileAttachmentForm } from "./FileAttachmentForm";

interface Props {
    files: List<IFile>
    addFileText: string
    noFilesMessage: string
    handleUpload: (files: Map<string, File>, cb: () => any) => any
    handleDelete: (file: string) => any
    handleDownload: (files: Set<string>) => any
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
    showConfirmDelete: Set<string>
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
            showConfirmDelete: Set<string>(),
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
        const { showConfirmDelete } = this.state;

        this.setState({
            showConfirmDelete: showConfirmDelete.has(fileName) ? showConfirmDelete.delete(fileName) : showConfirmDelete.add(fileName)
        })
    }

    deleteFile(fileName: string) {
        const { handleDelete } = this.props;
        this.setState( {
            showConfirmDelete: this.state.showConfirmDelete.delete(fileName),
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
                        const { description, downloadUrl, name } = file;
                        const confirmDelete = this.state.showConfirmDelete.has(name);

                        return (
                            <div className="component component-detail--container"  key={key}>
                                <div className="detail-component">
                                    <div className="row" key={key}>
                                        <div className="col-xs-4" style={{width: "108px"}}>
                                            <input checked={this.state.selectedFiles.contains(name)}
                                                   name={name}
                                                   onClick={this.toggleFileSelection}
                                                   type="checkbox"/>
                                            <i className={file.iconFontCls + " file-listing-icon"}
                                               style={{verticalAlign: "middle"}}/>
                                        </div>
                                        <div className="col-xs-3" style={{display: 'inline-block'}}>
                                            <strong><a href={downloadUrl} title={name}>
                                                <div style={
                                                    {
                                                        width: "250px",
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        display: "inline-block"
                                                    }}>{name}</div>
                                            </a></strong><br/>
                                            <span style={{color: "grey"}}><span className={"test-loc-file-created-by"}>{file.createdBy}</span> <span className={"test-loc-file-created"}>{file.created}</span></span>
                                        </div>

                                        <div className="col-xs-5">
                                            {description}
                                        </div>

                                        <span className="pull-right">
                                            {useFilePropertiesEditTrigger && getFilePropertiesEditTrigger(file)}
                                            {canDelete && confirmDelete ?
                                                <span>
                                                            <div
                                                                className="pull-right">Permanently delete?</div><br/>
                                                            <span style={{marginRight: "5px"}}>
                                                                <Button bsStyle="default"
                                                                        onClick={() => this.toggleDeleteConfirmation(name)}>Cancel</Button>
                                                            </span>
                                                            <Button bsStyle="danger"
                                                                    onClick={() => this.deleteFile(name)}>Delete File</Button>
                                                        </span>
                                                :
                                                <span className="pull-right file-listing-delete"
                                                      onClick={() => this.toggleDeleteConfirmation(name)}>
                                                            <i style={{fontSize: "20px", color: 'red'}}
                                                               className="fa fa-times-circle"/>
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
                        label="Attach a file"
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
