import askGitHub from "./githubRepoRequest.js"
import yaml from 'js-yaml';

const CONFIGURATION_FILENAME = 'improvedConfiguration.yml';

const retrieveConfigurationForRepo = async (githubHead) => {
    const url = `contents/${CONFIGURATION_FILENAME}`;

    try {
        const response = await askGitHub(githubHead, url);
        const data = await response.json();
        const contentBase64 = data.content;
        const yamlString = Buffer.from(contentBase64, 'base64').toString('utf8');

        const result = yaml.load(yamlString);
        return result;
    } catch (error) {
        throw new Error('No configuration file found in the repository root.');
    }
}

export default retrieveConfigurationForRepo;