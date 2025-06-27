# Build frontend
FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
# Install dependencies with retry logic and legacy peer deps
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit --legacy-peer-deps || \
    (npm cache clean --force && npm ci --prefer-offline --no-audit --legacy-peer-deps)
COPY frontend/ .
ENV NEXT_FORCE_SWCPACKAGE=1
RUN npm run build

# Build backend
FROM golang:1.21-alpine3.19 AS api
WORKDIR /app
# Update package repositories and install git
RUN apk update && \
    apk add --no-cache git ca-certificates
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Final stage
FROM alpine:3.19
WORKDIR /app
RUN apk update && \
    apk add --no-cache ca-certificates
COPY --from=frontend /app/frontend/.next /app/frontend/.next
COPY --from=frontend /app/frontend/public /app/frontend/public
COPY --from=frontend /app/frontend/package*.json /app/frontend/
COPY --from=api /app/main /app/
COPY --from=api /app/uploads /app/uploads
EXPOSE 3000 8080
CMD ["./main"] 