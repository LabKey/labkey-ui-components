/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { ComponentType } from 'react';
import { SchemaQuery } from '../public/SchemaQuery';

export interface ModalRendererProps {
    schemaQuery: SchemaQuery;
}

export type ModalRendererIdentifier = SchemaQuery | string;
export type ModalRendererComponent = ComponentType<ModalRendererProps>;

const modalRenderers: Record<string, ModalRendererComponent> = {};

export enum ModalRenderContext {
    AddEntities = 'AddEntities',
}

function getKey(identifier: ModalRendererIdentifier, modalRenderContext: ModalRenderContext): string {
    const id_ = identifierToString(identifier);
    return [id_.toLowerCase(), modalRenderContext].join('|');
}

function identifierToString(identifier: ModalRendererIdentifier): string {
    return identifier instanceof SchemaQuery ? identifier.toString() : identifier;
}

export function registerModalRenderer(
    identifier: ModalRendererIdentifier,
    renderer: ModalRendererComponent,
    modalRenderContext = ModalRenderContext.AddEntities
): void {
    modalRenderers[getKey(identifier, modalRenderContext)] = renderer;
}

export function resolveModalRenderer(identifier: ModalRendererIdentifier): ModalRendererComponent {
    return modalRenderers[identifierToString(identifier)];
}
