# SNAIL - Pull Request Analyse Server

A server that retrieve metric information about GitHub Pull Request. It is designed to work with the [Visual Studio Code Plugin](https://github.com/snail-unamur/vscode-pull-request-github).
 

## 🚀 Installation

Once the server has been cloned, follow these steps to complete the installation:

1. **Install dependencies**

    Run the following command:
    ```bash
    npm install
    ```

2. **Set up MongoDB**
    
    Create a MongoDB cluster and copy the connection string into the .env file using the key:
    ```
    MONGO_URI=<your-mongo-uri>
    ```

3. **Set up SonarCloud access**

    Create an access token in SonarCloud and add it to the .env file:
    ```
    SONARQUBE_CLOUD_TOKEN=<your-sonarcloud-token>
    ```

## 🛠 Repository configuration

Before the server can analyze pull requests, the target repository must be configured:

1. In the ```repositoryConfigurationTemplates``` folder, select the configuration files that match your repository's target language.

    Copy these files to the root directory of the target repository.

2. In SonarCloud:
    - Register a new project for your repository.
    - Follow the setup instructions provided by SonarCloud.
    - Update the CI/CD workflow if necessary, but do not change the project key. The server expects the default format: *"repo-owner_repo-name"*

## ▶️ Run the server

To start the server, run:

```bash
npm start
```

## 🧪 Run test

To execute the unit tests, run:

```bash
npm server
```
