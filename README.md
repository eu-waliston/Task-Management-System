# Task Management System 🚀

Um sistema corporativo completo de gerenciamento de tarefas construído com TypeScript, seguindo os princípios de Domain-Driven Design (DDD) e arquitetura limpa. Projetado para escalabilidade, manutenibilidade e alto desempenho em ambientes empresariais.

# ✨ Características Principais

## 🏗️ Arquitetura

- Domain-Driven Design (DDD) com separação clara de responsabilidades

- Arquitetura Limpa com camadas bem definidas

- Repository Pattern para abstração de dados

- Injeção de Dependências para baixo acoplamento

## 🔧 Tecnologias & Stack

- Backend: Node.js + Express + TypeScript

- Frontend: React 18 + TypeScript + Redux Toolkit

- Banco de Dados: MongoDB com transações

- Cache: Redis para performance

- Message Broker: RabbitMQ para processamento assíncrono

- Containerização: Docker + Docker Compose

- Monitoramento: Prometheus + Grafana

## 🛡️ Segurança

- Autenticação JWT com refresh tokens

- Rate Limiting com Redis

- Validação de dados com Zod

- Helmet para segurança HTTP

- CORS configurável

- Sanitização de inputs

## 📊 Monitoramento & Observabilidade


- Métricas com Prometheus


- Health Checks avançados


- Logging estruturado com Winston


- Tracing de requisições


- Dashboard Grafana

## 🚀 Começando Rápido

### Pré-requisitos

- Node.js 18+


- MongoDB 6+


- Redis 7+


- Docker & Docker Compose (opcional)

# 📁 Estrutura do Projeto

```bash

task-management-system/
├── backend/                 # Aplicação backend
│   ├── src/
│   │   ├── core/           # Domínio e regras de negócio
│   │   ├── application/    # Casos de uso e serviços
│   │   ├── infrastructure/ # Implementações externas
│   │   ├── api/           # Controladores e rotas
│   │   └── config/        # Configurações
│   ├── tests/             # Testes unitários e de integração
│   └── scripts/           # Scripts de deployment
├── frontend/              # Aplicação React
│   ├── src/
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── store/         # Gerenciamento de estado
│   │   └── services/      # Comunicação com API
├── infrastructure/        # Terraform e configurações de infra
└── docs/                 # Documentação

```

# 📚 API Documentation

### A documentação interativa da API está disponível em:

- Swagger UI: http://localhost:3000/api-docs

- OpenAPI Spec: http://localhost:3000/api-docs/json

# Endpoints Principais

```bash


Método	  Endpoint	        Descrição	        Autenticação
POST	    /api/auth/login	  Login de usuário	❌
POST	    /api/users	      Criar usuário	    ✅
GET	      /api/tasks	      Listar tarefas	  ✅
POST	    /api/tasks	      Criar tarefa	    ✅
PUT	      /api/tasks/:id	  Atualizar tarefa	✅


```
