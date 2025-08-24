# AI Dungeon Master

A multi-agent tabletop RPG engine where AI "Dungeon Master," "NPC Actors," and "Combat/Rules" agents run fully playable campaigns—encounters, dialogue, maps, initiative, skill checks, loot, and session notes—with safety tools and exportable artifacts.

## 🎯 Features

- **AI Dungeon Master**: Narrates scenes, sets stakes, runs checks, frames choices
- **NPC Actors**: Distinct voices, motives, persistent memories, dynamic reactions
- **Combat System**: Initiative tracking, turn management, rules resolution
- **Map & Tokens**: Interactive maps with fog-of-war, token management
- **Safety Tools**: Content filters, lines/veils, session tone controls
- **Exports**: Session journals, encounter cards, VTT bundles

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │  Orchestrator   │
│   (Next.js 14)  │◄──►│   (NestJS)      │◄──►│   (FastAPI)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Database      │    │   Workers       │
                       │   (PostgreSQL)  │    │   (Python)      │
                       └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Cache         │    │   Event Bus     │
                       │   (Redis)       │    │   (NATS)        │
                       └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+
- Python 3.11+

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-dungeon-master
   ```

2. **Copy environment file**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start all services**
   ```bash
   npm run dev:build
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - API Gateway: http://localhost:3001
   - API Docs: http://localhost:3001/api/docs
   - Orchestrator: http://localhost:8000
   - MinIO Console: http://localhost:9001

### Individual Service Development

```bash
# Frontend (Next.js)
cd apps/frontend
npm install
npm run dev

# Gateway (NestJS)
cd apps/gateway
npm install
npm run start:dev

# Orchestrator (FastAPI)
cd apps/orchestrator
pip install -r requirements.txt
uvicorn main:app --reload

# Workers (Python)
cd apps/workers
pip install -r requirements.txt
celery -A celery_app worker --loglevel=info
```

## 📁 Project Structure

```
ai-dungeon-master/
├── apps/
│   ├── frontend/          # Next.js 14 frontend
│   ├── gateway/           # NestJS API gateway
│   ├── orchestrator/      # FastAPI + CrewAI orchestration
│   └── workers/           # Python background workers
├── packages/
│   └── sdk/              # Shared TypeScript SDK
├── docker-compose.dev.yml # Development infrastructure
├── env.example           # Environment variables template
└── README.md
```

## 🔧 Configuration

### Environment Variables

Key environment variables (see `env.example` for complete list):

- `OPENAI_API_KEY`: Your OpenAI API key
- `JWT_SECRET_KEY`: Secret for JWT tokens
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `NATS_URL`: NATS connection string

### Database Setup

The application uses PostgreSQL with the following extensions:
- `pgvector` for embeddings
- `uuid-ossp` for UUID generation

## 🧪 Testing

```bash
# Run all tests
npm run test:all

# Frontend tests
cd apps/frontend && npm run test

# Gateway tests
cd apps/gateway && npm run test

# SDK tests
cd packages/sdk && npm run test
```

## 📦 Building for Production

```bash
# Build all applications
npm run build:all

# Build individual apps
npm run build:frontend
npm run build:gateway
npm run build:sdk
```

## 🔍 Monitoring & Observability

- **Health Checks**: `/health` endpoints on all services
- **API Documentation**: Swagger UI at `/api/docs`
- **Logs**: Structured JSON logging with correlation IDs
- **Metrics**: Prometheus metrics endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- Documentation: [Link to docs]
- Issues: [GitHub Issues]
- Discussions: [GitHub Discussions]

---

**AI Dungeon Master** - Bringing tabletop RPGs into the AI era 🎲✨
