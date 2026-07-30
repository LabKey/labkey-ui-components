/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { createContext, useContext } from 'react';

/**
 * Context that exposes the DOM node of a modal footer so that buttons rendered deep within the modal body (e.g.
 * WizardNavButtons rendered by an individual wizard step) can be portaled into the actual footer element. This keeps
 * the footer a true sibling of the body per Bootstrap layout, rather than rendering a "modal-footer" inside the
 * "modal-body". A null value means there is no footer to portal into and buttons should render inline.
 */
export const ModalFooterContext = createContext<HTMLElement | null>(null);

export function useModalFooter(): HTMLElement | null {
    return useContext(ModalFooterContext);
}
