import * as Path from 'path';

import { ActionURL, Ajax, getServerContext, Utils } from '@labkey/api';

import { ConceptModel, OntologyModel, PathModel } from './models';

interface OntologyOptions {
    ontologyId: string | number;
    success: (model: OntologyModel) => void;
    failure: (resp: { [key: string]: any }) => any;
}

// //TODO remove
// const mockResponse = new OntologyModel({
//     path: '/NCIT/',
//     name: 'My Ontology',
//     conceptCount: 65,
//     concepts: [],
//     paths: [
//         // new PathModel({
//         //     path: '/',
//         //     label: 'Ontologies',
//         //     code: 'NCIT',
//         //     hasChildren: true,
//         //     children: [],
//         // }),
//     ],
// });

const ONTOLOGY_CONTROLLER = 'ontology';
const GET_CHILD_PATHS_ACTION = 'getChildPaths.api';
const GET_ONTOLOGY_ACTION = 'getOntology.api';
const SHARED_CONTAINER = 'shared';
//
// interface OntologyIdForm {
//     ontologyId: number;
// }
//
// interface OntologyAbbreviationForm {
//     abbreviation: string;
// }
//
// type OntologyForm<T extends number | string> = T extends number ? OntologyIdForm : OntologyAbbreviationForm;
//
// function getOntologyForm<T extends number | string>(id: T): OntologyForm<T> {
//     {
//         'ontologyId': id,
//         'abbriviation': id,
//     } as OntologyForm<T>;
// }

class Ontology {
    static getOntology(ontologyId: string): Promise<OntologyModel> {
        return new Promise<OntologyModel>((resolve, reject) => {
            const { container } = getServerContext();
            const form = {
                abbreviation: ontologyId,
            };

            Ajax.request({
                url: ActionURL.buildURL(ONTOLOGY_CONTROLLER, GET_ONTOLOGY_ACTION, container?.path, form),
                method: 'GET',
                success: Utils.getCallbackWrapper(response => {
                    resolve(new OntologyModel(response));
                }),
                failure: Utils.getCallbackWrapper(
                    response => {
                        reject(response);
                    },
                    null,
                    false
                ),
            });
        });
    }
}

export function getOntologyDetails(ontologyId: string): Promise<OntologyModel> {
    return Ontology.getOntology(ontologyId);
}

export function getOntologyChildPathsAndConcepts(ontologyPath: string, container: string = SHARED_CONTAINER): Promise<[PathModel, ConceptModel[]]> {
    return new Promise((resolve, reject) => {
        const params = { path: ontologyPath };
        return Ajax.request({
            url: ActionURL.buildURL(ONTOLOGY_CONTROLLER, GET_CHILD_PATHS_ACTION, container, params),
            // jsonData: params,
            method: 'GET',
            success: Utils.getCallbackWrapper(response => {
                const { parent, concepts } = response;
                const { path, code, children } = parent;
                const childPaths = children.map(child => new PathModel(child));
                const conceptModels = concepts.map(concept => new ConceptModel(concept));
                resolve([new PathModel({ path, code, children: childPaths }), conceptModels]);
            }),
            failure: Utils.getCallbackWrapper(
                response => {
                    reject(response);
                },
                null,
                false
            ),
        });
    });
}

export async function fetchOntologyPathsAndConcepts(ontologyPath?: string): Promise<[PathModel, ConceptModel[]]> {
    return await getOntologyChildPathsAndConcepts(ontologyPath);
}
