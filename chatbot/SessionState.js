const STATES = require('./SessionStateEnum.js');

class SessionState {

    constructor(id, installationId, buttonId, unit, phoneNumber, state, numPresses, createdAt, updatedAt, incidentType, notes, fallBackAlertTwilioStatus) {
        this.id = id
        this.installationId = installationId
        this.buttonId = buttonId
        this.unit = unit
        this.phoneNumber = phoneNumber
        this.state = state
        this.numPresses = numPresses 
        this.createdAt = createdAt
        this.updatedAt = updatedAt
        this.incidentType = incidentType
        this.notes = notes
        this.fallBackAlertTwilioStatus = fallBackAlertTwilioStatus
        this.incidentCategoryMessage = 'Now that you have responded, please reply with the number that best describes the incident:\n0 - accidental\n1 - safer use\n2 - unsafe guest\n3 - overdose\n4 - other'
        this.allowedIncidentTypes = {
            '0': 'Accidental',
            '1': 'Safer Use',
            '2': 'Unsafe Guest',
            '3': 'Overdose',
            '4': 'Other'
        }
    }

    advanceSession(messageText) {

        let returnMessage;

        switch (this.state) {
            case STATES.STARTED:
                this.state = STATES.WAITING_FOR_CATEGORY;
                returnMessage = this.incidentCategoryMessage
                break;
            case STATES.WAITING_FOR_REPLY:
                this.state = STATES.WAITING_FOR_CATEGORY;
                returnMessage = this.incidentCategoryMessage
                break;
            case STATES.WAITING_FOR_CATEGORY: {
                let isValid = this.setIncidentType(messageText.trim());
                this.state = isValid ? STATES.WAITING_FOR_DETAILS : STATES.WAITING_FOR_CATEGORY;
                returnMessage = this.setIncidentType(messageText.trim()) ? 'Thank you. If you like, you can reply with any further details about the incident.' : 'Sorry, the incident type wasn\'t recognized. Please try again.';
                break;
            }
            case STATES.WAITING_FOR_DETAILS:
                this.notes = messageText.trim();
                this.state = STATES.COMPLETED;
                returnMessage = "Thank you. This session is now complete. (You don't need to respond to this message.)";
                break;
            case STATES.COMPLETED:
                returnMessage = "There is no active session for this button. (You don't need to respond to this message.)";
                break;
            case STATES.TIMED_OUT:
                returnMessage = "There is no active session for this button. (You don't need to respond to this message.)";
                break;
            default:
                returnMessage = 'Thank you for responding. Unfortunately, we have encountered an error in our system and will deal with it shortly.';
                break;
        }

        return returnMessage;
    }

    setIncidentType(numType) {

        if (numType in this.allowedIncidentTypes) {
            this.incidentType = this.allowedIncidentTypes[numType];
            return true;
        }
        return false;
    }

    incrementButtonPresses(numPresses) {
        this.numPresses += numPresses
    }

}

class SessionState_Alvis extends SessionState {

    constructor(id, installationId, buttonId, unit, phoneNumber, state, numPresses, createdAt, updatedAt, incidentType, notes, fallBackAlertTwilioStatus) { 
        super(id, installationId, buttonId, unit, phoneNumber, state, numPresses, createdAt, updatedAt, incidentType, notes, fallBackAlertTwilioStatus)
        this.incidentCategoryMessage = 'Now that you have responded, please reply with the number that best describes the incident:\n0 - health\n1 - mental health\n2 - overdose\n3 - safety\n4 - error press\n5 - other'
        this.allowedIncidentTypes = {
            '0': 'Health',
            '1': 'Mental Health',
            '2': 'Overdose',
            '3': 'Safety',
            '4': 'Error Press',
            '5': 'Other'
        }
    }
}

module.exports = { SessionState, SessionState_Alvis }
