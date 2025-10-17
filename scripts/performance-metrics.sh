#!/bin/bash

# 📊 CollabCanvas Performance Metrics Analysis Script
# Analyzes performance metrics and generates reports

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/backend"
REPORTS_DIR="$PROJECT_ROOT/reports"
METRICS_DIR="$REPORTS_DIR/metrics"

# Create directories if they don't exist
mkdir -p "$REPORTS_DIR" "$METRICS_DIR"

# Performance metrics
declare -A METRICS
declare -A THRESHOLDS

# Initialize thresholds
THRESHOLDS[load_time]=3000        # 3 seconds
THRESHOLDS[api_response]=100      # 100ms
THRESHOLDS[websocket_latency]=50  # 50ms
THRESHOLDS[error_rate]=1          # 1%
THRESHOLDS[memory_usage]=512      # 512MB
THRESHOLDS[cpu_usage]=80          # 80%

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to measure frontend build time
measure_frontend_build_time() {
    log_info "Measuring frontend build time..."
    
    cd "$FRONTEND_DIR"
    
    local start_time=$(date +%s%3N)
    npm run build --silent
    local end_time=$(date +%s%3N)
    
    local build_time=$((end_time - start_time))
    METRICS[frontend_build_time]=$build_time
    
    log_success "Frontend build time: ${build_time}ms"
}

# Function to measure backend startup time
measure_backend_startup_time() {
    log_info "Measuring backend startup time..."
    
    cd "$BACKEND_DIR"
    source venv/bin/activate
    
    local start_time=$(date +%s%3N)
    python run.py &
    local backend_pid=$!
    
    # Wait for backend to start
    local max_wait=30
    local wait_time=0
    while [ $wait_time -lt $max_wait ]; do
        if curl -f http://localhost:5000/health &> /dev/null; then
            break
        fi
        sleep 1
        wait_time=$((wait_time + 1))
    done
    
    local end_time=$(date +%s%3N)
    local startup_time=$((end_time - start_time))
    METRICS[backend_startup_time]=$startup_time
    
    # Cleanup
    kill $backend_pid 2>/dev/null || true
    sleep 2
    
    log_success "Backend startup time: ${startup_time}ms"
}

# Function to measure API response times
measure_api_response_times() {
    log_info "Measuring API response times..."
    
    cd "$BACKEND_DIR"
    source venv/bin/activate
    
    # Start backend
    python run.py &
    local backend_pid=$!
    sleep 5
    
    # Test API endpoints
    local endpoints=(
        "GET:/health"
        "GET:/api/canvas"
        "POST:/api/canvas"
        "GET:/api/objects"
        "POST:/api/objects"
    )
    
    local total_time=0
    local request_count=0
    
    for endpoint in "${endpoints[@]}"; do
        local method=$(echo "$endpoint" | cut -d: -f1)
        local path=$(echo "$endpoint" | cut -d: -f2)
        
        local start_time=$(date +%s%3N)
        
        if [ "$method" = "GET" ]; then
            curl -f "http://localhost:5000$path" &> /dev/null
        elif [ "$method" = "POST" ]; then
            curl -f -X POST "http://localhost:5000$path" \
                -H "Content-Type: application/json" \
                -d '{}' &> /dev/null
        fi
        
        local end_time=$(date +%s%3N)
        local response_time=$((end_time - start_time))
        
        total_time=$((total_time + response_time))
        request_count=$((request_count + 1))
        
        log_info "API $method $path: ${response_time}ms"
    done
    
    local avg_response_time=$((total_time / request_count))
    METRICS[api_response_time]=$avg_response_time
    
    # Cleanup
    kill $backend_pid 2>/dev/null || true
    sleep 2
    
    log_success "Average API response time: ${avg_response_time}ms"
}

# Function to measure WebSocket latency
measure_websocket_latency() {
    log_info "Measuring WebSocket latency..."
    
    cd "$FRONTEND_DIR"
    
    # Create a simple WebSocket test
    cat > "$FRONTEND_DIR/websocket-test.js" << 'EOF'
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:5000');

let startTime;
let latencies = [];

ws.on('open', () => {
    console.log('WebSocket connected');
    
    // Send ping and measure latency
    const pingInterval = setInterval(() => {
        startTime = Date.now();
        ws.ping();
    }, 1000);
    
    setTimeout(() => {
        clearInterval(pingInterval);
        ws.close();
        
        if (latencies.length > 0) {
            const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
            console.log(`Average WebSocket latency: ${avgLatency}ms`);
            process.exit(0);
        } else {
            console.log('No latency measurements recorded');
            process.exit(1);
        }
    }, 5000);
});

ws.on('pong', () => {
    const latency = Date.now() - startTime;
    latencies.push(latency);
    console.log(`WebSocket latency: ${latency}ms`);
});

ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    process.exit(1);
});
EOF

    # Start backend
    cd "$BACKEND_DIR"
    source venv/bin/activate
    python run.py &
    local backend_pid=$!
    sleep 5
    
    # Run WebSocket test
    cd "$FRONTEND_DIR"
    local ws_latency=$(node websocket-test.js 2>/dev/null | grep "Average WebSocket latency" | cut -d: -f2 | cut -d' ' -f2 | cut -d'm' -f1)
    
    if [ -n "$ws_latency" ]; then
        METRICS[websocket_latency]=$ws_latency
        log_success "WebSocket latency: ${ws_latency}ms"
    else
        log_warning "Could not measure WebSocket latency"
        METRICS[websocket_latency]=0
    fi
    
    # Cleanup
    kill $backend_pid 2>/dev/null || true
    rm -f "$FRONTEND_DIR/websocket-test.js"
    sleep 2
}

# Function to measure memory usage
measure_memory_usage() {
    log_info "Measuring memory usage..."
    
    # Measure frontend memory usage
    cd "$FRONTEND_DIR"
    npm run dev &
    local frontend_pid=$!
    sleep 10
    
    local frontend_memory=$(ps -o rss= -p $frontend_pid 2>/dev/null | awk '{print $1/1024}' || echo "0")
    METRICS[frontend_memory]=$frontend_memory
    
    # Measure backend memory usage
    cd "$BACKEND_DIR"
    source venv/bin/activate
    python run.py &
    local backend_pid=$!
    sleep 5
    
    local backend_memory=$(ps -o rss= -p $backend_pid 2>/dev/null | awk '{print $1/1024}' || echo "0")
    METRICS[backend_memory]=$backend_memory
    
    # Cleanup
    kill $frontend_pid $backend_pid 2>/dev/null || true
    sleep 2
    
    log_success "Frontend memory usage: ${frontend_memory}MB"
    log_success "Backend memory usage: ${backend_memory}MB"
}

# Function to measure CPU usage
measure_cpu_usage() {
    log_info "Measuring CPU usage..."
    
    # Start both frontend and backend
    cd "$FRONTEND_DIR"
    npm run dev &
    local frontend_pid=$!
    
    cd "$BACKEND_DIR"
    source venv/bin/activate
    python run.py &
    local backend_pid=$!
    
    sleep 10
    
    # Measure CPU usage
    local frontend_cpu=$(ps -o %cpu= -p $frontend_pid 2>/dev/null | awk '{print $1}' || echo "0")
    local backend_cpu=$(ps -o %cpu= -p $backend_pid 2>/dev/null | awk '{print $1}' || echo "0")
    
    METRICS[frontend_cpu]=$frontend_cpu
    METRICS[backend_cpu]=$backend_cpu
    
    # Cleanup
    kill $frontend_pid $backend_pid 2>/dev/null || true
    sleep 2
    
    log_success "Frontend CPU usage: ${frontend_cpu}%"
    log_success "Backend CPU usage: ${backend_cpu}%"
}

# Function to measure test execution time
measure_test_execution_time() {
    log_info "Measuring test execution time..."
    
    cd "$FRONTEND_DIR"
    
    # Measure E2E test execution time
    local start_time=$(date +%s)
    npx cypress run --spec 'cypress/e2e/authenticated-object-tests.cy.ts' --config-file cypress.config.auth.ts --headless
    local end_time=$(date +%s)
    
    local test_time=$((end_time - start_time))
    METRICS[e2e_test_time]=$test_time
    
    log_success "E2E test execution time: ${test_time}s"
}

# Function to generate performance report
generate_performance_report() {
    log_info "Generating performance report..."
    
    local report_file="$METRICS_DIR/performance-report-$(date +%Y%m%d-%H%M%S).json"
    
    # Calculate overall performance score
    local score=100
    local issues=()
    
    # Check thresholds
    for metric in "${!METRICS[@]}"; do
        local value=${METRICS[$metric]}
        local threshold=${THRESHOLDS[$metric]}
        
        if [ -n "$threshold" ] && [ "$value" -gt "$threshold" ]; then
            score=$((score - 10))
            issues+=("$metric: ${value}ms (threshold: ${threshold}ms)")
        fi
    done
    
    # Generate JSON report
    cat > "$report_file" << EOF
{
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "project": "CollabCanvas",
    "performance": {
        "score": $score,
        "metrics": {
            "frontend_build_time": ${METRICS[frontend_build_time]:-0},
            "backend_startup_time": ${METRICS[backend_startup_time]:-0},
            "api_response_time": ${METRICS[api_response_time]:-0},
            "websocket_latency": ${METRICS[websocket_latency]:-0},
            "frontend_memory": ${METRICS[frontend_memory]:-0},
            "backend_memory": ${METRICS[backend_memory]:-0},
            "frontend_cpu": ${METRICS[frontend_cpu]:-0},
            "backend_cpu": ${METRICS[backend_cpu]:-0},
            "e2e_test_time": ${METRICS[e2e_test_time]:-0}
        },
        "thresholds": {
            "load_time": ${THRESHOLDS[load_time]},
            "api_response": ${THRESHOLDS[api_response]},
            "websocket_latency": ${THRESHOLDS[websocket_latency]},
            "error_rate": ${THRESHOLDS[error_rate]},
            "memory_usage": ${THRESHOLDS[memory_usage]},
            "cpu_usage": ${THRESHOLDS[cpu_usage]}
        },
        "issues": [
EOF

    # Add issues to JSON
    for i in "${!issues[@]}"; do
        if [ $i -gt 0 ]; then
            echo "," >> "$report_file"
        fi
        echo "            \"${issues[$i]}\"" >> "$report_file"
    done

    cat >> "$report_file" << EOF
        ],
        "recommendations": [
            "Monitor performance metrics regularly",
            "Optimize slow API endpoints",
            "Implement caching strategies",
            "Use performance profiling tools",
            "Consider code splitting for frontend"
        ]
    }
}
EOF

    log_success "Performance report generated: $report_file"
    
    # Display summary
    echo ""
    log_info "📊 Performance Summary"
    echo -e "${BLUE}===================${NC}"
    echo -e "Performance Score: ${score}/100"
    echo -e "Frontend Build Time: ${METRICS[frontend_build_time]:-0}ms"
    echo -e "Backend Startup Time: ${METRICS[backend_startup_time]:-0}ms"
    echo -e "API Response Time: ${METRICS[api_response_time]:-0}ms"
    echo -e "WebSocket Latency: ${METRICS[websocket_latency]:-0}ms"
    echo -e "E2E Test Time: ${METRICS[e2e_test_time]:-0}s"
    
    if [ ${#issues[@]} -gt 0 ]; then
        echo ""
        log_warning "⚠️  Performance Issues:"
        for issue in "${issues[@]}"; do
            echo -e "  ${YELLOW}•${NC} $issue"
        done
    fi
}

# Main function
main() {
    log_info "📊 Starting CollabCanvas Performance Metrics Analysis"
    log_info "Project Root: $PROJECT_ROOT"
    log_info "Metrics Directory: $METRICS_DIR"
    
    # Run performance measurements
    measure_frontend_build_time
    measure_backend_startup_time
    measure_api_response_times
    measure_websocket_latency
    measure_memory_usage
    measure_cpu_usage
    measure_test_execution_time
    
    # Generate report
    generate_performance_report
    
    log_success "🎉 Performance metrics analysis completed!"
}

# Run main function
main "$@"
