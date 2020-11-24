import React from 'react';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGripVertical } from '@fortawesome/free-solid-svg-icons';

interface Props {
    highlighted: boolean;
}

export class DragDropHandle extends React.Component<Props, any> {
    render() {
        const { highlighted } = this.props;
        const className =
            highlighted !== undefined
                ? classNames({
                      'field-highlighted': highlighted,
                      'field-not-highlighted': !highlighted,
                  })
                : undefined;

        return <FontAwesomeIcon className={className} icon={faGripVertical} />;
    }
}
