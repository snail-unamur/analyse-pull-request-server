export const log = (message, prNumber) => {
    let logMessage = `[${new Date().toLocaleString()}]`;

    if (prNumber) {
       logMessage = logMessage.concat(`[PR #${prNumber}] `);
    } else {
        logMessage = logMessage.concat('[PR batch] ');
    }

    logMessage = logMessage.concat(message);

    console.log(logMessage);
}

export const logGithub = (message) => {
    let logMessage = `[${new Date().toLocaleString()}][ask GitHub] ${message}`;

    console.log(logMessage);
}

export const logSonar = (message) => {
    let logMessage = `[${new Date().toLocaleString()}][ask Sonar] ${message}`;

    console.log(logMessage);
}