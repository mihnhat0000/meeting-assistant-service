**Project Overview:**

You are to act as a senior Back-end Engineer. I need you to generate NestJS (version 10.x or latest stable as of early 2025) code
for a project симптоми “Meeting Assistant and Task Tracker”. This project will be a backend-only API service.

**Core Business Domains & Modules to Implement:**

The application should be structured модулярly. Please generate code for the following core modules:

1.  **`AudioModule`**: Handles audio recording file uploads and storage.
2.  **`TranscriptionModule`**: Manages audio processing (format conversion) and transcription using external services. This module
    should support asynchronous processing.
3.  **`AiIntegrationModule`**: Provides services to interact with various external AI APIs for tasks like summarization, sentiment
    analysis, etc.
4.  **`LarkIntegrationModule`**: Integrates with Lark (Feishu) APIs for task creation, calendar event management, and webhook
    handling.
5.  **`TaskManagementModule`**: Manages tasks within our system, including CRUD operations, assignments, status tracking, and
    deadlines.

**Technical Stack & Key Requirements:**

- **Framework:** NestJS (latest stable, assume v10.x or newer for early 2025 conventions)
- **Language:** TypeScript
- **Database:** MySQL
- **ORM:** TypeORM
- **File Storage:** Local file system (no cloud storage for this phase).
- **Asynchronous Processing:** Use Bull (with Redis) for background jobs like audio transcription.
- **API Interaction:** Use `@nestjs/axios` (HttpModule) for external API calls.
- **Configuration:** Use `@nestjs/config` for environment variable management.
- **Scheduling:** Use `@nestjs/schedule` for any necessary scheduled tasks.
- **Caching:** Use `@nestjs/cache-manager` (optional, if deemed beneficial for specific endpoints).
- **Monorepo/Modular Design:** Prioritize a scalable, modular design. If a full monorepo setup is too complex for initial
  generation, focus on well-defined, independent modules that can be later organized into a monorepo structure. Each business
  domain should be its own NestJS module.
- **Naming Conventions:** Follow NestJS conventions (e.g., `user.module.ts`, `user.controller.ts`, `user.service.ts`,
  `CreateUserDto`, `UserEntity`).
- **Error Handling:** Implement robust error handling, including custom exception filters where appropriate.
- **Authentication/Authorization:** Assume JWT-based authentication. Generate a basic `AuthGuard` (e.g., `JwtAuthGuard`) and
  demonstrate its usage on protected C_RUD_UD endpoints. For simplicity, a mock user/payload can be assumed within the guard for
  generation purposes if a full auth module isn't explicitly requested in this phase.
- **NO TESTING CODE:** Skip generation of all unit tests (`.spec.ts` files) and E2E tests.
- **NO CI/CD CONFIG:** Skip CI/CD pipeline configurations.
- **Focus on Backend Logic:** This is a backend-only API service.

---

**Detailed Instructions for Each Module and Feature:**

**I. Project Setup & High-Level Structure:**

1.  **Root `AppModule` (`app.module.ts`):**

    - Configure `ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' })`.
    - Configure `TypeOrmModule.forRootAsync()` for MySQL connection using environment variables (see DB section).
    - Import all five core business modules.
    - Set a global API prefix (e.g., `/api/v1`).
    - Register a global `ValidationPipe`.
    - Register a global custom `HttpExceptionFilter` for centralized error handling.

2.  **Folder Structure:**
    - Propose a clear folder structure, for example:
      ```
      src/
      ├── app.module.ts
      ├── main.ts
      ├── config/               # Configuration related files (e.g. TypeORM config object)
      ├── core/                 # Global core components (guards, interceptors, filters)
      │   ├── guards/
      │   │   └── jwt-auth.guard.ts
      │   └── filters/
      │       └── http-exception.filter.ts
      ├── modules/
      │   ├── auth/             # (Minimal, placeholder if needed for JwtAuthGuard)
      │   ├── audio/
      │   ├── transcription/
      │   ├── ai_integration/
      │   ├── lark_integration/
      │   └── task_management/
      └── shared/               # Shared utilities, constants
      ```

**II. Database (MySQL with TypeORM):**

1.  **Environment Variables (for `.env` file):**

    - `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`
    - `JWT_SECRET`, `JWT_EXPIRATION_TIME`
    - `OPENAI_API_KEY`
    - `LARK_APP_ID`, `LARK_APP_SECRET`
    - `REDIS_HOST`, `REDIS_PORT` (for Bull)

2.  **TypeORM Configuration (`app.module.ts` or a separate `config/typeorm.config.ts`):**

    - Show the `TypeOrmModule.forRootAsync()` setup, injecting `ConfigService` to read DB credentials.
    - Include `autoLoadEntities: true` and `synchronize: true` (for development ease; acknowledge this is not for production).

3.  **Entity Definitions:**
    - **`UserEntity` (`user.entity.ts` - basic for now):**
      - `id` (uuid, primary generated)
      - `email` (string, unique)
      - `password` (string, select: false)
      - `firstName` (string, nullable)
      - `lastName` (string, nullable)
      - `createdAt`, `updatedAt` (timestamps)
    - **`AudioRecordingEntity` (`audio-recording.entity.ts` in `AudioModule`):**
      - `id` (uuid, primary generated)
      - `userId` (uuid, foreign key to User)
      - `originalFileName` (string)
      - `filePath` (string, local path to the stored file)
      - `mimeType` (string)
      - `size` (number, in bytes)
      - `duration` (number, seconds, nullable)
      - `transcriptionId` (uuid, nullable, one-to-one relation to `TranscriptionEntity`)
      - `createdAt`, `updatedAt`
      - _Relationship:_ `ManyToOne` with `UserEntity`, `OneToOne` (optional eager) with `TranscriptionEntity`.
    - **`TranscriptionEntity` (`transcription.entity.ts` in `TranscriptionModule`):**
      - `id` (uuid, primary generated)
      - `audioRecordingId` (uuid, foreign key, one-to-one with `AudioRecordingEntity`)
      - `status` (enum: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`)
      - `transcriptText` (text, nullable)
      - `language` (string, nullable)
      - `processedAt` (timestamp, nullable)
      - `errorMessage` (string, nullable, if failed)
      - `createdAt`, `updatedAt`
      - _Relationship:_ `OneToOne` (inverse side) with `AudioRecordingEntity`.
    - **`TaskEntity` (`task.entity.ts` in `TaskManagementModule`):**
      - `id` (uuid, primary generated)
      - `title` (string)
      - `description` (text, nullable)
      - `status` (enum: `TODO`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`)
      - `priority` (enum: `LOW`, `MEDIUM`, `HIGH` - optional)
      - `dueDate` (Date, nullable)
      - `assigneeId` (uuid, nullable, foreign key to User)
      - `reporterId` (uuid, foreign key to User)
      - `audioRecordingId` (uuid, nullable, foreign key to `AudioRecordingEntity` - if task originated from a meeting)
      - `larkTaskId` (string, nullable, unique - to store ID from Lark)
      - `createdAt`, `updatedAt`
      - _Relationships:_ `ManyToOne` with `UserEntity` (for assignee and reporter), `ManyToOne` with `AudioRecordingEntity`
        (optional).

**III. `AudioModule`:**

1.  **Module (`audio.module.ts`):**
    - Import `MulterModule.register()` for local file storage. Configure it to save audio files to `./uploads/audio/`. The
      destination path should be configurable via an environment variable if possible (e.g., `UPLOAD_AUDIO_PATH`).
    - Import `TypeOrmModule.forFeature([AudioRecordingEntity, UserEntity])`.
2.  **Controller (`audio.controller.ts`):**
    - `POST /upload`:
      - Use `@UseInterceptors(FileInterceptor('file', multerOptions))` where `multerOptions` limits file size and maybe file
        types.
      - Accepts `@UploadedFile() file: Express.Multer.File` and `@Body() metadataDto: AudioMetadataDto`.
      - `AudioMetadataDto` should include `userId`.
      - Call `AudioService.saveAudioFile()`.
      - Endpoint should be protected by `JwtAuthGuard`.
3.  **Service (`audio.service.ts`):**
    - `saveAudioFile(file: Express.Multer.File, userId: string, metadata?: any): Promise<AudioRecordingEntity>`
      - Saves file buffer to disk using `fs.writeFileSync` or streams.
      - Handles potential errors during file write.
      - Creates and saves an `AudioRecordingEntity` record in the database with `filePath`, `originalFileName`, `mimeType`,
        `size`, and `userId`.
      - Returns the created `AudioRecordingEntity`.
    - Method to get an audio recording by ID.

**IV. `TranscriptionModule`:**

1.  **Module (`transcription.module.ts`):**
    - Import `TypeOrmModule.forFeature([TranscriptionEntity, AudioRecordingEntity])`.
    - Import `BullModule.forRootAsync()` to connect to Redis (read host/port from `ConfigService`).
    - Import `BullModule.registerQueue({ name: 'audio-transcription' })`.
    - Import `HttpModule` (from `@nestjs/axios`).
2.  **Service (`transcription.service.ts`):**
    - Inject `@InjectQueue('audio-transcription') private audioQueue: Queue`.
    - `startTranscription(audioRecordingId: string): Promise<TranscriptionEntity>`:
      - Create a `TranscriptionEntity` with `status: PENDING` linked to `audioRecordingId`.
      - Add a job to the `audio-transcription` Bull queue, passing `audioRecordingId` and `filePath` (from
        `AudioRecordingEntity`).
      - Return the created `TranscriptionEntity`.
    - `getTranscriptionStatus(transcriptionId: string): Promise<TranscriptionEntity>`.
3.  **Processor (`transcription.processor.ts`):**
    - Annotate with `@Processor('audio-transcription')`.
    - `@Process('transcribe') async processTranscriptionJob(job: Job<{ audioRecordingId: string; filePath: string }>): Promise<void>`:
      - Get `filePath` and `audioRecordingId` from `job.data`.
      - **FFmpeg (Conceptual):** Outline where a call to `ffmpeg` would be made (e.g., using `child_process.execSync`) to convert
        the audio file at `filePath` to a format suitable for the transcription API (e.g., FLAC, 16kHz mono). Handle errors. For
        generation, a placeholder for this step is acceptable if actual `ffmpeg` interop is too complex for AI.
      - **Call Transcription API (e.g., OpenAI Whisper):**
        - Read `OPENAI_API_KEY` from `ConfigService`.
        - Use `HttpService` to make a POST request to the Whisper API endpoint, sending the (converted) audio file.
        - Handle API response (success or error).
        - If successful, update the `TranscriptionEntity` with `transcriptText`, `status: COMPLETED`, `language`.
        - If failed, update with `status: FAILED`, `errorMessage`.
        - Log progress and errors.
4.  **Controller (`transcription.controller.ts`):**
    - `POST /transcribe/:audioRecordingId`: Calls `TranscriptionService.startTranscription()`. Protected by `JwtAuthGuard`.
    - `GET /transcription/:transcriptionId/status`: Calls `TranscriptionService.getTranscriptionStatus()`. Protected by
      `JwtAuthGuard`.

**V. `AiIntegrationModule`:**

1.  **Module (`ai_integration.module.ts`):**
    - Import `HttpModule`.
2.  **Service (`ai_integration.service.ts`):**
    - Inject `HttpService` and `ConfigService`.
    - `summarizeText(text: string): Promise<{ summary: string }>`:
      - Read `OPENAI_API_KEY` (or other relevant AI API key).
      - Make a request to an AI model (e.g., OpenAI's GPT) for text summarization.
      - Include proper error handling and return the summary.
    - `analyzeSentiment(text: string): Promise<{ sentiment: string; score: number }>`:
      - Similar to `summarizeText`, but for sentiment analysis.
3.  **Controller (`ai_integration.controller.ts`):**
    - `POST /summarize`: Accepts text in body, calls `AiIntegrationService.summarizeText()`. Protected by `JwtAuthGuard`.
    - `POST /sentiment`: Accepts text in body, calls `AiIntegrationService.analyzeSentiment()`. Protected by `JwtAuthGuard`.

**VI. `LarkIntegrationModule`:**

1.  **Module (`lark_integration.module.ts`):**
    - Import `HttpModule`.
    - Import `TypeOrmModule.forFeature([TaskEntity])` (if updating local task with Lark ID).
2.  **Service (`lark_integration.service.ts`):**
    - Inject `HttpService` and `ConfigService`.
    - Store `LARK_APP_ID`, `LARK_APP_SECRET`. Cache tenant access token.
    - `private async getTenantAccessToken(): Promise<string>`:
      - Implements logic to fetch/refresh Lark tenant access token using App ID/Secret.
      - Handles caching of the token.
    - `createTaskOnLark(taskDetails: { title: string; description?: string; /* ...other Lark task fields */ }): Promise<{ larkTaskId: string; data: any }>`:
      - Gets access token.
      - Makes API call to Lark's "Create Task" endpoint.
      - Returns Lark's task ID and response data.
    - `createCalendarEventOnLark(eventDetails: { summary: string; startTime: string; endTime: string; attendees?: string[]; /* ... */ }): Promise<any>`:
      - Gets access token.
      - Makes API call to Lark's "Create Calendar Event" endpoint.
    - `handleTaskUpdateWebhook(payload: any, signature: string, timestamp: string): Promise<void>`:
      - **Webhook Signature Verification (Conceptual):** Outline where signature verification logic would go (using App Secret,
        payload, timestamp). For AI generation, a placeholder comment is fine.
      - Parse payload to update corresponding `TaskEntity` in local DB (e.g., by `larkTaskId`).
    - `handleCalendarEventWebhook(payload: any, signature: string, timestamp: string): Promise<void>`:
      - Similar to task webhook handling.
3.  **Controller (`lark_integration.controller.ts`):**
    - `POST /lark/tasks`: Accepts task details, calls `LarkIntegrationService.createTaskOnLark()`. Protected.
    - `POST /lark/calendar/events`: Accepts event details, calls `LarkIntegrationService.createCalendarEventOnLark()`. Protected.
    - `POST /lark/webhooks/event_callback`:
      - This endpoint is for Lark to call. It might need a slightly different security mechanism if not using standard JWT (e.g.
        signature verification is key).
      - It receives the webhook payload (and headers for signature).
      - Calls the appropriate service method (e.g., `handleTaskUpdateWebhook` or `handleCalendarEventWebhook` based on payload
        type).
      - Remember Lark webhooks often require an immediate `200 OK` response, then process asynchronously. Handle
        encryption/challenge requests if Lark requires them during webhook setup.

**VII. `TaskManagementModule`:**

1.  **Module (`task_management.module.ts`):**
    - Import `TypeOrmModule.forFeature([TaskEntity, UserEntity, AudioRecordingEntity])`.
    - (Optional) If implementing real-time updates: Import necessary WebSocket gateway setup (`@nestjs/websockets`). For this
      generation, assume REST only unless specified for websockets.
2.  **Entities:** `TaskEntity` (already defined).
3.  **DTOs:**
    - `CreateTaskDto.ts`: `title` (string, required), `description` (string, optional), `status` (enum, optional, default `TODO`),
      `priority` (optional), `dueDate` (Date, optional), `assigneeId` (uuid, optional), `reporterId` (uuid, required from
      authenticated user), `audioRecordingId` (uuid, optional).
    - `UpdateTaskDto.ts`: All fields from `CreateTaskDto` but optional, using `PartialType` from `@nestjs/mapped-types`.
4.  **Controller (`task.controller.ts`):**
    - `POST /tasks`: `@Body() createTaskDto: CreateTaskDto`. Protected. (Set `reporterId` from `req.user.id`).
    - `GET /tasks`: List tasks with pagination and filtering (e.g., by status, assignee). Protected.
    - `GET /tasks/:id`: Get a specific task. Protected.
    - `PATCH /tasks/:id`: `@Body() updateTaskDto: UpdateTaskDto`. Protected.
    - `DELETE /tasks/:id`: Delete a task. Protected.
5.  **Service (`task.service.ts`):**
    - Implement CRUD methods (`create`, `findAll`, `findOne`, `update`, `remove`) using `Repository<TaskEntity>`.
    - Handle relations (e.g., validating `assigneeId` exists if provided).
    - When a task is created/updated and has Lark integration details, consider calling `LarkIntegrationService` to sync.

**VIII. General Best Practices:**

1.  **Middleware:**
    - Generate a simple `LoggerMiddleware` (functional, not class-based for simplicity if AI struggles) that logs request method
      and URL, and apply it globally or to specific routes.
2.  **Guards:**
    - `JwtAuthGuard` (`core/guards/jwt-auth.guard.ts`):
      - Extends `AuthGuard('jwt')`.
      - Can include a basic `handleRequest` method for custom error throwing if token is invalid/missing.
      - The `JwtStrategy` (if you decide to include a minimal auth module) should read `JWT_SECRET` from `ConfigService`.
3.  **Interceptors:**
    - Generate a `TransformResponseInterceptor` (`core/interceptors/transform-response.interceptor.ts`) to wrap all successful
      responses in a consistent structure like `{ statusCode: 200, data: ... }`.
4.  **Exception Filters:**
    - `HttpExceptionFilter` (`core/filters/http-exception.filter.ts`):
      - Catches `HttpException` and any other unhandled exceptions.
      - Formats error responses consistently: `{ statusCode, timestamp, path, message, details? }`.
      - Logs errors.
