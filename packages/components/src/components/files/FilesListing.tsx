import React from 'react';

import { Button } from 'react-bootstrap';
import { List, Set } from 'immutable';

import { IFile } from './models';

interface Props {
    files: List<IFile>;
    headerText?: string;
    noFilesMessage: string;
    onFileSelection: (event) => any;
    onDelete?: (fileName: string) => any;
    canDelete?: boolean;
    selectedFiles: Set<string>;
    useFilePropertiesEditTrigger?: boolean;
    getFilePropertiesEditTrigger?: (file: IFile) => React.ReactNode;
}

interface State {
    confirmDeletionSet: Set<string>;
}

export class FilesListing extends React.PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            confirmDeletionSet: Set<string>(),
        };
    }

    toggleDeleteConfirmation = (fileName: string) => {
        const { confirmDeletionSet } = this.state;

        this.setState({
            confirmDeletionSet: confirmDeletionSet.has(fileName)
                ? confirmDeletionSet.delete(fileName)
                : confirmDeletionSet.add(fileName),
        });
    };

    deleteFile = (fileName: string) => {
        const { onDelete } = this.props;
        this.setState({
            confirmDeletionSet: this.state.confirmDeletionSet.delete(fileName),
        });
        onDelete(fileName);
    };

    render() {
        const {
            files,
            headerText,
            noFilesMessage,
            useFilePropertiesEditTrigger,
            getFilePropertiesEditTrigger,
            canDelete,
        } = this.props;

        if (!files || files.size === 0) return <div>{noFilesMessage}</div>;

        return (
            <div>
                {headerText && <div className="file-listing--header bottom-spacing">{headerText}</div>}
                {files.map((file: IFile, key) => {
                    const { description, downloadUrl, name } = file;
                    const confirmDelete = this.state.confirmDeletionSet.has(name);

                    return (
                        <div className="component file-listing-row--container" key={key}>
                            <div className="detail-component">
                                <div className="row" key={key}>
                                    <div className="col-xs-4 file-listing-icon--container">
                                        <input
                                            checked={this.props.selectedFiles.contains(name)}
                                            name={name}
                                            onClick={this.props.onFileSelection}
                                            type="checkbox"
                                        />
                                        <i className={file.iconFontCls + ' file-listing-icon'} />
                                    </div>
                                    <div className="col-xs-3 file-listing-info">
                                        <strong>
                                            <a href={downloadUrl} title={name}>
                                                <div className="file-listing-filename">{name}</div>
                                            </a>
                                        </strong>
                                        <br />
                                        <span className="file-listing-info-light">
                                            <span className="test-loc-file-created-by">{file.createdBy}</span>
                                            <span className="test-loc-file-created">{file.created}</span>
                                        </span>
                                    </div>

                                    <div className="col-xs-5">{description}</div>

                                    <span className="pull-right">
                                        {useFilePropertiesEditTrigger && getFilePropertiesEditTrigger(file)}
                                        {canDelete && confirmDelete ? (
                                            <span>
                                                <div className="pull-right">Permanently delete?</div>
                                                <br />
                                                <span className="file-listing-canceldel-icon">
                                                    <Button
                                                        bsStyle="default"
                                                        onClick={() => this.toggleDeleteConfirmation(name)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </span>
                                                <Button bsStyle="danger" onClick={() => this.deleteFile(name)}>
                                                    Delete File
                                                </Button>
                                            </span>
                                        ) : (
                                            canDelete && (
                                                <span
                                                    className="pull-right file-listing-delete"
                                                    onClick={() => this.toggleDeleteConfirmation(name)}
                                                >
                                                    <i className="fa fa-times-circle file-listing-delete-icon" />
                                                </span>
                                            )
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }
}
