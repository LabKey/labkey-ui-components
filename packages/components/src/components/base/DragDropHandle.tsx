import React from 'react';
import classNames from 'classnames'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGripVertical } from '@fortawesome/free-solid-svg-icons';

interface Props {
    highlighted: boolean
}

export class DragDropHandle extends React.Component<Props, any> {

    render() {

        const className = classNames({
            'field-highlighted': this.props.highlighted,
            'field-not-highlighted': !this.props.highlighted
        });

        return (<FontAwesomeIcon size='lg' className={className} icon={faGripVertical}/>)
    }


}
