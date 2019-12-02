
import * as React from 'react';

interface Props {
    allowDelete?: boolean
    onDelete?: (name: string) => any
    name: string
    key?: string
    titleText?: string
}

export class FileAttachmentEntry extends React.PureComponent<Props, any> {

    static defaultProps = {
        allowDelete: true,
        titleText: "Remove file"
    };

    render() {
        const { allowDelete, onDelete, key, name, titleText } = this.props;

        return (
            <div key={key || name} className="attached-file--container">
                {allowDelete && <span
                    className="fa fa-times-circle file-upload__remove--icon"
                    onClick={() => onDelete(name)}
                    title={titleText}
                />}
                <span className="fa fa-file-text attached-file--icon attached-file--bottom-spacing"/>
                {name}
            </div>
        )
    }
}
