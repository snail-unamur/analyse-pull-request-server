# SNAIL - Pull Request Analyse Server

A server that retrieve metric information about GitHub Pull Request. It is designed to work with the [Visual Studio Code Plugin](https://github.com/snail-unamur/vscode-pull-request-github).
 

## 📦 Installation

Once the server has been cloned, follow these steps to complete the installation:

1. **Install dependencies**

    Run the following command:
    ```bash
    npm install
    ```

2. **Set up SonarCloud access**

    Create an access token in SonarCloud and add it to the .env file:
    ```
    SONARQUBE_CLOUD_TOKEN=<your-sonarcloud-token>
    ```

## 🛠 Repository configuration

Before the server can analyze pull requests, the target repository must be configured:

1. In the ```__templates__``` folder, select the configuration folder that match your repository's target language.

    - Copy the ```.github``` folder, ```codeql``` folder and ```improvedConfiguration.yml``` file to the root directory of the target repository. 
    
2. In SonarCloud:
    - Register a new project for your repository.
    - Follow the setup instructions provided by SonarCloud.
    - Update the CI/CD workflow if necessary, but do not change the project key. The server expects the default format: *"repo-owner_repo-name"*

## 📊 Metric Configuration

The `improvedConfiguration.yml` file, copied in the previous step, serves as the configuration file for the repository.  It defines all available metrics.

You can:
- ✅ Enable or disable a metric  
- 🎯 Adjust threshold values used in the radar chart  

Modify this file to tailor the analysis to your project's needs.


## ▶️ Run the server

To start the server, run:

```bash
npm start
```

Make sure you have a properly configured .env file in your project directory.

## 🚀 Run for Production

The server runs inside a Docker container for production.

1. Build the Docker image

    ```bash
    docker build -t pull-request-analyse-server .
    ```

2. Run the container with environment variables
Make sure you have a properly configured .env file in your project directory.

    ```bash
    docker run -p 3000:3000 --env-file .env pull-request-analyse-server
    ```

This command injects the .env variables at runtime, keeping your secrets out of the image.



## 🧪 Run test

To execute the unit tests, run:

```bash
npm test
```
