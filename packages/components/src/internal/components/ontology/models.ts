export class OntologyModel {
    readonly ontologyId: number;
    readonly name: string;
    readonly conceptCount: number;
    concepts: ConceptModel[];
    paths: PathModel[];

    constructor(values?: Partial<OntologyModel>) {
        Object.assign(this, values);
    }
}

export interface ConceptModel {
    name: string;
    code: string;
    paths: string[];
    description: string;
}

export interface PathModel {
    label: string;
    fullpath: string;
    pathIdx: number;
    conceptCode: string;
    children?: PathModel[];
}
