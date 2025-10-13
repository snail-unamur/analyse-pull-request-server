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
    SONAR_TOKEN=<your-sonar-token>
    ```

## 🛠 Repository configuration

Before the server can analyze pull requests, the target repository must be configured:

1. In the ```__templates__``` folder, select the configuration folder that match your repository's target language.

    - Copy the ```.github``` folder, ```codeql``` folder and ```improvedConfiguration.yml``` file to the root directory of the target repository. 
    
2. In SonarCloud:
    - Register a new project for your repository.
    - Follow the setup instructions provided by SonarCloud, select 'with GitHub Actions' for the analysis method and choose the right language.
    - Update the CI/CD workflow file ```.github/workflows/sonar.yml``` if necessary, but do not change the project key. The server expects the default format: *"repo-owner_repo-name"*

## 📊 Metric Configuration

The `improvedConfiguration.yml` file, which you copied to the root folder of the target repository in the previous step, serves as the configuration file for the metrics. It defines all available metrics and their settings.

For each metric, you can:

- ✅ **Enable or disable** the metric using the `checked` field  
- 🔄 **Change the source** from which the metric is retrieved using the `source` field  
- 🎯 **Adjust threshold values** used to compute the radar chart via the `thresholds` field. Thresholds range from 'a' (center value) to 'e' (outer value)  

Modify this file to tailor the analysis to your project's specific needs.

At the root of the server, the `metricsDescription.json` file defines all the textual descriptions of the metrics used by the server. You can modify the `name`, `full_name`, or `description` fields to provide more accurate or project-specific information.


## ▶️ Run the server

To start the server, run:

```bash
npm start
```

Make sure you have a properly configured .env file in your project directory.

In the VSC plugin, the base url must be "<url>/api".

## 🚀 Run for Production

The server runs inside a Docker container for production.

1. Build the Docker image

    ```bash
    docker build -t pull-request-analyse-server .
    ```

2. Run the container with environment variables
Make sure you have a properly configured .env file in your project directory.

    ```bash
    docker run -d --name pull-request-analyse-server -p 3000:3000 --env-file .env pull-request-analyse-server
    ```

This command injects the .env variables at runtime, keeping your secrets out of the image.



## 🧪 Run test

To execute the unit tests, run:

```bash
npm test
```

## 🏢 Architecture

The entry point of the server is [`server.js`](./server.js). This file initializes the server and registers all the API routes.

The server is organized into the following folders:

- **`routes/`** Defines the API endpoints, including HTTP methods and the middleware stack for each route.

- **`controllers/`** Implements the functions associated with each route. Controllers handle the transformation of incoming requests into appropriate responses.

- **`models/`** Contains the core business logic of the application, including the retrieval and calculation of metrics.

- **`middleware/`** Defines middleware functions used to process data or enforce rules as requests pass through the server.

- **`api/`** Contains helper functions to interact with external services where metrics are sourced (e.g. GitHub, SonarCloud).

- **`utils/`** Provides utility functions shared across the codebase.

- **`__tests__/`** Includes unit tests for the server components.

- **`__data__/`** Stores mock or sample data used during testing.

- **`__templates__/`** Contains template files required to set up repositories for analysis.
