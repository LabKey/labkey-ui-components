import React from 'react';
import { Col, Row } from 'react-bootstrap';

import { helpLinkNode } from '../../..';

interface Props {
    nounPlural?: string;
    helpTopic: string;
}

export function HelpTopicURL(props: Props) {
    const text = props.nounPlural
        ? 'Learn more about designing ' + props.nounPlural.toLowerCase()
        : 'Learn more about this tool';

    return (
        <Row>
            <Col xs={12}>{helpLinkNode(props.helpTopic, text, 'domain-field-float-right')}</Col>
        </Row>
    );
}
