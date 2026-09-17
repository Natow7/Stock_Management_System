#!/bin/bash

# Stock Management System - Deployment Script
# Usage: ./deploy.sh [start|stop|restart|logs|update|backup]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        echo "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Check if .env file exists
check_env() {
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from .env.example..."
        cp .env.example .env
        print_info "Please edit .env file with your configuration before deploying"
        print_info "Run: nano .env"
        exit 1
    fi
    print_success ".env file found"
}

# Start the application
start() {
    print_info "Starting Stock Management System..."
    docker-compose up -d
    print_success "Application started successfully!"
    print_info "Frontend: http://localhost"
    print_info "Backend API: http://localhost:4000"
    print_info "Database: localhost:5432"
    echo ""
    print_info "Run './deploy.sh logs' to view application logs"
}

# Stop the application
stop() {
    print_info "Stopping Stock Management System..."
    docker-compose down
    print_success "Application stopped"
}

# Restart the application
restart() {
    print_info "Restarting Stock Management System..."
    docker-compose restart
    print_success "Application restarted"
}

# View logs
logs() {
    if [ -z "$2" ]; then
        docker-compose logs -f
    else
        docker-compose logs -f "$2"
    fi
}

# Update application (pull latest code and rebuild)
update() {
    print_info "Updating Stock Management System..."
    
    # Pull latest code
    print_info "Pulling latest code from Git..."
    git pull
    
    # Rebuild containers
    print_info "Rebuilding containers..."
    docker-compose build --no-cache
    
    # Restart services
    print_info "Restarting services..."
    docker-compose down
    docker-compose up -d
    
    print_success "Update completed successfully!"
}

# Backup database
backup() {
    BACKUP_DIR="./backups"
    mkdir -p "$BACKUP_DIR"
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/sms_backup_$TIMESTAMP.sql"
    
    print_info "Creating database backup..."
    docker-compose exec -T database pg_dump -U postgres spms > "$BACKUP_FILE"
    
    # Compress backup
    gzip "$BACKUP_FILE"
    
    print_success "Backup created: ${BACKUP_FILE}.gz"
    
    # Keep only last 7 backups
    print_info "Cleaning old backups (keeping last 7)..."
    ls -t "$BACKUP_DIR"/sms_backup_*.sql.gz | tail -n +8 | xargs -r rm
    print_success "Old backups cleaned"
}

# Restore database from backup
restore() {
    BACKUP_DIR="./backups"
    
    if [ -z "$2" ]; then
        print_error "Please specify backup file to restore"
        echo "Usage: ./deploy.sh restore <backup_file>"
        echo ""
        echo "Available backups:"
        ls -1 "$BACKUP_DIR"/sms_backup_*.sql.gz 2>/dev/null || echo "No backups found"
        exit 1
    fi
    
    BACKUP_FILE="$2"
    
    if [ ! -f "$BACKUP_FILE" ]; then
        print_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    
    print_warning "This will overwrite the current database!"
    read -p "Are you sure? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
        print_info "Restore cancelled"
        exit 0
    fi
    
    print_info "Restoring database from backup..."
    
    # Decompress and restore
    gunzip -c "$BACKUP_FILE" | docker-compose exec -T database psql -U postgres spms
    
    print_success "Database restored successfully!"
}

# Show status
status() {
    print_info "Stock Management System Status:"
    echo ""
    docker-compose ps
}

# Main script
case "$1" in
    start)
        check_docker
        check_env
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    logs)
        logs "$@"
        ;;
    update)
        check_docker
        update
        ;;
    backup)
        backup
        ;;
    restore)
        restore "$@"
        ;;
    status)
        status
        ;;
    *)
        echo "Stock Management System - Deployment Script"
        echo ""
        echo "Usage: ./deploy.sh [command]"
        echo ""
        echo "Commands:"
        echo "  start       - Start the application"
        echo "  stop        - Stop the application"
        echo "  restart     - Restart the application"
        echo "  logs        - View application logs (Ctrl+C to exit)"
        echo "  logs [service] - View logs for specific service (frontend/backend/database)"
        echo "  update      - Pull latest code and rebuild"
        echo "  backup      - Create database backup"
        echo "  restore <file> - Restore database from backup"
        echo "  status      - Show application status"
        echo ""
        echo "Examples:"
        echo "  ./deploy.sh start"
        echo "  ./deploy.sh logs backend"
        echo "  ./deploy.sh backup"
        echo "  ./deploy.sh restore ./backups/sms_backup_20240917_120000.sql.gz"
        exit 1
        ;;
esac
