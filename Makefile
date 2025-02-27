# Variables
DOCKER_COMPOSE = docker-compose
COMPOSE_FILE = docker-compose.yml
VALID_SERVICES = frontend backend db nginx # List of valid services

# Default target
.PHONY: all
all: build up

# Build all services
.PHONY: build
build:
	@echo "Building all services..."
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) build

# Start the services
.PHONY: up
up:
	@echo "Starting services..."
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) up -d

# Stop the services
.PHONY: down
down:
	@echo "Stopping services..."
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) down

# Clean up volumes and networks
.PHONY: clean
clean:
	@echo "Cleaning up unused Docker volumes and networks..."
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) down --volumes --remove-orphans

# View logs for a specific service
.PHONY: logs
logs:
	@if [ -z "$(SERVICE)" ]; then \
		echo "Error: SERVICE argument is required. Use make logs SERVICE=<service-name>"; \
		exit 1; \
	elif ! echo "$(VALID_SERVICES)" | grep -q -w "$(SERVICE)"; then \
		echo "Error: Invalid service name '$(SERVICE)'. Valid services are: $(VALID_SERVICES)"; \
		exit 1; \
	else \
		echo "Viewing logs for service: $(SERVICE)..."; \
		$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) logs $(SERVICE); \
	fi

# Shell into a container
.PHONY: shell
shell:
	@if [ -z "$(SERVICE)" ]; then \
		echo "Error: SERVICE argument is required. Use make shell SERVICE=<service-name>"; \
		exit 1; \
	elif ! echo "$(VALID_SERVICES)" | grep -q -w "$(SERVICE)"; then \
		echo "Error: Invalid service name '$(SERVICE)'. Valid services are: $(VALID_SERVICES)"; \
		exit 1; \
	else \
		echo "Opening a shell in service: $(SERVICE)..."; \
		$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) exec $(SERVICE) sh; \
	fi

# Restart the services
.PHONY: restart
restart:
	docker compose down -v
	docker compose up --build
	@echo "Services restarted successfully!"

# Remove all Docker artifacts (use with caution)
.PHONY: prune
prune:
	@echo "Removing all stopped containers, networks, and dangling images..."
	docker system prune -af --volumes

# Help command
.PHONY: help
help:
	@echo "Available commands:"
	@echo "  make build       Build all services"
	@echo "  make up          Start all services in detached mode"
	@echo "  make down        Stop all services"
	@echo "  make clean       Remove containers, volumes, and networks"
	@echo "  make logs        View logs for a specific service (use SERVICE=<name>)"
	@echo "  make restart     Restart all services"
	@echo "  make shell       Open a shell in a specific container (use SERVICE=<name>)"
	@echo "  make prune       Remove all Docker artifacts (use with caution)"
	@echo "  make help        Display this help message"
