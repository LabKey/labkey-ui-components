import React, { ReactElement, FC, memo, useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';

import { hasPermissions, User } from '../base/models/User';

interface ResponsiveMenuItem {
    button: ReactElement;
    perm: string;
}

interface Props {
    items: ResponsiveMenuItem[];
    user: User;
}

// The known size of the More dropdown. Ideally we'd calculate this, but we need to know it before we inject it, so
// this was calculated by inspecting the DOM in FireFox.
const MORE_SIZE = 70;

export const ResponsiveMenuButtonGroup: FC<Props> = memo(props => {
    const { items, user } = props;
    const [renderedItems, setRenderedItems] = useState<ReactElement[]>(items.map(item => item.button));
    const [collapsedItems, setCollapsedItems] = useState<ReactElement[]>([]);
    const [itemWidths, setItemWidths] = useState<number[]>([]);
    const ref = useRef<HTMLElement>(undefined);
    const computeButtonLayout = useCallback((): void => {
        if (itemWidths.length === 0 || ref.current === undefined) {
            // If we haven't determined itemWidths then we cannot properly determine how to render the buttons
            return;
        }
        const parent = ref.current.parentNode; // Should be responsive-btn-group, contains all the grid buttons
        const grandParent = parent.parentNode as HTMLElement; // Should be button-bar__section, contains buttons + filter/search
        const staticButtons = Array.from(parent.childNodes).reduce((reduction, node: HTMLElement) => {
            if (!node.getAttribute('class').includes('responsive-menu-button-group')) {
                reduction += node.getBoundingClientRect().width;
            }
            return reduction;
        }, 0);
        const filterAndSearch = grandParent.querySelector('.button-bar__filter-search').getBoundingClientRect().width;
        // 24 = 12px margin on filterAndSearch wrapper, 12px margin on search box.
        const siblingSize = staticButtons + filterAndSearch + 24;
        const sizeLeft = grandParent.getBoundingClientRect().width - siblingSize;
        const allButtonsSize = itemWidths.reduce((sum, size) => sum + size, 0);

        if (allButtonsSize > sizeLeft) {
            const collapsed = [];
            const rendered = [];
            // calculate visible buttons
            let currentSize = MORE_SIZE;
            items.forEach((item, idx) => {
                const itemWidth = itemWidths[idx];

                if (currentSize + itemWidth > sizeLeft) {
                    collapsed.push(item.button);
                } else {
                    rendered.push(item.button);
                    currentSize = currentSize + itemWidth;
                }
            });
            setCollapsedItems(collapsed);
            setRenderedItems(rendered);
        } else {
            // All buttons visible
            setRenderedItems(items.map(item => item.button));
            setCollapsedItems([]);
        }
    }, [itemWidths, items]);

    useEffect(() => {
        // Need to call computeButtonLayout here to compute the layout after first render
        computeButtonLayout();
        window.addEventListener('resize', computeButtonLayout);
        return () => window.removeEventListener('resize', computeButtonLayout);
    }, [computeButtonLayout]);

    // After the first render we need to calculate the width of each item passed to this component
    useEffect(() => {
        const itemEls = ref.current.childNodes;
        // childNodes is a nodeList which does not have the map method
        const widths = Array.from(itemEls).map((element: HTMLElement) => element.getBoundingClientRect().width);
        setItemWidths(widths);
    }, []);

    const buttons = items.filter(item => hasPermissions(user, [item.perm], false)).map(item => item.button);

    if (buttons.length === 0) return null;

    return (
        <span className="responsive-menu-button-group" ref={ref}>
            {renderedItems.length > 0 &&
                renderedItems.map((button, idx) => (
                    // Issue 47167
                    // We wrap buttons in Fragment because otherwise we'll get an error warning about unique keys if
                    // each button passed in wasn't given a key.
                    <Fragment key={idx}>{button}</Fragment>
                ))}
            {collapsedItems.length > 0 && (
                <DropdownButton id="responsive-menu-button-group" title="More" className="responsive-menu">
                    {collapsedItems.map((item, index) => {
                        return (
                            <Fragment key={index}>
                                {React.cloneElement(item, { asSubMenu: true })}
                                {index < buttons.length - 1 && <MenuItem divider />}
                            </Fragment>
                        );
                    })}
                </DropdownButton>
            )}
        </span>
    );
});

ResponsiveMenuButtonGroup.displayName = 'ResponsiveMenuButtonGroup';
