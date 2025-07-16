const JAVA_PATH_PREFIXE_SIZE = 4;

const format = (modulePath) => {
    const pathElements = modulePath.split('/');
    const fileNamePosition = pathElements.length - 1;

    const fileName = pathElements[fileNamePosition];
    const extensionPos = fileName.indexOf('.');
    const fileNameWithoutExtension = fileName.substr(0,extensionPos);

    const codeQLPathElements = (pathElements.slice(JAVA_PATH_PREFIXE_SIZE, fileNamePosition)).concat(fileNameWithoutExtension);
    const result = codeQLPathElements.join('.');

    return result;
}

export default format;