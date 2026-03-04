# TCC Backend – Sistema de Gestão de Jornada de Trabalho

Backend desenvolvido como parte do Trabalho de Conclusão de Curso (TCC).
O sistema permite registrar a jornada de trabalho dos usuários, incluindo entrada (clock-in), saída (clock-out), solicitações de ajuste de ponto e aprovação ou rejeição dessas solicitações por administradores.

## Tecnologias utilizadas

* Node.js
* Express
* Prisma ORM
* JWT (JSON Web Token) para autenticação
* MySQL
* Thunder Client para testes de API
* GitHub para versionamento

## Funcionalidades

### Autenticação e usuários

* Criação de usuários
* Login com autenticação JWT
* Rotas protegidas com middleware de autenticação
* Controle de permissões (admin e usuário)

### Sistema de jornada de trabalho

* Registrar entrada (clock-in)
* Registrar saída (clock-out)
* Listar jornadas do usuário autenticado
* Validação para impedir múltiplos clock-in sem clock-out

### Sistema de ajustes de ponto

Usuários podem solicitar ajustes caso esqueçam de registrar o ponto.

* Solicitar ajuste de jornada
* Administrador pode visualizar solicitações
* Administrador pode aprovar ajustes
* Administrador pode rejeitar ajustes

### Auditoria do sistema

Todas as ações importantes ficam registradas:

* Aprovação de ajustes
* Rejeição de ajustes
* Alterações importantes no sistema

Esses registros são armazenados na tabela **audit_logs**.

## Estrutura do projeto

```
backend
│
├── prisma
│   └── schema.prisma
│
├── .env
├── index.js
├── package.json
└── README.md
```

## Principais endpoints da API

### Autenticação

POST /login

### Jornada de trabalho

POST /clock-in
POST /clock-out
GET /my-entries

### Ajustes de ponto

POST /adjustments/request

### Administração

GET /admin/adjustments
POST /admin/adjustments/:id/approve
POST /admin/adjustments/:id/reject

## Como rodar o projeto

### 1. Clonar o repositório

```
git clone https://github.com/seu-usuario/tcc-backend-jornada.git
```

### 2. Entrar na pasta do projeto

```
cd tcc-backend-jornada
```

### 3. Instalar dependências

```
npm install
```

### 4. Configurar o arquivo .env

Exemplo:

```
DATABASE_URL="mysql://user:password@localhost:3306/database"
JWT_SECRET="seu_segredo_jwt"
```

### 5. Rodar o Prisma

```
npx prisma generate
npx prisma db push
```

### 6. Iniciar o servidor

```
node index.js
```

O servidor iniciará em:

```
http://localhost:3000
```

## Testando a API

A API pode ser testada utilizando:

* Thunder Client
* Postman
* Insomnia

Fluxo recomendado de teste:

1. Criar usuário
2. Fazer login
3. Registrar clock-in
4. Registrar clock-out
5. Solicitar ajuste
6. Administrador aprovar ou rejeitar ajuste

## Objetivo acadêmico

Este projeto foi desenvolvido com o objetivo de demonstrar a implementação de uma API REST para gestão de jornada de trabalho, utilizando boas práticas de desenvolvimento backend, autenticação segura e controle de permissões.

## Autor

Projeto desenvolvido por **Catalina Lopes** como parte do Trabalho de Conclusão de Curso em Engenharia de Software.
