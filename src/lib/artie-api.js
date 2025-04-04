/* eslint-disable max-len */
/* eslint-disable no-undefined */
/* eslint-disable array-callback-return */
/* eslint-disable no-unused-expressions */
/* eslint-disable semi */
/* eslint-disable brace-style */
/* eslint-disable no-let */
/* eslint-disable no-unused-lets */
/* eslint-disable arrow-parens */

const _inputElementsValues = ['text', 'math_number', 'math_positive_number', 'math_whole_number'];
const _pedagogicalInterventionWebServiceUrl = 'https://prod.artie.rocks:8443';
const _pedagogialWebUrl = 'https://prod.artie.rocks:8443';
const _apiKey = 'k6siZlG9OZGyMorpmSUeYo87ebfsN7s0';

const _pedagogicalSoftwarePath = '/api/v1/pedagogicalsoftware';
const _usersPath = '/api/v1/users';
const _studentsPath = '/api/v1/students';
const _exercisesPath = '/api/v1/exercises';
const _sensorPath = '/api/v1/sensor';


const _createArtieBlockFromTempBlock = (tempBlock) => ({id: tempBlock.id, elementName: tempBlock.elementName, elementFamily: tempBlock.elementFamily, next: tempBlock.next, inputs: tempBlock.inputs, nested: tempBlock.nested, previous: tempBlock.previous, parent: tempBlock.parent});

const _generateArtieBlock = (blocks) => {

    const artieBlocks = [];

    // 1- Gets the top level elements
    const arrayBlocks = [];
    Object.values(blocks).forEach((block) => { arrayBlocks.push(block) });

    // Getting all the roots that are not included in the input elements values (because these elements are not elements but just inputs)
    const roots = arrayBlocks.filter(block => block.topLevel === true && !_inputElementsValues.includes(block.opcode));

    // 2- Gets the nested elements, the next elements and the inputs
    Object.values(roots).forEach((root) => {
        const element = _blockHandler(root, arrayBlocks);
        artieBlocks.push(element);
    });

    return artieBlocks;
}

const _blockHandler = (block, blocks) => {

    // 2.1- creates the temporal element for the root
    let transformed = false;
    const elementFamily = (block !== undefined && block.opcode !== undefined ? (block.opcode.split('_'))[0] : null);
    let element = {id: (block.id !== undefined ? block.id : null), elementName: (block.opcode !== undefined ? block.opcode : null), elementFamily: elementFamily, next: null, inputs: [], nested: [], previous: null, parent: null};

    // 2.2- Checks if this block has a next element
    if (block.next !== null && block.next !== undefined){
        element = _nextElementHandler(element, block.next, blocks);
        transformed = true;
    }

    // 2.3- Checks if this block has inputs or nested elements
    Object.values(block.inputs).forEach((input) => {
        element = _nestedInputsHandler(element, input.block, input.name, blocks);
        transformed = true;
    });

    if (transformed === false){
        element = _createArtieBlockFromTempBlock(element);
    }

    return element;
}

const _nextElementHandler = (parent, nextId, blocks) => {

    // Creates the return letiable
    const artieParent = _createArtieBlockFromTempBlock(parent);

    // 1- Searches for the next element in the block array
    let nextElement = blocks.find(block => block.id === nextId);
    nextElement = _blockHandler(nextElement, blocks)

    // 2- Adds the previous element (the parent in this case), without its inputs, next, nested, previous and parent to avoid large objects
    nextElement.previous = {id: parent.id, elementName: parent.elementName, elementFamily: parent.elementFamily, next: null, inputs: null, nested: [], previous: null, parent: null}

    // 3- Inserts the next element in the parent
    artieParent.next = nextElement;

    return artieParent;
}

const _nestedInputsHandler = (parent, inputId, inputName, blocks) => {

    // Creates the return letiable
    const artieParent = _createArtieBlockFromTempBlock(parent);

    // 1- Searches for the input element in the block array
    const tmpElement = blocks.find(block => block.id === inputId);
    if (tmpElement !== undefined) {

        const inputElement = _blockHandler(tmpElement, blocks);

        // 2.1- If the input element is a nested element
        if (inputName.includes('SUBSTACK') && !_inputElementsValues.includes(tmpElement.opcode)) {

            // 2.1.1- Adds the parent element, without its next, nested, previous and parent to avoid large objects
            inputElement.parent = {
                id: parent.id,
                elementName: parent.elementName,
                elementFamily: parent.elementFamily,
                next: null,
                inputs: null,
                nested: [],
                previous: null,
                parent: null
            }

            // 2.1.2- Pushes the input element into the artie parent nested array
            artieParent.nested.push(inputElement);
        }
        // 2.2- If the input element is an input
        else {
            // Gets all the fields from the different subInputs of the element
            let tempFields = [];
            if (inputElement.inputs !== undefined && inputElement.inputs !== null && inputElement.inputs.length > 0) {
                Object.values(inputElement.inputs).forEach((input) => {
                    tempFields = tempFields.concat(input.fields);
                });
            }

            const tempInput = {opcode: inputElement.elementName, name: inputName, fields: tempFields};
            Object.values(tmpElement.fields).forEach((field) => {
                tempInput.fields.push({opcode: field.elementName, name: field.name, value: field.value});
            });

            artieParent.inputs.push(tempInput);
        }
    }

    return artieParent;
}

const sendBlockArtie = (student, sprites, exercise, requestHelp, manualEmotionalState, secondsHelpOpen, finishedExercise, lastLogin,
    lastExerciseChange, screenShot, binary) => new Promise((resolve) => {

    const spriteElements = [];

    Object.values(sprites).forEach((sprite) => {
        const artieBlocks = _generateArtieBlock(sprite.blocks);
        const spriteElement = {id: sprite.id, name: sprite.name, blocks: artieBlocks};
        spriteElements.push(spriteElement);
    });

    const artiePedagogicalSoftwareData = {id: null,
        student: student,
        exercise: exercise,
        requestHelp: requestHelp,
        manualEmotionalState: manualEmotionalState,
        secondsHelpOpen: secondsHelpOpen,
        finishedExercise: finishedExercise,
        lastLogin: lastLogin,
        lastExerciseChange: lastExerciseChange,
        screenShot: screenShot,
        binary: binary,
        elements: spriteElements};

    const xhr = new XMLHttpRequest();
    const params = JSON.stringify(artiePedagogicalSoftwareData);
    xhr.addEventListener('readystatechange', () => {
        if (xhr.readyState === 4) {
            if (xhr.status === 201 && xhr.response !== null) {
                if (xhr.response === '') {
                    resolve(null);
                } else {
                    const json = JSON.parse(xhr.response);

                    // If the response is not null, we send the parsed response
                    resolve(json.body.object);
                }
            }
        }
    });

    xhr.open('POST', `${_pedagogicalInterventionWebServiceUrl}${_pedagogicalSoftwarePath}/sendPedagogicalSoftwareData`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('apiKey', _apiKey);
    xhr.send(params);
});

const sendSolutionArtie = (userId, sprites, exercise, screenShot, binary) => new Promise((resolve) => {

    const spriteElements = []

    Object.values(sprites).forEach((sprite) => {
        const artieBlocks = _generateArtieBlock(sprite.blocks);
        const spriteElement = {id: sprite.id, name: sprite.name, blocks: artieBlocks};
        spriteElements.push(spriteElement);
    });

    const artiePedagogicalSoftwareSolution = {id: null, userId: userId, exercise: exercise, elements: spriteElements, screenShot: screenShot, binary: binary};
    const xhr = new XMLHttpRequest();
    const params = JSON.stringify(artiePedagogicalSoftwareSolution);
    xhr.addEventListener('readystatechange', () => {
        if (xhr.readyState === 4) {
            if (xhr.status === 201 && xhr.response !== null) {
                if (xhr.response !== '') {
                    const json = JSON.parse(xhr.response);

                    if (json !== null && json.body !== null) {
                        resolve(json.body);
                    }
                }
            }
        }
    });

    xhr.open('POST', `${_pedagogicalInterventionWebServiceUrl}${_pedagogicalSoftwarePath}/sendPedagogicalSoftwareSolution`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('apiKey', _apiKey);
    xhr.send(params);
});

const updateAnsweredNeedHelp = (id, answeredNeedHelp) => new Promise((resolve, reject) => {

    const xhr = new XMLHttpRequest();
    xhr.addEventListener('readystatechange', () => {
        if (xhr.readyState === 4) {
            if (xhr.status === 202 && xhr.response !== null) {
                const json = JSON.parse(xhr.response);
                if (json.body.message === 'OK') {
                    resolve(json.body.object);
                } else {
                    reject(json.body.message);
                }
            }
        }
    });

    xhr.open('PUT', `${_pedagogicalInterventionWebServiceUrl}${_pedagogicalSoftwarePath}/update/answeredNeedHelp?id=${id}&answeredNeedHelp=${answeredNeedHelp}`, true);
    xhr.setRequestHeader('apiKey', _apiKey);
    xhr.send();
});


const loginArtie = (userName, password) => new Promise((resolve, reject) => {

    const xhr = new XMLHttpRequest();
    xhr.addEventListener('readystatechange', () => {
        if (xhr.readyState === 4) {
            if (xhr.status === 302 && xhr.response !== null) {
                const json = JSON.parse(xhr.response);

                // We check if there are no errors
                if (json.body.object === null){
                    reject(json.body.message);
                } else {
                    resolve(json.body.object);
                }
            }
        }
    });

    xhr.open('GET', `${_pedagogialWebUrl}${_usersPath}/loginWithRole?userName=${userName}&password=${password}`, true);
    xhr.setRequestHeader('apiKey', _apiKey);
    xhr.send();

});

const getArtieStudents = (userName, password) => new Promise((resolve) => {

    const xhr = new XMLHttpRequest();
    xhr.addEventListener('readystatechange', () => {
        if (xhr.readyState === 4) {
            if (xhr.status === 302 && xhr.response !== null) {
                const json = JSON.parse(xhr.response);
                resolve(json.body.object);
            }
        }
    });

    xhr.open('GET', `${_pedagogialWebUrl}${_studentsPath}/getAllActiveString?userName=${userName}&password=${password}`, true);
    xhr.setRequestHeader('apiKey', _apiKey);
    xhr.send();

});


const getArtieExercises = (userName, password, evaluation) => new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.addEventListener('readystatechange', () => {
        if (xhr.readyState === 4) {
            if (xhr.status === 302 && xhr.response !== null) {
                const json = JSON.parse(xhr.response);
                resolve(json.body.object);
            }
        }
    });

    xhr.open('GET', `${_pedagogialWebUrl}${_exercisesPath}/getAllIsEvaluation?userName=${userName}&password=${password}&isEvaluation=${evaluation}`, true);
    xhr.setRequestHeader('apiKey', _apiKey);
    xhr.send();

});


const getAllArtieExercises = (userName, password) => new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.addEventListener('readystatechange', () => {
        if (xhr.readyState === 4) {
            if (xhr.status === 302 && xhr.response !== null) {
                const json = JSON.parse(xhr.response);
                resolve(json.body.object);
            }
        }
    });

    xhr.open('GET', `${_pedagogialWebUrl}${_exercisesPath}/getAll?userName=${userName}&password=${password}`, true);
    xhr.setRequestHeader('apiKey', _apiKey);
    xhr.send();

});

const getFinishedExercisesByStudentId = (studentId) => new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.addEventListener('readystatechange', () => {
        if (xhr.readyState === 4) {
            if (xhr.status === 302 && xhr.response !== null) {
                const json = JSON.parse(xhr.response);
                resolve(json);
            }
        }
    });

    xhr.open('GET', `${_pedagogicalInterventionWebServiceUrl}${_pedagogicalSoftwarePath}/finishedExercisesByStudentId?studentId=${studentId}`, true);
    xhr.setRequestHeader('apiKey', _apiKey);
    xhr.send();
});

const updateStudentCompetence = (studentId, competence) => new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.addEventListener('readystatechange', () => {
        if (xhr.readyState === 4) {
            if (xhr.status === 302 && xhr.response !== null) {
                const json = JSON.parse(xhr.response);
                resolve(json.body.object);
            }
        }
    });

    xhr.open('GET', `${_pedagogialWebUrl}${_studentsPath}/updateStudentCompetence?studentId=${studentId}&competence=${competence}`, true);
    xhr.setRequestHeader('apiKey', _apiKey);
    xhr.send();

});

const updateStudentData = (studentId, gender, motherTongue, age) => new Promise((resolve) => {

    const xhr = new XMLHttpRequest();
    xhr.addEventListener('readystatechange', () => {
        if (xhr.readyState === 4) {
            if (xhr.status === 302 && xhr.response !== null) {
                const json = JSON.parse(xhr.response);
                resolve(json.body.object);
            }
        }
    });

    xhr.open('GET', `${_pedagogialWebUrl}${_studentsPath}/updateStudentData?studentId=${studentId}&gender=${gender}&motherTongue=${motherTongue}&age=${age}`, true);
    xhr.setRequestHeader('apiKey', _apiKey);
    xhr.send();
});


const sendSensorInformation = (userName, password, student, sensorObjectType, sensorName, data, fromDate, toDate) =>
    new Promise((resolve) => {

        // Gets the current date and milliseconds
        const dateOptions = {year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'UTC',
            timeZoneName: 'short'};
        const date = new Date().toLocaleDateString('es-ES', dateOptions);
        const milliseconds = Date.now();

        // 1- Creates the sensor object
        const sensorObject = {date: date,
            milliseconds: milliseconds,
            data: data,
            sensorObjectType: sensorObjectType,
            sensorName: sensorName,
            fromDate: fromDate,
            toDate: toDate};

        // 2- Creates the security sensor data object
        const securitySensorData = {user: userName,
            password: password,
            data: [sensorObject],
            student: student
        }

        const xhr = new XMLHttpRequest();
        const params = JSON.stringify(securitySensorData);
        xhr.addEventListener('readystatechange', () => {
            if (xhr.readyState === 4) {
                if (xhr.status === 201 && xhr.response !== null) {
                    if (xhr.response === '') {
                        resolve(null);
                    } else {
                        const json = JSON.parse(xhr.response);

                        // If the response is not null, we send the parsed response
                        resolve(json.body.object);
                    }
                }
            }
        });

        xhr.open('POST', `${_pedagogicalInterventionWebServiceUrl}${_sensorPath}/sendSensorData`, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('apiKey', _apiKey);
        xhr.send(params);
    });

export {sendBlockArtie, sendSolutionArtie, updateAnsweredNeedHelp, loginArtie,
    getArtieStudents, getArtieExercises, getAllArtieExercises, updateStudentCompetence,
    updateStudentData, getFinishedExercisesByStudentId, sendSensorInformation};
