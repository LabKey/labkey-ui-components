import React, { FC, useState, useEffect, memo } from 'react';

interface Props {
    ratio?: number;
    offset?: number;
    cls?: string
}

export const VerticalScrollPanel: FC<Props> = memo(props => {
    const { ratio, offset, children, cls } = props;
    const [height, setHeight] = useState<number>(0);

    useEffect(() => {
        if (offset)
            setHeight(window.innerHeight - offset);
        else
            setHeight(window.innerHeight * ratio);
    }, []);

    return (
        <div style={{'height' : height + 'px', overflowY: 'scroll'}} className={cls}>
            {children}
        </div>
    )

});

VerticalScrollPanel.defaultProps = {
    ratio: 0.9,
    offset: 0
}
