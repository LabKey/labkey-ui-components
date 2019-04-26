/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import {fetchDomain, saveDomain, clearFieldDetails, updateDomainField} from "./actions/actions";
import {DomainDesign} from "./models";
import DomainForm from "./components/DomainForm"
import {DomainFieldsDisplay} from "./components/DomainFieldsDisplay"

import './theme/index.scss'

export {
    // components
    DomainForm,
    DomainFieldsDisplay,

    // functions
    fetchDomain,
    saveDomain,
    clearFieldDetails,

    // models
    DomainDesign
}