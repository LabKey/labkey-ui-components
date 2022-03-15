import React, { FC, memo } from 'react';

interface Props {
    templateUrl: string,
    className?: string,
    text?: string,
}

export const TemplateDownloadButton: FC<Props> = memo(props => {
    const { className, templateUrl, text } = props;

    if (!templateUrl?.length)
        return null;

    return (
        <a
            className={"btn btn-info " + className}
            title="Download Template"
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
