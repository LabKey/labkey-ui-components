import React from 'react';
import { Col } from 'react-bootstrap';

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
            <Col xs={12}>{helpLinkNode(props.helpTopic, text, 'domain-field-float-right')}</Col>
        </div>
    );
}
