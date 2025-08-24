# Created automatically by Cursor AI (2024-12-19)

import logging
import time
from typing import Dict, Any, Optional
from contextlib import contextmanager
from functools import wraps
import structlog
from opentelemetry import trace, metrics
from opentelemetry.exporter.prometheus import PrometheusMetricReader
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.resources import Resource
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor
from prometheus_client import Counter, Histogram, Gauge, Summary
import redis
from sqlalchemy import create_engine

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

class ObservabilityManager:
    """Manages observability setup including tracing, metrics, and logging"""
    
    def __init__(self, service_name: str = "ai-dungeon-master-orchestrator"):
        self.service_name = service_name
        self.tracer = None
        self.meter = None
        self.metrics = {}
        self._setup_tracing()
        self._setup_metrics()
        self._setup_logging()
    
    def _setup_tracing(self):
        """Setup OpenTelemetry tracing"""
        try:
            # Create tracer provider
            resource = Resource.create({"service.name": self.service_name})
            trace_provider = TracerProvider(resource=resource)
            
            # Add OTLP exporter for traces
            otlp_exporter = OTLPSpanExporter(
                endpoint=os.getenv("OTLP_ENDPOINT", "http://localhost:4317")
            )
            trace_provider.add_span_processor(BatchSpanProcessor(otlp_exporter))
            
            # Set global tracer provider
            trace.set_tracer_provider(trace_provider)
            self.tracer = trace.get_tracer(__name__)
            
            logger.info("Tracing setup completed", service_name=self.service_name)
            
        except Exception as e:
            logger.error("Failed to setup tracing", error=str(e))
            # Fallback to no-op tracer
            self.tracer = trace.get_tracer(__name__)
    
    def _setup_metrics(self):
        """Setup Prometheus metrics"""
        try:
            # Create meter provider
            metric_reader = PrometheusMetricReader()
            meter_provider = MeterProvider(metric_readers=[metric_reader])
            metrics.set_meter_provider(meter_provider)
            self.meter = metrics.get_meter(__name__)
            
            # Define common metrics
            self.metrics = {
                'requests_total': Counter(
                    'requests_total',
                    'Total number of requests',
                    ['method', 'endpoint', 'status']
                ),
                'request_duration': Histogram(
                    'request_duration_seconds',
                    'Request duration in seconds',
                    ['method', 'endpoint']
                ),
                'active_sessions': Gauge(
                    'active_sessions',
                    'Number of active sessions'
                ),
                'ai_generation_duration': Histogram(
                    'ai_generation_duration_seconds',
                    'AI content generation duration',
                    ['content_type', 'model']
                ),
                'safety_checks_total': Counter(
                    'safety_checks_total',
                    'Total number of safety checks',
                    ['level', 'content_type']
                ),
                'database_operations': Histogram(
                    'database_operations_duration_seconds',
                    'Database operation duration',
                    ['operation', 'table']
                ),
                'cache_hits': Counter(
                    'cache_hits_total',
                    'Total cache hits',
                    ['cache_type']
                ),
                'cache_misses': Counter(
                    'cache_misses_total',
                    'Total cache misses',
                    ['cache_type']
                ),
                'worker_tasks': Counter(
                    'worker_tasks_total',
                    'Total worker tasks',
                    ['task_type', 'status']
                ),
                'websocket_connections': Gauge(
                    'websocket_connections',
                    'Number of active WebSocket connections'
                )
            }
            
            logger.info("Metrics setup completed")
            
        except Exception as e:
            logger.error("Failed to setup metrics", error=str(e))
    
    def _setup_logging(self):
        """Setup structured logging"""
        # Configure root logger
        logging.basicConfig(
            level=logging.INFO,
            format="%(message)s",
            handlers=[logging.StreamHandler()]
        )
        
        # Set log levels for noisy libraries
        logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
        logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
        logging.getLogger("redis").setLevel(logging.WARNING)
        
        logger.info("Logging setup completed")
    
    def instrument_fastapi(self, app):
        """Instrument FastAPI application"""
        try:
            FastAPIInstrumentor.instrument_app(app)
            logger.info("FastAPI instrumentation completed")
        except Exception as e:
            logger.error("Failed to instrument FastAPI", error=str(e))
    
    def instrument_sqlalchemy(self, engine):
        """Instrument SQLAlchemy engine"""
        try:
            SQLAlchemyInstrumentor().instrument(engine=engine)
            logger.info("SQLAlchemy instrumentation completed")
        except Exception as e:
            logger.error("Failed to instrument SQLAlchemy", error=str(e))
    
    def instrument_redis(self, redis_client):
        """Instrument Redis client"""
        try:
            RedisInstrumentor().instrument(redis_client)
            logger.info("Redis instrumentation completed")
        except Exception as e:
            logger.error("Failed to instrument Redis", error=str(e))
    
    @contextmanager
    def trace_span(self, name: str, attributes: Optional[Dict[str, Any]] = None):
        """Context manager for tracing spans"""
        if self.tracer:
            with self.tracer.start_as_current_span(name, attributes=attributes or {}) as span:
                yield span
        else:
            yield None
    
    def record_metric(self, metric_name: str, value: float = 1.0, labels: Optional[Dict[str, str]] = None):
        """Record a metric"""
        if metric_name in self.metrics:
            metric = self.metrics[metric_name]
            if labels:
                metric.labels(**labels).inc(value)
            else:
                metric.inc(value)
    
    def observe_metric(self, metric_name: str, value: float, labels: Optional[Dict[str, str]] = None):
        """Observe a metric value"""
        if metric_name in self.metrics:
            metric = self.metrics[metric_name]
            if labels:
                metric.labels(**labels).observe(value)
            else:
                metric.observe(value)
    
    def set_gauge(self, metric_name: str, value: float, labels: Optional[Dict[str, str]] = None):
        """Set a gauge metric"""
        if metric_name in self.metrics:
            metric = self.metrics[metric_name]
            if labels:
                metric.labels(**labels).set(value)
            else:
                metric.set(value)

def trace_function(name: str = None, attributes: Optional[Dict[str, Any]] = None):
    """Decorator to trace function execution"""
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            span_name = name or f"{func.__module__}.{func.__name__}"
            with observability.trace_span(span_name, attributes):
                start_time = time.time()
                try:
                    result = await func(*args, **kwargs)
                    duration = time.time() - start_time
                    observability.observe_metric('function_duration_seconds', duration, {
                        'function': func.__name__,
                        'status': 'success'
                    })
                    return result
                except Exception as e:
                    duration = time.time() - start_time
                    observability.observe_metric('function_duration_seconds', duration, {
                        'function': func.__name__,
                        'status': 'error'
                    })
                    raise
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            span_name = name or f"{func.__module__}.{func.__name__}"
            with observability.trace_span(span_name, attributes):
                start_time = time.time()
                try:
                    result = func(*args, **kwargs)
                    duration = time.time() - start_time
                    observability.observe_metric('function_duration_seconds', duration, {
                        'function': func.__name__,
                        'status': 'success'
                    })
                    return result
                except Exception as e:
                    duration = time.time() - start_time
                    observability.observe_metric('function_duration_seconds', duration, {
                        'function': func.__name__,
                        'status': 'error'
                    })
                    raise
        
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator

def monitor_database_operation(operation: str, table: str = None):
    """Decorator to monitor database operations"""
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                duration = time.time() - start_time
                observability.observe_metric('database_operations', duration, {
                    'operation': operation,
                    'table': table or 'unknown'
                })
                return result
            except Exception as e:
                duration = time.time() - start_time
                observability.observe_metric('database_operations', duration, {
                    'operation': operation,
                    'table': table or 'unknown'
                })
                raise
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                duration = time.time() - start_time
                observability.observe_metric('database_operations', duration, {
                    'operation': operation,
                    'table': table or 'unknown'
                })
                return result
            except Exception as e:
                duration = time.time() - start_time
                observability.observe_metric('database_operations', duration, {
                    'operation': operation,
                    'table': table or 'unknown'
                })
                raise
        
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator

# Global observability instance
observability = ObservabilityManager()

# Import asyncio for the decorators
import asyncio
import os
