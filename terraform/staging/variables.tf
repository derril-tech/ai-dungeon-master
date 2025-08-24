# Created automatically by Cursor AI (2024-12-19)

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "ai-dungeon-master.com"
}

variable "frontend_image" {
  description = "Frontend Docker image"
  type        = string
}

variable "gateway_image" {
  description = "Gateway Docker image"
  type        = string
}

variable "orchestrator_image" {
  description = "Orchestrator Docker image"
  type        = string
}

variable "workers_image" {
  description = "Workers Docker image"
  type        = string
}

variable "jwt_secret" {
  description = "JWT secret for authentication"
  type        = string
  sensitive   = true
}

variable "jwt_secret_arn" {
  description = "ARN of JWT secret in AWS Secrets Manager"
  type        = string
}

variable "openai_api_key_arn" {
  description = "ARN of OpenAI API key in AWS Secrets Manager"
  type        = string
}

variable "nats_url" {
  description = "NATS server URL"
  type        = string
  default     = "nats://nats:4222"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "staging"
}
