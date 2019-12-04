
import * as React from 'react';

interface Props {
    allowDelete?: boolean
    onDelete?: (name: string) => any
    name: string
    downloadUrl?: string
    titleText?: string
}

export class FileAttachmentEntry extends React.PureComponent<Props, any> {

    static defaultProps = {
        allowDelete: true,
        titleText: "Remove file"
    };

    render() {
        const { allowDelete, downloadUrl, onDelete, name, titleText } = this.props;
        return (
            <div key={name} className="attached-file--container">
                {allowDelete && <span
                    className="fa fa-times-circle file-upload__remove--icon"
                    onClick={() => onDelete(name)}
                    title={titleText}
                />}
                <span className="fa fa-file-text attached-file--icon attached-file--bottom-spacing"/>
                {downloadUrl ? (
                        <strong>
                            <a href={downloadUrl} title={name}>
                                <div className={"file-listing-filename"}>{name}</div>
                            </a>
                        </strong>
                    )
                    : name
                }
            </div>
        )
    }
}
