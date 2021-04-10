import { immerable } from 'immer';

import { caseInsensitive } from '../../..';

export class ConceptModel {
    [immerable] = true;

    readonly label: string;
    readonly code: string;
    readonly paths: string[];
    readonly description: string;
    readonly synonyms: string[];

    constructor(values?: Partial<ConceptModel>) {
        Object.assign(this, values);
    }

    getDisplayLabel(): string {
        return this.label + ' (' + this.code + ')';
    }
}

export class PathModel {
    [immerable] = true;

    readonly path: string; // Ontology coded path
    readonly code: string; // Concept code for the concept at this path
    readonly label: string; // Human readable label for this path node
    readonly hasChildren: boolean; // flag indicating if node path has any children
    readonly children: PathModel[] | undefined; // Array of Child paths, undefined if not loaded or hasChildren is false

    constructor(values?: Partial<PathModel>) {
        Object.assign(this, values);
    }
}

export class OntologyModel {
    [immerable] = true;

    readonly name: string;
    readonly description: string;
    readonly rowId: number;
    readonly abbreviation: string;
    readonly path: string;
    readonly conceptCount: number;
    readonly children: PathModel[] = undefined;

    constructor(values?: Partial<OntologyModel>) {
        Object.assign(this, values);
    }

    static create(raw: any): OntologyModel {
        return new OntologyModel({
            rowId: caseInsensitive(raw, 'RowId')?.value,
            name: caseInsensitive(raw, 'Name')?.value,
            abbreviation: caseInsensitive(raw, 'Abbreviation')?.value,
        });
    }

    getPathModel(): PathModel {
        return new PathModel({
            path: this.path,
            code: this.abbreviation,
            label: this.name,
            hasChildren: !!this.children,
            children: this.children,
        });
    }

    getDisplayName(): string {
        return this.name + (this.name !== this.abbreviation ? ' (' + this.abbreviation + ')' : '');
    }
}
