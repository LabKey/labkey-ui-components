import React, { FC, useState, useEffect, memo, useCallback, PropsWithChildren } from 'react';

// We have padding at the bottom of our pages that we need to account for or we'll end up with double scrollbars on the
// page which looks bad
const PADDING = 45;

interface Props extends PropsWithChildren {
    cls?: string;
    offset?: number;
    ratio?: number;
    scroll?: boolean;
}

export const VerticalScrollPanel: FC<Props> = memo(props => {
    const { ratio, offset, children, cls } = props;
    const [height, setHeight] = useState<number>(0);
    const resize = useCallback(() => {
        if (offset) setHeight(window.innerHeight - offset - PADDING);
        else setHeight(window.innerHeight * ratio);
    }, [offset, ratio]);

    useEffect(() => {
        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, [resize]);

    return (
        <div style={{ height: height + 'px' }} className={'vertical-scroll-panel ' + cls}>
            {children}
        </div>
    );
});

VerticalScrollPanel.defaultProps = {
    ratio: 0.9,
    offset: 0,
    scroll: true,
};
