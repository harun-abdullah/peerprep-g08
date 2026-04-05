# PeerPrep Containerization Report

This document outlines the containerization strategy and local deployment process for the PeerPrep microservices architecture.

## 1. Containerization Coverage

The entire PeerPrep system is orchestrated using a single **`docker-compose.yml`** file. This ensures that all services, including back-end microservices, the front-end, and database dependencies, can be started with a single command.

### Services Included:
*   **Back-end Microservices**:
    *   `user-service`: Handles user authentication and profiles.
    *   `question-service`: Manages the bank of technical interview questions.
    *   `collab-service`: Manages real-time collaborative editing sessions and chat.
    *   `matching-service`: Manages finding available peers and pairing them together.
*   **Internal Infrastructure**:
    *   `api-gateway`: Unified entry point that proxies requests to back-end services.
*   **Front-end Application**:
    *   `frontend`: React/Vite-based UI served via Nginx.
*   **Databases**:
    *   `peerprep-mongodb`: Local MongoDB instance (optional, switchable to Cloud Atlas).
    *   `peerprep-redis`: In-memory data store for collaboration state.

### Starting the System:
To start the entire system, run the following command from the root directory:

```bash
docker compose up --build
```

---

## 2. Dockerfile Strategy

A standardized strategy was applied to all microservices to ensure small, secure, and production-ready images.

### Key Strategies:
1.  **Choice of Base Image (`node:20-alpine`)**:
    *   **Lightweight**: Alpine Linux significantly reduces the image size (from ~1GB to ~150MB).
    *   **Security**: Smaller attack surface due to fewer pre-installed packages.
2.  **Multi-Stage Builds**:
    *   **Stage 1 (Builder)**: Installs all dependencies (including `devDependencies`) and compiles source code where necessary (e.g., `frontend` build).
    *   **Stage 2 (Runtime)**: Copies only the necessary application context and production `node_modules`. This keeps the final image clean of build-time artifacts and source control junk.
3.  **Context Optimization**:
    *   **`.dockerignore`**: Prevents unnecessary files like `.git`, `node_modules` (local), and `.env` from being sent to the Docker daemon during the build process, further speeding up build times.
4.  **Health Checks**:
    *   Custom `healthcheck` commands were added to the `mongodb` and `redis` services. The microservices are configured to wait until these health checks pass (`condition: service_healthy`) before attempting to connect, preventing "Connection Refused" errors on startup.

---

## 3. Inter-service Communication

The services communicate seamlessly using **Docker's Internal DNS** and a dedicated bridge network.

### Architecture Overview:

```mermaid
graph TD
    User([User Browser]) -->|Port 5173| Frontend[peerprep-frontend]
    Frontend -->|API Calls Port 3000| Gateway[peerprep-api-gateway]
    
    subgraph "Docker Internal Network (peerprep-network)"
    Gateway -->|http://user-service:3001| UserSvc[peerprep-user-service]
    Gateway -->|http://question-service:8080| QuestionSvc[peerprep-question-service]
    Gateway -->|http://collab-service:3219| CollabSvc[peerprep-collab-service]
    Gateway -->|http://matching-service:3002| MatchingSvc[peerprep-matching-service]
    
    UserSvc -->|mongodb://mongodb:27017| MongoDB[(peerprep-mongodb)]
    QuestionSvc -->|mongodb://mongodb:27017| MongoDB
    CollabSvc -->|mongodb://mongodb:27017| MongoDB
    CollabSvc -->|redis://redis:6379| Redis[(peerprep-redis)]
    MatchingSvc -->|redis://redis:6379| Redis
    end
```

### Key Technical Details:
*   **Internal DNS**: Docker's embedded DNS server allows services to resolve other containers by their service names (e.g., `user-service`, `mongodb`).
*   **Zero-Intervention Configuration**: All connection strings are managed via **Environment Variables** in the `docker-compose.yml`. For example, the `api-gateway` defines:
    *   `USER_SERVICE_URL=http://user-service:3001`
    *   `QUESTION_SERVICE_URL=http://question-service:8080`
*   **Isolation**: Only those ports required by the user (3000 for Gateway, 5173 for Frontend) need to be exposed to the host machine. All inter-service traffic remains private within the Docker network.
