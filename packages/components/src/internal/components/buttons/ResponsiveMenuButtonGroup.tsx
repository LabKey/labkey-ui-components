import React, { ReactElement, FC, memo, useState, useEffect, useCallback, useRef, Fragment, useMemo } from 'react';

import { hasPermissions, User } from '../base/models/User';
import { DropdownButton, MenuDivider } from '../../dropdowns';

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
const MORE_SIZE = 68;

export const ResponsiveMenuButtonGroup: FC<Props> = memo(props => {
    const { items, user } = props;
    const filteredItems = useMemo(() => items.filter(item => hasPermissions(user, [item.perm], false)), [items, user]);
    const [renderedItems, setRenderedItems] = useState<ReactElement[]>(filteredItems.map(item => item.button));
    const [collapsedItems, setCollapsedItems] = useState<ReactElement[]>([]);
    const [itemWidths, setItemWidths] = useState<number[]>([]);
    const elRef = useRef<HTMLElement>(undefined);
    const computeButtonLayout = useCallback((): void => {
        if (itemWidths.length === 0 || elRef.current === undefined) {
            // If we haven't determined itemWidths then we cannot properly determine how to render the buttons
            return;
        }
        const parent = elRef.current.parentNode as HTMLElement; // Should be responsive-btn-group, contains all the grid buttons
        let availableSpace;
        const parentClass = parent.getAttribute('class');

        // Unsupported scenario, so we just render everything.
        if (parentClass === null) return;

        if (parentClass.includes('responsive-btn-group')) {
            // This means we're in a GridPanel
            const grandParent = parent.parentNode as HTMLElement; // Should be button-bar__section, contains buttons + filter/search
            const staticButtons = Array.from(parent.childNodes).reduce((reduction, node: HTMLElement) => {
                if (!node.getAttribute('class')?.includes('responsive-menu-button-group')) {
                    reduction += node.getBoundingClientRect().width;
                }

                return reduction;
            }, 0);

            const filterAndSearch = grandParent
                .querySelector('.button-bar__filter-search')
                .getBoundingClientRect().width;
            // 24 = 12px margin on filterAndSearch wrapper, 12px margin on search box.
            const siblingSize = staticButtons + filterAndSearch + 24;
            availableSpace = grandParent.getBoundingClientRect().width - siblingSize;
        } else {
            // We're just going to assume we can look at our parent for all the information we need. This scenario is
            // needed by FM ItemDetailHeader/ItemSamplesActionMenu
            const siblingSize = Array.from(parent.childNodes).reduce((reduction, node: HTMLElement) => {
                if (!node.getAttribute('class')?.includes('responsive-menu-button-group')) {
                    const computedStyle = getComputedStyle(node);
                    // We often put margin on items that we render next to ResponsiveMenuButtonGroup, so we count it
                    const margin = parseInt(computedStyle.marginLeft, 10) + parseInt(computedStyle.marginRight, 10);
                    reduction += node.getBoundingClientRect().width + margin;
                }
                return reduction;
            }, 0);

            availableSpace = parent.getBoundingClientRect().width - siblingSize;
        }

        const allButtonsSize = itemWidths.reduce((sum, size) => sum + size, 0);

        if (allButtonsSize > availableSpace) {
            const collapsed = [];
            const rendered = [];
            // calculate visible buttons
            let currentSize = MORE_SIZE;
            // We track if we can render more buttons via this flag and not strictly based on remaining size, in order
            // to retain the render order. Otherwise, you may see a button layout like:
            // [Derive, Assay, Picklists, Jobs, More] on a larger screen
            // [Derive, Assay, Jobs, More] on a smaller screen
            let canRenderMore = true;
            filteredItems.forEach((item, idx) => {
                const itemWidth = itemWidths[idx];

                // The button is likely being hidden due to permissions or something similar.
                if (itemWidth === undefined) return;

                if (currentSize + itemWidth > availableSpace) {
                    canRenderMore = false;
                }

                if (canRenderMore) {
                    rendered.push(item.button);
                    currentSize = currentSize + itemWidth;
                } else {
                    collapsed.push(item.button);
                }
            });
            setCollapsedItems(collapsed);
            setRenderedItems(rendered);
        } else {
            // All buttons visible
            setRenderedItems(filteredItems.map(item => item.button));
            setCollapsedItems([]);
        }
    }, [itemWidths, filteredItems]);

    useEffect(() => {
        // Need to call computeButtonLayout here to compute the layout after first render
        computeButtonLayout();
        window.addEventListener('resize', computeButtonLayout);
        return () => window.removeEventListener('resize', computeButtonLayout);
    }, [computeButtonLayout]);

    // After the first render we need to calculate the width of each item passed to this component
    useEffect(() => {
        // Don't attempt to compute widths when we're in tests, or we'll fall over
        if (navigator.userAgent.includes('jsdom')) return;
        const itemEls = elRef.current?.childNodes ?? [];
        // childNodes is a nodeList which does not have the map method
        const widths = Array.from(itemEls).map((element: HTMLElement) => {
            // Include margin for buttons in size
            const computedStyle = getComputedStyle(element);
            return (
                element.getBoundingClientRect().width +
                parseInt(computedStyle.marginLeft, 10) +
                parseInt(computedStyle.marginRight, 10)
            );
        });
        setItemWidths(widths);
    }, []);

    const buttons = filteredItems.map(item => item.button);

    if (buttons.length === 0) return null;

    return (
        <span className="responsive-menu-button-group" ref={elRef}>
            {renderedItems.length > 0 &&
                renderedItems.map((button, idx) => (
                    // Issue 47167
                    // We wrap buttons in Fragment because otherwise we'll get an error warning about unique keys if
                    // each button passed in wasn't given a key, and there's no way to warn consumers that they need to
                    // put a key on the buttons they pass.
                    <Fragment key={idx}>{button}</Fragment>
                ))}
            {collapsedItems.length > 0 && (
                <DropdownButton className="responsive-menu-button-group responsive-menu" title="More">
                    {collapsedItems.map((item, index) => {
                        return (
                            <Fragment key={index}>
                                {React.cloneElement(item, { asSubMenu: true })}
                                {index < collapsedItems.length - 1 && <MenuDivider />}
                            </Fragment>
                        );
                    })}
                </DropdownButton>
            )}
        </span>
    );
});

ResponsiveMenuButtonGroup.displayName = 'ResponsiveMenuButtonGroup';
