import React from 'react';


import { helpLinkNode } from '../../util/helpLinks';

interface Props {
    nounPlural?: string;
    helpTopic: string;
}

export function HelpTopicURL(props: Props) {
    const text = props.nounPlural
        ? 'Learn more about designing ' + props.nounPlural.toLowerCase()
        : 'Learn more about this tool';

    return (
        <div className="row">
            <div className="col-xs-12">{helpLinkNode(props.helpTopic, text, 'domain-field-float-right')}</div>
        </div>
    );
}
