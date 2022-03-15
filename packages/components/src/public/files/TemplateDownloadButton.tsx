import React, { FC, memo } from 'react';

interface Props {
    templateUrl?: string,
    className?: string,
    text?: string,
    onClick?: () => void,
}

export const TemplateDownloadButton: FC<Props> = memo(props => {
    const { className, onClick, templateUrl, text } = props;

    if (!onClick && !templateUrl?.length)
        return null;

    return (
        <a
            className={"btn btn-info " + className}
            title="Download Template"
            onClick={onClick}
            href={templateUrl}
            rel="noopener noreferrer"
            target="_blank"
        >
            <span className="fa fa-download" /> {text}
        </a>
    );
});

TemplateDownloadButton.defaultProps = {
    text: "Template"
}
