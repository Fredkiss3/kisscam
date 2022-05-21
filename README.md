
<p align="center">
  <a href="https://thullo.fredkiss.dev">
    <img alt="Design" src="./design/design.jpeg" width="100%" />
  </a>
</p>

# DPKISS Call 😎


![Build Status Back](https://github.com/Fredkiss3/dpkiss-call/workflows/Continous%20Integration%20For%20Backend/badge.svg?branch=main)
<!-- ![Build Status Front](https://github.com/Fredkiss3/dpkiss-call/workflows/CI%2FCD%20For%20the%20Frontend/badge.svg?branch=main) -->

DPKISS Call is a web application that allows you to call your friends and family for how much time you want.


# Requirements

- Node >= v16.6.2
- [PNPM](https://pnpm.io/installation) >= v6.22.2
## 🚀 How to work on the project ?

1. First you have to clone the repository
    
    ```bash
    git clone https://github.com/Fredkiss3/dpkiss-call.git
    ```    

2. **Then, Install the dependencies :**

    ```bash
    pnpm install
    ```    

3. **And launch the project :**

    ```bash
    pnpm run dev --parallel
    ```

    The express API will be available at 
    http://localhost:8080 and the frontend client at http://localhost:3000.

4. **Open the source code and start rocking ! 😎**


## 🧐 Project structure

A quick look at the top-level files and directories you will see in this project.

    .
    ├── .github/
    │    └── workflows
    │        ├── back.yml
    │        └── front.yml
    ├── back/
    ├── front/
    ├── .prettierrc
    ├── pnpm-workspace.yaml
    ├── pnpm-lock.yaml
    └── tsconfig.json

1. **`.github/`**: this folder contains the GitHub Actions workflow configuration for Continuous Integration/Continuous Deployment.
   Given that this project is a [monorepo](https://www.wikiwand.com/en/Monorepo), there is muliples workflows for the different packages, with each one targeting a specific environment :
   
    1. **`back.yml`** : this workflow is used to deploy the backend.
   
    2. **`front.yml`** : this workflow is used to test and deploy the frontend app.
   
2. **`back/`** : this package contains the API mainly implemented with socket.io.   

3. **`front/`** : this package contains the frontend app written in React.
    
4. **`.prettierrc`**: this file contains the configuration for prettier to enable autoformatting.

5. **`pnpm-workspace.yaml`**: this file contains the configuration for the monorepo.

6. **`pnpm-lock.yaml`**: this file contains the dependencies lock for the monorepo.

7. **`tsconfig.json`**: this file contains the configuration for typescript, that are used by the all the underlying packages
