# syntax=docker/dockerfile:1

# ============================================================
# Etapa 1 — build do bundle Vite
# ============================================================
FROM node:22-alpine AS build

WORKDIR /app

# Manifesto primeiro: o cache de camadas do Docker só invalida
# a partir daqui quando as dependências realmente mudam.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# O Vite injeta as variáveis VITE_* no bundle em TEMPO DE BUILD,
# não em runtime. Se elas não existirem aqui, o bundle sai com o
# placeholder e o site nasce na tela de "configuração pendente".
# No Coolify: cadastre-as em "Build Variables" / "Runtime Variables"
# com build pack Docker.
#
# O lint do Docker reclama que ARG/ENV nao devem receber segredo
# (SecretsUsedInArgOrEnv). Aqui isso e proposital: a chave anon do
# Supabase e publica por design - ela vai dentro do bundle que o
# navegador baixa de qualquer jeito. Nenhuma senha ou service_role
# key deve passar por aqui.
# check=skip=SecretsUsedInArgOrEnv
ARG VITE_SUPABASE_URL=""
# check=skip=SecretsUsedInArgOrEnv
ARG VITE_SUPABASE_ANON_KEY=""
# check=skip=SecretsUsedInArgOrEnv
ARG VITE_ADMIN_EMAIL=""

# check=skip=SecretsUsedInArgOrEnv
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_ADMIN_EMAIL=$VITE_ADMIN_EMAIL

RUN npm run build

# ============================================================
# Etapa 2 — serviço estático (nginx)
# ============================================================
FROM nginx:1.27-alpine AS runtime

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
