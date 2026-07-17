/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { createContext, useContext } from 'react';

/**
 * The footer slot element provided by a Modal rendered with "footerSlot":
 * - undefined: no slot-enabled Modal is an ancestor. Consumers (e.g., FormButtons) should render inline.
 * - null: a slot-enabled Modal is an ancestor, but the slot element has not mounted yet. Consumers should
 *   render nothing for this transient state (prevents a flash of inline buttons before the slot mounts).
 * - HTMLDivElement: portal content into this element.
 */
export type ModalFooterSlotElement = HTMLDivElement | null | undefined;

export const ModalFooterSlotContext = createContext<ModalFooterSlotElement>(undefined);

/**
 * Returns the footer slot element of the nearest enclosing Modal rendered with "footerSlot", null if that
 * Modal's slot has not mounted yet, or undefined when no slot-enabled Modal is an ancestor. See
 * ModalFooterSlotElement for how consumers are expected to react to each state.
 */
export function useModalFooterSlot(): ModalFooterSlotElement {
    return useContext(ModalFooterSlotContext);
}
