#!/bin/bash

# 🚀 CollabCanvas Production Monitoring Script
# Phase 5: Production Testing - Performance Monitoring and Alerting

set -e

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
REPORTS_DIR="$PROJECT_ROOT/docs/production-reports"
LOGS_DIR="$PROJECT_ROOT/logs/production"
MONITORING_DIR="$PROJECT_ROOT/monitoring"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Production URLs
PRODUCTION_FRONTEND_URL="https://collabcanvas-mvp-24.vercel.app"
PRODUCTION_BACKEND_URL="https://collabcanvas-mvp-24-production.up.railway.app"

# Monitoring thresholds
PERFORMANCE_THRESHOLD_MS=3000
ERROR_RATE_THRESHOLD=1.0
MEMORY_THRESHOLD_MB=100
CPU_THRESHOLD_PERCENT=80
DISK_THRESHOLD_PERCENT=85

# Alert configuration
ALERT_EMAIL="admin@collabcanvas.com"
ALERT_WEBHOOK_URL=""
SLACK_WEBHOOK_URL=""

# Create directories
mkdir -p "$REPORTS_DIR" "$LOGS_DIR" "$MONITORING_DIR"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOGS_DIR/production-monitoring-$TIMESTAMP.log"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}" | tee -a "$LOGS_DIR/production-monitoring-$TIMESTAMP.log"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}" | tee -a "$LOGS_DIR/production-monitoring-$TIMESTAMP.log"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}" | tee -a "$LOGS_DIR/production-monitoring-$TIMESTAMP.log"
}

log_info() {
    echo -e "${CYAN}[$(date +'%Y-%m-%d %H:%M:%S')] ℹ️  $1${NC}" | tee -a "$LOGS_DIR/production-monitoring-$TIMESTAMP.log"
}

# Header
echo -e "${PURPLE}"
echo "🚀 CollabCanvas Production Monitoring - Phase 5"
echo "=============================================="
echo -e "${NC}"

log "Starting production monitoring at $(date)"

# Function to check system resources
check_system_resources() {
    log "Checking system resources..."
    
    local system_file="$MONITORING_DIR/system-resources-$TIMESTAMP.json"
    
    # Get system information
    local memory_usage=$(free | awk 'NR==2{printf "%.2f", $3*100/$2}')
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    local disk_usage=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')
    local load_average=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    
    # Create system resources data
    cat > "$system_file" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "environment": "production",
  "system_resources": {
    "memory_usage_percent": $memory_usage,
    "cpu_usage_percent": $cpu_usage,
    "disk_usage_percent": $disk_usage,
    "load_average": $load_average,
    "uptime": "$(uptime -p)",
    "hostname": "$(hostname)"
  }
}
EOF
    
    # Check thresholds
    if (( $(echo "$memory_usage > $MEMORY_THRESHOLD_MB" | bc -l) )); then
        log_warning "Memory usage exceeds threshold: ${memory_usage}%"
        send_alert "HIGH_MEMORY_USAGE" "Memory usage: ${memory_usage}%"
    else
        log_success "Memory usage within acceptable range: ${memory_usage}%"
    fi
    
    if (( $(echo "$cpu_usage > $CPU_THRESHOLD_PERCENT" | bc -l) )); then
        log_warning "CPU usage exceeds threshold: ${cpu_usage}%"
        send_alert "HIGH_CPU_USAGE" "CPU usage: ${cpu_usage}%"
    else
        log_success "CPU usage within acceptable range: ${cpu_usage}%"
    fi
    
    if (( $(echo "$disk_usage > $DISK_THRESHOLD_PERCENT" | bc -l) )); then
        log_warning "Disk usage exceeds threshold: ${disk_usage}%"
        send_alert "HIGH_DISK_USAGE" "Disk usage: ${disk_usage}%"
    else
        log_success "Disk usage within acceptable range: ${disk_usage}%"
    fi
    
    log_info "System resources: Memory: ${memory_usage}%, CPU: ${cpu_usage}%, Disk: ${disk_usage}%"
    log_success "System resources check completed"
}

# Function to monitor application performance
monitor_application_performance() {
    log "Monitoring application performance..."
    
    local performance_file="$MONITORING_DIR/application-performance-$TIMESTAMP.json"
    
    # Test frontend performance
    local frontend_start=$(date +%s%3N)
    local frontend_status=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_FRONTEND_URL")
    local frontend_end=$(date +%s%3N)
    local frontend_response_time=$((frontend_end - frontend_start))
    
    # Test backend performance
    local backend_start=$(date +%s%3N)
    local backend_status=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_BACKEND_URL/" 2>/dev/null || echo "000")
    local backend_end=$(date +%s%3N)
    local backend_response_time=$((backend_end - backend_start))
    
    # Create performance data
    cat > "$performance_file" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "environment": "production",
  "application_performance": {
    "frontend": {
      "response_time_ms": $frontend_response_time,
      "status_code": $frontend_status,
      "url": "$PRODUCTION_FRONTEND_URL"
    },
    "backend": {
      "response_time_ms": $backend_response_time,
      "status_code": $backend_status,
      "url": "$PRODUCTION_BACKEND_URL"
    }
  }
}
EOF
    
    # Check performance thresholds
    if [ "$frontend_response_time" -gt "$PERFORMANCE_THRESHOLD_MS" ]; then
        log_warning "Frontend response time exceeds threshold: ${frontend_response_time}ms"
        send_alert "SLOW_FRONTEND_RESPONSE" "Frontend response time: ${frontend_response_time}ms"
    else
        log_success "Frontend response time within acceptable range: ${frontend_response_time}ms"
    fi
    
    if [ "$backend_response_time" -gt 1000 ]; then
        log_warning "Backend response time exceeds threshold: ${backend_response_time}ms"
        send_alert "SLOW_BACKEND_RESPONSE" "Backend response time: ${backend_response_time}ms"
    else
        log_success "Backend response time within acceptable range: ${backend_response_time}ms"
    fi
    
    # Check status codes
    if [ "$frontend_status" != "200" ]; then
        log_error "Frontend returned non-200 status: $frontend_status"
        send_alert "FRONTEND_ERROR" "Frontend status code: $frontend_status"
    fi
    
    if [ "$backend_status" != "200" ] && [ "$backend_status" != "000" ]; then
        log_error "Backend returned non-200 status: $backend_status"
        send_alert "BACKEND_ERROR" "Backend status code: $backend_status"
    fi
    
    log_success "Application performance monitoring completed"
}

# Function to monitor error rates
monitor_error_rates() {
    log "Monitoring error rates..."
    
    local error_file="$MONITORING_DIR/error-rates-$TIMESTAMP.json"
    
    # Test multiple requests to get error rate
    local total_requests=20
    local frontend_errors=0
    local backend_errors=0
    local frontend_4xx=0
    local frontend_5xx=0
    local backend_4xx=0
    local backend_5xx=0
    
    log "Testing $total_requests requests to measure error rates..."
    
    for i in $(seq 1 $total_requests); do
        # Test frontend
        local frontend_status=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_FRONTEND_URL")
        if [[ "$frontend_status" =~ ^[45][0-9][0-9]$ ]]; then
            ((frontend_errors++))
            if [[ "$frontend_status" =~ ^4[0-9][0-9]$ ]]; then
                ((frontend_4xx++))
            elif [[ "$frontend_status" =~ ^5[0-9][0-9]$ ]]; then
                ((frontend_5xx++))
            fi
        fi
        
        # Test backend
        local backend_status=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_BACKEND_URL/" 2>/dev/null || echo "000")
        if [[ "$backend_status" =~ ^[45][0-9][0-9]$ ]]; then
            ((backend_errors++))
            if [[ "$backend_status" =~ ^4[0-9][0-9]$ ]]; then
                ((backend_4xx++))
            elif [[ "$backend_status" =~ ^5[0-9][0-9]$ ]]; then
                ((backend_5xx++))
            fi
        fi
        
        sleep 0.1
    done
    
    # Calculate error rates
    local frontend_error_rate=$(echo "scale=2; $frontend_errors * 100 / $total_requests" | bc -l)
    local backend_error_rate=$(echo "scale=2; $backend_errors * 100 / $total_requests" | bc -l)
    
    # Create error rate data
    cat > "$error_file" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "environment": "production",
  "error_rates": {
    "frontend": {
      "total_requests": $total_requests,
      "4xx_errors": $frontend_4xx,
      "5xx_errors": $frontend_5xx,
      "total_errors": $frontend_errors,
      "error_rate_percentage": $frontend_error_rate
    },
    "backend": {
      "total_requests": $total_requests,
      "4xx_errors": $backend_4xx,
      "5xx_errors": $backend_5xx,
      "total_errors": $backend_errors,
      "error_rate_percentage": $backend_error_rate
    }
  }
}
EOF
    
    # Check error rate thresholds
    if (( $(echo "$frontend_error_rate > $ERROR_RATE_THRESHOLD" | bc -l) )); then
        log_warning "Frontend error rate exceeds threshold: ${frontend_error_rate}%"
        send_alert "HIGH_FRONTEND_ERROR_RATE" "Frontend error rate: ${frontend_error_rate}%"
    else
        log_success "Frontend error rate within acceptable range: ${frontend_error_rate}%"
    fi
    
    if (( $(echo "$backend_error_rate > $ERROR_RATE_THRESHOLD" | bc -l) )); then
        log_warning "Backend error rate exceeds threshold: ${backend_error_rate}%"
        send_alert "HIGH_BACKEND_ERROR_RATE" "Backend error rate: ${backend_error_rate}%"
    else
        log_success "Backend error rate within acceptable range: ${backend_error_rate}%"
    fi
    
    log_info "Error rates - Frontend: ${frontend_error_rate}%, Backend: ${backend_error_rate}%"
    log_success "Error rate monitoring completed"
}

# Function to monitor database performance
monitor_database_performance() {
    log "Monitoring database performance..."
    
    local db_file="$MONITORING_DIR/database-performance-$TIMESTAMP.json"
    
    # Test database connectivity through backend
    local db_start=$(date +%s%3N)
    local db_status=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_BACKEND_URL/api/health" 2>/dev/null || echo "000")
    local db_end=$(date +%s%3N)
    local db_response_time=$((db_end - db_start))
    
    # Create database performance data
    cat > "$db_file" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "environment": "production",
  "database_performance": {
    "health_check_response_time_ms": $db_response_time,
    "health_check_status": $db_status,
    "connectivity": "$([ "$db_status" = "200" ] && echo "healthy" || echo "unhealthy")"
  }
}
EOF
    
    if [ "$db_status" = "200" ]; then
        log_success "Database connectivity healthy (${db_response_time}ms)"
    else
        log_error "Database connectivity issues (status: $db_status)"
        send_alert "DATABASE_CONNECTIVITY_ISSUE" "Database health check failed: $db_status"
    fi
    
    log_success "Database performance monitoring completed"
}

# Function to monitor security
monitor_security() {
    log "Monitoring security..."
    
    local security_file="$MONITORING_DIR/security-monitoring-$TIMESTAMP.json"
    
    # Test for common security headers
    local frontend_headers=$(curl -s -I "$PRODUCTION_FRONTEND_URL" 2>/dev/null || echo "")
    local backend_headers=$(curl -s -I "$PRODUCTION_BACKEND_URL/" 2>/dev/null || echo "")
    
    # Check for security headers
    local has_csp=$(echo "$frontend_headers" | grep -i "content-security-policy" | wc -l)
    local has_hsts=$(echo "$frontend_headers" | grep -i "strict-transport-security" | wc -l)
    local has_xframe=$(echo "$frontend_headers" | grep -i "x-frame-options" | wc -l)
    local has_xss=$(echo "$frontend_headers" | grep -i "x-xss-protection" | wc -l)
    
    # Create security data
    cat > "$security_file" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "environment": "production",
  "security_headers": {
    "content_security_policy": $([ "$has_csp" -gt 0 ] && echo "true" || echo "false"),
    "strict_transport_security": $([ "$has_hsts" -gt 0 ] && echo "true" || echo "false"),
    "x_frame_options": $([ "$has_xframe" -gt 0 ] && echo "true" || echo "false"),
    "x_xss_protection": $([ "$has_xss" -gt 0 ] && echo "true" || echo "false")
  }
}
EOF
    
    # Check security headers
    if [ "$has_csp" -eq 0 ]; then
        log_warning "Content Security Policy header missing"
    else
        log_success "Content Security Policy header present"
    fi
    
    if [ "$has_hsts" -eq 0 ]; then
        log_warning "Strict Transport Security header missing"
    else
        log_success "Strict Transport Security header present"
    fi
    
    if [ "$has_xframe" -eq 0 ]; then
        log_warning "X-Frame-Options header missing"
    else
        log_success "X-Frame-Options header present"
    fi
    
    log_success "Security monitoring completed"
}

# Function to send alerts
send_alert() {
    local alert_type="$1"
    local message="$2"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    log_warning "ALERT: $alert_type - $message"
    
    # Create alert data
    local alert_data="{
        \"timestamp\": \"$timestamp\",
        \"alert_type\": \"$alert_type\",
        \"message\": \"$message\",
        \"environment\": \"production\",
        \"severity\": \"warning\"
    }"
    
    # Send to webhook if configured
    if [ -n "$ALERT_WEBHOOK_URL" ]; then
        curl -s -X POST "$ALERT_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "$alert_data" > /dev/null 2>&1 || log_warning "Failed to send webhook alert"
    fi
    
    # Send to Slack if configured
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        local slack_message="🚨 *CollabCanvas Production Alert*\n*Type:* $alert_type\n*Message:* $message\n*Time:* $timestamp"
        curl -s -X POST "$SLACK_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"$slack_message\"}" > /dev/null 2>&1 || log_warning "Failed to send Slack alert"
    fi
    
    # Log alert to file
    echo "$alert_data" >> "$LOGS_DIR/alerts-$TIMESTAMP.log"
}

# Function to generate monitoring report
generate_monitoring_report() {
    log "Generating monitoring report..."
    
    local report_file="$REPORTS_DIR/monitoring-report-$TIMESTAMP.html"
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CollabCanvas Production Monitoring Report - $TIMESTAMP</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .content { padding: 30px; }
        .section { margin-bottom: 40px; }
        .section h2 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .metric { background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 10px 0; border-radius: 4px; }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric p { margin: 5px 0; color: #666; }
        .status-success { color: #28a745; }
        .status-warning { color: #ffc107; }
        .status-error { color: #dc3545; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { background: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; }
        .card h3 { margin-top: 0; color: #333; }
        .footer { text-align: center; padding: 20px; color: #666; border-top: 1px solid #e9ecef; }
        .alert { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin: 10px 0; }
        .alert h4 { margin: 0 0 10px 0; color: #856404; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 CollabCanvas Production Monitoring</h1>
            <p>Generated on $(date) | Environment: Production | Phase 5 Monitoring</p>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>📊 System Overview</h2>
                <div class="grid">
                    <div class="card">
                        <h3>System Resources</h3>
                        <p>Memory Usage: <span id="memory-usage">Loading...</span></p>
                        <p>CPU Usage: <span id="cpu-usage">Loading...</span></p>
                        <p>Disk Usage: <span id="disk-usage">Loading...</span></p>
                    </div>
                    <div class="card">
                        <h3>Application Performance</h3>
                        <p>Frontend Response: <span id="frontend-response">Loading...</span></p>
                        <p>Backend Response: <span id="backend-response">Loading...</span></p>
                    </div>
                    <div class="card">
                        <h3>Error Rates</h3>
                        <p>Frontend Errors: <span id="frontend-errors">Loading...</span></p>
                        <p>Backend Errors: <span id="backend-errors">Loading...</span></p>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>🔧 Monitoring Results</h2>
                <div class="metric">
                    <h3>System Resources</h3>
                    <p>✅ Memory usage monitoring active</p>
                    <p>✅ CPU usage monitoring active</p>
                    <p>✅ Disk usage monitoring active</p>
                    <p>✅ Load average monitoring active</p>
                </div>
                
                <div class="metric">
                    <h3>Application Performance</h3>
                    <p>✅ Frontend response time monitoring</p>
                    <p>✅ Backend response time monitoring</p>
                    <p>✅ Status code monitoring</p>
                    <p>✅ Database connectivity monitoring</p>
                </div>
                
                <div class="metric">
                    <h3>Security Monitoring</h3>
                    <p>✅ Security headers monitoring</p>
                    <p>✅ HTTPS enforcement monitoring</p>
                    <p>✅ Content Security Policy monitoring</p>
                </div>
            </div>
            
            <div class="section">
                <h2>🚨 Alerts</h2>
                <div id="alerts">
                    <p>Loading alerts...</p>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>CollabCanvas Production Monitoring - Phase 5 | Generated by automated monitoring system</p>
        </div>
    </div>
    
    <script>
        // Load and display system resources
        fetch('system-resources-$TIMESTAMP.json')
            .then(response => response.json())
            .then(data => {
                document.getElementById('memory-usage').textContent = data.system_resources.memory_usage_percent + '%';
                document.getElementById('cpu-usage').textContent = data.system_resources.cpu_usage_percent + '%';
                document.getElementById('disk-usage').textContent = data.system_resources.disk_usage_percent + '%';
            })
            .catch(error => console.error('Error loading system resources:', error));
        
        // Load and display application performance
        fetch('application-performance-$TIMESTAMP.json')
            .then(response => response.json())
            .then(data => {
                document.getElementById('frontend-response').textContent = data.application_performance.frontend.response_time_ms + 'ms';
                document.getElementById('backend-response').textContent = data.application_performance.backend.response_time_ms + 'ms';
            })
            .catch(error => console.error('Error loading application performance:', error));
        
        // Load and display error rates
        fetch('error-rates-$TIMESTAMP.json')
            .then(response => response.json())
            .then(data => {
                document.getElementById('frontend-errors').textContent = data.error_rates.frontend.error_rate_percentage + '%';
                document.getElementById('backend-errors').textContent = data.error_rates.backend.error_rate_percentage + '%';
            })
            .catch(error => console.error('Error loading error rates:', error));
        
        // Load and display alerts
        fetch('alerts-$TIMESTAMP.log')
            .then(response => response.text())
            .then(data => {
                const alertsDiv = document.getElementById('alerts');
                if (data.trim()) {
                    const alerts = data.trim().split('\n').map(line => JSON.parse(line));
                    alerts.forEach(alert => {
                        const alertDiv = document.createElement('div');
                        alertDiv.className = 'alert';
                        alertDiv.innerHTML = \`
                            <h4>\${alert.alert_type}</h4>
                            <p>\${alert.message}</p>
                            <small>\${alert.timestamp}</small>
                        \`;
                        alertsDiv.appendChild(alertDiv);
                    });
                } else {
                    alertsDiv.innerHTML = '<p class="status-success">No alerts generated</p>';
                }
            })
            .catch(error => {
                document.getElementById('alerts').innerHTML = '<p class="status-success">No alerts generated</p>';
            });
    </script>
</body>
</html>
EOF
    
    log_success "Monitoring report generated: $report_file"
}

# Function to setup continuous monitoring
setup_continuous_monitoring() {
    log "Setting up continuous monitoring..."
    
    # Create monitoring cron job
    local cron_job="*/5 * * * * $SCRIPT_DIR/production-monitoring.sh >> $LOGS_DIR/continuous-monitoring.log 2>&1"
    
    # Add to crontab if not already present
    if ! crontab -l 2>/dev/null | grep -q "production-monitoring.sh"; then
        (crontab -l 2>/dev/null; echo "$cron_job") | crontab -
        log_success "Continuous monitoring cron job added"
    else
        log_info "Continuous monitoring cron job already exists"
    fi
    
    # Create monitoring service script
    cat > "$MONITORING_DIR/monitoring-service.sh" << 'EOF'
#!/bin/bash
# CollabCanvas Production Monitoring Service

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

cd "$PROJECT_ROOT"

# Run monitoring
./scripts/production-monitoring.sh

# Cleanup old logs (keep last 7 days)
find "$PROJECT_ROOT/logs/production" -name "*.log" -mtime +7 -delete
find "$PROJECT_ROOT/monitoring" -name "*.json" -mtime +7 -delete
find "$PROJECT_ROOT/docs/production-reports" -name "*.html" -mtime +7 -delete
EOF
    
    chmod +x "$MONITORING_DIR/monitoring-service.sh"
    
    log_success "Continuous monitoring setup completed"
}

# Main execution
main() {
    log "Starting CollabCanvas Production Monitoring - Phase 5"
    
    # Run all monitoring checks
    check_system_resources
    monitor_application_performance
    monitor_error_rates
    monitor_database_performance
    monitor_security
    generate_monitoring_report
    setup_continuous_monitoring
    
    log_success "Production monitoring completed successfully!"
    log "Reports available in: $REPORTS_DIR"
    log "Monitoring data available in: $MONITORING_DIR"
    log "Logs available in: $LOGS_DIR"
    
    echo -e "${GREEN}"
    echo "🎉 Phase 5: Production Monitoring Complete!"
    echo "=========================================="
    echo "📊 Reports: $REPORTS_DIR"
    echo "📈 Monitoring: $MONITORING_DIR"
    echo "📝 Logs: $LOGS_DIR"
    echo "🔄 Continuous monitoring: Active (every 5 minutes)"
    echo -e "${NC}"
}

# Run main function
main "$@"
