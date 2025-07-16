const log = (message, prNumber) => {
    let logMessage = `[${new Date().toLocaleString()}]`;

    if (prNumber) {
       logMessage = logMessage.concat(`[PR #${prNumber}] `);
    } else {
        logMessage = logMessage.concat('[PR batching] ');
    }

    logMessage = logMessage.concat(message);

    console.log(logMessage);
}

export default log;